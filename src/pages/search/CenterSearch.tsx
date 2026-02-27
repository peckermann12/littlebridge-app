import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase, isDemoMode } from "@/lib/supabase";
import { mockCenters } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  Building2,
  Shield,
  MapPin,
  X,
  ChevronDown,
  Loader2,
  Mail,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CenterPhoto {
  id: string;
  photo_url: string;
  display_order: number;
}

interface CenterProfile {
  id: string;
  center_name: string;
  slug: string;
  suburb: string;
  postcode: string;
  state: string;
  description_en: string | null;
  description_zh: string | null;
  fee_min: number | null;
  fee_max: number | null;
  nqs_rating: string | null;
  programs: string[] | null;
  staff_languages: { language: string; count: number }[] | null;
  age_groups: { group_name: string; capacity: number; vacancies: number }[] | null;
  is_ccs_approved: boolean;
  is_founding_partner: boolean;
  subscription_status: string;
  center_photos: CenterPhoto[];
}

type SortOption = "newest";
type LanguageFilter = "mandarin" | "cantonese" | "english";
type AgeGroupFilter = "0-2" | "2-3" | "3-5";

// ---------------------------------------------------------------------------
// CenterCard Component
// ---------------------------------------------------------------------------

interface CenterCardProps {
  center: CenterProfile;
  locale: string;
  t: (key: any, vars?: Record<string, string | number>) => string;
}

