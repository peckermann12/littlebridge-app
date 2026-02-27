import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase, isDemoMode } from "@/lib/supabase";
import { mockCenters } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Shield,
  MapPin,
  ExternalLink,
  Clock,
  DollarSign,
  Globe,
  MessageSquare,
  Link2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CenterPhoto {
  id: string;
  photo_url: string;
  display_order: number;
  alt_text: string | null;
}

interface StaffLanguage {
  language: string;
  count: number;
}

interface AgeGroup {
  group_name: string;
  capacity: number;
  vacancies: number;
}

interface OperatingHours {
  [day: string]: { open: string; close: string } | undefined;
}

interface CenterData {
  id: string;
  center_name: string;
  slug: string;
  address: string | null;
  suburb: string;
  postcode: string;
  state: string;
  description_en: string | null;
  description_zh: string | null;
  operating_hours: OperatingHours | null;
  age_groups: AgeGroup[] | null;
  fee_min: number | null;
  fee_max: number | null;
  is_ccs_approved: boolean;
  staff_languages: StaffLanguage[] | null;
  programs: string[] | null;
  nqs_rating: string | null;
  is_founding_partner: boolean;
  acecqa_url: string | null;
  website: string | null;
  phone: string | null;
  location: unknown;
  center_photos: CenterPhoto[];
}

// ---------------------------------------------------------------------------
// NQS Rating display helper
// ---------------------------------------------------------------------------

function nqsLabel(rating: string | null): string {
  if (!rating) return "";
  const labels: Record<string, string> = {
    exceeding: "Exceeding NQS",
    meeting: "Meeting NQS",
    working_towards: "Working Towards NQS",
    not_yet_assessed: "Not Yet Assessed",
  };
  return labels[rating] || rating;
}

