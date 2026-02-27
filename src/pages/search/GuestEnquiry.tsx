import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Send,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  Baby,
  MessageSquare,
  Eye,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CenterSummary {
  id: string;
  center_name: string;
  slug: string;
  suburb: string;
  state: string;
  center_photos: { photo_url: string }[];
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  childAge: string;
  daysPerWeek: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHILD_AGE_OPTIONS = [
  "Under 1 year",
  "1 year",
  "1.5 years",
  "2 years",
  "2.5 years",
  "3 years",
  "3.5 years",
  "4 years",
  "4.5 years",
  "5 years",
  "5+ years",
];

const DAYS_OPTIONS = [
  "1 day",
  "2 days",
  "3 days",
  "4 days",
  "5 days",
  "Not sure yet",
];

const COOKIE_KEY = "lb_enquiry_draft";

// ---------------------------------------------------------------------------
// CJK character detection helper
// ---------------------------------------------------------------------------

function containsChinese(text: string): boolean {
  if (!text) return false;
  const cjkCount = (
    text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []
  ).length;
  return cjkCount / text.length > 0.2;
}

// ---------------------------------------------------------------------------
// Auto-save helpers
// ---------------------------------------------------------------------------

function saveDraft(data: FormData) {
  try {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(data));
  } catch {
    // Ignore — localStorage may not be available
  }
}

function loadDraft(): FormData | null {
  try {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (stored) return JSON.parse(stored) as FormData;
  } catch {
    // Ignore
  }
  return null;
}