function CenterCard({ center, locale, t }: CenterCardProps) {
  const photo = center.center_photos?.[0];
  const hasVacancies = center.age_groups?.some((ag) => ag.vacancies > 0);

  const hasMandarin = center.staff_languages?.some(
    (sl) => sl.language.toLowerCase() === "mandarin",
  );
  const hasCantonese = center.staff_languages?.some(
    (sl) => sl.language.toLowerCase() === "cantonese",
  );
  const hasBilingualProgram = center.programs?.includes("bilingual_program");

  return (
    <Link
      to={`/centers/${center.slug}`}
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition bg-white"
    >
      {/* Photo */}
      <div className="h-48 bg-gray-100 relative">
        {photo ? (
          <img
            src={photo.photo_url}
            alt={center.center_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Building2 className="w-10 h-10 mb-2" />
            <span className="text-sm font-medium">{center.center_name}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Founding Partner badge */}
        {center.is_founding_partner && (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2">
            <Shield className="w-3 h-3" />
            {t("centerDetail.foundingPartner")}
          </span>
        )}

        {/* Center name */}
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {center.center_name}
        </h3>

        {/* Suburb */}
        <p className="text-sm text-gray-500 mt-0.5">
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          {center.suburb}
          {center.state ? `, ${center.state}` : ""}
        </p>

        {/* Factor Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {hasMandarin && (
            <span className="bg-red-50 text-red-700 rounded-full px-3 py-1 text-xs font-medium">
              {t("search.factorBadges.mandarinSpoken")}
            </span>
          )}
          {hasCantonese && (
            <span className="bg-orange-50 text-orange-700 rounded-full px-3 py-1 text-xs font-medium">
              {t("search.factorBadges.cantoneseSpoken")}
            </span>
          )}
          {center.is_ccs_approved && (
            <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium">
              {t("search.factorBadges.ccsApproved")}
            </span>
          )}
          {hasVacancies && (
            <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium">
              {t("search.factorBadges.vacanciesAvailable")}
            </span>
          )}
          {hasBilingualProgram && (
            <span className="bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-xs font-medium">
              {t("search.factorBadges.bilingualProgram")}
            </span>
          )}
          {center.nqs_rating === "exceeding" && (
            <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium">
              Exceeding NQS
            </span>
          )}
        </div>

        {/* Fee range */}
        {(center.fee_min || center.fee_max) && (
          <p className="text-sm text-gray-500 mt-2">
            {center.fee_min && center.fee_max
              ? `$${center.fee_min} - $${center.fee_max} / day`
              : center.fee_min
                ? `From $${center.fee_min} / day`
                : `Up to $${center.fee_max} / day`}
          </p>
        )}

        {/* CTA */}
        <p className="text-blue-600 text-sm font-medium mt-3 flex items-center gap-1">
          {t("search.centerCard.sendEnquiry")}
          <span aria-hidden="true">&rarr;</span>
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-24" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Panel
// ---------------------------------------------------------------------------

interface FilterPanelProps {
  languageFilters: LanguageFilter[];
  setLanguageFilters: (v: LanguageFilter[]) => void;
  ageGroupFilters: AgeGroupFilter[];
  setAgeGroupFilters: (v: AgeGroupFilter[]) => void;
  ccsOnly: boolean;
  setCcsOnly: (v: boolean) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  t: (key: any, vars?: Record<string, string | number>) => string;
}

function FilterPanel({
  languageFilters,
  setLanguageFilters,
  ageGroupFilters,
  setAgeGroupFilters,
  ccsOnly,
  setCcsOnly,
  onApply,
  onClear,
  onClose,
  t,
}: FilterPanelProps) {
  const toggleLanguage = (lang: LanguageFilter) => {
    if (languageFilters.includes(lang)) {
      setLanguageFilters(languageFilters.filter((l) => l !== lang));
    } else {
      setLanguageFilters([...languageFilters, lang]);
    }
  };

  const toggleAgeGroup = (ag: AgeGroupFilter) => {
    if (ageGroupFilters.includes(ag)) {
      setAgeGroupFilters(ageGroupFilters.filter((a) => a !== ag));
    } else {
      setAgeGroupFilters([...ageGroupFilters, ag]);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">
          {t("search.filters.title")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 md:hidden"
          aria-label="Close filters"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Languages */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          {t("search.filters.languages")}
        </p>
        <div className="space-y-2">
          {(["mandarin", "cantonese", "english"] as LanguageFilter[]).map(
            (lang) => (
              <label
                key={lang}
                className="flex items-center gap-2 min-h-[44px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={languageFilters.includes(lang)}
                  onChange={() => toggleLanguage(lang)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{lang}</span>
              </label>
            ),
          )}
        </div>
      </div>

      {/* Age Groups */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          {t("search.filters.ageGroup")}
        </p>
        <div className="space-y-2">
          {([
            { value: "0-2" as AgeGroupFilter, label: "0-2 years (Nursery)" },
            { value: "2-3" as AgeGroupFilter, label: "2-3 years (Toddler)" },
            { value: "3-5" as AgeGroupFilter, label: "3-5 years (Preschool)" },
          ]).map((ag) => (
            <label
              key={ag.value}
              className="flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={ageGroupFilters.includes(ag.value)}
                onChange={() => toggleAgeGroup(ag.value)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{ag.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* CCS Approved toggle */}
      <div>
        <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={ccsOnly}
            onChange={() => setCcsOnly(!ccsOnly)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {t("search.factorBadges.ccsApproved")} only
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onApply}
          className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 transition min-h-[44px]"
        >
          {t("search.filters.applyFilters")}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {t("search.filters.clearFilters")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waitlist Signup Component
// ---------------------------------------------------------------------------

interface WaitlistSignupProps {
  suburb: string;
  t: (key: any, vars?: Record<string, string | number>) => string;
  locale: string;
}

function WaitlistSignup({ suburb, t, locale }: WaitlistSignupProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError("");

    // Demo mode: simulate success
    if (isDemoMode) {
      setTimeout(() => {
        setSubmitted(true);
        setSubmitting(false);
      }, 600);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from("waitlist")
        .insert({
          email,
          suburb,
          preferred_language: locale,
        });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <p className="text-sm text-gray-700 font-medium">
          {t("emptyState.waitlistSuccess", { suburb })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        {t("emptyState.noCentersTitle", { suburb })}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {t("emptyState.waitlistSubtitle")}
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emptyState.waitlistEmailPlaceholder")}
          required
          className="flex-1 w-full sm:w-auto h-11 px-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto h-11 px-6 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <Mail className="w-4 h-4" />
          {t("emptyState.waitlistButton")}
        </button>
      </form>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <p className="text-xs text-gray-500 mt-4">
        {t("emptyState.growingMessage")}
      </p>

      <Link
        to="/center/onboard"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {t("emptyState.suggestCenterButton")}
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CenterSearch Page
// ---------------------------------------------------------------------------

export default function CenterSearch() {
  const { t, locale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || "",
  );
  const [activeSearch, setActiveSearch] = useState(
    searchParams.get("q") || "",
  );

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [languageFilters, setLanguageFilters] = useState<LanguageFilter[]>([]);
  const [ageGroupFilters, setAgeGroupFilters] = useState<AgeGroupFilter[]>([]);
  const [ccsOnly, setCcsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Data state
  const [centers, setCenters] = useState<CenterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active filter count for badge
  const activeFilterCount =
    languageFilters.length +
    ageGroupFilters.length +
    (ccsOnly ? 1 : 0);

  // Fetch centers from Supabase
  useEffect(() => {
    async function fetchCenters() {
      setLoading(true);
      setError(null);

      // Demo mode: use mock data instead of Supabase
      if (isDemoMode) {
        setCenters(mockCenters as unknown as CenterProfile[]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("center_profiles")
          .select(
            `
            id,
            center_name,
            slug,
            suburb,
            postcode,
            state,
            description_en,
            description_zh,
            fee_min,
            fee_max,
            nqs_rating,
            programs,
            staff_languages,
            age_groups,
            is_ccs_approved,
            is_founding_partner,
            subscription_status,
            center_photos (
              id,
              photo_url,
              display_order
            )
          `,
          )
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Sort photos by display_order for each center
        const processed = (data || []).map((center: CenterProfile) => ({
          ...center,
          center_photos: (center.center_photos || []).sort(
            (a: CenterPhoto, b: CenterPhoto) => a.display_order - b.display_order,
          ),
        }));

        setCenters(processed);
      } catch (err) {
        console.error("Failed to load centers:", err);
        setError("Failed to load centers. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchCenters();
  }, []);

  // Apply client-side filters
  const filteredCenters = useMemo(() => {
    let results = [...centers];

    // Suburb/postcode text search
    if (activeSearch.trim()) {
      const query = activeSearch.toLowerCase().trim();
      results = results.filter(
        (c) =>
          c.suburb?.toLowerCase().includes(query) ||
          c.postcode?.includes(query) ||
          c.center_name?.toLowerCase().includes(query),
      );
    }

    // Language filters
    if (languageFilters.length > 0) {
      results = results.filter((c) =>
        languageFilters.some((lang) =>
          c.staff_languages?.some(
            (sl) => sl.language.toLowerCase() === lang,
          ),
        ),
      );
    }

    // Age group filters
    if (ageGroupFilters.length > 0) {
      results = results.filter((c) =>
        ageGroupFilters.some((ag) => {
          if (!c.age_groups) return false;
          return c.age_groups.some((group) => {
            const name = group.group_name.toLowerCase();
            if (ag === "0-2")
              return (
                name.includes("nursery") ||
                name.includes("baby") ||
                name.includes("infant") ||
                name.includes("0-2")
              );
            if (ag === "2-3")
              return name.includes("toddler") || name.includes("2-3");
            if (ag === "3-5")
              return (
                name.includes("preschool") ||
                name.includes("kindy") ||
                name.includes("3-5") ||
                name.includes("pre-k")
              );
            return false;
          });
        }),
      );
    }

    // CCS approved filter
    if (ccsOnly) {
      results = results.filter((c) => c.is_ccs_approved);
    }

    // Sort
    if (sortBy === "newest") {
      // Already sorted by created_at desc from query
    }

    return results;
  }, [centers, activeSearch, languageFilters, ageGroupFilters, ccsOnly, sortBy]);

  // Whether we have a search active but no results
  const hasSearchNoResults =
    activeSearch.trim() !== "" && filteredCenters.length === 0;

  // Handle search
  const handleSearch = useCallback(() => {
    setActiveSearch(searchQuery);
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setLanguageFilters([]);
    setAgeGroupFilters([]);
    setCcsOnly(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page heading */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {t("search.title")}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {t("search.subtitle")}
        </p>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("search.searchPlaceholder")}
              className="w-full h-12 pl-10 pr-4 text-base border-2 border-gray-200 focus:border-blue-600 rounded-lg outline-none transition"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="h-12 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition min-w-[44px]"
          >
            {t("common.buttons.search")}
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 border rounded-md text-sm transition min-h-[44px]",
              activeFilterCount > 0
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-gray-300 text-gray-600 hover:bg-gray-50",
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t("search.filters.title")}
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none h-9 pl-3 pr-8 border border-gray-300 rounded-md text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="newest">{t("search.sort.newest")}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Result count */}
          {!loading && (
            <span className="text-sm text-gray-500 ml-auto">
              {t("search.results.showing", {
                count: filteredCenters.length,
              })}
              {activeSearch && (
                <>
                  {" "}
                  {t("search.results.nearLocation", {
                    location: activeSearch,
                  })}
                </>
              )}
            </span>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <>
            {/* Mobile overlay */}
            <div
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              onClick={() => setShowFilters(false)}
            />
            {/* Mobile slide-in */}
            <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl overflow-y-auto p-4 md:hidden">
              <FilterPanel
                languageFilters={languageFilters}
                setLanguageFilters={setLanguageFilters}
                ageGroupFilters={ageGroupFilters}
                setAgeGroupFilters={setAgeGroupFilters}
                ccsOnly={ccsOnly}
                setCcsOnly={setCcsOnly}
                onApply={() => setShowFilters(false)}
                onClear={clearFilters}
                onClose={() => setShowFilters(false)}
                t={t}
              />
            </div>
            {/* Desktop inline */}
            <div className="hidden md:block mb-6">
              <FilterPanel
                languageFilters={languageFilters}
                setLanguageFilters={setLanguageFilters}
                ageGroupFilters={ageGroupFilters}
                setAgeGroupFilters={setAgeGroupFilters}
                ccsOnly={ccsOnly}
                setCcsOnly={setCcsOnly}
                onApply={() => setShowFilters(false)}
                onClear={clearFilters}
                onClose={() => setShowFilters(false)}
                t={t}
              />
            </div>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results grid */}
        {!loading && !error && filteredCenters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCenters.map((center) => (
              <CenterCard
                key={center.id}
                center={center}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Empty state with search active */}
        {!loading && !error && hasSearchNoResults && (
          <div className="space-y-8">
            {/* Show nearest centers (all centers as fallback) */}
            {centers.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  {t("emptyState.nearestCentersTitle")}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {t("emptyState.nearestCentersMessage")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {centers.slice(0, 5).map((center) => (
                    <CenterCard
                      key={center.id}
                      center={center}
                      locale={locale}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Waitlist signup */}
            <WaitlistSignup suburb={activeSearch} t={t} locale={locale} />
          </div>
        )}

        {/* No centers at all in database */}
        {!loading && !error && centers.length === 0 && !activeSearch.trim() && (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              {t("emptyState.noCentersMessage")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("emptyState.growingMessage")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
