/**
 * submit-guest-enquiry Edge Function
 *
 * Allows families to send enquiries WITHOUT being logged in.
 * This is the most critical change from the consolidated review:
 *   - Rachel estimates 40-60% drop-off from auth gate
 *   - Yuki calls it "the single most dangerous moment in the entire flow"
 *   - Mei Lin says she would not sign up for a website she does not trust yet
 *   - Karen just wants to receive the lead
 *
 * Flow:
 * 1. Validate required fields (no auth required)
 * 2. Rate limit by email (max 5/day) + IP (max 20/day)
 * 3. Detect message language
 * 4. If Chinese and not confirmed: translate and return preview (don't send yet)
 * 5. If confirmed: save enquiry, calculate match factors, send emails
 * 6. Send structured notification email to center (per Karen's feedback)
 * 7. Send confirmation email to guest in detected language
 *
 * POST /submit-guest-enquiry
 * Body: {
 *   center_profile_id: string,
 *   guest_name: string,
 *   guest_email: string,
 *   guest_phone?: string,
 *   guest_wechat_id?: string,
 *   guest_child_age: string,          // e.g. "2 years", "18 months"
 *   guest_child_days_needed?: string,  // e.g. "3 days/week", "Mon, Wed, Fri"
 *   guest_suburb?: string,
 *   message: string,
 *   preferred_tour_datetime?: string,
 *   contact_preference?: string[],     // e.g. ["phone", "wechat", "email"]
 *   confirmed?: boolean,               // true = send now; false/absent = preview translation
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { supabaseAdmin, SUPABASE_URL } from "../_shared/supabase.ts";
import {
  sendEmail,
  enquiryNotificationEmail,
  guestEnquiryConfirmationEmail,
  type EnquiryNotificationData,
  type GuestEnquiryConfirmationData,
} from "../_shared/resend-v2.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmitGuestEnquiryRequest {
  center_profile_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  guest_wechat_id?: string;
  guest_child_age: string;
  guest_child_days_needed?: string;
  guest_suburb?: string;
  message: string;
  preferred_tour_datetime?: string;
  contact_preference?: string[];
  confirmed?: boolean;
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

function detectLanguage(text: string): "en" | "zh" {
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length;
  return totalChars > 0 && chineseChars / totalChars > 0.2 ? "zh" : "en";
}

// ---------------------------------------------------------------------------
// Call translate-text Edge Function
// ---------------------------------------------------------------------------

async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<{ translated_text: string; detected_language: string }> {
  const fnUrl = `${SUPABASE_URL}/functions/v1/translate-text`;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      text,
      source_language: sourceLang,
      target_language: targetLang,
      context: "enquiry_message",
    }),
  });

  if (!res.ok) {
    console.error("Translation function error:", await res.text());
    return { translated_text: text, detected_language: sourceLang };
  }

  return await res.json();
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  // Basic email validation — reject obviously invalid addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

/**
 * Get the client IP address from request headers.
 * Supports Cloudflare (CF-Connecting-IP), standard proxies (X-Forwarded-For),
 * and X-Real-IP as fallback.
 */
function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Check rate limits for guest enquiries.
 * - Max 5 enquiries per email per day (prevents spam from one guest)
 * - Max 20 enquiries per IP per day (prevents automated abuse)
 *
 * Uses the enquiries table with guest_email and client_ip columns.
 */