function clearDraft() {
  try {
    localStorage.removeItem(COOKIE_KEY);
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Wizard Step Indicator (mobile)
// ---------------------------------------------------------------------------

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6 md:hidden">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition",
            i + 1 === currentStep
              ? "bg-blue-600"
              : i + 1 < currentStep
                ? "bg-blue-300"
                : "bg-gray-200",
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuestEnquiry Page
// ---------------------------------------------------------------------------

export default function GuestEnquiry() {
  const { t, locale } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Center data
  const [center, setCenter] = useState<CenterSummary | null>(null);
  const [loadingCenter, setLoadingCenter] = useState(true);

  // Form state
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    childAge: "",
    daysPerWeek: "",
    message: "",
  });

  // Wizard step (mobile only)
  const [step, setStep] = useState(1);

  // Translation preview
  const [showPreview, setShowPreview] = useState(false);
  const [simulatedTranslation, setSimulatedTranslation] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Validation
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Responsive: detect if mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load center data
  useEffect(() => {
    if (!slug) return;

    async function fetchCenter() {
      setLoadingCenter(true);
      try {
        const { data, error } = await supabase
          .from("center_profiles")
          .select(
            `
            id,
            center_name,
            slug,
            suburb,
            state,
            center_photos (
              photo_url
            )
          `,
          )
          .eq("slug", slug)
          .single();

        if (error || !data) {
          navigate("/search");
          return;
        }
        setCenter(data as CenterSummary);
      } catch {
        navigate("/search");
      } finally {
        setLoadingCenter(false);
      }
    }

    fetchCenter();
  }, [slug, navigate]);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setForm(draft);
    }
  }, []);

  // Auto-save on form change
  useEffect(() => {
    if (
      form.name ||
      form.email ||
      form.phone ||
      form.childAge ||
      form.daysPerWeek ||
      form.message
    ) {
      saveDraft(form);
    }
  }, [form]);

  // Form field handler
  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  // Validation
  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.childAge) newErrors.childAge = "Child's age is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.message.trim()) newErrors.message = "Message is required";
    if (form.message.length > 2000)
      newErrors.message = "Message must be under 2000 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = (): boolean => {
    const e1 = validateStep1();
    const e2 = validateStep2();
    const e3 = validateStep3();
    return e1 && e2 && e3;
  };

  // Handle step navigation (mobile)
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3) {
      if (!validateStep3()) return;
      // Check if translation preview needed
      if (containsChinese(form.message)) {
        // Simulate translation preview
        setSimulatedTranslation(
          "[Translation preview] " +
            form.message.substring(0, 100) +
            "... (Full AI translation will be generated server-side)",
        );
        setShowPreview(true);
        return;
      }
      handleSubmit();
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  // Desktop: preview or submit
  const handleDesktopSubmit = () => {
    if (!validateAll()) return;
    if (containsChinese(form.message) && !showPreview) {
      setSimulatedTranslation(
        "[Translation preview] " +
          form.message.substring(0, 100) +
          "... (Full AI translation will be generated server-side)",
      );
      setShowPreview(true);
      return;
    }
    handleSubmit();
  };

  // Submit enquiry
  const handleSubmit = async () => {
    if (!center) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      // Determine source language
      const sourceLanguage = containsChinese(form.message) ? "zh" : "en";

      const { error: insertError } = await supabase.from("enquiries").insert({
        center_profile_id: center.id,
        guest_name: form.name.trim(),
        guest_email: form.email.trim(),
        guest_phone: form.phone.trim() || null,
        guest_child_age: form.childAge,
        guest_child_days_needed: form.daysPerWeek || null,
        guest_preferred_language: locale,
        message_original: form.message.trim(),
        message_source_language: sourceLanguage,
        is_guest: true,
        status: "new",
        translation_approved: showPreview,
      });

      if (insertError) throw insertError;

      clearDraft();
      setSubmitted(true);
    } catch (err: unknown) {
      console.error("Enquiry submission failed:", err);
      setSubmitError(
        "Something went wrong. Please try again or contact us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loadingCenter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!center) return null;

  // Success state
  if (submitted) {
    return (
      <div
        className="min-h-screen bg-white"
        style={{ overscrollBehavior: "none" }}
      >
        <div className="max-w-lg mx-auto py-12 px-4 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("guestEnquiry.confirmation.title")}
          </h1>
          <p className="text-gray-600 mb-8">
            {t("guestEnquiry.confirmation.message", {
              centerName: center.center_name,
            })}
          </p>

          {/* What happens next */}
          <div className="text-left bg-gray-50 rounded-lg p-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              {t("guestEnquiry.confirmation.whatNext")}
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                  1
                </span>
                <span className="text-sm text-gray-600">
                  {t("guestEnquiry.confirmation.step1")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                  2
                </span>
                <span className="text-sm text-gray-600">
                  {t("guestEnquiry.confirmation.step2")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                  3
                </span>
                <span className="text-sm text-gray-600">
                  {t("guestEnquiry.confirmation.step3")}
                </span>
              </li>
            </ol>
          </div>

          {/* Account upsell */}
          <div className="bg-blue-50 rounded-lg p-5 mb-6">
            <p className="text-sm font-medium text-gray-800 mb-1">
              {t("guestEnquiry.createAccountPrompt")}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {t("guestEnquiry.createAccountBenefits")}
            </p>
            <Link
              to="/signup?returnUrl=/family/enquiries"
              className="inline-block bg-white border border-blue-300 text-blue-600 text-sm font-medium px-5 py-2.5 rounded-md hover:bg-blue-50 transition min-h-[44px]"
            >
              {t("guestEnquiry.createAccountButton")}
            </Link>
            <p className="text-xs text-gray-400 mt-2">
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="hover:underline"
              >
                {t("guestEnquiry.continueWithout")}
              </button>
            </p>
          </div>

          {/* Browse more */}
          <Link
            to="/search"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            &larr; {t("enquiry.confirmation.backToSearch")}
          </Link>
        </div>
      </div>
    );
  }

  // Translation preview state
  if (showPreview) {
    return (
      <div
        className="min-h-screen bg-white"
        style={{ overscrollBehavior: "none" }}
      >
        <div className="max-w-lg mx-auto py-6 px-4">
          {/* Back */}
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4 min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            {locale === "zh" ? "返回编辑" : "Back to edit"}
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("guestEnquiry.translationPreview.title")}
          </h2>

          {/* Original */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-1">
              {locale === "zh" ? "您的消息:" : "Your message:"}
            </p>
            <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-700 whitespace-pre-line">
              {form.message}
            </div>
          </div>

          {/* Translation */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              {locale === "zh"
                ? "中心也会看到:"
                : "The center will also see:"}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-gray-700">
              <p className="text-xs text-blue-500 font-medium mb-2">
                {locale === "zh" ? "双语版本" : "Bilingual version"}
              </p>
              <p className="whitespace-pre-line">{simulatedTranslation}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 text-lg font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {t("guestEnquiry.translationPreview.confirmButton")}
            </button>

            <button
              type="button"
              onClick={prevStep}
              className="w-full text-blue-600 text-sm hover:underline min-h-[44px]"
            >
              {locale === "zh" ? "编辑消息" : "Edit message"}
            </button>
          </div>

          {submitError && (
            <p className="text-sm text-red-500 mt-3 text-center">
              {submitError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Form rendering
  return (
    <div
      className="min-h-screen bg-white"
      style={{ overscrollBehavior: "none" }}
    >
      <div className="max-w-lg mx-auto py-6 px-4">
        {/* Back link */}
        <Link
          to={`/centers/${center.slug}`}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {center.center_name}
        </Link>

        {/* Context card */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-6">
          {center.center_photos?.[0] ? (
            <img
              src={center.center_photos[0].photo_url}
              alt={center.center_name}
              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {center.center_name}
            </p>
            <p className="text-xs text-gray-500">
              {center.suburb}
              {center.state ? `, ${center.state}` : ""}
            </p>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {t("guestEnquiry.title")}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {t("guestEnquiry.subtitle")}
        </p>

        {/* Step indicator (mobile) */}
        {isMobile && <StepIndicator currentStep={step} totalSteps={3} />}

        {/* === FORM === */}
        {/* On desktop, all steps shown. On mobile, show current step only. */}

        {/* STEP 1: About You */}
        <div className={cn(isMobile && step !== 1 && "hidden")}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">
                {locale === "zh" ? "关于您" : "About You"}
              </h2>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="guest-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("guestEnquiry.fields.parentName")}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="guest-name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={t("guestEnquiry.fields.parentNamePlaceholder")}
                className={cn(
                  "w-full h-11 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                  errors.name ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="guest-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("guestEnquiry.fields.email")}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="guest-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder={t("guestEnquiry.fields.emailPlaceholder")}
                className={cn(
                  "w-full h-11 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                  errors.email ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label
                htmlFor="guest-phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("guestEnquiry.fields.phone")}
              </label>
              <input
                id="guest-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder={t("guestEnquiry.fields.phonePlaceholder")}
                className="w-full h-11 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* STEP 2: About Your Child */}
        <div
          className={cn(
            isMobile && step !== 2 && "hidden",
            !isMobile && "mt-8",
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Baby className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">
                {locale === "zh" ? "关于您的孩子" : "About Your Child"}
              </h2>
            </div>

            {/* Child's age */}
            <div>
              <label
                htmlFor="child-age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("guestEnquiry.fields.childAge")}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                id="child-age"
                value={form.childAge}
                onChange={(e) => updateField("childAge", e.target.value)}
                className={cn(
                  "w-full h-11 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                  errors.childAge ? "border-red-400" : "border-gray-300",
                  !form.childAge && "text-gray-400",
                )}
              >
                <option value="" disabled>
                  {t("guestEnquiry.fields.childAgePlaceholder")}
                </option>
                {CHILD_AGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.childAge && (
                <p className="text-xs text-red-500 mt-1">{errors.childAge}</p>
              )}
            </div>

            {/* Days per week */}
            <div>
              <label
                htmlFor="days-per-week"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {locale === "zh" ? "每周需要的天数" : "Days per week needed"}
                <span className="text-gray-400 text-xs ml-1">
                  ({locale === "zh" ? "可选" : "optional"})
                </span>
              </label>
              <select
                id="days-per-week"
                value={form.daysPerWeek}
                onChange={(e) => updateField("daysPerWeek", e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">
                  {locale === "zh" ? "选择..." : "Select..."}
                </option>
                {DAYS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* STEP 3: Your Message */}
        <div
          className={cn(
            isMobile && step !== 3 && "hidden",
            !isMobile && "mt-8",
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">
                {locale === "zh" ? "您的消息" : "Your Message"}
              </h2>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("guestEnquiry.fields.message")}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                id="message"
                rows={6}
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder={t("guestEnquiry.fields.messagePlaceholder")}
                maxLength={2000}
                className={cn(
                  "w-full px-3 py-2.5 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                  errors.message ? "border-red-400" : "border-gray-300",
                )}
              />
              <div className="flex justify-between mt-1">
                {errors.message ? (
                  <p className="text-xs text-red-500">{errors.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {form.message.length}/2000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 space-y-3">
          {/* Mobile wizard navigation */}
          {isMobile && (
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 h-12 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={nextStep}
                disabled={submitting}
                className={cn(
                  "flex-1 h-12 font-medium rounded-md transition flex items-center justify-center gap-2 min-h-[44px]",
                  step === 3
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-600 text-white hover:bg-blue-700",
                  submitting && "opacity-50",
                )}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {step === 3 ? (
                  <>
                    {containsChinese(form.message) ? (
                      <>
                        <Eye className="w-4 h-4" />
                        {locale === "zh" ? "预览翻译" : "Preview translation"}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t("guestEnquiry.submitButton")}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Desktop submit */}
          {!isMobile && (
            <button
              type="button"
              onClick={handleDesktopSubmit}
              disabled={submitting}
              className="w-full h-12 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : containsChinese(form.message) ? (
                <>
                  <Eye className="w-5 h-5" />
                  {locale === "zh" ? "预览翻译" : "Preview & Send"}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t("guestEnquiry.submitButton")}
                </>
              )}
            </button>
          )}

          {/* Privacy note */}
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            <Shield className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            {t("guestEnquiry.privacyNote")}
          </p>

          {/* Submit error */}
          {submitError && (
            <p className="text-sm text-red-500 text-center">{submitError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
