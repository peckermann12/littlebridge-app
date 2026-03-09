# Comparison Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 4-page Chinese-language childcare comparison tool with CCS calculator, centre matching, and lead capture — all within the existing LittleBridge React app.

**Architecture:** Add 4 new pages to the existing React Router setup at `/compare/*` routes. CCS calculator is a pure TypeScript function. Quiz state flows through React state (no backend needed until lead capture). Lead capture reuses the existing enquiries API endpoint with minor additions.

**Tech Stack:** React 18 + Vite + Tailwind (existing), Express + PostgreSQL (existing), Lucide icons (existing), existing i18n system with new keys.

---

### Task 1: CCS Calculator Logic

**Files:**
- Create: `src/lib/ccs-calculator.ts`

**Step 1: Create the CCS calculator module**

This is the core business logic — a pure function that takes family income bracket and daily fee, returns CCS percentage and out-of-pocket cost.

```typescript
// 2026 CCS rates (updated July 2025)
// Source: Services Australia

export interface CCSInput {
  incomeBracket: string; // key from CCS_BRACKETS
  dailyFee: number;
  daysPerWeek: number;
}

export interface CCSResult {
  subsidyPercent: number;
  hourlyCapRate: number;
  dailySubsidy: number;
  dailyOutOfPocket: number;
  weeklyOutOfPocket: number;
  annualSavings: number;
}

// 2025-26 CCS income thresholds and subsidy rates
// The hourly fee cap for centre-based day care is $15.60/hr (2025-26)
// Standard day = 12 hours = $187.20 max subsidisable amount
export const HOURLY_CAP = 15.60;
export const STANDARD_HOURS = 12;
export const MAX_SUBSIDISABLE_DAILY = HOURLY_CAP * STANDARD_HOURS; // $187.20

export const CCS_BRACKETS = [
  { key: "bracket1", maxIncome: 83170, subsidyPercent: 90, label_en: "Up to $83,170", label_zh: "不超过 $83,170" },
  { key: "bracket2", maxIncome: 113170, subsidyPercent: 85, label_en: "$83,171 – $113,170", label_zh: "$83,171 – $113,170" },
  { key: "bracket3", maxIncome: 143170, subsidyPercent: 80, label_en: "$113,171 – $143,170", label_zh: "$113,171 – $143,170" },
  { key: "bracket4", maxIncome: 183170, subsidyPercent: 75, label_en: "$143,171 – $183,170", label_zh: "$143,171 – $183,170" },
  { key: "bracket5", maxIncome: 223170, subsidyPercent: 65, label_en: "$183,171 – $223,170", label_zh: "$183,171 – $223,170" },
  { key: "bracket6", maxIncome: 263170, subsidyPercent: 50, label_en: "$223,171 – $263,170", label_zh: "$223,171 – $263,170" },
  { key: "bracket7", maxIncome: 353170, subsidyPercent: 30, label_en: "$263,171 – $353,170", label_zh: "$263,171 – $353,170" },
  { key: "bracket8", maxIncome: 443170, subsidyPercent: 20, label_en: "$353,171 – $443,170", label_zh: "$353,171 – $443,170" },
  { key: "bracket9", maxIncome: Infinity, subsidyPercent: 0, label_en: "Over $443,170", label_zh: "超过 $443,170" },
] as const;

export function calculateCCS(input: CCSInput): CCSResult {
  const bracket = CCS_BRACKETS.find(b => b.key === input.incomeBracket) ?? CCS_BRACKETS[0];
  const subsidyPercent = bracket.subsidyPercent;

  // CCS is applied to the LESSER of: actual fee, or hourly cap * hours
  const subsidisableAmount = Math.min(input.dailyFee, MAX_SUBSIDISABLE_DAILY);
  const dailySubsidy = Math.round(subsidisableAmount * (subsidyPercent / 100) * 100) / 100;
  const dailyOutOfPocket = Math.round((input.dailyFee - dailySubsidy) * 100) / 100;
  const weeklyOutOfPocket = Math.round(dailyOutOfPocket * input.daysPerWeek * 100) / 100;
  const annualSavings = Math.round(dailySubsidy * input.daysPerWeek * 52 * 100) / 100;

  return {
    subsidyPercent,
    hourlyCapRate: HOURLY_CAP,
    dailySubsidy,
    dailyOutOfPocket,
    weeklyOutOfPocket,
    annualSavings,
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/ccs-calculator.ts
git commit -m "feat: add CCS calculator with 2025-26 rates"
```

---

### Task 2: Quiz State Types and Centre Matching

**Files:**
- Create: `src/lib/compare-types.ts`
- Create: `src/lib/centre-matcher.ts`

