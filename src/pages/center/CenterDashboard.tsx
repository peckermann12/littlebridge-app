import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Baby,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit3,
  PlusCircle,
  CreditCard,
  Star,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CenterProfileRow {
  id: string;
  center_name: string;
  slug: string | null;
  subscription_status: string;
  subscription_trial_end: string | null;
  is_founding_partner: boolean;
  founding_partner_expires_at: string | null;
}

interface EnquiryRow {
  id: string;
  family_profile_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_wechat_id: string | null;
  guest_child_age: string | null;
  guest_child_days_needed: string | null;
  guest_suburb: string | null;
  message_original: string | null;
  message_translated: string | null;
  message_source_language: string | null;
  status: string;
  center_notes: string | null;
  is_guest: boolean;
  created_at: string;
  // Joined data for registered users
  family_profiles?: {
    parent_name: string | null;
    phone: string | null;
    wechat_id: string | null;
    suburb: string | null;
    children?: {
      name: string | null;
      date_of_birth: string | null;
      days_per_week: number | null;
    }[];
  } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "new", label: "New", className: "text-blue-700 bg-blue-50" },
  { value: "contacted", label: "Contacted", className: "text-amber-700 bg-amber-50" },
  { value: "tour_booked", label: "Visit Scheduled", className: "text-green-700 bg-green-50" },
  { value: "enrolled", label: "Enrolled", className: "text-emerald-700 bg-emerald-50 font-semibold" },
  { value: "declined", label: "Declined", className: "text-gray-500 bg-gray-50" },
];

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths}m`;
  if (remainingMonths === 0) return `${years}y`;
  return `${years}y ${remainingMonths}m`;
}

function daysRemaining(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const end = new Date(trialEnd);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CenterDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [center, setCenter] = useState<CenterProfileRow | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedEnquiry, setExpandedEnquiry] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ---- Load data ----
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        // Fetch center profile
        const { data: cp, error: cpError } = await supabase
          .from("center_profiles")
          .select("id, center_name, slug, subscription_status, subscription_trial_end, is_founding_partner, founding_partner_expires_at")
          .eq("profile_id", user!.id)
          .maybeSingle();

        if (cpError) throw cpError;
        if (!cp) {
          setLoading(false);
          return;
        }
        setCenter(cp as CenterProfileRow);

        // Fetch enquiries with family data
        const { data: enqs, error: eqError } = await supabase
          .from("enquiries")
          .select(`
            id,
            family_profile_id,
            guest_name,
            guest_email,
            guest_phone,
            guest_wechat_id,
            guest_child_age,
            guest_child_days_needed,
            guest_suburb,
            message_original,
            message_translated,
            message_source_language,
            status,
            center_notes,
            is_guest,
            created_at,
            family_profiles (
              parent_name,
              phone,
              wechat_id,
              suburb,
              children (
                name,
                date_of_birth,
                days_per_week
              )
            )
          `)
          .eq("center_profile_id", cp.id)
          .order("created_at", { ascending: false });

        if (eqError) throw eqError;
        setEnquiries((enqs as unknown as EnquiryRow[]) || []);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  // ---- Status update ----
  const updateStatus = useCallback(
    async (enquiryId: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from("enquiries")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", enquiryId);

        if (error) throw error;

        setEnquiries((prev) =>
          prev.map((eq) => (eq.id === enquiryId ? { ...eq, status: newStatus } : eq)),
        );

        setToast({ type: "success", message: "Status updated" });
        setTimeout(() => setToast(null), 2000);
      } catch (err: any) {
        setToast({ type: "error", message: err.message || "Failed to update" });
      }
    },
    [],
  );

  // ---- Notes save ----
  const saveNotes = useCallback(async (enquiryId: string, notes: string) => {
    setSavingNotes((prev) => ({ ...prev, [enquiryId]: true }));
    try {
      const { error } = await supabase
        .from("enquiries")
        .update({ center_notes: notes, updated_at: new Date().toISOString() })
        .eq("id", enquiryId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes((prev) => ({ ...prev, [enquiryId]: false }));
    }
  }, []);

  // ---- Filter enquiries ----
  const filteredEnquiries = enquiries.filter((eq) => {
    if (activeTab === "all") return true;
    if (activeTab === "new") return eq.status === "new";
    if (activeTab === "in_progress") return ["contacted", "tour_booked"].includes(eq.status);
    if (activeTab === "completed") return ["enrolled", "declined"].includes(eq.status);
    return true;
  });

  const newCount = enquiries.filter((eq) => eq.status === "new").length;

  // ---- Loading ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="mt-4 text-lg font-semibold text-gray-800">
            No center profile found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Set up your center profile to start receiving enquiries.
          </p>
          <Link
            to="/center/profile"
            className="mt-4 inline-block bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700"
          >
            Set Up Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ---- Toast ---- */}
        {toast && (
          <div
            className={cn(
              "mb-4 rounded-md p-3 text-sm flex items-center gap-2",
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200",
            )}
          >
            {toast.message}
          </div>
        )}

        {/* ---- Top bar ---- */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{center.center_name}</h1>
          <Link
            to="/center/profile"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>

        {/* ================================================================ */}
        {/* SECTION 1: Subscription Status                                    */}
        {/* ================================================================ */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {center.is_founding_partner ? (
                <>
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">
                    Founding Partner -- Free access
                    {center.founding_partner_expires_at &&
                      ` until ${new Date(center.founding_partner_expires_at).toLocaleDateString("en-AU")}`}
                  </span>
                </>
              ) : center.subscription_status === "active" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">
                    Subscription active
                  </span>
                </>
              ) : center.subscription_status === "trialing" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-amber-700">
                    Free trial -- {daysRemaining(center.subscription_trial_end)} days remaining
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm font-medium text-gray-500">
                    Subscription inactive
                  </span>
                </>
              )}
            </div>
            <Link
              to="/center/dashboard/subscription"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Manage
            </Link>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 2: Enquiries                                              */}
        {/* ================================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Family Enquiries
            </h2>
            {enquiries.length > 0 && (
              <span className="bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {enquiries.length}
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[36px]",
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {tab.label}
                {tab.key === "new" && newCount > 0 && (
                  <span className="ml-1">({newCount})</span>
                )}
              </button>
            ))}
          </div>

          {/* Enquiry cards */}
          {filteredEnquiries.length > 0 ? (
            <div className="space-y-3">
              {filteredEnquiries.map((eq) => {
                const isExpanded = expandedEnquiry === eq.id;
                const isTranslationShown = showTranslation[eq.id] || false;

                // Resolve contact/child info from guest or registered
                const familyName = eq.is_guest
                  ? eq.guest_name
                  : eq.family_profiles?.parent_name;
                const phoneNumber = eq.is_guest
                  ? eq.guest_phone
                  : eq.family_profiles?.phone;
                const wechatId = eq.is_guest
                  ? eq.guest_wechat_id
                  : eq.family_profiles?.wechat_id;
                const email = eq.is_guest ? eq.guest_email : null;
                const suburb = eq.is_guest
                  ? eq.guest_suburb
                  : eq.family_profiles?.suburb;

                // Child info
                let childAge: string | null = null;
                let daysNeeded: string | null = null;

                if (eq.is_guest) {
                  childAge = eq.guest_child_age || null;
                  daysNeeded = eq.guest_child_days_needed
                    ? `${eq.guest_child_days_needed} days/week`
                    : null;
                } else if (eq.family_profiles?.children && eq.family_profiles.children.length > 0) {
                  const child = eq.family_profiles.children[0];
                  childAge = child.date_of_birth ? calculateAge(child.date_of_birth) : null;
                  daysNeeded = child.days_per_week ? `${child.days_per_week} days/week` : null;
                }

                // Message: show translated version as primary if available
                const primaryMessage =
                  eq.message_source_language === "zh" && eq.message_translated
                    ? eq.message_translated
                    : eq.message_original;
                const secondaryMessage =
                  eq.message_source_language === "zh" && eq.message_translated
                    ? eq.message_original
                    : eq.message_translated;
                const hasTranslation = Boolean(secondaryMessage);

                return (
                  <div
                    key={eq.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-gray-800">
                        {familyName || "Guest"}
                      </span>
                      <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                        {timeAgo(eq.created_at)}
                      </span>
                    </div>

                    {/* Key info badges -- phone/contact FIRST per Karen's feedback */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {phoneNumber && (
                        <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700">
                          <Phone className="w-3 h-3" />
                          {phoneNumber}
                        </span>
                      )}
                      {wechatId && (
                        <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-green-50 text-green-700">
                          <MessageCircle className="w-3 h-3" />
                          {wechatId}
                        </span>
                      )}
                      {email && (
                        <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-blue-50 text-blue-700">
                          <Mail className="w-3 h-3" />
                          {email}
                        </span>
                      )}
                      {childAge && (
                        <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-blue-50 text-blue-700">
                          <Baby className="w-3 h-3" />
                          {childAge}
                        </span>
                      )}
                      {daysNeeded && (
                        <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-purple-50 text-purple-700">
                          <Calendar className="w-3 h-3" />
                          {daysNeeded}
                        </span>
                      )}
                      {suburb && (
                        <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {suburb}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    {primaryMessage && (
                      <div className="mt-3">
                        <p
                          className={cn(
                            "text-sm text-gray-600",
                            !isExpanded && "line-clamp-2",
                          )}
                        >
                          {primaryMessage}
                        </p>
                        {primaryMessage.length > 120 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEnquiry(isExpanded ? null : eq.id)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Translation toggle */}
                    {hasTranslation && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShowTranslation((prev) => ({
                              ...prev,
                              [eq.id]: !prev[eq.id],
                            }))
                          }
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {isTranslationShown ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          {isTranslationShown
                            ? "Hide original"
                            : "Show original (Chinese)"}
                        </button>
                        {isTranslationShown && (
                          <div className="mt-2 bg-gray-50 rounded-md p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              Bilingual version
                            </p>
                            <p className="text-sm text-gray-600">
                              {secondaryMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status + Notes row */}
                    <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                      <select
                        value={eq.status}
                        onChange={(e) => updateStatus(eq.id, e.target.value)}
                        className={cn(
                          "border rounded-md px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500",
                          STATUS_OPTIONS.find((s) => s.value === eq.status)?.className || "bg-gray-50 text-gray-700",
                        )}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        defaultValue={eq.center_notes || ""}
                        placeholder="Add a note..."
                        onBlur={(e) => saveNotes(eq.id, e.target.value)}
                        className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {savingNotes[eq.id] && (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ---- Empty State ---- */
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="mt-3 text-lg font-semibold text-gray-800">
                {t("dashboard.enquiries.noEnquiries" as any)}
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                Make sure your profile is complete -- centers with photos and
                descriptions receive 3x more enquiries.
              </p>
              <Link
                to="/center/profile"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Complete Your Profile
              </Link>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* SECTION 3: Quick Actions                                          */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/center/profile"
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white min-h-[44px]"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Link>
          {center.slug && (
            <a
              href={`/centers/${center.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white min-h-[44px]"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Listing
            </a>
          )}
          <Link
            to="/center/dashboard/jobs/new"
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Post a Job
          </Link>
        </div>
      </div>
    </div>
  );
}