async function checkRateLimits(
  email: string,
  ip: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  // Check email rate limit
  const { count: emailCount, error: emailError } = await supabaseAdmin
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("guest_email", email.toLowerCase())
    .gte("created_at", todayIso);

  if (emailError) {
    console.error("Email rate limit check error:", emailError);
    return { allowed: false, reason: "Failed to verify rate limit" };
  }

  if ((emailCount ?? 0) >= 5) {
    return {
      allowed: false,
      reason:
        "You have reached the daily enquiry limit (5). Please try again tomorrow. / 您已达到每日咨询上限（5次），请明天再试。",
    };
  }

  // Check IP rate limit (secondary, higher threshold)
  if (ip !== "unknown") {
    const { count: ipCount, error: ipError } = await supabaseAdmin
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("client_ip", ip)
      .gte("created_at", todayIso);

    if (!ipError && (ipCount ?? 0) >= 20) {
      return {
        allowed: false,
        reason: "Too many enquiries from this network today. Please try again tomorrow.",
      };
    }
  }

  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Simple match factor calculation for guests (no full profile available)
// ---------------------------------------------------------------------------

interface MatchFactor {
  label_en: string;
  label_zh: string;
  icon: string; // emoji for badge display
}

async function calculateGuestMatchFactors(
  guestSuburb: string | undefined,
  centerProfileId: string,
): Promise<MatchFactor[]> {
  const factors: MatchFactor[] = [];

  try {
    // Fetch center profile for language and location info
    const { data: center } = await supabaseAdmin
      .from("center_profiles")
      .select("staff_languages, suburb, location")
      .eq("profile_id", centerProfileId)
      .single();

    if (!center) return factors;

    // Language factors — staff_languages is jsonb array of {language, count}
    const staffLangs: Array<{ language: string; count: number }> = center.staff_languages ?? [];
    const langNames = staffLangs.map((sl) => sl.language?.toLowerCase());
    if (langNames.includes("mandarin") || langNames.includes("chinese")) {
      factors.push({
        label_en: "Mandarin spoken",
        label_zh: "提供普通话服务",
        icon: "language",
      });
    }
    if (langNames.includes("cantonese")) {
      factors.push({
        label_en: "Cantonese spoken",
        label_zh: "提供粤语服务",
        icon: "language",
      });
    }

    // Suburb match factor (simple text comparison — no geocoding needed for guests)
    if (guestSuburb && center.suburb) {
      if (guestSuburb.trim().toLowerCase() === center.suburb.trim().toLowerCase()) {
        factors.push({
          label_en: "Same suburb",
          label_zh: "同一区域",
          icon: "location",
        });
      }
    }
  } catch (e) {
    // Match factors are non-critical; log and continue
    console.warn("Match factor calculation failed:", e);
  }

  return factors;
}

/**
 * Haversine formula to calculate distance between two lat/lng points in km.
 */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight — must allow unauthenticated requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    // 1. Parse and validate input (NO auth required)
    const body: SubmitGuestEnquiryRequest = await req.json();

    // Required field validation
    if (!body.center_profile_id?.trim()) {
      return errorResponse("'center_profile_id' is required");
    }
    if (!body.guest_name?.trim()) {
      return errorResponse("'guest_name' is required / 请填写您的姓名");
    }
    if (!body.guest_email?.trim() || !isValidEmail(body.guest_email.trim())) {
      return errorResponse("A valid email address is required / 请填写有效的电子邮箱");
    }
    if (!body.guest_child_age?.trim()) {
      return errorResponse("'guest_child_age' is required / 请填写孩子的年龄");
    }
    if (!body.message?.trim()) {
      return errorResponse("'message' is required / 请填写留言");
    }
    if (body.message.trim().length > 2000) {
      return errorResponse("Message must be under 2000 characters / 留言不能超过2000字");
    }

    const sanitizedEmail = body.guest_email.trim().toLowerCase();
    const clientIp = getClientIp(req);

    // 2. Rate limit check
    const rateLimitResult = await checkRateLimits(sanitizedEmail, clientIp);
    if (!rateLimitResult.allowed) {
      return errorResponse(rateLimitResult.reason ?? "Rate limit exceeded", 429);
    }

    // 3. Verify center exists
    const { data: center, error: centerError } = await supabaseAdmin
      .from("center_profiles")
      .select(`
        *,
        profile:profiles!center_profiles_profile_id_fkey(email, preferred_language)
      `)
      .eq("profile_id", body.center_profile_id)
      .single();

    if (centerError || !center) {
      return errorResponse("Center not found", 404);
    }

    // 4. Detect language and translate if needed
    const messageLanguage = detectLanguage(body.message.trim());
    let messageTranslated: string | null = null;

    if (messageLanguage === "zh") {
      const translation = await translateText(body.message.trim(), "zh", "en");
      messageTranslated = translation.translated_text;
    }

    // 5. Translation preview flow:
    //    If Chinese message and not confirmed, return the translation for preview
    //    Per Yuki + Mei Lin: "You MUST let me see the translation before sending"
    if (messageLanguage === "zh" && !body.confirmed) {
      return jsonResponse({
        success: true,
        requires_confirmation: true,
        translation_preview: messageTranslated,
        detected_language: messageLanguage,
        message:
          "Please review the bilingual version of your message before sending. / 发送前请确认您留言的双语版本。",
      });
    }

    // 6. If English message or confirmed Chinese message, proceed to send

    // Calculate match factors (not score — per Karen/Rachel/Yuki feedback)
    const matchFactors = await calculateGuestMatchFactors(
      body.guest_suburb,
      body.center_profile_id,
    );

    // 7. Save enquiry to database (using admin client, bypasses RLS)
    const { data: enquiry, error: insertError } = await supabaseAdmin
      .from("enquiries")
      .insert({
        family_profile_id: null, // Guest — no account
        center_profile_id: body.center_profile_id,
        guest_name: body.guest_name.trim(),
        guest_email: sanitizedEmail,
        guest_phone: body.guest_phone?.trim() || null,
        guest_wechat_id: body.guest_wechat_id?.trim() || null,
        guest_child_age: body.guest_child_age.trim(),
        guest_suburb: body.guest_suburb?.trim() || null,
        guest_child_days_needed: body.guest_child_days_needed?.trim() || null,
        guest_preferred_language: messageLanguage,
        preferred_tour_datetime: body.preferred_tour_datetime || null,
        message_original: body.message.trim(),
        message_translated: messageTranslated,
        message_source_language: messageLanguage,
        contact_preference: body.contact_preference ?? ["email"],
        match_factors: matchFactors,
        client_ip: clientIp !== "unknown" ? clientIp : null,
        is_guest: true,
        status: "new",
      })
      .select("id")
      .single();

    if (insertError || !enquiry) {
      console.error("Failed to save guest enquiry:", insertError);
      return errorResponse("Failed to save enquiry", 500);
    }

    // 8. Send notification email to center — structured per Karen's feedback:
    //    Lead with: child age, days needed, suburb, phone, start date
    //    Then: message + translation
    //    Then: factor badges (not score number)
    const centerEmailAddr = center.email || center.profile?.email;

    if (centerEmailAddr) {
      try {
        const notificationData: EnquiryNotificationData = {
          centerName: center.center_name,
          familyName: body.guest_name.trim(),
          childAge: body.guest_child_age.trim(),
          daysPerWeek: body.guest_child_days_needed?.trim() || "Not specified / 未指定",
          suburb: body.guest_suburb?.trim() || "Not specified / 未指定",
          contactEmail: sanitizedEmail,
          contactPhone: body.guest_phone?.trim() || undefined,
          contactWechat: body.guest_wechat_id?.trim() || undefined,
          contactPreference: (body.contact_preference ?? ["email"]).join(", "),
          preferredTourDatetime: body.preferred_tour_datetime || "Flexible / 灵活安排",
          messageOriginal: body.message.trim(),
          messageTranslated: messageTranslated || undefined,
          messageSourceLanguage: messageLanguage === "zh" ? "Chinese" : "English",
          matchFactors: matchFactors,
          enquiryId: enquiry.id,
          isGuest: true,
        };

        const emailOpts = enquiryNotificationEmail(notificationData);
        emailOpts.to = centerEmailAddr;
        emailOpts.replyTo = sanitizedEmail;
        await sendEmail(emailOpts);
      } catch (emailError) {
        console.error("Failed to send center notification email:", emailError);
        // Non-critical — enquiry is already saved
      }
    }

    // 9. Send confirmation email to guest in detected language
    try {
      const confirmData: GuestEnquiryConfirmationData = {
        guestName: body.guest_name.trim(),
        centerName: center.center_name,
        preferredTourDatetime: body.preferred_tour_datetime || undefined,
        preferredLanguage: messageLanguage,
        messageOriginal: body.message.trim(),
        messageTranslated: messageTranslated || undefined,
        messageSourceLanguage: messageLanguage,
      };
      const confirmOpts = guestEnquiryConfirmationEmail(confirmData, sanitizedEmail);
      await sendEmail(confirmOpts);
    } catch (emailError) {
      console.error("Failed to send guest confirmation email:", emailError);
      // Non-critical
    }

    // 10. Return success
    return jsonResponse({
      success: true,
      enquiry_id: enquiry.id,
      translation_preview: messageTranslated,
      message_translated: messageTranslated !== null,
      detected_language: messageLanguage,
    });
  } catch (error) {
    console.error("submit-guest-enquiry error:", error);
    return errorResponse(
      "An unexpected error occurred / 发生了意外错误",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