**Step 1: Create shared types for the comparison flow**

```typescript
// src/lib/compare-types.ts
export interface QuizAnswers {
  suburb: string;
  childAge: string;       // "0-1" | "1-2" | "2-3" | "3-4" | "4-5" | "5-6"
  daysPerWeek: number;    // 1-5
  incomeBracket: string;  // key from CCS_BRACKETS
  languagePref: string;   // "mandarin" | "cantonese" | "either" | "any"
  priority: string;       // "bilingual" | "cost" | "proximity" | "quality"
}

export interface MatchedCentre {
  id: string;
  center_name: string;
  slug: string;
  suburb: string;
  postcode: string;
  dailyFee: number;         // average of fee_min/fee_max
  dailyOutOfPocket: number; // after CCS
  weeklyOutOfPocket: number;
  subsidyPercent: number;
  nqs_rating: string;
  programs: string[];
  staff_languages: { language: string; count: number }[];
  photo_url: string | null;
  matchScore: number;       // 0-100 relevance score
}
```

**Step 2: Create the centre matching function**

```typescript
// src/lib/centre-matcher.ts
import { MockCenterProfile, mockCenters } from "./mock-data";
import { QuizAnswers, MatchedCentre } from "./compare-types";
import { calculateCCS, CCS_BRACKETS } from "./ccs-calculator";

export function matchCentres(answers: QuizAnswers): MatchedCentre[] {
  return mockCenters
    .map((c) => scoreAndEnrich(c, answers))
    .filter((c) => c.matchScore > 0)
    .sort((a, b) => a.dailyOutOfPocket - b.dailyOutOfPocket)
    .slice(0, 5);
}

function scoreAndEnrich(centre: MockCenterProfile, answers: QuizAnswers): MatchedCentre {
  let score = 50; // base

  // Language match
  const hasLanguage = (lang: string) =>
    centre.staff_languages.some(sl => sl.language.toLowerCase() === lang);

  if (answers.languagePref === "mandarin" && hasLanguage("mandarin")) score += 20;
  else if (answers.languagePref === "cantonese" && hasLanguage("cantonese")) score += 20;
  else if (answers.languagePref === "either" && (hasLanguage("mandarin") || hasLanguage("cantonese"))) score += 15;
  else if (answers.languagePref === "any") score += 10;
  else score -= 30; // doesn't match language preference

  // NQS rating bonus
  if (centre.nqs_rating === "exceeding") score += 10;

  // Priority bonus
  if (answers.priority === "quality" && centre.nqs_rating === "exceeding") score += 15;
  if (answers.priority === "bilingual") {
    const totalChinese = centre.staff_languages
      .filter(sl => ["mandarin", "cantonese"].includes(sl.language.toLowerCase()))
      .reduce((sum, sl) => sum + sl.count, 0);
    if (totalChinese >= 5) score += 15;
  }

  // Age group match
  const ageMap: Record<string, string[]> = {
    "0-1": ["Baby (0-1)", "Nursery (0-2)"],
    "1-2": ["Nursery (0-2)", "Nursery (1-2)"],
    "2-3": ["Toddler (2-3)"],
    "3-4": ["Preschool (3-5)"],
    "4-5": ["Preschool (3-5)"],
    "5-6": ["Kindergarten (5-6)", "Preschool (3-5)"],
  };
  const matchAges = ageMap[answers.childAge] ?? [];
  const hasAgeGroup = centre.age_groups.some(ag => matchAges.includes(ag.group_name));
  if (!hasAgeGroup) score -= 40;

  // CCS calculation
  const avgFee = (centre.fee_min + centre.fee_max) / 2;
  const ccs = calculateCCS({
    incomeBracket: answers.incomeBracket,
    dailyFee: avgFee,
    daysPerWeek: answers.daysPerWeek,
  });

  return {
    id: centre.id,
    center_name: centre.center_name,
    slug: centre.slug,
    suburb: centre.suburb,
    postcode: centre.postcode,
    dailyFee: avgFee,
    dailyOutOfPocket: ccs.dailyOutOfPocket,
    weeklyOutOfPocket: ccs.weeklyOutOfPocket,
    subsidyPercent: ccs.subsidyPercent,
    nqs_rating: centre.nqs_rating,
    programs: centre.programs,
    staff_languages: centre.staff_languages,
    photo_url: centre.center_photos[0]?.photo_url ?? null,
    matchScore: Math.max(0, Math.min(100, score)),
  };
}
```

**Step 3: Commit**

```bash
git add src/lib/compare-types.ts src/lib/centre-matcher.ts
git commit -m "feat: add quiz types and centre matching logic"
```

