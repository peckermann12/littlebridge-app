import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import type { TranslationKey } from "@/i18n";

// ---------------------------------------------------------------------------
// Language Toggle (shared between desktop & mobile)
// ---------------------------------------------------------------------------

function LanguageButtons({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale } = useTranslation();

  const baseClasses =
    "min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";

  const activeLight = "bg-primary-600 text-white";
  const inactiveLight = "bg-gray-100 text-gray-600 hover:bg-gray-200";
  const activeDark = "bg-white text-gray-900";
  const inactiveDark = "bg-gray-700 text-gray-300 hover:bg-gray-600";

  const active = variant === "light" ? activeLight : activeDark;
  const inactive = variant === "light" ? inactiveLight : inactiveDark;

  return (
    <div className="flex gap-1" role="group" aria-label="Language selection">
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={cn(baseClasses, locale === "en" ? active : inactive)}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("zh")}
        className={cn(baseClasses, locale === "zh" ? active : inactive)}
        aria-pressed={locale === "zh"}
      >
        中文
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User dropdown (desktop)
// ---------------------------------------------------------------------------

function UserDropdown() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = profile?.email?.charAt(0).toUpperCase() ?? "U";

  function profileLink(): string {
    switch (profile?.role) {
      case "family":
        return "/family/profile";
      case "center":
        return "/center/profile";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  }

  function dashboardLink(): string {
    switch (profile?.role) {
      case "center":
        return "/center/dashboard";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("common.nav.profile" as TranslationKey)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
          {initials}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <Link
            to={profileLink()}
            onClick={() => setOpen(false)}
            className="block min-h-[44px] px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            {t("common.nav.profile" as TranslationKey)}
          </Link>

          {profile?.role === "family" && (
            <Link
              to="/family/enquiries"
              onClick={() => setOpen(false)}
              className="block min-h-[44px] px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              {t("common.nav.myEnquiries" as TranslationKey)}
            </Link>
          )}

          {(profile?.role === "center" || profile?.role === "admin") && (
            <Link
              to={dashboardLink()}
              onClick={() => setOpen(false)}
              className="block min-h-[44px] px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              {t("common.nav.dashboard" as TranslationKey)}
            </Link>
          )}

          <div className="my-1 border-t border-gray-200" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut().then(() => navigate("/"));
            }}
            className="block w-full min-h-[44px] px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            {t("common.nav.signOut" as TranslationKey)}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile sidebar
// ---------------------------------------------------------------------------

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Prevent body scroll while sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function profileLink(): string {
    switch (profile?.role) {
      case "family":
        return "/family/profile";
      case "center":
        return "/center/profile";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  }

  const linkClasses =
    "block min-h-[44px] px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 flex items-center";

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t("common.nav.menu" as TranslationKey)}
      >
        {/* Close button */}
        <div className="flex items-center justify-end p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            aria-label={t("common.buttons.close" as TranslationKey)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col">
          <Link to="/search" onClick={onClose} className={linkClasses}>
            {t("common.nav.findCenters" as TranslationKey)}
          </Link>
          <Link to="/educators/signup" onClick={onClose} className={linkClasses}>
            {t("common.nav.forEducators" as TranslationKey)}
          </Link>
          <Link to="/center/onboard" onClick={onClose} className={linkClasses}>
            {t("common.nav.forCenters" as TranslationKey)}
          </Link>
          <Link to="/about" onClick={onClose} className={linkClasses}>
            {t("common.nav.about" as TranslationKey)}
          </Link>

          <div className="my-2 border-t border-gray-200" />

          {user && profile ? (
            <>
              <Link to={profileLink()} onClick={onClose} className={linkClasses}>
                {t("common.nav.profile" as TranslationKey)}
              </Link>

              {profile.role === "family" && (
                <Link
                  to="/family/enquiries"
                  onClick={onClose}
                  className={linkClasses}
                >
                  {t("common.nav.myEnquiries" as TranslationKey)}
                </Link>
              )}

              {(profile.role === "center" || profile.role === "admin") && (
                <Link
                  to={
                    profile.role === "center"
                      ? "/center/dashboard"
                      : "/admin"
                  }
                  onClick={onClose}
                  className={linkClasses}
                >
                  {t("common.nav.dashboard" as TranslationKey)}
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  signOut().then(() => navigate("/"));
                }}
                className={cn(linkClasses, "text-left")}
              >
                {t("common.nav.signOut" as TranslationKey)}
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" onClick={onClose} className={linkClasses}>
                {t("common.nav.signIn" as TranslationKey)}
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className={cn(
                  linkClasses,
                  "mx-4 mt-2 justify-center rounded-md bg-primary-600 text-white hover:bg-primary-700 hover:text-white",
                )}
              >
                {t("common.nav.signUp" as TranslationKey)}
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Header (exported)
// ---------------------------------------------------------------------------

export default function Header() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* ---- Logo ---- */}
        <Link
          to="/"
          className="flex min-h-[44px] items-center text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:rounded-md"
          aria-label={t("common.appName" as TranslationKey)}
        >
          <span className="text-primary-600">Little</span>
          <span className="text-accent-500">Bridge</span>
        </Link>

        {/* ---- Desktop nav (hidden below md) ---- */}
        <nav className="hidden md:flex md:items-center md:gap-6" aria-label="Main navigation">
          <Link
            to="/search"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
          >
            {t("common.nav.findCenters" as TranslationKey)}
          </Link>
          <Link
            to="/educators/signup"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
          >
            {t("common.nav.forEducators" as TranslationKey)}
          </Link>
          <Link
            to="/center/onboard"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
          >
            {t("common.nav.forCenters" as TranslationKey)}
          </Link>
        </nav>

        {/* ---- Right side ---- */}
        <div className="flex items-center gap-2">
          {/* Language toggle (always visible) */}
          <LanguageButtons variant="light" />

          {/* Auth controls (desktop only) */}
          <div className="hidden md:flex md:items-center md:gap-2">
            {!loading && !user && (
              <>
                <Link
                  to="/signin"
                  className="min-h-[44px] flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                >
                  {t("common.nav.signIn" as TranslationKey)}
                </Link>
                <Link
                  to="/signup"
                  className="min-h-[44px] flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                >
                  {t("common.nav.signUp" as TranslationKey)}
                </Link>
              </>
            )}
            {!loading && user && <UserDropdown />}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 md:hidden"
            aria-label={t("common.nav.menu" as TranslationKey)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
