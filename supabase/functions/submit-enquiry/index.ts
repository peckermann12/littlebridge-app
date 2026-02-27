/**
 * submit-enquiry Edge Function
 *
 * Handles a family submitting a "Book a Tour" enquiry to a childcare center.
 *
 * Flow:
 * 1. Validate input
 * 2. Verify auth
 * 3. Rate limit (max 5 enquiries per family per day)
 * 4. Detect message language; translate if Chinese
 * 5. Calculate match score (via database function)
 * 6. Save enquiry to database
 * 7. Send notification email to center (bilingual)
 * 8. Send confirmation email to family (in preferred language)
 * 9. Return success with enquiry ID
 *
 * POST /submit-enquiry
 * Body: {
 *   family_profile_id: string,
 *   center_profile_id: string,
 *   message: string,
 *   preferred_tour_datetime: string,
 *   contact_preference: string[]   // e.g. ["email", "phone", "wechat"]
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { supabaseAdmin, SUPABASE_URL } from "../_shared/supabase.ts";
import { verifyAuth } from "../_shared/auth.ts";
import {
  sendEmail,
  enquiryNotificationEmail,
  enquiryConfirmationEmail,
  type EnquiryNotificationData,
  type EnquiryConfirmationData,
} from "../_shared/resend.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmitEnquiryRequest {
  family_profile_id: string;
  center_profile_id: string;
  message: string;
  preferred_tour_datetime: string;
  contact_preference: string[];
}

// ---------------------------------------------------------------------------
// Language detection (mirrors translate-text logic)
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
// Format child age from DOB
// ---------------------------------------------------------------------------

function formatChildAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years} year${years > 1 ? "s" : ""} ${remMonths} month${remMonths > 1 ? "s" : ""}` : `${years} year${years > 1 ? "s" : ""}`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    // 1. Verify auth
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    // 2. Parse and validate input
    const body: SubmitEnquiryRequest = await req.json();

    const requiredFields = [
      "family_profile_id",
      "center_profile_id",
      "message",
      "preferred_tour_datetime",
      "contact_preference",
    ] as const;

    for (const field of requiredFields) {
      if (!body[field]) {
        return errorResponse(`'${field}' is required`);
      }
    }

    if (typeof body.message !== "string" || body.message.trim().length === 0) {
      return errorResponse("'message' must be a non-empty string");
    }

    if (!Array.isArray(body.contact_preference) || body.contact_preference.length === 0) {
      return errorResponse("'contact_preference' must be a non-empty array");
    }

    // 3. Rate limit — max 5 enquiries per family per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: enquiryCount, error: countError } = await supabaseAdmin
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("family_profile_id", body.family_profile_id)
      .gte("created_at", todayStart.toISOString());

    if (countError) {
      console.error("Rate limit check error:", countError);
      return errorResponse("Failed to check rate limit", 500);
    }

    if ((enquiryCount ?? 0) >= 5) {
      return errorResponse(
        "You have reached the daily enquiry limit of 5. Please try again tomorrow.",
        429,
      );
    }

    // 4. Fetch family profile
    const { data: family, error: familyError } = await supabaseAdmin
      .from("family_profiles")
      .select(`
        *,
        profile:profiles!family_profiles_profile_id_fkey(email, preferred_language),
        children(*)
      `)
      .eq("profile_id", body.family_profile_id)
      .single();

    if (familyError || !family) {
      return errorResponse("Family profile not found", 404);
    }

    // 5. Fetch center profile
    const { data: center, error: centerError } = await supabaseAdmin
      .from("center_profiles")
      .select(`
        *,
        profile:profiles!center_profiles_profile_id_fkey(email, preferred_language)
      `)
      .eq("profile_id", body.center_profile_id)
      .single();

    if (centerError || !center) {
      return errorResponse("Center profile not found", 404);
    }

    // 6. Detect language and translate if needed
    const messageLanguage = detectLanguage(body.message);
    let messageTranslated: string | null = null;

    if (messageLanguage === "zh") {
      const translation = await translateText(body.message.trim(), "zh", "en");
      messageTranslated = translation.translated_text;
    } else if (messageLanguage === "en") {
      // Optionally translate to Chinese for bilingual display
      // For MVP, only translate ZH -> EN as that's the primary use case
      messageTranslated = null;
    }

    // 7. Calculate match score (via database function if it exists)
    //    match_family_to_center returns a plain integer 0-100
    let matchScore: number | null = null;

    try {
      const { data: score, error: matchError } = await supabaseAdmin.rpc(
        "match_family_to_center",
        {
          p_family_id: body.family_profile_id,
          p_center_id: body.center_profile_id,
        },
      );

      if (!matchError && score !== null) {
        matchScore = score as number;
      }
    } catch (e) {
      // Match scoring is non-critical; log and continue
      console.warn("Match score calculation failed:", e);
    }

    // 8. Save enquiry to database
    const { data: enquiry, error: insertError } = await supabaseAdmin
      .from("enquiries")
      .insert({
        family_profile_id: body.family_profile_id,
        center_profile_id: body.center_profile_id,
        preferred_tour_datetime: body.preferred_tour_datetime,
        message_original: body.message.trim(),
        message_translated: messageTranslated,
        message_source_language: messageLanguage,
        contact_preference: body.contact_preference,
        match_score: matchScore,
        status: "new",
      })
      .select("id")
      .single();

    if (insertError || !enquiry) {
      console.error("Failed to save enquiry:", insertError);
      return errorResponse("Failed to save enquiry", 500);
    }

    // 9. Send notification email to center
    const firstChild = family.children?.[0];
    const childAge = firstChild?.date_of_birth
      ? formatChildAge(firstChild.date_of_birth)
      : "Not specified";
    const daysPerWeek = firstChild?.days_per_week
      ? `${firstChild.days_per_week} days/week`
      : "Not specified";

    const notificationData: EnquiryNotificationData = {
      centerName: center.center_name,
      familyName: family.parent_name,
      familyChineseName: family.chinese_name || undefined,
      childAge,
      daysPerWeek,
      suburb: family.suburb ?? "Not specified",
      preferredLanguage: family.communication_language ?? family.profile?.preferred_language ?? "en",
      contactPreference: body.contact_preference.join(", "),
      contactEmail: family.profile?.email ?? "",
      contactPhone: family.phone || undefined,
      contactWechat: family.wechat_id || undefined,
      preferredTourDatetime: body.preferred_tour_datetime,
      messageOriginal: body.message.trim(),
      messageTranslated: messageTranslated || undefined,
      messageSourceLanguage: messageLanguage === "zh" ? "Chinese" : "English",
      matchScore: matchScore ?? undefined,
      enquiryId: enquiry.id,
    };

    const centerEmailAddr = center.email || center.profile?.email;
    if (centerEmailAddr) {
      try {
        const emailOpts = enquiryNotificationEmail(notificationData);
        emailOpts.to = centerEmailAddr;
        emailOpts.replyTo = family.profile?.email;
        await sendEmail(emailOpts);
      } catch (emailError) {
        console.error("Failed to send center notification email:", emailError);
        // Non-critical; enquiry is already saved
      }
    }

    // 10. Send confirmation email to family
    const familyEmailAddr = family.profile?.email;
    if (familyEmailAddr) {
      try {
        const confirmData: EnquiryConfirmationData = {
          familyName: family.parent_name,
          centerName: center.center_name,
          preferredTourDatetime: body.preferred_tour_datetime,
          preferredLanguage: family.communication_language ?? family.profile?.preferred_language ?? "en",
        };
        const confirmOpts = enquiryConfirmationEmail(confirmData, familyEmailAddr);
        await sendEmail(confirmOpts);
      } catch (emailError) {
        console.error("Failed to send family confirmation email:", emailError);
        // Non-critical
      }
    }

    // 11. Return success
    return jsonResponse({
      success: true,
      enquiry_id: enquiry.id,
      match_score: matchScore,
      message_translated: messageTranslated !== null,
    });
  } catch (error) {
    console.error("submit-enquiry error:", error);
    return errorResponse(
      "An unexpected error occurred",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