---

### Task 3: i18n Keys for Comparison Tool

**Files:**
- Modify: `src/i18n/en.json` — add `compare` section
- Modify: `src/i18n/zh.json` — add `compare` section

**Step 1: Add English translations**

Add a `"compare"` key to en.json with all text for the 4 pages:

```json
{
  "compare": {
    "landing": {
      "heroTitle": "Find the right bilingual childcare",
      "heroSubtitle": "See what you'll actually pay after Child Care Subsidy",
      "step1": "Take the quiz",
      "step1Desc": "Tell us about your family in 60 seconds",
      "step2": "Compare centres",
      "step2Desc": "See real costs after CCS for centres near you",
      "step3": "Book a tour",
      "step3Desc": "Connect directly with your top matches",
      "cta": "Start comparing",
      "trust1": "ACECQA verified data",
      "trust2": "Helped {count}+ families",
      "trust3": "Free, no sign-up needed"
    },
    "quiz": {
      "title": "Find Your Match",
      "subtitle": "6 quick questions to find the best centres for your family",
      "stepOf": "Step {current} of {total}",
      "next": "Next",
      "back": "Back",
      "seeResults": "See My Results",
      "suburb": { "label": "Where do you live?", "placeholder": "Enter suburb or postcode" },
      "childAge": {
        "label": "How old is your child?",
        "options": { "0-1": "0–1 years", "1-2": "1–2 years", "2-3": "2–3 years", "3-4": "3–4 years", "4-5": "4–5 years", "5-6": "5–6 years" }
      },
      "daysPerWeek": { "label": "How many days per week?", "suffix": "days" },
      "income": { "label": "Family income (combined annual)" },
      "language": {
        "label": "Language preference",
        "mandarin": "Mandarin 普通话",
        "cantonese": "Cantonese 粤语",
        "either": "Either Mandarin or Cantonese",
        "any": "Any language is fine"
      },
      "priority": {
        "label": "What matters most to you?",
        "bilingual": "Bilingual program strength",
        "cost": "Lowest cost",
        "proximity": "Closest to home",
        "quality": "Highest quality rating"
      }
    },
    "results": {
      "title": "Your Top Matches",
      "subtitle": "Based on your preferences, sorted by lowest out-of-pocket cost",
      "perDay": "/day after CCS",
      "perWeek": "/week",
      "subsidyLabel": "CCS subsidy",
      "dailyFee": "Daily fee",
      "yourCost": "Your cost",
      "nqsBadge": { "exceeding": "Exceeding NQS", "meeting": "Meeting NQS" },
      "staffLanguages": "{count} {language}-speaking staff",
      "bookTour": "Book a Tour",
      "getQuote": "Get a Quote",
      "noResults": "No centres matched your criteria. Try adjusting your preferences.",
      "retakeQuiz": "Retake Quiz",
      "waitlistTitle": "Can't find what you need?",
      "waitlistDesc": "Join our waitlist and we'll notify you when new centres are added.",
      "waitlistButton": "Join Waitlist",
      "sortBy": "Sort by",
      "sortCost": "Lowest cost",
      "sortRating": "Highest rating"
    },
    "leadCapture": {
      "title": "Book a Tour",
      "subtitle": "We'll connect you with {centreName}",
      "name": "Your name",
      "phone": "Phone number",
      "wechat": "WeChat ID (optional)",
      "childName": "Child's name",
      "preferredContact": "Preferred contact method",
      "contactPhone": "Phone",
      "contactWechat": "WeChat",
      "contactEmail": "Email",
      "submit": "Send My Details",
      "success": "Thanks! June will contact you within 24 hours.",
      "prefilled": "Pre-filled from your quiz answers"
    }
  }
}
```

**Step 2: Add Chinese translations**

Add matching `"compare"` key to zh.json:

