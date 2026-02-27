import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase, isDemoMode } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Loader2,
  Search,
  Briefcase,
  DollarSign,
  UserCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = [
  { value: "mandarin", label: "Mandarin" },
  { value: "cantonese", label: "Cantonese" },
  { value: "english", label: "English" },
  { value: "other", label: "Other" },
];

const QUALIFICATION_OPTIONS = [
  { value: "", label: "Select qualification..." },
  { value: "cert3", label: "Certificate III in Early Childhood" },
  { value: "diploma", label: "Diploma of Early Childhood" },
  { value: "bachelor", label: "Bachelor's degree" },
  { value: "masters", label: "Master's degree or PhD" },
  { value: "other", label: "Other" },
];

const WWCC_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  suburb: string;
  languages: string[];
  qualification: string;
  hasWwcc: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EducatorSignUp() {
  const { t, locale } = useTranslation();

  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    suburb: "",
    languages: [],
    qualification: "",
    hasWwcc: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- Field helpers ----
  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleLanguage(lang: string) {
    setForm((prev) => {
      const current = prev.languages;
      if (current.includes(lang)) {
        return { ...prev, languages: current.filter((l) => l !== lang) };
      }
      return { ...prev, languages: [...current, lang] };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.languages;
      return next;
    });
  }

  // ---- Validation ----
  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Please enter a valid email address";
    if (!form.suburb.trim()) errs.suburb = "Suburb is required";
    if (form.languages.length === 0)
      errs.languages = "Please select at least one language";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    // Demo mode: simulate successful submission
    if (isDemoMode) {
      setTimeout(() => {
        setSubmitted(true);
        setSubmitting(false);
      }, 800);
      return;
    }

    try {
      const { error } = await supabase.from("educator_leads").insert({
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        suburb: form.suburb.trim(),
        languages: form.languages,
        qualification: form.qualification || null,
        has_wwcc: form.hasWwcc || "unsure",
        preferred_language: locale,
      });

      if (error) {
        // Handle duplicate email
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          setSubmitError(t("educators.signup.success.duplicate" as any));
          return;
        }
        throw error;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Educator signup error:", err);
      setSubmitError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Success state ----
  if (submitted) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-800">
            {t("educators.signup.success.title" as any)}
          </h1>
          <p className="mt-3 text-gray-600">
            {t("educators.signup.success.message" as any).replace(
              "{suburb}",
              form.suburb,
            )}
          </p>
          <Link
            to="/search"
            className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            {t("educators.signup.success.browseCenters" as any)}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* ============================================================ */}
          {/* LEFT: Value Proposition                                        */}
          {/* ============================================================ */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {t("educators.signup.title" as any)}
            </h1>
            <p className="mt-4 text-gray-600">
              {t("educators.signup.subtitle" as any)}
            </p>

            {/* Benefits */}
            <div className="mt-8 space-y-5">
              {[
                {
                  icon: Briefcase,
                  text: t("educators.signup.benefit1" as any),
                },
                {
                  icon: DollarSign,
                  text: t("educators.signup.benefit2" as any),
                },
                {
                  icon: UserCheck,
                  text: t("educators.signup.benefit3" as any),
                },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Trust line */}
            <p className="mt-10 text-sm text-gray-400">
              {t("educators.signup.trust" as any).replace("{count}", "20")}
            </p>
          </div>

          {/* ============================================================ */}
          {/* RIGHT: Form Card                                               */}
          {/* ============================================================ */}
          <div className="border border-gray-200 rounded-lg p-6 shadow-none md:shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">
              {t("educators.signup.formTitle" as any)}
            </h2>

            {/* Submit error */}
            {submitError && (
              <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("educators.signup.fields.fullName" as any)} *
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder={t("educators.signup.fields.fullNamePlaceholder" as any)}
                  className={cn(
                    "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    errors.fullName ? "border-red-400" : "border-gray-300",
                  )}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("educators.signup.fields.email" as any)} *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder={t("educators.signup.fields.emailPlaceholder" as any)}
                  className={cn(
                    "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    errors.email ? "border-red-400" : "border-gray-300",
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("educators.signup.fields.phone" as any)}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder={t("educators.signup.fields.phonePlaceholder" as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Suburb */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("educators.signup.fields.suburb" as any)} *
                </label>
                <input
                  type="text"
                  value={form.suburb}
                  onChange={(e) => updateField("suburb", e.target.value)}
                  placeholder={t("educators.signup.fields.suburbPlaceholder" as any)}
                  className={cn(
                    "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    errors.suburb ? "border-red-400" : "border-gray-300",
                  )}
                />
                {errors.suburb && (
                  <p className="text-sm text-red-500 mt-1">{errors.suburb}</p>
                )}
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("educators.signup.fields.languages" as any)} *
                </label>
                <div className="space-y-2">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-center gap-3 border rounded-md px-4 py-2.5 cursor-pointer text-sm transition-colors min-h-[44px]",
                        form.languages.includes(opt.value)
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form.languages.includes(opt.value)}
                        onChange={() => toggleLanguage(opt.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.languages && (
                  <p className="text-sm text-red-500 mt-1">{errors.languages}</p>
                )}
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("educators.signup.fields.qualification" as any)}
                </label>
                <select
                  value={form.qualification}
                  onChange={(e) => updateField("qualification", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {QUALIFICATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* WWCC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("educators.signup.fields.wwcc" as any)}
                </label>
                <div className="flex gap-3">
                  {WWCC_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-center gap-2 border rounded-md px-4 py-2.5 cursor-pointer text-sm transition-colors min-h-[44px] flex-1 justify-center",
                        form.hasWwcc === opt.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300",
                      )}
                    >
                      <input
                        type="radio"
                        name="wwcc"
                        value={opt.value}
                        checked={form.hasWwcc === opt.value}
                        onChange={() => updateField("hasWwcc", opt.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] mt-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting
                  ? t("common.submitting" as any)
                  : t("educators.signup.submitButton" as any)}
              </button>

              {/* Privacy note */}
              <p className="text-xs text-gray-400 text-center mt-3">
                {t("educators.signup.privacy" as any)}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