function nqsBadgeColor(rating: string | null): string {
  if (!rating) return "bg-gray-100 text-gray-600";
  if (rating === "exceeding") return "bg-emerald-100 text-emerald-700";
  if (rating === "meeting") return "bg-blue-100 text-blue-700";
  if (rating === "working_towards") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

// ---------------------------------------------------------------------------
// Vacancy dot color
// ---------------------------------------------------------------------------

function vacancyIndicator(vacancies: number): { color: string; label: string } {
  if (vacancies > 0) return { color: "bg-emerald-500", label: "Available" };
  return { color: "bg-gray-400", label: "Waitlist" };
}

// ---------------------------------------------------------------------------
// Program label display
// ---------------------------------------------------------------------------

const PROGRAM_LABELS: Record<string, string> = {
  bilingual_program: "Bilingual Program",
  cultural_events: "Cultural Celebrations",
  mandarin_classes: "Mandarin Classes",
  play_based: "Play-Based Learning",
  montessori: "Montessori",
  stem: "STEM",
  outdoor: "Outdoor Learning",
  music: "Music Program",
  art: "Art Program",
  sports: "Sports Program",
};

// ---------------------------------------------------------------------------
// Day labels for operating hours
// ---------------------------------------------------------------------------

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

// ---------------------------------------------------------------------------
// CenterDetail Page
// ---------------------------------------------------------------------------

export default function CenterDetail() {
  const { t, locale } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [center, setCenter] = useState<CenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // UI state
  const [showOtherLang, setShowOtherLang] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function fetchCenter() {
      setLoading(true);
      setNotFound(false);

      // Demo mode: find center from mock data by slug
      if (isDemoMode) {
        const found = mockCenters.find((c) => c.slug === slug);
        if (found) {
          setCenter(found as unknown as CenterData);
        } else {
          setNotFound(true);
        }
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("center_profiles")
          .select(
            `
            id,
            center_name,
            slug,
            address,
            suburb,
            postcode,
            state,
            description_en,
            description_zh,
            operating_hours,
            age_groups,
            fee_min,
            fee_max,
            is_ccs_approved,
            staff_languages,
            programs,
            nqs_rating,
            is_founding_partner,
            acecqa_url,
            website,
            phone,
            location,
            center_photos (
              id,
              photo_url,
              display_order,
              alt_text
            )
          `,
          )
          .eq("slug", slug)
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        // Sort photos by display_order
        const processed = {
          ...data,
          center_photos: (data.center_photos || []).sort(
            (a: CenterPhoto, b: CenterPhoto) => a.display_order - b.display_order,
          ),
        } as CenterData;

        setCenter(processed);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCenter();
  }, [slug]);

  // Copy link handler
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is not available
    }
  };

  // Build ACECQA URL
  const acecqaLink =
    center?.acecqa_url ||
    (center?.center_name
      ? `https://www.acecqa.gov.au/resources/national-registers/search?provider=${encodeURIComponent(center.center_name)}`
      : null);

  // Description based on locale
  const primaryDescription =
    locale === "zh" ? center?.description_zh : center?.description_en;
  const secondaryDescription =
    locale === "zh" ? center?.description_en : center?.description_zh;
  const otherLangLabel =
    locale === "zh" ? "View English version" : "View Chinese version / 查看中文版";
  const otherLangNote =
    locale === "zh" ? "English version" : "Chinese version / 中文版";

  // Vacancies summary
  const vacancyGroups = center?.age_groups?.filter((ag) => ag.vacancies > 0) || [];
  const vacancySummary = vacancyGroups.map((ag) => ag.group_name).join(", ");

  // Has any mandarin staff
  const mandarinStaff = center?.staff_languages?.find(
    (sl) => sl.language.toLowerCase() === "mandarin",
  );
  const cantoneseStaff = center?.staff_languages?.find(
    (sl) => sl.language.toLowerCase() === "cantonese",
  );

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // 404
  if (notFound || !center) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Center not found
        </h1>
        <p className="text-gray-500 mb-6">
          This center may have been removed or the URL is incorrect.
        </p>
        <Link
          to="/search"
          className="text-blue-600 hover:underline font-medium"
        >
          &larr; Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sticky CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 md:hidden">
        <Link
          to={`/centers/${center.slug}/enquiry`}
          className="block w-full bg-blue-600 text-white py-3 text-center text-lg font-semibold rounded-md hover:bg-blue-700 transition min-h-[44px]"
        >
          {t("centerPage.sendEnquiryCta")}
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Back link */}
        <Link
          to="/search"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>

        {/* Photo section */}
        <div className="mb-6">
          {center.center_photos.length > 0 ? (
            <div className="space-y-2">
              {/* Main photo */}
              <div className="h-48 md:h-64 w-full rounded-lg overflow-hidden">
                <img
                  src={center.center_photos[0].photo_url}
                  alt={
                    center.center_photos[0].alt_text || center.center_name
                  }
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Additional photos grid */}
              {center.center_photos.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {center.center_photos.slice(1, 5).map((photo) => (
                    <div
                      key={photo.id}
                      className="h-24 rounded-md overflow-hidden"
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.alt_text || center.center_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
              <Building2 className="w-12 h-12 mb-2" />
              <span className="font-medium">{center.center_name}</span>
            </div>
          )}
        </div>

        {/* Content: two columns on desktop */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0">
            {/* Center name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {center.center_name}
            </h1>

            {/* Suburb + NQS */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {center.suburb}
                {center.state ? `, ${center.state}` : ""}
              </span>

              {center.nqs_rating && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    nqsBadgeColor(center.nqs_rating),
                  )}
                  title={
                    locale === "en"
                      ? "NQS is the Australian government quality rating. 'Exceeding' is the highest level."
                      : "NQS 是澳大利亚政府质量评级。'超出' 是最高水平。"
                  }
                >
                  {nqsLabel(center.nqs_rating)}
                  <Info className="w-3 h-3 opacity-60" />
                </span>
              )}
            </div>

            {/* ACECQA link */}
            {center.nqs_rating && acecqaLink && (
              <div className="mt-2">
                <a
                  href={acecqaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {t("centerDetail.acecqaLink")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("centerDetail.acecqaHelp")}
                </p>
              </div>
            )}

            {/* Founding Partner badge */}
            {center.is_founding_partner && (
              <div className="mt-4">
                <span
                  className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-full px-4 py-1.5 text-sm font-semibold"
                  title={t("centerDetail.foundingPartnerTooltip")}
                >
                  <Shield className="w-4 h-4" />
                  {t("centerDetail.foundingPartner")}
                </span>
              </div>
            )}

            {/* Factor Badges row */}
            <div className="flex flex-wrap gap-2 mt-4">
              {mandarinStaff && (
                <span className="bg-red-50 text-red-700 rounded-full px-3 py-1 text-sm font-medium">
                  {t("search.factorBadges.mandarinSpoken")} ({mandarinStaff.count}{" "}
                  staff)
                </span>
              )}
              {cantoneseStaff && (
                <span className="bg-orange-50 text-orange-700 rounded-full px-3 py-1 text-sm font-medium">
                  {t("search.factorBadges.cantoneseSpoken")} (
                  {cantoneseStaff.count} staff)
                </span>
              )}
              {center.programs?.includes("bilingual_program") && (
                <span className="bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-sm font-medium">
                  {t("search.factorBadges.bilingualProgram")}
                </span>
              )}
              {center.is_ccs_approved && (
                <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium">
                  {t("search.factorBadges.ccsApproved")}
                </span>
              )}
              {vacancyGroups.length > 0 && (
                <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium">
                  {t("search.factorBadges.vacanciesAvailable")}
                </span>
              )}
            </div>

            {/* Bilingual Description */}
            {(primaryDescription || secondaryDescription) && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  {t("centerPage.aboutSection")}
                </h2>
                {primaryDescription ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {primaryDescription}
                  </p>
                ) : secondaryDescription ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {secondaryDescription}
                  </p>
                ) : null}

                {secondaryDescription && primaryDescription && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowOtherLang(!showOtherLang)}
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {otherLangLabel}
                      {showOtherLang ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {showOtherLang && (
                      <div className="mt-2 bg-gray-50 rounded-md p-3">
                        <p className="text-xs text-gray-400 mb-1">
                          {otherLangNote}
                        </p>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                          {secondaryDescription}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Programs & Features */}
            {center.programs && center.programs.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  {t("centerPage.programsSection")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {center.programs.map((prog) => (
                    <span
                      key={prog}
                      className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm"
                    >
                      {PROGRAM_LABELS[prog] || prog}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Age Groups & Vacancies */}
            {center.age_groups && center.age_groups.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  {t("centerPage.ageGroupsSection")}
                </h2>
                <div className="space-y-2">
                  {center.age_groups.map((ag) => {
                    const { color, label } = vacancyIndicator(ag.vacancies);
                    return (
                      <div
                        key={ag.group_name}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-sm text-gray-700">
                          {ag.group_name}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-gray-600">
                          <span
                            className={cn("w-2.5 h-2.5 rounded-full", color)}
                          />
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Operating Hours */}
            {center.operating_hours &&
              Object.keys(center.operating_hours).length > 0 && (
                <section className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    {t("centerPage.hoursSection")}
                  </h2>
                  <div className="space-y-1">
                    {DAY_ORDER.map((day) => {
                      const hours = center.operating_hours?.[day];
                      if (!hours) return null;
                      return (
                        <div
                          key={day}
                          className="flex items-center justify-between py-1.5 text-sm"
                        >
                          <span className="text-gray-700">
                            {DAY_LABELS[day]}
                          </span>
                          <span className="text-gray-500">
                            {hours.open} - {hours.close}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

            {/* Fees & CCS */}
            {(center.fee_min || center.fee_max) && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  {t("centerPage.feesSection")}
                </h2>
                <p className="text-lg font-medium text-gray-800">
                  {center.fee_min && center.fee_max
                    ? `$${center.fee_min} - $${center.fee_max} per day`
                    : center.fee_min
                      ? `From $${center.fee_min} per day`
                      : `Up to $${center.fee_max} per day`}
                </p>

                {center.is_ccs_approved && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                    <p className="text-sm text-gray-700">
                      {t("ccs.ccsApprovedExplainer")}
                    </p>
                    <Link
                      to="/ccs-guide"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      {locale === "zh"
                        ? "了解儿童保育补贴 (CCS)"
                        : "Learn about CCS"}
                      {" "}
                      &rarr;
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* Staff Languages */}
            {center.staff_languages && center.staff_languages.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-400" />
                  {t("centerPage.languagesSection")}
                </h2>
                <div className="space-y-2">
                  {center.staff_languages.map((sl) => (
                    <div
                      key={sl.language}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span className="text-gray-700 capitalize">
                        {sl.language}
                      </span>
                      <span className="text-gray-500">
                        {t("centerPage.staffLanguages", {
                          count: sl.count,
                          language: sl.language,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location */}
            {center.address && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {t("centerPage.locationSection")}
                </h2>
                <p className="text-sm text-gray-600">
                  {center.address}
                  {center.suburb ? `, ${center.suburb}` : ""}
                  {center.state ? ` ${center.state}` : ""}
                  {center.postcode ? ` ${center.postcode}` : ""}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${center.address}, ${center.suburb} ${center.state} ${center.postcode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:underline text-sm font-medium min-h-[44px]"
                >
                  <MapPin className="w-4 h-4" />
                  {t("centerPage.directionsCta")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </section>
            )}

            {/* Parent Reviews placeholder */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                {t("centerDetail.reviews.title")}
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {t("centerDetail.reviews.empty", {
                    centerName: center.center_name,
                  })}
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-3 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-400 cursor-not-allowed"
                  title={t("centerDetail.reviews.comingSoon")}
                >
                  {t("centerDetail.reviews.comingSoon")}
                </button>
              </div>
            </section>

            {/* Share / QR section */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-gray-400" />
                {t("centerPage.shareCenter")}
              </h2>
              <div className="flex items-center gap-4">
                {/* QR code placeholder */}
                <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  QR Code
                </div>
                <div>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition min-h-[44px]"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 max-w-xs">
                    {center.center_name} -{" "}
                    {mandarinStaff
                      ? "Mandarin-speaking staff"
                      : "Bilingual childcare"}
                    , {center.suburb}. View on LittleBridge.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — Enquiry CTA (desktop only) */}
          <div className="hidden md:block w-80 flex-shrink-0">
            <div className="sticky top-20 border-2 border-blue-600 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                {locale === "zh"
                  ? "联系这家中心"
                  : "Contact this center"}
              </h2>

              {/* Fee summary */}
              {center.fee_min && (
                <p className="text-gray-600 text-sm">
                  From ${center.fee_min}/day
                </p>
              )}

              {/* CCS */}
              {center.is_ccs_approved && (
                <p className="text-sm text-emerald-600 mt-1">
                  {t("centerPage.ccsApproved")} — subsidy may apply
                </p>
              )}

              {/* Vacancy summary */}
              {vacancySummary && (
                <p className="text-sm text-emerald-600 mt-1">
                  Vacancies in {vacancySummary}
                </p>
              )}

              {/* CTA button */}
              <Link
                to={`/centers/${center.slug}/enquiry`}
                className="block w-full mt-4 bg-blue-600 text-white py-3 text-center text-lg font-semibold rounded-md hover:bg-blue-700 transition min-h-[44px]"
              >
                {t("centerPage.sendEnquiryCta")}
              </Link>

              <p className="text-xs text-gray-400 mt-3 text-center">
                {locale === "zh"
                  ? "无需注册账号。中英文均可。"
                  : "No account needed. Write in Chinese or English."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