```json
{
  "compare": {
    "landing": {
      "heroTitle": "找到最适合的双语幼儿园",
      "heroSubtitle": "看看扣除CCS补贴后，你实际要付多少",
      "step1": "做个小测试",
      "step1Desc": "60秒告诉我们你的需求",
      "step2": "比较幼儿园",
      "step2Desc": "查看附近幼儿园CCS补贴后的真实费用",
      "step3": "预约参观",
      "step3Desc": "直接联系最匹配的幼儿园",
      "cta": "开始比较",
      "trust1": "ACECQA官方认证数据",
      "trust2": "已帮助 {count}+ 个家庭",
      "trust3": "免费，无需注册"
    },
    "quiz": {
      "title": "找到你的匹配",
      "subtitle": "6个快速问题，帮你找到最适合的幼儿园",
      "stepOf": "第 {current} 步，共 {total} 步",
      "next": "下一步",
      "back": "上一步",
      "seeResults": "查看结果",
      "suburb": { "label": "你住在哪里？", "placeholder": "输入区域或邮编" },
      "childAge": {
        "label": "孩子多大了？",
        "options": { "0-1": "0–1岁", "1-2": "1–2岁", "2-3": "2–3岁", "3-4": "3–4岁", "4-5": "4–5岁", "5-6": "5–6岁" }
      },
      "daysPerWeek": { "label": "每周需要几天？", "suffix": "天" },
      "income": { "label": "家庭年收入（合计）" },
      "language": {
        "label": "语言偏好",
        "mandarin": "普通话 Mandarin",
        "cantonese": "粤语 Cantonese",
        "either": "普通话或粤语都可以",
        "any": "任何语言都可以"
      },
      "priority": {
        "label": "你最看重什么？",
        "bilingual": "双语教学质量",
        "cost": "最低费用",
        "proximity": "离家最近",
        "quality": "最高质量评级"
      }
    },
    "results": {
      "title": "你的最佳匹配",
      "subtitle": "根据你的偏好，按自付费用从低到高排序",
      "perDay": "/天（CCS补贴后）",
      "perWeek": "/周",
      "subsidyLabel": "CCS补贴",
      "dailyFee": "每日费用",
      "yourCost": "你的费用",
      "nqsBadge": { "exceeding": "超出NQS标准", "meeting": "达到NQS标准" },
      "staffLanguages": "{count} 名{language}教师",
      "bookTour": "预约参观",
      "getQuote": "获取报价",
      "noResults": "没有找到匹配的幼儿园，请调整你的偏好重试。",
      "retakeQuiz": "重新测试",
      "waitlistTitle": "没找到合适的？",
      "waitlistDesc": "加入等候名单，有新幼儿园加入时我们会通知你。",
      "waitlistButton": "加入等候名单",
      "sortBy": "排序方式",
      "sortCost": "费用最低",
      "sortRating": "评级最高"
    },
    "leadCapture": {
      "title": "预约参观",
      "subtitle": "我们会帮你联系 {centreName}",
      "name": "你的姓名",
      "phone": "手机号码",
      "wechat": "微信号（选填）",
      "childName": "孩子姓名",
      "preferredContact": "首选联系方式",
      "contactPhone": "电话",
      "contactWechat": "微信",
      "contactEmail": "邮箱",
      "submit": "发送我的信息",
      "success": "谢谢！June会在24小时内联系你。",
      "prefilled": "已从测试答案中自动填入"
    }
  }
}
```

**Step 3: Commit**

```bash
git add src/i18n/en.json src/i18n/zh.json
git commit -m "feat: add bilingual i18n keys for comparison tool"
```

---

### Task 4: Comparison Landing Page

**Files:**
- Create: `src/pages/compare/CompareLanding.tsx`

**Step 1: Build the landing page**

Chinese-first landing page with:
- Hero: title + subtitle + single "Start comparing" CTA
- 3-step "how it works" strip
- Trust signals (ACECQA data, family count, no sign-up needed)
- All text from i18n keys using `t("compare.landing.*")`
- Mobile-first layout, reuses existing Tailwind theme
- Links to `/compare/quiz`

Key patterns to follow from existing Landing.tsx:
- `useTranslation()` hook for all text
- Lucide icons for visual elements
- `Link` from react-router-dom for navigation
- `min-h-[44px]` on all buttons
- `max-w-6xl mx-auto px-4` for content width

**Step 2: Commit**

```bash
git add src/pages/compare/CompareLanding.tsx
git commit -m "feat: add comparison tool landing page"
```

---

### Task 5: Quiz Wizard (6-step mobile wizard)

**Files:**
- Create: `src/pages/compare/CompareQuiz.tsx`

**Step 1: Build the 6-step wizard**

Mobile-first wizard with progress indicator. Each step is a screen with one question:
1. Suburb (text input with placeholder)
2. Child's age (6 radio options)
3. Days per week (1-5 selector buttons)
4. Family income bracket (dropdown/radio from CCS_BRACKETS)
5. Language preference (4 radio options)
6. Priority (4 radio options)

State management: single `useState<Partial<QuizAnswers>>({})` + `step` counter.

Navigation: Back/Next buttons. "See My Results" on step 6.

On submit: navigate to `/compare/results` with quiz answers in location state.

Pattern: follow existing form patterns from GuestEnquiry.tsx and SignUp.tsx — `cn()` for conditional classes, inline validation, `min-h-[44px]` buttons.

