/**
 * submit-application Edge Function
 *
 * Handles an educator expressing interest in a job listing.
 *
 * Flow:
 * 1. Validate input
 * 2. Verify auth
 * 3. Check for duplicate application
 * 4. Detect cover note language; translate if needed
 * 5. Calculate match score (via database function)
 * 6. Save application to database
 * 7. Send notification email to center
 * 8. Send confirmation email to educator
 * 9. Return success with application ID
 *
 * POST /submit-application
 * Body: {
 *   educator_profile_id: string,
 *   job_listing_id: string,
 *   cover_note: string,
 *   available_to_start: string,
 *   interview_availability: string
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { supabaseAdmin, SUPABASE_URL } from "../_shared/supabase.ts";
import { verifyAuth } from "../_shared/auth.ts";
import {
  sendEmail,
  applicationNotificationEmail,
  applicationConfirmationEmail,
  type ApplicationNotificationData,
  type ApplicationConfirmationData,
} from "../_shared/resend.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmitApplicationRequest {
  educator_profile_id: string;
  job_listing_id: string;
  cover_note: string;
  available_to_start: string;
  interview_availability: string;
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
      context: "cover_note",
    }),
  });

  if (!res.ok) {
    console.error("Translation function error:", await res.text());
    return { translated_text: text, detected_language: sourceLang };
  }

  return await res.json();
}

// ---------------------------------------------------------------------------
// Format languages JSONB for display
// ---------------------------------------------------------------------------

function formatLanguages(languages: Record<string, string>[] | null): string {
  if (!languages || !Array.isArray(languages)) return "Not specified";
  return languages
    .map((l) => {
      const name = l.language || l.name || Object.keys(l)[0] || "Unknown";
      const level = l.proficiency || l.level || Object.values(l)[0] || "";
      return level ? `${name} (${level})` : name;
    })
    .join(", ");
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
    const body: SubmitApplicationRequest = await req.json();

    const requiredFields = [
      "educator_profile_id",
      "job_listing_id",
      "cover_note",
      "available_to_start",
      "interview_availability",
    ] as const;

    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== "string" || body[field].trim().length === 0) {
        return errorResponse(`'${field}' is required and must be a non-empty string`);
      }
    }

    // 3. Check for duplicate application
    const { data: existing, error: dupError } = await supabaseAdmin
      .from("job_applications")
      .select("id")
      .eq("educator_profile_id", body.educator_profile_id)
      .eq("job_listing_id", body.job_listing_id)
      .maybeSingle();

    if (dupError) {
      console.error("Duplicate check error:", dupError);
      return errorResponse("Failed to check for existing application", 500);
    }

    if (existing) {
      return errorResponse(
        "You have already applied for this position. You cannot apply twice.",
        409,
      );
    }

    // 4. Fetch educator profile
    const { data: educator, error: educatorError } = await supabaseAdmin
      .from("educator_profiles")
      .select(`
        *,
        profile:profiles!educator_profiles_profile_id_fkey(email, preferred_language)
      `)
      .eq("profile_id", body.educator_profile_id)
      .single();

    if (educatorError || !educator) {
      return errorResponse("Educator profile not found", 404);
    }

    // 5. Fetch job listing and center profile
    const { data: job, error: jobError } = await supabaseAdmin
      .from("job_listings")
      .select(`
        *,
        center:center_profiles!job_listings_center_profile_id_fkey(
          *,
          profile:profiles!center_profiles_profile_id_fkey(email, preferred_language)
        )
      `)
      .eq("id", body.job_listing_id)
      .single();

    if (jobError || !job) {
      return errorResponse("Job listing not found", 404);
    }

    if (job.status !== "active") {
      return errorResponse("This job listing is no longer accepting applications", 400);
    }

    // 6. Detect language and translate cover note if needed
    const coverNoteLanguage = detectLanguage(body.cover_note);
    let coverNoteTranslated: string | null = null;

    if (coverNoteLanguage === "zh") {
      const translation = await translateText(body.cover_note.trim(), "zh", "en");
      coverNoteTranslated = translation.translated_text;
    }

    // 7. Calculate match score
    let matchScore: number | null = null;
    let matchReasons: string[] = [];

    try {
      const { data: matchData, error: matchError } = await supabaseAdmin.rpc(
        "calculate_educator_job_match",
        {
          p_educator_profile_id: body.educator_profile_id,
          p_job_listing_id: body.job_listing_id,
        },
      );

      if (!matchError && matchData) {
        matchScore = matchData.score ?? null;
        matchReasons = matchData.reasons ?? [];
      }
    } catch (e) {
      console.warn("Match score calculation failed:", e);
    }

    // 8. Save application to database
    const { data: application, error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        educator_profile_id: body.educator_profile_id,
        job_listing_id: body.job_listing_id,
        cover_note_original: body.cover_note.trim(),
        cover_note_translated: coverNoteTranslated,
        cover_note_source_language: coverNoteLanguage,
        available_to_start: body.available_to_start,
        interview_availability: body.interview_availability,
        match_score: matchScore,
        match_reasons: matchReasons,
        status: "new",
      })
      .select("id")
      .single();

    if (insertError || !application) {
      console.error("Failed to save application:", insertError);
      return errorResponse("Failed to save application", 500);
    }

    // 9. Send notification email to center
    const centerEmailAddr = job.center?.email || job.center?.profile?.email;

    if (centerEmailAddr) {
      try {
        const notificationData: ApplicationNotificationData = {
          centerName: job.center.center_name,
          centerEmail: centerEmailAddr,
          educatorName: educator.full_name,
          educatorLanguages: formatLanguages(educator.languages),
          educatorQualification: educator.qualification ?? "Not specified",
          educatorExperience: educator.years_experience
            ? `${educator.years_experience} years`
            : "Not specified",
          educatorSuburb: educator.suburb ?? "Not specified",
          jobTitle: job.title,
          coverNoteOriginal: body.cover_note.trim(),
          coverNoteTranslated: coverNoteTranslated || undefined,
          coverNoteSourceLanguage: coverNoteLanguage === "zh" ? "Chinese" : "English",
          availableToStart: body.available_to_start,
          interviewAvailability: body.interview_availability,
          matchScore: matchScore ?? undefined,
          matchReasons: matchReasons.length > 0 ? matchReasons : undefined,
          applicationId: application.id,
        };

        const emailOpts = applicationNotificationEmail(notificationData);
        emailOpts.replyTo = educator.profile?.email;
        await sendEmail(emailOpts);
      } catch (emailError) {
        console.error("Failed to send center notification email:", emailError);
      }
    }

    // 10. Send confirmation email to educator
    const educatorEmailAddr = educator.profile?.email;

    if (educatorEmailAddr) {
      try {
        const confirmData: ApplicationConfirmationData = {
          educatorName: educator.full_name,
          jobTitle: job.title,
          centerName: job.center?.center_name ?? "the center",
          preferredLanguage: educator.profile?.preferred_language ?? "en",
        };

        const confirmOpts = applicationConfirmationEmail(confirmData, educatorEmailAddr);
        await sendEmail(confirmOpts);
      } catch (emailError) {
        console.error("Failed to send educator confirmation email:", emailError);
      }
    }

    // 11. Return success
    return jsonResponse({
      success: true,
      application_id: application.id,
      match_score: matchScore,
      match_reasons: matchReasons,
      cover_note_translated: coverNoteTranslated !== null,
    });
  } catch (error) {
    console.error("submit-application error:", error);
    return errorResponse(
      "An unexpected error occurred",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
