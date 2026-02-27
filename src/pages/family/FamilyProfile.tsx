import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isDemoMode } from "@/lib/supabase";
import { mockFamilyProfile, mockChildren } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  User,
  MapPin,
  Phone,
  Baby,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChildEntry {
  id?: string;
  name: string;
  dateOfBirth: string;
  daysPerWeek: number;
}

interface FamilyFormData {
  parentName: string;
  suburb: string;
  phone: string;
  communicationLanguage: string;
  chineseName: string;
  wechatId: string;
  priorities: string[];
  additionalNotes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_OPTIONS = [
  { value: 1, label: "1 day" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
  { value: 5, label: "5 days" },
];

const PRIORITY_OPTIONS = [
  "bilingual_education",
  "cultural_understanding",
  "proximity",
  "cost",
  "outdoor_play",
  "academic_readiness",
  "meal_quality",
  "small_groups",
  "extended_hours",
  "inclusive_program",
] as const;

const PRIORITY_LABELS: Record<string, string> = {
  bilingual_education: "Bilingual education",
  cultural_understanding: "Cultural understanding",
  proximity: "Close to home",
  cost: "Affordable fees",
  outdoor_play: "Outdoor play & nature",
  academic_readiness: "School readiness",
  meal_quality: "Quality meals & nutrition",
  small_groups: "Small group sizes",
  extended_hours: "Extended operating hours",
  inclusive_program: "Inclusive & diverse program",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateCompleteness(form: FamilyFormData, children: ChildEntry[]): number {
  let filled = 0;
  const total = 10;

  if (form.parentName.trim()) filled++;
  if (form.suburb.trim()) filled++;
  if (form.phone.trim()) filled++;
  if (children.length > 0 && children[0].dateOfBirth) filled++;
  if (children.length > 0 && children[0].daysPerWeek > 0) filled++;
  if (form.communicationLanguage) filled++;
  if (form.chineseName.trim()) filled++;
  if (form.wechatId.trim()) filled++;
  if (form.priorities.length > 0) filled++;
  if (form.additionalNotes.trim()) filled++;

  return Math.round((filled / total) * 100);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyProfile() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FamilyFormData>({
    parentName: "",
    suburb: "",
    phone: "",
    communicationLanguage: "en",
    chineseName: "",
    wechatId: "",
    priorities: [],
    additionalNotes: "",
  });

  const [children, setChildren] = useState<ChildEntry[]>([
    { name: "", dateOfBirth: "", daysPerWeek: 3 },
  ]);

  const [familyProfileId, setFamilyProfileId] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Load existing profile ----
  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      // Demo mode: use mock family profile
      if (isDemoMode) {
        const fp = mockFamilyProfile;
        setFamilyProfileId(fp.id);
        setForm({
          parentName: fp.parent_name,
          suburb: fp.suburb,
          phone: fp.phone,
          communicationLanguage: fp.communication_language,
          chineseName: fp.chinese_name || "",
          wechatId: fp.wechat_id || "",
          priorities: fp.priorities,
          additionalNotes: fp.additional_notes || "",
        });
        setChildren(
          mockChildren.map((c) => ({
            id: c.id,
            name: c.name,
            dateOfBirth: c.date_of_birth,
            daysPerWeek: c.days_per_week,
          })),
        );
        if (fp.chinese_name || fp.wechat_id || fp.priorities.length > 0 || fp.additional_notes) {
          setShowOptional(true);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: fp, error: fpError } = await supabase
          .from("family_profiles")
          .select("*")
          .eq("profile_id", user!.id)
          .maybeSingle();

        if (fpError) throw fpError;

        if (fp) {
          setFamilyProfileId(fp.id);
          setForm({
            parentName: fp.parent_name || "",
            suburb: fp.suburb || "",
            phone: fp.phone || "",
            communicationLanguage: fp.communication_language || "en",
            chineseName: fp.chinese_name || "",
            wechatId: fp.wechat_id || "",
            priorities: fp.priorities || [],
            additionalNotes: fp.additional_notes || "",
          });

          // Load children
          const { data: childrenData } = await supabase
            .from("children")
            .select("*")
            .eq("family_profile_id", fp.id)
            .order("created_at", { ascending: true });

          if (childrenData && childrenData.length > 0) {
            setChildren(
              childrenData.map((c) => ({
                id: c.id,
                name: c.name || "",
                dateOfBirth: c.date_of_birth || "",
                daysPerWeek: c.days_per_week || 3,
              })),
            );
          }

          // Show optional section if any optional fields are filled
          if (fp.chinese_name || fp.wechat_id || (fp.priorities && fp.priorities.length > 0) || fp.additional_notes) {
            setShowOptional(true);
          }
        }
      } catch (err) {
        console.error("Failed to load family profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // ---- Field update helpers ----
  const updateField = useCallback(
    <K extends keyof FamilyFormData>(key: K, value: FamilyFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const updateChild = useCallback(
    (index: number, field: keyof ChildEntry, value: string | number) => {
      setChildren((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`child_${index}_${field}`];
        return next;
      });
    },
    [],
  );

  const addChild = useCallback(() => {
    setChildren((prev) => [...prev, { name: "", dateOfBirth: "", daysPerWeek: 3 }]);
  }, []);

  const removeChild = useCallback(
    (index: number) => {
      if (children.length <= 1) return;
      setChildren((prev) => prev.filter((_, i) => i !== index));
    },
    [children.length],
  );

  const togglePriority = useCallback((priority: string) => {
    setForm((prev) => {
      const current = prev.priorities;
      if (current.includes(priority)) {
        return { ...prev, priorities: current.filter((p) => p !== priority) };
      }
      if (current.length >= 5) return prev;
      return { ...prev, priorities: [...current, priority] };
    });
  }, []);

  // ---- Validation ----
  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.parentName.trim()) errs.parentName = t("common.errors.required" as any);
    if (!form.suburb.trim()) errs.suburb = t("common.errors.required" as any);
    if (!form.phone.trim()) errs.phone = t("common.errors.required" as any);

    children.forEach((child, i) => {
      if (!child.dateOfBirth) errs[`child_${i}_dateOfBirth`] = t("common.errors.required" as any);
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;

    setSaving(true);
    setToast(null);

    // Demo mode: simulate save
    if (isDemoMode) {
      setTimeout(() => {
        setToast({ type: "success", message: t("familyProfile.saveSuccess" as any) });
        setSaving(false);
        setTimeout(() => setToast(null), 3000);
      }, 600);
      return;
    }

    try {
      // Upsert family_profiles
      const familyData = {
        profile_id: user.id,
        parent_name: form.parentName.trim(),
        suburb: form.suburb.trim(),
        phone: form.phone.trim(),
        communication_language: form.communicationLanguage,
        chinese_name: form.chineseName.trim() || null,
        wechat_id: form.wechatId.trim() || null,
        priorities: form.priorities,
        additional_notes: form.additionalNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let fpId = familyProfileId;

      if (fpId) {
        const { error } = await supabase
          .from("family_profiles")
          .update(familyData)
          .eq("id", fpId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("family_profiles")
          .insert(familyData)
          .select("id")
          .single();
        if (error) throw error;
        fpId = data.id;
        setFamilyProfileId(fpId);
      }

      // Upsert children
      for (const child of children) {
        const childData = {
          family_profile_id: fpId!,
          name: child.name.trim() || "Child",
          date_of_birth: child.dateOfBirth,
          days_per_week: child.daysPerWeek,
        };

        if (child.id) {
          const { error } = await supabase
            .from("children")
            .update({ ...childData, updated_at: new Date().toISOString() })
            .eq("id", child.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("children")
            .insert(childData)
            .select("id")
            .single();
          if (error) throw error;
          child.id = data.id;
        }
      }

      // Mark onboarding complete
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      setToast({ type: "success", message: t("familyProfile.saveSuccess" as any) });

      // Auto-dismiss toast after 3s
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setToast({ type: "error", message: err?.message || t("common.errors.generic" as any) });
    } finally {
      setSaving(false);
    }
  }

  // ---- Completeness ----
  const completeness = calculateCompleteness(form, children);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
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
          {t("familyProfile.title" as any)}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {t("familyProfile.subtitle" as any)}
        </p>

        {/* ---- Completeness bar ---- */}
        <div className="mt-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">
              Profile {completeness}% complete
            </span>
            <span className="text-gray-400">{completeness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                completeness < 40
                  ? "bg-amber-500"
                  : completeness < 70
                    ? "bg-blue-500"
                    : "bg-emerald-500",
              )}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {/* ---- Form ---- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ---- REQUIRED FIELDS ---- */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Required Information
            </h2>

            {/* Parent name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("familyProfile.fields.parentName" as any)} *
              </label>
              <input
                type="text"
                value={form.parentName}
                onChange={(e) => updateField("parentName", e.target.value)}
                placeholder={t("familyProfile.fields.parentNamePlaceholder" as any)}
                className={cn(
                  "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.parentName ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.parentName && (
                <p className="text-sm text-red-500 mt-1">{errors.parentName}</p>
              )}
            </div>

            {/* Suburb */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t("familyProfile.fields.suburb" as any)} *
              </label>
              <input
                type="text"
                value={form.suburb}
                onChange={(e) => updateField("suburb", e.target.value)}
                placeholder={t("familyProfile.fields.suburbPlaceholder" as any)}
                className={cn(
                  "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.suburb ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.suburb && (
                <p className="text-sm text-red-500 mt-1">{errors.suburb}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                {t("familyProfile.fields.phone" as any)} *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder={t("familyProfile.fields.phonePlaceholder" as any)}
                className={cn(
                  "w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.phone ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Baby className="w-4 h-4 inline mr-1" />
                {t("familyProfile.children.title" as any)} *
              </label>

              <div className="space-y-4">
                {children.map((child, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-md p-4 space-y-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Child {index + 1}
                      </span>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(index)}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("familyProfile.children.removeChild" as any)}
                        </button>
                      )}
                    </div>

                    {/* Child name */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t("familyProfile.children.childName" as any)}
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(index, "name", e.target.value)}
                        placeholder={t("familyProfile.children.childNamePlaceholder" as any)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Date of birth */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t("familyProfile.children.dateOfBirth" as any)} *
                      </label>
                      <input
                        type="date"
                        value={child.dateOfBirth}
                        onChange={(e) => updateChild(index, "dateOfBirth", e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className={cn(
                          "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                          errors[`child_${index}_dateOfBirth`] ? "border-red-400" : "border-gray-300",
                        )}
                      />
                      {errors[`child_${index}_dateOfBirth`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`child_${index}_dateOfBirth`]}
                        </p>
                      )}
                    </div>

                    {/* Days per week */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t("familyProfile.children.daysPerWeek" as any)} *
                      </label>
                      <select
                        value={child.daysPerWeek}
                        onChange={(e) => updateChild(index, "daysPerWeek", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {DAYS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addChild}
                className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="w-4 h-4" />
                {t("familyProfile.children.addChild" as any)}
              </button>
            </div>
          </div>

          {/* ---- OPTIONAL FIELDS ---- */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOptional((prev) => !prev)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Optional Details
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  Complete later for better recommendations
                </span>
              </div>
              {showOptional ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showOptional && (
              <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-5">
                {/* Communication language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("familyProfile.fields.communicationLanguage" as any)}
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    {t("familyProfile.fields.communicationLanguageHelp" as any)}
                  </p>
                  <div className="flex gap-3">
                    {[
                      { value: "en", label: "English" },
                      { value: "zh", label: "Mandarin / 中文" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          "flex items-center gap-2 border rounded-md px-4 py-2.5 cursor-pointer text-sm transition-colors min-h-[44px]",
                          form.communicationLanguage === opt.value
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-300 text-gray-600 hover:border-gray-400",
                        )}
                      >
                        <input
                          type="radio"
                          name="communicationLanguage"
                          value={opt.value}
                          checked={form.communicationLanguage === opt.value}
                          onChange={(e) => updateField("communicationLanguage", e.target.value)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Chinese name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("familyProfile.fields.chineseName" as any)}
                  </label>
                  <input
                    type="text"
                    value={form.chineseName}
                    onChange={(e) => updateField("chineseName", e.target.value)}
                    placeholder={t("familyProfile.fields.chineseNamePlaceholder" as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* WeChat ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("familyProfile.fields.wechatId" as any)}
                  </label>
                  <input
                    type="text"
                    value={form.wechatId}
                    onChange={(e) => updateField("wechatId", e.target.value)}
                    placeholder={t("familyProfile.fields.wechatIdPlaceholder" as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Priorities checklist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("familyProfile.priorities.title" as any)}
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    {t("familyProfile.priorities.subtitle" as any)}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRIORITY_OPTIONS.map((priority) => (
                      <label
                        key={priority}
                        className={cn(
                          "flex items-center gap-2 border rounded-md px-3 py-2.5 cursor-pointer text-sm transition-colors min-h-[44px]",
                          form.priorities.includes(priority)
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={form.priorities.includes(priority)}
                          onChange={() => togglePriority(priority)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {PRIORITY_LABELS[priority]}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("familyProfile.fields.additionalNotes" as any)}
                  </label>
                  <textarea
                    value={form.additionalNotes}
                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                    placeholder={t("familyProfile.fields.additionalNotesPlaceholder" as any)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t("familyProfile.fields.additionalNotesHelp" as any)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ---- Submit ---- */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t("common.saving" as any) : t("common.buttons.saveChanges" as any)}
          </button>

          <p className="text-xs text-gray-400 text-center">
            {t("familyProfile.completeProfilePrompt" as any)}
          </p>
        </form>
      </div>
    </div>
  );
}
