/**
 * translate-text Edge Function
 *
 * Translates text between English and Chinese using the Claude API (Haiku model).
 * Designed for the LittleBridge bilingual childcare marketplace.
 *
 * - Auto-detects source language if not provided.
 * - Uses a childcare-specific system prompt with glossary terms.
 * - Handles mixed Chinese-English input gracefully.
 *
 * POST /translate-text
 * Body: { text: string, source_language?: string, target_language?: string, context?: string }
 * Returns: { translated_text: string, detected_language: string, source_text: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

// ---------------------------------------------------------------------------
// Childcare-specific system prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a professional translator for LittleBridge (小桥), a bilingual childcare marketplace connecting Chinese/Mandarin-speaking families with childcare centers in Australia.

Your task is to translate text between English and Chinese (Simplified Mandarin). Follow these instructions carefully:

1. TRANSLATION STYLE:
   - Translate naturally and idiomatically, NOT literally or word-for-word.
   - Maintain an empathetic, warm, and professional tone appropriate for early childhood education contexts.
   - When translating from Chinese to English, produce natural Australian English that a center director would find professional and easy to understand.
   - When translating from English to Chinese, produce natural Simplified Chinese that a Mandarin-speaking parent would find warm and accessible.
   - Preserve the emotional intent and sentiment of the original message.

2. CHILDCARE TERMINOLOGY GLOSSARY — always use these standardised translations:
   - CCS (Child Care Subsidy) = 托儿补贴
   - ACECQA (Australian Children's Education and Care Quality Authority) = 澳大利亚儿童教育与护理质量管理局
   - NQS (National Quality Standard) = 国家质量标准
   - WWCC (Working With Children Check) = 儿童工作审查
   - ECT (Early Childhood Teacher) = 幼儿教师
   - LDC (Long Day Care) = 全日制托儿所
   - FDC (Family Day Care) = 家庭日托
   - OSHC (Outside School Hours Care) = 课后托管
   - Diploma of ECE (Early Childhood Education) = 幼儿教育文凭
   - Certificate III in Early Childhood = 幼儿教育三级证书
   - Approved Provider = 核准服务提供者
   - Inclusion Support = 融合支持
   - Transition to school = 幼小衔接
   - Kindy / Kindergarten = 幼儿园
   - Preppie / Prep = 学前班
   - Nappy = 尿布
   - Dummy / Pacifier = 安抚奶嘴
   - Nap time / Rest time = 午休时间
   - Drop-off / Pick-up = 送园 / 接园
   - Orientation visit = 适应期参观
   - Settling in period = 适应期
   - Waitlist = 候补名单
   - Vacancy = 空位
   - Enrolment = 入学登记
   - Excursion = 外出活动
   - Educator-to-child ratio = 师生比例

3. HANDLING MIXED INPUT:
   - If the text mixes Chinese and English (common for bilingual families), translate each part into the target language while keeping proper nouns, names, and abbreviations intact.
   - Keep Australian place names, center names, and personal names in their original script.

4. COLLOQUIAL MANDARIN:
   - Understand and translate colloquial Mandarin / internet slang / WeChat-style expressions into natural, clear English.
   - For example: 宝宝 = child/little one (not "treasure treasure"), 带娃 = looking after the kids, 鸡娃 = academic pressure on children.

5. RESPONSE FORMAT:
   - Return ONLY the translated text. No explanations, notes, or commentary.
   - Do not add any prefixes like "Translation:" — just the translated text itself.

6. LANGUAGE DETECTION (when asked):
   - If the text is primarily Chinese characters, it is "zh".
   - If the text is primarily English/Latin script, it is "en".
   - For mixed text, determine the dominant language.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TranslateRequest {
  text: string;
  source_language?: string; // "en" | "zh"
  target_language?: string; // "en" | "zh"
  context?: string; // e.g. "enquiry_message", "center_description", "cover_note"
}

interface TranslateResponse {
  translated_text: string;
  detected_language: string;
  source_text: string;
}

// ---------------------------------------------------------------------------
// Language detection helper
// ---------------------------------------------------------------------------

function detectLanguage(text: string): "en" | "zh" {
  // Count Chinese characters (CJK Unified Ideographs range)
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length;
  // If more than 20% of characters are Chinese, treat as Chinese
  return totalChars > 0 && chineseChars / totalChars > 0.2 ? "zh" : "en";
}

// ---------------------------------------------------------------------------
// Claude API call
// ---------------------------------------------------------------------------

async function callClaude(
  text: string,
  sourceLang: string,
  targetLang: string,
  context?: string,
): Promise<string> {
  const contextHint = context
    ? `\n\nContext: This text is a ${context.replace(/_/g, " ")} on a childcare marketplace platform.`
    : "";

  const userMessage = `Translate the following text from ${sourceLang === "zh" ? "Chinese" : "English"} to ${targetLang === "zh" ? "Chinese (Simplified)" : "English"}.${contextHint}

Text to translate:
${text}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const translatedText = data.content?.[0]?.text?.trim();

  if (!translatedText) {
    throw new Error("Empty translation response from Claude API");
  }

  return translatedText;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body: TranslateRequest = await req.json();

    // Validate input
    if (!body.text || typeof body.text !== "string" || body.text.trim().length === 0) {
      return errorResponse("'text' is required and must be a non-empty string");
    }

    if (body.text.length > 10000) {
      return errorResponse("Text exceeds maximum length of 10,000 characters");
    }

    // Detect or use provided source language
    const detectedLanguage = body.source_language || detectLanguage(body.text);
    const targetLanguage = body.target_language || (detectedLanguage === "zh" ? "en" : "zh");

    // If source and target are the same, return the original text
    if (detectedLanguage === targetLanguage) {
      const result: TranslateResponse = {
        translated_text: body.text.trim(),
        detected_language: detectedLanguage,
        source_text: body.text.trim(),
      };
      return jsonResponse(result as unknown as Record<string, unknown>);
    }

    // Call Claude API for translation
    const translatedText = await callClaude(
      body.text.trim(),
      detectedLanguage,
      targetLanguage,
      body.context,
    );

    const result: TranslateResponse = {
      translated_text: translatedText,
      detected_language: detectedLanguage,
      source_text: body.text.trim(),
    };

    return jsonResponse(result as unknown as Record<string, unknown>);
  } catch (error) {
    console.error("Translation error:", error);

    // Fallback: return original text with error flag
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.text) {
        return jsonResponse(
          {
            translated_text: body.text.trim(),
            detected_language: body.source_language || "unknown",
            source_text: body.text.trim(),
            warning: "Translation failed; returning original text",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          200,
        );
      }
    } catch {
      // Ignore fallback errors
    }

    return errorResponse(
      "Translation service unavailable",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
