/**
 * Resend email helper for LittleBridge — v2
 *
 * Updated based on consolidated review feedback:
 *   - Karen: restructure enquiry notification to lead with actionable info (age, days, suburb, phone)
 *   - Rachel/Yuki/Karen: replace match score with factor badges
 *   - Mei Lin: show original + translation side by side in confirmation
 *   - Yuki: reframe "AI Translation" as "Bilingual version"
 *   - Rachel: add account creation CTA for guests
 *   - Rachel/Yuki: add waitlist confirmation email
 *
 * All templates are mobile-responsive and use bilingual framing.
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "LittleBridge <hello@littlebridge.com.au>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://littlebridge.com.au";

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }

  return await res.json();
}

// ---------------------------------------------------------------------------
// Base template wrapper (mobile-responsive)
// ---------------------------------------------------------------------------

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LittleBridge</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; -webkit-text-size-adjust: 100%; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 24px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .header p { color: #e0d4fc; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .body h2 { font-size: 20px; margin-top: 0; color: #1a1a1a; }
    .body h3 { font-size: 17px; color: #1a1a1a; margin-top: 24px; }
    .body p, .body li { font-size: 15px; line-height: 1.6; color: #444; }
    .detail-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .detail-box dt { font-weight: 600; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; }
    .detail-box dt:first-child { margin-top: 0; }
    .detail-box dd { margin: 2px 0 0 0; font-size: 15px; color: #1a1a1a; }
    .factor-badges { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .factor-badge { display: inline-block; padding: 6px 14px; border-radius: 16px; font-size: 13px; font-weight: 500; background-color: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; }
    .factor-badge.language { background-color: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
    .factor-badge.location { background-color: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .cta { display: inline-block; background: #4F46E5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .cta-secondary { display: inline-block; background: #ffffff; color: #4F46E5 !important; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 8px 0; border: 2px solid #4F46E5; }
    .bilingual-block { border-left: 3px solid #7C3AED; padding-left: 16px; margin: 12px 0; }
    .bilingual-label { font-size: 12px; color: #7C3AED; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .bilingual-side-by-side { display: table; width: 100%; border-spacing: 0; margin: 12px 0; }
    .bilingual-col { display: table-cell; width: 50%; vertical-align: top; padding: 12px 16px; }
    .bilingual-col:first-child { border-right: 1px solid #e5e7eb; }
    .bilingual-col .bilingual-label { margin-bottom: 8px; }
    .highlight-row { background-color: #fef3c7; border-radius: 6px; padding: 12px 16px; margin: 8px 0; }
    .highlight-row strong { color: #92400e; }
    .contact-grid { display: table; width: 100%; margin: 8px 0; }
    .contact-item { display: table-row; }
    .contact-label { display: table-cell; padding: 4px 12px 4px 0; font-weight: 600; font-size: 14px; color: #6b7280; white-space: nowrap; vertical-align: top; }
    .contact-value { display: table-cell; padding: 4px 0; font-size: 15px; color: #1a1a1a; }
    .contact-value a { color: #4F46E5; text-decoration: none; }
    .footer { padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
    .footer a { color: #7C3AED; text-decoration: none; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .subtle { font-size: 13px; color: #6b7280; }
    .center-link { display: block; padding: 10px 16px; margin: 6px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; text-decoration: none; color: #1a1a1a; font-size: 14px; }
    .center-link:hover { background-color: #f3f4f6; }
    .center-link .distance { color: #6b7280; font-size: 12px; }
    @media (max-width: 640px) {
      .body { padding: 20px 16px; }
      .header { padding: 20px 16px; }
      .bilingual-side-by-side { display: block; }
      .bilingual-col { display: block; width: 100%; padding: 12px 0; }
      .bilingual-col:first-child { border-right: none; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
      .factor-badges { gap: 6px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LittleBridge</h1>
      <p>Bilingual Childcare Marketplace / 双语幼托平台</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p><a href="${APP_URL}">littlebridge.com.au</a></p>
      <p>Connecting families, educators, and childcare centres across Australia.</p>
      <p>连接澳大利亚的家庭、教育工作者和幼托中心。</p>
      <hr class="divider" />
      <p><a href="${APP_URL}/unsubscribe">Unsubscribe / 退订</a> &middot; <a href="${APP_URL}/privacy">Privacy / 隐私</a></p>
      <p>&copy; ${new Date().getFullYear()} LittleBridge Pty Ltd. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Factor badge helpers — replaces match score badge
// Per Karen/Rachel/Yuki: show factor badges, not composite score number
// ---------------------------------------------------------------------------

export interface MatchFactor {
  label_en: string;
  label_zh: string;
  icon: string; // "language" | "location" | other
}

function factorBadgesHtml(factors: MatchFactor[] | undefined): string {
  if (!factors || factors.length === 0) return "";

  const badges = factors
    .map((f) => {
      const cssClass = f.icon === "language" ? "language" : f.icon === "location" ? "location" : "";
      return `<span class="factor-badge ${cssClass}">${escHtml(f.label_en)} / ${escHtml(f.label_zh)}</span>`;
    })
    .join("\n      ");

  return `
    <div class="factor-badges">
      ${badges}
    </div>`;
}

// ---------------------------------------------------------------------------
// 1. Enquiry Notification — sent to center
//    RESTRUCTURED per Karen's review (Section 7.7 of consolidated findings):
//    - Lead with child's age (does she have a spot?)
//    - Then days needed (are those days available?)
//    - Then suburb (close enough?)
//    - Then contact info (so she can call immediately)
//    - Then start date (urgent or browsing?)
//    - Then message (original + bilingual version)
//    - Then factor badges (not score number)
// ---------------------------------------------------------------------------

export interface EnquiryNotificationData {
  centerName: string;
  familyName: string;
  familyChineseName?: string;
  childAge: string;
  daysPerWeek: string;
  suburb: string;
  preferredLanguage?: string;
  contactPreference: string;
  contactEmail: string;
  contactPhone?: string;
  contactWechat?: string;
  preferredTourDatetime: string;
  messageOriginal: string;
  messageTranslated?: string;
  messageSourceLanguage: string;
  matchFactors?: MatchFactor[];
  enquiryId: string;
  isGuest?: boolean;
}

export function enquiryNotificationHtml(d: EnquiryNotificationData): string {
  // Build contact details section — prominent, so Karen can call immediately
  const contactRows: string[] = [];
  if (d.contactPhone) {
    contactRows.push(`
      <div class="contact-item">
        <span class="contact-label">Phone</span>
        <span class="contact-value"><a href="tel:${escHtml(d.contactPhone)}">${escHtml(d.contactPhone)}</a></span>
      </div>`);
  }
  contactRows.push(`
      <div class="contact-item">
        <span class="contact-label">Email</span>
        <span class="contact-value"><a href="mailto:${escHtml(d.contactEmail)}">${escHtml(d.contactEmail)}</a></span>
      </div>`);
  if (d.contactWechat) {
    contactRows.push(`
      <div class="contact-item">
        <span class="contact-label">WeChat</span>
        <span class="contact-value">${escHtml(d.contactWechat)}</span>
      </div>`);
  }

  // Bilingual message section — "Bilingual version" framing, not "AI Translation"
  let messageHtml: string;
  if (d.messageTranslated) {
    messageHtml = `
    <h3>Message / 留言</h3>
    <div class="bilingual-side-by-side" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div class="bilingual-col">
        <div class="bilingual-label">Original (${escHtml(d.messageSourceLanguage)})</div>
        <p style="margin: 0; font-size: 15px; color: #1a1a1a;">${escHtml(d.messageOriginal)}</p>
      </div>
      <div class="bilingual-col">
        <div class="bilingual-label">Bilingual version / 双语版本</div>
        <p style="margin: 0; font-size: 15px; color: #1a1a1a;">${escHtml(d.messageTranslated)}</p>
      </div>
    </div>`;
  } else {
    messageHtml = `
    <h3>Message / 留言</h3>
    <div class="bilingual-block">
      <p>${escHtml(d.messageOriginal)}</p>
    </div>`;
  }

  // Factor badges section
  const factorsHtml = factorBadgesHtml(d.matchFactors);

  // Guest indicator
  const guestNote = d.isGuest
    ? `<p class="subtle" style="margin-top: 4px; font-style: italic;">This family enquired as a guest (not yet registered). / 该家庭以访客身份咨询（尚未注册）。</p>`
    : "";

  const familyDisplay = d.familyChineseName
    ? `${escHtml(d.familyName)} (${escHtml(d.familyChineseName)})`
    : escHtml(d.familyName);

  return baseTemplate(`
    <h2>New Enquiry from ${escHtml(d.familyName)}</h2>
    <p>Hi ${escHtml(d.centerName)} team,</p>
    <p>A family is interested in your centre. Here is what you need to know:</p>
    ${guestNote}

    <!-- KEY DETAILS: Lead with what Karen needs to make a decision -->
    <div class="detail-box">
      <dt>Child's Age / 孩子年龄</dt>
      <dd><strong>${escHtml(d.childAge)}</strong></dd>

      <dt>Days Needed / 需要的天数</dt>
      <dd><strong>${escHtml(d.daysPerWeek)}</strong></dd>

      <dt>Suburb / 地区</dt>
      <dd><strong>${escHtml(d.suburb)}</strong></dd>

      <dt>Preferred Start / 希望开始时间</dt>
      <dd>${escHtml(d.preferredTourDatetime)}</dd>
    </div>

    <!-- CONTACT: So Karen can call immediately -->
    <h3>Contact / 联系方式</h3>
    <div class="detail-box">
      <dd style="margin-top: 0;"><strong>${familyDisplay}</strong></dd>
      <div class="contact-grid">
        ${contactRows.join("")}
      </div>
      <dt style="margin-top: 8px;">Preferred contact / 首选联系方式</dt>
      <dd>${escHtml(d.contactPreference)}</dd>
    </div>

    <!-- MESSAGE -->
    ${messageHtml}

    <!-- FACTOR BADGES: Not score number -->
    ${factorsHtml ? `<h3>At a Glance / 快速了解</h3>${factorsHtml}` : ""}

    <a class="cta" href="${APP_URL}/dashboard/enquiries/${escHtml(d.enquiryId)}">View in Dashboard / 查看详情</a>

    <hr class="divider" />
    <p class="subtle">Responding quickly helps build trust with families. We recommend replying within 24-48 hours.</p>
    <p class="subtle">快速回复有助于建立家庭信任。我们建议在24-48小时内回复。</p>
  `);
}

export function enquiryNotificationEmail(d: EnquiryNotificationData): EmailOptions {
  return {
    to: d.contactEmail, // Will be overridden to center email by caller
    subject: `New Enquiry: ${d.childAge}, ${d.daysPerWeek} — ${d.familyName} / 新咨询`,
    html: enquiryNotificationHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 2. Enquiry Confirmation — sent to family (registered user)
//    Updated per review feedback:
//    - Add: "Expect a response within 24-48 hours"
//    - Add: "Here's what you sent" with original + translation side by side
//    - In Chinese for Chinese-language users
// ---------------------------------------------------------------------------

export interface EnquiryConfirmationData {
  familyName: string;
  centerName: string;
  preferredTourDatetime: string;
  preferredLanguage: string; // "en" | "zh"
  messageOriginal?: string;
  messageTranslated?: string;
  messageSourceLanguage?: string;
}

export function enquiryConfirmationHtml(d: EnquiryConfirmationData): string {
  const isZh = d.preferredLanguage === "zh";

  // Build the "what you sent" section if we have the original message
  let messageSummaryHtml = "";
  if (d.messageOriginal) {
    if (d.messageTranslated) {
      messageSummaryHtml = `
      <h3>${isZh ? "您发送的内容" : "Here's what you sent"}</h3>
      <div class="bilingual-side-by-side" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div class="bilingual-col">
          <div class="bilingual-label">${isZh ? "原文" : "Original"}</div>
          <p style="margin: 0; font-size: 14px; color: #1a1a1a;">${escHtml(d.messageOriginal)}</p>
        </div>
        <div class="bilingual-col">
          <div class="bilingual-label">${isZh ? "双语版本" : "Bilingual version"}</div>
          <p style="margin: 0; font-size: 14px; color: #1a1a1a;">${escHtml(d.messageTranslated)}</p>
        </div>
      </div>`;
    } else {
      messageSummaryHtml = `
      <h3>${isZh ? "您发送的内容" : "Here's what you sent"}</h3>
      <div class="bilingual-block">
        <p style="font-size: 14px;">${escHtml(d.messageOriginal)}</p>
      </div>`;
    }
  }

  if (isZh) {
    return baseTemplate(`
      <h2>咨询已发送</h2>
      <p>${escHtml(d.familyName)}，您好！</p>
      <p>您的咨询已成功发送至 <strong>${escHtml(d.centerName)}</strong>。该中心将在 <strong>24-48小时内</strong> 与您联系。</p>

      <dl class="detail-box">
        <dt>中心</dt>
        <dd>${escHtml(d.centerName)}</dd>
        <dt>希望参观时间</dt>
        <dd>${escHtml(d.preferredTourDatetime)}</dd>
      </dl>

      ${messageSummaryHtml}

      <a class="cta" href="${APP_URL}/dashboard">查看我的咨询</a>

      <hr class="divider" />
      <p class="subtle">如果您在48小时内未收到回复，请随时通过 hello@littlebridge.com.au 联系我们，我们会帮您跟进。</p>
    `);
  }

  return baseTemplate(`
    <h2>Enquiry Sent</h2>
    <p>Hi ${escHtml(d.familyName)},</p>
    <p>Your enquiry has been sent to <strong>${escHtml(d.centerName)}</strong>. Expect a response within <strong>24-48 hours</strong>.</p>

    <dl class="detail-box">
      <dt>Centre</dt>
      <dd>${escHtml(d.centerName)}</dd>
      <dt>Preferred Tour Time</dt>
      <dd>${escHtml(d.preferredTourDatetime)}</dd>
    </dl>

    ${messageSummaryHtml}

    <a class="cta" href="${APP_URL}/dashboard">View My Enquiries</a>

    <hr class="divider" />
    <p class="subtle">If you don't hear back within 48 hours, reach out to us at hello@littlebridge.com.au and we'll follow up for you.</p>
  `);
}

export function enquiryConfirmationEmail(d: EnquiryConfirmationData, to: string): EmailOptions {
  const isZh = d.preferredLanguage === "zh";
  return {
    to,
    subject: isZh
      ? `咨询已发送 — ${d.centerName} | LittleBridge`
      : `Enquiry Sent — ${d.centerName} | LittleBridge`,
    html: enquiryConfirmationHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 3. Guest Enquiry Confirmation — sent to guest (no account)
//    Key differences from registered confirmation:
//    - No dashboard link (they don't have an account)
//    - CTA to create a free account to track enquiry
//    - Shows original + translation side by side
//    - In Chinese for Chinese-language users
// ---------------------------------------------------------------------------

export interface GuestEnquiryConfirmationData {
  guestName: string;
  centerName: string;
  preferredTourDatetime?: string;
  preferredLanguage: string; // "en" | "zh"
  messageOriginal: string;
  messageTranslated?: string;
  messageSourceLanguage: string;
}

export function guestEnquiryConfirmationHtml(d: GuestEnquiryConfirmationData): string {
  const isZh = d.preferredLanguage === "zh";

  // "What you sent" section with bilingual side-by-side
  let messageSummaryHtml: string;
  if (d.messageTranslated) {
    messageSummaryHtml = `
    <h3>${isZh ? "您发送的内容" : "Here's what you sent"}</h3>
    <div class="bilingual-side-by-side" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div class="bilingual-col">
        <div class="bilingual-label">${isZh ? "原文" : "Original"}</div>
        <p style="margin: 0; font-size: 14px; color: #1a1a1a;">${escHtml(d.messageOriginal)}</p>
      </div>
      <div class="bilingual-col">
        <div class="bilingual-label">${isZh ? "双语版本" : "Bilingual version"}</div>
        <p style="margin: 0; font-size: 14px; color: #1a1a1a;">${escHtml(d.messageTranslated)}</p>
      </div>
    </div>`;
  } else {
    messageSummaryHtml = `
    <h3>${isZh ? "您发送的内容" : "Here's what you sent"}</h3>
    <div class="bilingual-block">
      <p style="font-size: 14px;">${escHtml(d.messageOriginal)}</p>
    </div>`;
  }

  const tourDateHtml = d.preferredTourDatetime
    ? `<dt>${isZh ? "希望参观时间" : "Preferred Tour Time"}</dt><dd>${escHtml(d.preferredTourDatetime)}</dd>`
    : "";

  if (isZh) {
    return baseTemplate(`
      <h2>咨询已发送</h2>
      <p>${escHtml(d.guestName)}，您好！</p>
      <p>您的咨询已成功发送至 <strong>${escHtml(d.centerName)}</strong>。该中心将在 <strong>24-48小时内</strong> 与您联系。</p>

      <dl class="detail-box">
        <dt>中心</dt>
        <dd>${escHtml(d.centerName)}</dd>
        ${tourDateHtml}
      </dl>

      ${messageSummaryHtml}

      <hr class="divider" />

      <h3>想要跟踪您的咨询进度？</h3>
      <p>创建免费帐户，即可查看中心的回复状态、保存收藏的中心，以及获得个性化推荐。</p>
      <a class="cta" href="${APP_URL}/signup?ref=guest-enquiry">创建免费帐户</a>

      <hr class="divider" />
      <p class="subtle">如果您在48小时内未收到回复，请随时通过 hello@littlebridge.com.au 联系我们，我们会帮您跟进。</p>
    `);
  }

  return baseTemplate(`
    <h2>Enquiry Sent</h2>
    <p>Hi ${escHtml(d.guestName)},</p>
    <p>Your enquiry has been sent to <strong>${escHtml(d.centerName)}</strong>. Expect a response within <strong>24-48 hours</strong>.</p>

    <dl class="detail-box">
      <dt>Centre</dt>
      <dd>${escHtml(d.centerName)}</dd>
      ${tourDateHtml}
    </dl>

    ${messageSummaryHtml}

    <hr class="divider" />

    <h3>Want to track your enquiry?</h3>
    <p>Create a free account to see response status, save favourite centres, and get personalised recommendations.</p>
    <a class="cta" href="${APP_URL}/signup?ref=guest-enquiry">Create Free Account</a>

    <hr class="divider" />
    <p class="subtle">If you don't hear back within 48 hours, reach out to us at hello@littlebridge.com.au and we'll follow up for you.</p>
  `);
}

export function guestEnquiryConfirmationEmail(
  d: GuestEnquiryConfirmationData,
  to: string,
): EmailOptions {
  const isZh = d.preferredLanguage === "zh";
  return {
    to,
    subject: isZh
      ? `咨询已发送 — ${d.centerName} | LittleBridge`
      : `Enquiry Sent — ${d.centerName} | LittleBridge`,
    html: guestEnquiryConfirmationHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 4. Waitlist Confirmation — sent to family when they sign up for suburb waitlist
//    NEW template per review feedback (Rachel, Yuki):
//    - "We'll notify you when a centre in [suburb] joins LittleBridge"
//    - In their preferred language
//    - Include nearest 3 centres with links
// ---------------------------------------------------------------------------

export interface WaitlistConfirmationData {
  name: string;
  suburb: string;
  preferredLanguage: string; // "en" | "zh"
  nearestCenters?: Array<{
    name: string;
    suburb: string;
    distanceKm: number;
    profileUrl: string;
  }>;
}

export function waitlistConfirmationHtml(d: WaitlistConfirmationData): string {
  const isZh = d.preferredLanguage === "zh";

  // Build nearest centres list
  let nearestHtml = "";
  if (d.nearestCenters && d.nearestCenters.length > 0) {
    const centerLinks = d.nearestCenters
      .map(
        (c) => `
      <a class="center-link" href="${escHtml(c.profileUrl)}">
        <strong>${escHtml(c.name)}</strong> &mdash; ${escHtml(c.suburb)}
        <br /><span class="distance">${c.distanceKm.toFixed(1)}km ${isZh ? "距离您" : "from you"}</span>
      </a>`,
      )
      .join("");

    nearestHtml = `
    <h3>${isZh ? "附近的中心" : "Nearest centres in the meantime"}</h3>
    <p class="subtle">${isZh ? "在等待的同时，以下是离您最近的幼托中心：" : "While you wait, here are the closest centres to you:"}</p>
    ${centerLinks}`;
  }

  if (isZh) {
    return baseTemplate(`
      <h2>已加入等候名单</h2>
      <p>${escHtml(d.name)}，您好！</p>
      <p>您已成功加入 <strong>${escHtml(d.suburb)}</strong> 的等候名单。当有新的双语幼托中心加入 LittleBridge 时，我们会第一时间通知您。</p>

      <div class="highlight-row">
        <strong>我们正在积极拓展 ${escHtml(d.suburb)} 及周边地区的合作中心。您的等待不会太久！</strong>
      </div>

      ${nearestHtml}

      <hr class="divider" />
      <p class="subtle">我们会在 ${escHtml(d.suburb)} 有新中心加入时通过邮件通知您。同时，如果您有任何问题，请随时联系 hello@littlebridge.com.au。</p>
    `);
  }

  return baseTemplate(`
    <h2>You're on the Waitlist</h2>
    <p>Hi ${escHtml(d.name)},</p>
    <p>You've been added to the waitlist for <strong>${escHtml(d.suburb)}</strong>. We'll notify you as soon as a bilingual childcare centre in your area joins LittleBridge.</p>

    <div class="highlight-row">
      <strong>We're actively expanding in ${escHtml(d.suburb)} and surrounding areas. Your wait won't be long!</strong>
    </div>

    ${nearestHtml}

    <hr class="divider" />
    <p class="subtle">We'll email you when a centre in ${escHtml(d.suburb)} joins. In the meantime, feel free to reach out at hello@littlebridge.com.au with any questions.</p>
  `);
}

export function waitlistConfirmationEmail(
  d: WaitlistConfirmationData,
  to: string,
): EmailOptions {
  const isZh = d.preferredLanguage === "zh";
  return {
    to,
    subject: isZh
      ? `已加入等候名单 — ${d.suburb} | LittleBridge`
      : `You're on the Waitlist — ${d.suburb} | LittleBridge`,
    html: waitlistConfirmationHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 5. Application Notification — sent to center (carried forward from v1)
//    Updated: factor badges instead of match score
// ---------------------------------------------------------------------------

export interface ApplicationNotificationData {
  centerName: string;
  centerEmail: string;
  educatorName: string;
  educatorLanguages: string;
  educatorQualification: string;
  educatorExperience: string;
  educatorSuburb: string;
  jobTitle: string;
  coverNoteOriginal: string;
  coverNoteTranslated?: string;
  coverNoteSourceLanguage: string;
  matchFactors?: MatchFactor[];
  applicationId: string;
  availableToStart: string;
  interviewAvailability: string;
}

export function applicationNotificationHtml(d: ApplicationNotificationData): string {
  const factorsHtml = factorBadgesHtml(d.matchFactors);

  // Bilingual cover note — reframed as "Bilingual version" not "AI Translation"
  const coverNoteHtml = d.coverNoteTranslated
    ? `
    <div class="bilingual-side-by-side" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div class="bilingual-col">
        <div class="bilingual-label">Original (${escHtml(d.coverNoteSourceLanguage)})</div>
        <p style="margin: 0; font-size: 15px; color: #1a1a1a;">${escHtml(d.coverNoteOriginal)}</p>
      </div>
      <div class="bilingual-col">
        <div class="bilingual-label">Bilingual version / 双语版本</div>
        <p style="margin: 0; font-size: 15px; color: #1a1a1a;">${escHtml(d.coverNoteTranslated)}</p>
      </div>
    </div>`
    : `
    <div class="bilingual-block">
      <p>${escHtml(d.coverNoteOriginal)}</p>
    </div>`;

  return baseTemplate(`
    <h2>New Application / 新的职位申请</h2>
    <p>Hi ${escHtml(d.centerName)} team,</p>
    <p>An educator has expressed interest in your listing: <strong>${escHtml(d.jobTitle)}</strong>.</p>

    ${factorsHtml}

    <dl class="detail-box">
      <dt>Educator / 教育工作者</dt>
      <dd>${escHtml(d.educatorName)}</dd>
      <dt>Languages / 语言</dt>
      <dd>${escHtml(d.educatorLanguages)}</dd>
      <dt>Qualification / 资质</dt>
      <dd>${escHtml(d.educatorQualification)}</dd>
      <dt>Experience / 经验</dt>
      <dd>${escHtml(d.educatorExperience)}</dd>
      <dt>Location / 地区</dt>
      <dd>${escHtml(d.educatorSuburb)}</dd>
      <dt>Available to Start / 可开始时间</dt>
      <dd>${escHtml(d.availableToStart)}</dd>
      <dt>Interview Availability / 面试可用时间</dt>
      <dd>${escHtml(d.interviewAvailability)}</dd>
    </dl>

    <h3>Cover Note / 求职信</h3>
    ${coverNoteHtml}

    <a class="cta" href="${APP_URL}/dashboard/applications/${escHtml(d.applicationId)}">View Application / 查看申请</a>
  `);
}

export function applicationNotificationEmail(d: ApplicationNotificationData): EmailOptions {
  return {
    to: d.centerEmail,
    subject: `New Application for ${d.jobTitle} from ${d.educatorName} / 新申请`,
    html: applicationNotificationHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 6. Application Confirmation — sent to educator (carried forward from v1)
// ---------------------------------------------------------------------------

export interface ApplicationConfirmationData {
  educatorName: string;
  jobTitle: string;
  centerName: string;
  preferredLanguage: string; // "en" | "zh"
}

export function applicationConfirmationHtml(d: ApplicationConfirmationData): string {
  const isZh = d.preferredLanguage === "zh";

  if (isZh) {
    return baseTemplate(`
      <h2>申请确认</h2>
      <p>${escHtml(d.educatorName)}，您好！</p>
      <p>感谢您通过 LittleBridge 申请 <strong>${escHtml(d.centerName)}</strong> 的 <strong>${escHtml(d.jobTitle)}</strong> 职位。</p>
      <p>该中心将会审核您的申请，并在有进一步消息时与您联系。</p>
      <a class="cta" href="${APP_URL}/dashboard">查看我的申请</a>
      <hr class="divider" />
      <p class="subtle">祝您求职顺利！<br/>LittleBridge 团队</p>
    `);
  }

  return baseTemplate(`
    <h2>Application Confirmed</h2>
    <p>Hi ${escHtml(d.educatorName)},</p>
    <p>Thank you for expressing interest in the <strong>${escHtml(d.jobTitle)}</strong> position at <strong>${escHtml(d.centerName)}</strong> through LittleBridge.</p>
    <p>The centre will review your application and reach out to you if there is a fit.</p>
    <a class="cta" href="${APP_URL}/dashboard">View My Applications</a>
    <hr class="divider" />
    <p class="subtle">Best of luck with your application!<br/>The LittleBridge Team</p>
  `);
}

export function applicationConfirmationEmail(d: ApplicationConfirmationData, to: string): EmailOptions {
  const isZh = d.preferredLanguage === "zh";
  return {
    to,
    subject: isZh
      ? `申请确认 — ${d.jobTitle} | LittleBridge`
      : `Application Confirmed — ${d.jobTitle} | LittleBridge`,
    html: applicationConfirmationHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 7. Payment Confirmation — sent to center (carried forward from v1)
// ---------------------------------------------------------------------------

export interface PaymentConfirmationData {
  centerName: string;
  amountPaid: string;
  invoiceDate: string;
  nextBillingDate: string;
}

export function paymentConfirmationHtml(d: PaymentConfirmationData): string {
  return baseTemplate(`
    <h2>Payment Confirmed / 付款确认</h2>
    <p>Hi ${escHtml(d.centerName)} team,</p>
    <p>We've received your subscription payment. Thank you for being part of LittleBridge!</p>
    <p>我们已收到您的订阅付款。感谢您加入 LittleBridge！</p>
    <dl class="detail-box">
      <dt>Amount / 金额</dt>
      <dd>${escHtml(d.amountPaid)}</dd>
      <dt>Invoice Date / 发票日期</dt>
      <dd>${escHtml(d.invoiceDate)}</dd>
      <dt>Next Billing Date / 下次计费日期</dt>
      <dd>${escHtml(d.nextBillingDate)}</dd>
    </dl>
    <a class="cta" href="${APP_URL}/dashboard">Go to Dashboard / 前往控制面板</a>
    <hr class="divider" />
    <p class="subtle">Need to manage your subscription? <a href="${APP_URL}/dashboard/subscription">Click here / 点击这里</a>.</p>
  `);
}

export function paymentConfirmationEmail(d: PaymentConfirmationData, to: string): EmailOptions {
  return {
    to,
    subject: `Payment Confirmed — $${d.amountPaid} / 付款确认 | LittleBridge`,
    html: paymentConfirmationHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 8. Payment Failed Warning — sent to center (carried forward from v1)
// ---------------------------------------------------------------------------

export interface PaymentFailedData {
  centerName: string;
  amountDue: string;
  nextRetryDate?: string;
}

export function paymentFailedHtml(d: PaymentFailedData): string {
  return baseTemplate(`
    <h2>Payment Failed / 付款失败</h2>
    <p>Hi ${escHtml(d.centerName)} team,</p>
    <p>We were unable to process your subscription payment of <strong>${escHtml(d.amountDue)}</strong>.</p>
    <p>我们无法处理您 <strong>${escHtml(d.amountDue)}</strong> 的订阅付款。</p>
    <p>Please update your payment method to avoid interruption to your LittleBridge services. If your subscription lapses, your profile will remain visible, but new enquiries and job listings will be paused.</p>
    <p>请更新您的付款方式，以避免 LittleBridge 服务中断。如果订阅过期，您的资料将保持可见，但新的咨询和职位发布将暂停。</p>
    ${d.nextRetryDate ? `<p class="subtle">We will retry the payment on ${escHtml(d.nextRetryDate)}.<br/>我们将在 ${escHtml(d.nextRetryDate)} 重新尝试扣款。</p>` : ""}
    <a class="cta" href="${APP_URL}/dashboard/subscription">Update Payment Method / 更新付款方式</a>
  `);
}

export function paymentFailedEmail(d: PaymentFailedData, to: string): EmailOptions {
  return {
    to,
    subject: `Action Required: Payment Failed / 付款失败 | LittleBridge`,
    html: paymentFailedHtml(d),
  };
}

// ---------------------------------------------------------------------------
// 9. Subscription Canceled — sent to center (carried forward from v1)
// ---------------------------------------------------------------------------

export interface SubscriptionCanceledData {
  centerName: string;
  endDate: string;
}

export function subscriptionCanceledHtml(d: SubscriptionCanceledData): string {
  return baseTemplate(`
    <h2>Subscription Cancelled / 订阅已取消</h2>
    <p>Hi ${escHtml(d.centerName)} team,</p>
    <p>Your LittleBridge subscription has been cancelled. Your services were active until <strong>${escHtml(d.endDate)}</strong>.</p>
    <p>您的 LittleBridge 订阅已取消。您的服务有效期至 <strong>${escHtml(d.endDate)}</strong>。</p>

    <h3>What this means / 这意味着什么：</h3>
    <ul>
      <li>Your centre profile remains visible to families / 您的中心资料对家庭仍然可见</li>
      <li>New enquiries will be held until you reactivate / 新的咨询将在您重新激活前保留</li>
      <li>Active job listings have been paused / 活跃的职位已暂停</li>
    </ul>

    <p>We'd love to have you back. You can reactivate at any time:</p>
    <p>我们期待您的回归。您可以随时重新激活：</p>
    <a class="cta" href="${APP_URL}/dashboard/subscription">Reactivate Subscription / 重新激活订阅</a>

    <hr class="divider" />
    <p class="subtle">If you have any feedback about your experience, we'd love to hear from you at hello@littlebridge.com.au.<br/>如果您对使用体验有任何反馈，请联系 hello@littlebridge.com.au。</p>
  `);
}

export function subscriptionCanceledEmail(d: SubscriptionCanceledData, to: string): EmailOptions {
  return {
    to,
    subject: `Subscription Cancelled / 订阅已取消 | LittleBridge`,
    html: subscriptionCanceledHtml(d),
  };
}

// ---------------------------------------------------------------------------
// HTML escaping helper
// ---------------------------------------------------------------------------

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
