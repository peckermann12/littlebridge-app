import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  Eye,
  XCircle,
  Calendar,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Enquiry {
  id: string;
  center_profile_id: string;
  message_original: string | null;
  status: "new" | "contacted" | "tour_booked" | "enrolled" | "declined";
  created_at: string;
  center_profiles: {
    center_name: string;
    slug: string | null;
    suburb: string | null;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  new: {
    label: "Sent",
    className: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  contacted: {
    label: "Contacted",
    className: "bg-amber-100 text-amber-700",
    icon: Eye,
  },
  tour_booked: {
    label: "Visit Scheduled",
    className: "bg-emerald-100 text-emerald-700",
    icon: Calendar,
  },
  enrolled: {
    label: "Enrolled",
    className: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
  },
  declined: {
    label: "Declined",
    className: "bg-gray-100 text-gray-500",
    icon: XCircle,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyEnquiries() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadEnquiries() {
      try {
        // First get the family_profile_id for this user
        const { data: familyProfile, error: fpError } = await supabase
          .from("family_profiles")
          .select("id")
          .eq("profile_id", user!.id)
          .maybeSingle();

        if (fpError) throw fpError;
        if (!familyProfile) {
          setEnquiries([]);
          setLoading(false);
          return;
        }

        // Fetch enquiries with center info
        const { data, error: eqError } = await supabase
          .from("enquiries")
          .select(
            `
            id,
            center_profile_id,
            message_original,
            status,
            created_at,
            center_profiles (
              center_name,
              slug,
              suburb
            )
          `,
          )
          .eq("family_profile_id", familyProfile.id)
          .order("created_at", { ascending: false });

        if (eqError) throw eqError;

        setEnquiries((data as unknown as Enquiry[]) || []);
      } catch (err: any) {
        console.error("Failed to load enquiries:", err);
        setError(err.message || "Failed to load enquiries");
      } finally {
        setLoading(false);
      }
    }

    loadEnquiries();
  }, [user]);

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
        {/* ---- Header ---- */}
        <h1 className="text-2xl font-bold text-gray-800">
          {t("dashboard.family.title" as any)}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Track the status of your enquiries to centers.
        </p>

        {/* ---- Error ---- */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ---- Enquiry List ---- */}
        {enquiries.length > 0 ? (
          <div className="mt-6 space-y-4">
            {enquiries.map((enquiry) => {
              const status = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.new;
              const StatusIcon = status.icon;
              const centerSlug = enquiry.center_profiles?.slug;

              return (
                <div
                  key={enquiry.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                  {/* Top row: center name + date */}
                  <div className="flex items-start justify-between">
                    <div>
                      {centerSlug ? (
                        <Link
                          to={`/centers/${centerSlug}`}
                          className="text-base font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                        >
                          {enquiry.center_profiles?.center_name}
                        </Link>
                      ) : (
                        <span className="text-base font-semibold text-gray-800">
                          {enquiry.center_profiles?.center_name}
                        </span>
                      )}
                      {enquiry.center_profiles?.suburb && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {enquiry.center_profiles.suburb}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                      Sent {timeAgo(enquiry.created_at)}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div className="mt-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1",
                        status.className,
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Message preview */}
                  {enquiry.message_original && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {enquiry.message_original}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ---- Empty State ---- */
          <div className="mt-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-blue-300" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              {t("dashboard.family.noEnquiries" as any)}
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              {t("dashboard.family.noEnquiriesMessage" as any)}
            </p>
            <Link
              to="/search"
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
            >
              <Search className="w-4 h-4" />
              {t("dashboard.family.startSearching" as any)}
            </Link>
          </div>
        )}

        {/* ---- Bottom CTA ---- */}
        {enquiries.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              <Search className="w-4 h-4" />
              Browse more centers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
