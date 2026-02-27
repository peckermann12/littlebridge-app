import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  ImagePlus,
  Languages,
  CheckCircle,
  Loader2,
  Save,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CenterFormData {
  centerName: string;
  address: string;
  suburb: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  descriptionEn: string;
  descriptionZh: string;
  staffLanguages: string[];
  programs: string[];
  ageGroups: string[];
  feeMin: string;
  feeMax: string;
  isCcsApproved: boolean;
  nqsRating: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAFF_LANGUAGE_OPTIONS = [
  { value: "mandarin", label: "Mandarin" },
  { value: "cantonese", label: "Cantonese" },
  { value: "english", label: "English" },
];

const PROGRAM_OPTIONS = [
  { value: "bilingual_program", label: "Bilingual education program" },
  { value: "cultural_events", label: "Cultural celebrations program" },
  { value: "mandarin_classes", label: "Mandarin classes" },
  { value: "play_based", label: "Play-based learning" },
  { value: "montessori", label: "Montessori" },
  { value: "stem", label: "STEM / Science program" },
  { value: "outdoor", label: "Nature / Outdoor learning" },
  { value: "music", label: "Music & movement" },
  { value: "art", label: "Art & creativity" },
  { value: "sports", label: "Sports program" },
];

const AGE_GROUP_OPTIONS = [
  { value: "0-1", label: "Infant (0-1)" },
  { value: "1-2", label: "Toddler (1-2)" },
  { value: "2-3", label: "Preschool (2-3)" },
  { value: "3-5", label: "Kindergarten (3-5)" },
  { value: "5+", label: "School Age (5+)" },
];

const NQS_OPTIONS = [
  { value: "", label: "Select NQS rating..." },
  { value: "exceeding", label: "Exceeding NQS" },
  { value: "meeting", label: "Meeting NQS" },
  { value: "working_towards", label: "Working Towards NQS" },
  { value: "not_yet_assessed", label: "Not Yet Assessed" },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CenterProfile() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<CenterFormData>({
    centerName: "",
    address: "",
    suburb: "",
    postcode: "",
    phone: "",
    email: profile?.email || "",
    website: "",
    descriptionEn: "",
    descriptionZh: "",
    staffLanguages: [],
    programs: [],
    ageGroups: [],
    feeMin: "",
    feeMax: "",
    isCcsApproved: false,
    nqsRating: "",
  });

  const [centerProfileId, setCenterProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ---- Load existing profile ----
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const { data: cp, error } = await supabase
          .from("center_profiles")
          .select("*")
          .eq("profile_id", user!.id)
          .maybeSingle();

        if (error) throw error;

        if (cp) {
          setCenterProfileId(cp.id);

          // Parse staff_languages from jsonb [{language, count}] to string[]
          const langs: string[] = [];
          if (Array.isArray(cp.staff_languages)) {
            for (const entry of cp.staff_languages as any[]) {
              if (entry.language) langs.push(entry.language);
            }
          }

          setForm({
            centerName: cp.center_name || "",
            address: cp.address || "",
            suburb: cp.suburb || "",
            postcode: cp.postcode || "",
            phone: cp.phone || "",
            email: cp.email || profile?.email || "",
            website: cp.website || "",
            descriptionEn: cp.description_en || "",
            descriptionZh: cp.description_zh || "",
            staffLanguages: langs,
            programs: cp.programs || [],
            ageGroups: Array.isArray(cp.age_groups)
              ? (cp.age_groups as any[]).map((ag: any) => ag.group_name || ag).filter(Boolean)
              : [],
            feeMin: cp.fee_min ? String(cp.fee_min) : "",
            feeMax: cp.fee_max ? String(cp.fee_max) : "",
            isCcsApproved: cp.is_ccs_approved ?? false,
            nqsRating: cp.nqs_rating || "",
          });
        }
      } catch (err) {
        console.error("Failed to load center profile:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, profile]);

  // ---- Field helpers ----
  const updateField = useCallback(
    <K extends keyof CenterFormData>(key: K, value: CenterFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const toggleArrayField = useCallback(
    (key: "staffLanguages" | "programs" | "ageGroups", value: string) => {
      setForm((prev) => {
        const current = prev[key] as string[];
        if (current.includes(value)) {
          return { ...prev, [key]: current.filter((v) => v !== value) };
        }
        return { ...prev, [key]: [...current, value] };
      });
    },
    [],
  );

  // ---- Validation ----
  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.centerName.trim()) errs.centerName = "Center name is required";
    if (!form.address.trim() && !form.suburb.trim()) errs.suburb = "Suburb is required";
    if (!form.suburb.trim()) errs.suburb = "Suburb is required";
    if (!form.postcode.trim()) errs.postcode = "Postcode is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    if (!form.email.trim()) errs.email = "Email is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;

    setSaving(true);
    setToast(null);

    try {
      const staffLanguagesJson = form.staffLanguages.map((lang) => ({
        language: lang,
        count: 1,
      }));

      const ageGroupsJson = form.ageGroups.map((ag) => ({
        group_name: ag,
        capacity: 0,
        vacancies: 0,
      }));

      const slug = generateSlug(form.centerName);

      const data: Record<string, any> = {
        profile_id: user.id,
        center_name: form.centerName.trim(),
        slug,
        address: form.address.trim() || null,
        suburb: form.suburb.trim(),
        postcode: form.postcode.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim() || null,
        description_en: form.descriptionEn.trim() || null,
        description_zh: form.descriptionZh.trim() || null,
        staff_languages: staffLanguagesJson,
        programs: form.programs,
        age_groups: ageGroupsJson,
        fee_min: form.feeMin ? parseFloat(form.feeMin) : null,
        fee_max: form.feeMax ? parseFloat(form.feeMax) : null,
        is_ccs_approved: form.isCcsApproved,
        nqs_rating: form.nqsRating || null,
        updated_at: new Date().toISOString(),
      };

      if (centerProfileId) {
        const { error } = await supabase
          .from("center_profiles")
          .update(data)
          .eq("id", centerProfileId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("center_profiles")
          .insert(data)
          .select("id")
          .single();
        if (error) throw error;
        setCenterProfileId(inserted.id);
      }

      // Mark onboarding complete
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      setToast({ type: "success", message: t("centerProfile.saveSuccess" as any) });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setToast({ type: "error", message: err?.message || "Failed to save profile" });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
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
          {t("centerProfile.title" as any)}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {t("centerProfile.subtitle" as any)}
        </p>

        {/* ---- Form ---- */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* ================================================================ */}
          {/* SECTION: Basic Info                                               */}
          {/* ================================================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Basic Information
            </h2>

            {/* Center name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("centerProfile.fields.centerName" as any)} *
              </label>
              <input
                type="text"
                value={form.centerName}
                onChange={(e) => updateField("centerName", e.target.value)}
                placeholder={t("centerProfile.fields.centerNamePlaceholder" as any)}
                className={cn(
                  "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.centerName ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.centerName && (
                <p className="text-sm text-red-500 mt-1">{errors.centerName}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("centerProfile.fields.address" as any)}
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder={t("centerProfile.fields.addressPlaceholder" as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Suburb + Postcode row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("centerProfile.fields.suburb" as any)} *
                </label>
                <input
                  type="text"
                  value={form.suburb}
                  onChange={(e) => updateField("suburb", e.target.value)}
                  placeholder={t("centerProfile.fields.suburbPlaceholder" as any)}
                  className={cn(
                    "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    errors.suburb ? "border-red-400" : "border-gray-300",
                  )}
                />
                {errors.suburb && (
                  <p className="text-sm text-red-500 mt-1">{errors.suburb}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("centerProfile.fields.postcode" as any)} *
                </label>
                <input
                  type="text"
                  value={form.postcode}
                  onChange={(e) => updateField("postcode", e.target.value)}
                  placeholder="e.g., 2067"
                  className={cn(
                    "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    errors.postcode ? "border-red-400" : "border-gray-300",
                  )}
                />
                {errors.postcode && (
                  <p className="text-sm text-red-500 mt-1">{errors.postcode}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                {t("centerProfile.fields.phone" as any)} *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder={t("centerProfile.fields.phonePlaceholder" as any)}
                className={cn(
                  "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.phone ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                {t("centerProfile.fields.email" as any)} *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder={t("centerProfile.fields.emailPlaceholder" as any)}
                className={cn(
                  "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.email ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION: Descriptions                                             */}
          {/* ================================================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Description
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("centerProfile.fields.descriptionEn" as any)}
              </label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => updateField("descriptionEn", e.target.value)}
                placeholder={t("centerProfile.fields.descriptionEnPlaceholder" as any)}
                rows={5}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("centerProfile.fields.descriptionZh" as any)}
              </label>
              <p className="text-xs text-gray-400 mb-2">
                {t("centerProfile.fields.descriptionZhHelp" as any)}
              </p>
              <textarea
                value={form.descriptionZh}
                onChange={(e) => updateField("descriptionZh", e.target.value)}
                placeholder="Chinese description / 中文介绍..."
                rows={5}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION: Staff Languages                                          */}
          {/* ================================================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-600" />
              {t("centerProfile.staffLanguages.title" as any)}
            </h2>
            <p className="text-sm text-gray-500">
              {t("centerProfile.staffLanguages.subtitle" as any)}
            </p>

            <div className="space-y-2">
              {STAFF_LANGUAGE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 border rounded-md px-4 py-3 cursor-pointer text-sm transition-colors min-h-[44px]",
                    form.staffLanguages.includes(opt.value)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.staffLanguages.includes(opt.value)}
                    onChange={() => toggleArrayField("staffLanguages", opt.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION: Programs                                                 */}
          {/* ================================================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {t("centerProfile.programs.title" as any)}
            </h2>
            <p className="text-sm text-gray-500">
              {t("centerProfile.programs.subtitle" as any)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROGRAM_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 border rounded-md px-3 py-2.5 cursor-pointer text-sm transition-colors min-h-[44px]",
                    form.programs.includes(opt.value)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.programs.includes(opt.value)}
                    onChange={() => toggleArrayField("programs", opt.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION: Age Groups                                               */}
          {/* ================================================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {t("centerProfile.ageGroups.title" as any)}
            </h2>

            <div className="space-y-2">
              {AGE_GROUP_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 border rounded-md px-4 py-3 cursor-pointer text-sm transition-colors min-h-[44px]",
                    form.ageGroups.includes(opt.value)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.ageGroups.includes(opt.value)}
                    onChange={() => toggleArrayField("ageGroups", opt.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION: Fees, CCS, NQS                                           */}
          {/* ================================================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">
              Fees & Quality
            </h2>

            {/* Fee range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("centerProfile.fields.feeRange" as any)}
              </label>
              <p className="text-xs text-gray-400 mb-2">
                {t("centerProfile.fields.feeHelp" as any)}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={form.feeMin}
                    onChange={(e) => updateField("feeMin", e.target.value)}
                    placeholder="Min/day"
                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={form.feeMax}
                    onChange={(e) => updateField("feeMax", e.target.value)}
                    placeholder="Max/day"
                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* CCS approved */}
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={form.isCcsApproved}
                onChange={(e) => updateField("isCcsApproved", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
              />
              <span className="text-sm text-gray-700">
                CCS Approved (Child Care Subsidy)
              </span>
            </label>

            {/* NQS Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("centerProfile.nqsRatings.title" as any)}
              </label>
              <select
                value={form.nqsRating}
                onChange={(e) => updateField("nqsRating", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {NQS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION: Photos (placeholder)                                     */}
          {/* ================================================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-blue-600" />
              {t("centerProfile.photos.title" as any)}
            </h2>
            <p className="text-sm text-gray-500">
              {t("centerProfile.photos.subtitle" as any)}
            </p>

            {/* Upload zone placeholder */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <ImagePlus className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">
                {t("centerProfile.photos.dragDrop" as any)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG or PNG, max 5MB per photo
              </p>
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
              <Save className="w-4 h-4" />
            )}
            {saving ? t("common.saving" as any) : t("common.buttons.saveChanges" as any)}
          </button>
        </form>
      </div>
    </div>
  );
}