Progress bar: simple `div` with width percentage (`step/6 * 100%`).

**Step 2: Commit**

```bash
git add src/pages/compare/CompareQuiz.tsx
git commit -m "feat: add 6-step quiz wizard with CCS inputs"
```

---

### Task 6: Results Page

**Files:**
- Create: `src/pages/compare/CompareResults.tsx`

**Step 1: Build the results page**

Reads quiz answers from `useLocation().state`. Calls `matchCentres(answers)` to get top 5.

Each centre card shows:
- Centre name + suburb
- Photo (from mock data)
- Daily fee AFTER CCS (large, prominent)
- Weekly out-of-pocket
- NQS badge (exceeding/meeting) with colour
- Staff languages with counts
- Programs list
- "Book a Tour" button → opens lead capture modal

Sort controls: by cost (default) or by rating.

Bottom section: "Can't find what you need?" → waitlist CTA.

If no results: empty state with "Retake Quiz" button.

If no location state (direct navigation): redirect to `/compare/quiz`.

Pattern: follow CenterSearch.tsx card layout. Use Lucide Shield for NQS badge, MapPin for suburb, DollarSign for cost.

**Step 2: Commit**

```bash
git add src/pages/compare/CompareResults.tsx
git commit -m "feat: add results page with centre cards and CCS costs"
```

---

### Task 7: Lead Capture Modal

**Files:**
- Modify: `src/pages/compare/CompareResults.tsx` — add modal component inline

**Step 1: Add lead capture modal to results page**

Modal triggered by "Book a Tour" button on any centre card. Uses Radix Dialog (`@radix-ui/react-dialog` — already installed).

Fields:
- Name (required)
- Phone (required)
- WeChat ID (optional)
- Child's name (required)
- Preferred contact method (phone/wechat/email radio)

Pre-filled from quiz: suburb, child age, days needed (shown as read-only info).

Submit: POST to `/api/enquiries` with `is_guest: true` and the centre's ID. This reuses the existing enquiry endpoint.

Success state: shows confirmation message, keeps modal open with success content.

**Step 2: Commit**

```bash
git add src/pages/compare/CompareResults.tsx
git commit -m "feat: add lead capture modal to results page"
```

---

### Task 8: Router + Navigation Integration

**Files:**
- Modify: `src/App.tsx` — add 3 new routes
- Modify: `src/components/Header.tsx` — add "Compare" nav link

**Step 1: Add routes to App.tsx**

Import the 3 new page components and add routes:
```tsx
import CompareLanding from "@/pages/compare/CompareLanding";
import CompareQuiz from "@/pages/compare/CompareQuiz";
import CompareResults from "@/pages/compare/CompareResults";

// In Routes:
<Route path="/compare" element={<CompareLanding />} />
<Route path="/compare/quiz" element={<CompareQuiz />} />
<Route path="/compare/results" element={<CompareResults />} />
```

**Step 2: Add Compare link to Header navigation**

Add a "Compare" / "比较" link to the Header's desktop and mobile nav, pointing to `/compare`. This goes before the existing "Find Centers" link.

**Step 3: Update the root `/` landing page CTA**

Change the main CTA button on Landing.tsx from linking to `/search` to `/compare` — this makes the comparison tool the primary funnel.

**Step 4: Commit**

```bash
git add src/App.tsx src/components/Header.tsx src/pages/Landing.tsx
git commit -m "feat: wire up comparison routes and navigation"
```

---

### Task 9: Build Verification

**Step 1: Run TypeScript check**

```bash
cd /Users/peter/littlebridge-app && npx tsc --noEmit
```
Expected: 0 errors.

**Step 2: Run Vite build**

```bash
cd /Users/peter/littlebridge-app && npm run build
```
Expected: Build succeeds.

**Step 3: Visual test**

Start dev server and verify all 4 pages render:
- `/compare` — landing page with hero + CTA
- `/compare/quiz` — wizard navigates through all 6 steps
- `/compare/results` — shows matched centres with CCS costs
- Lead capture modal opens and form works

**Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: resolve build issues"
```

---

## Task Dependency Graph

```
Task 1 (CCS calculator) ──┐
                           ├── Task 2 (types + matcher) ──┐
Task 3 (i18n keys) ────────┤                              ├── Task 5 (quiz) ──┐
                           │                              │                   │
                           └── Task 4 (landing page) ─────┘                   ├── Task 6 (results) ── Task 7 (lead modal) ── Task 8 (router) ── Task 9 (verify)
```

Tasks 1 and 3 can run in parallel. Tasks 4 and 5 can run in parallel once 1-3 are done.
