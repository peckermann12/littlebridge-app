import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isDemoMode } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Languages,
  DollarSign,
  Calendar,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "casual", label: "Casual" },
  { value: "contract", label: "Contract" },
];

const QUALIFICATION_OPTIONS = [
  { value: "", label: "Select qualification..." },
  { value: "certificate_iii", label: "Certificate III in Early Childhood" },
  { value: "diploma", label: "Diploma of Early Childhood" },
  { value: "bachelor", label: "Bachelor's degree" },
  { value: "master", label: "Master's degree or PhD" },
  { value: "other", label: "Other" },
];

const LANGUAGE_OPTIONS = [
  { value: "mandarin", label: "Mandarin" },
  { value: "cantonese", label: "Cantonese" },
  { value: "english", label: "English" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobFormData {
  title: string;
  employmentType: string;
  descriptionEn: string;
  descriptionZh: string;
  qualificationRequired: string;
  languagesRequired: string[];
  payMin: string;
  payMax: string;
  startDate: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CenterJobPost() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<JobFormData>({
    title: "",
    employmentType: "full_time",
    descriptionEn: "",
    descriptionZh: "",
    qualificationRequired: "",
    languagesRequired: [],
    payMin: "",
    payMax: "",
    startDate: "",
  });

  const [centerProfileId, setCenterProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ---- Load center profile ID ----
  useEffect(() => {
    if (!user) return;

    async function load() {
      if (isDemoMode) {
        setCenterProfileId("demo-center-001");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("center_profiles")
          .select("id")
          .eq("profile_id", user!.id)
          .maybeSingle();

        if (error) throw error;
        if (data) setCenterProfileId(data.id);
      } catch (err) {
        console.error("Failed to load center profile:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  // ---- Field helpers ----
  function updateField<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleLanguage(lang: string) {
    setForm((prev) => {
      const current = prev.languagesRequired;
      if (current.includes(lang)) {
        return { ...prev, languagesRequired: current.filter((l) => l !== lang) };
      }
      return { ...prev, languagesRequired: [...current, lang] };
    });
  }

  // ---- Validation ----
  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.title.trim()) errs.title = "Job title is required";
    if (!form.employmentType) errs.employmentType = "Employment type is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !centerProfileId) return;

    setSaving(true);
    setToast(null);

    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 800));
      } else {
        const languagesJson = form.languagesRequired.map((lang) => ({
          language: lang,
          proficiency: "conversational",
        }));

        const { error } = await supabase.from("job_listings").insert({
          center_profile_id: centerProfileId,
          title: form.title.trim(),
          employment_type: form.employmentType,
          description_en: form.descriptionEn.trim() || null,
          description_zh: form.descriptionZh.trim() || null,
          qualification_required: form.qualificationRequired || null,
          languages_required: languagesJson,
          pay_min: form.payMin ? parseFloat(form.payMin) : null,
          pay_max: form.payMax ? parseFloat(form.payMax) : null,
          start_date: form.startDate || null,
          status: "active",
        });

        if (error) throw error;
      }

      setToast({ type: "success", message: t("jobs.postJob.success" as any) });

      // Navigate back to dashboard after brief delay
      setTimeout(() => {
        navigate("/center/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to post job:", err);
      setToast({ type: "error", message: err?.message || "Failed to post job" });
    } finally {
      setSaving(false);
    }
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!centerProfileId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Set up your center profile first
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            You need a center profile before you can post jobs.
          </p>
          <button
            onClick={() => navigate("/center/profile")}
            className="mt-4 bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700"
          >
            Set Up Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* ---- Back link ---- */}
        <button
          type="button"
          onClick={() => navigate("/center/dashboard")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* ---- Toast ---- */}
        {toast && (
          <div
            className={cn(
              "mb-6 rounded-md p-4 text-sm flex items-center gap-2",
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200",
            )}
          >
            {toast.type === "success" && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.message}
          </div>
        )}

        {/* ---- Header ---- */}
        <h1 className="text-2xl font-bold text-gray-800">
          {t("jobs.postJob.title" as any)}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {t("jobs.postJob.subtitle" as any)}
        </p>

        {/* ---- Form ---- */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Job Details
            </h2>

            {/* Job title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("jobs.postJob.jobTitle" as any)} *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={t("jobs.postJob.jobTitlePlaceholder" as any)}
                className={cn(
                  "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.title ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Employment type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("jobs.postJob.employmentType" as any)} *
              </label>
              <select
                value={form.employmentType}
                onChange={(e) => updateField("employmentType", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description EN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("jobs.postJob.descriptionEn" as any)}
              </label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => updateField("descriptionEn", e.target.value)}
                placeholder={t("jobs.postJob.descriptionEnPlaceholder" as any)}
                rows={5}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Description ZH */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("jobs.postJob.descriptionZh" as any)}
              </label>
              <p className="text-xs text-gray-400 mb-2">
                {t("jobs.postJob.descriptionZhHelp" as any)}
              </p>
              <textarea
                value={form.descriptionZh}
                onChange={(e) => updateField("descriptionZh", e.target.value)}
                placeholder="Chinese job description / 中文职位描述..."
                rows={5}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-600" />
              Requirements
            </h2>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("jobs.postJob.qualificationRequired" as any)}
              </label>
              <select
                value={form.qualificationRequired}
                onChange={(e) => updateField("qualificationRequired", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {QUALIFICATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Languages required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("jobs.postJob.languagesRequired" as any)}
              </label>
              <div className="space-y-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center gap-3 border rounded-md px-4 py-3 cursor-pointer text-sm transition-colors min-h-[44px]",
                      form.languagesRequired.includes(opt.value)
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.languagesRequired.includes(opt.value)}
                      onChange={() => toggleLanguage(opt.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Pay & Date */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Compensation & Start Date
            </h2>

            {/* Pay range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay range ($/hr)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={form.payMin}
                    onChange={(e) => updateField("payMin", e.target.value)}
                    placeholder="Min"
                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={form.payMax}
                    onChange={(e) => updateField("payMax", e.target.value)}
                    placeholder="Max"
                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t("jobs.postJob.startDate" as any)}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* ---- Submit ---- */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Briefcase className="w-4 h-4" />
            )}
            {saving ? t("jobs.postJob.submitting" as any) : t("jobs.postJob.submitButton" as any)}
          </button>
        </form>
      </div>
    </div>
  );
}
