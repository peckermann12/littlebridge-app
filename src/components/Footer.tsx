import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";

import type { TranslationKey } from "@/i18n";

export default function Footer() {
  const { t, locale, setLocale } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* ---- Column 1: Brand ---- */}
          <div>
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:rounded-md"
              aria-label={t("common.appName" as TranslationKey)}
            >
              <span className="text-white">Little</span>
              <span className="text-accent-500">Bridge</span>
            </Link>
            <p className="mt-2 text-sm text-gray-400">
              {t("common.footer.tagline" as TranslationKey)}
            </p>

            {/* Language toggle (dark variant) */}
            <div className="mt-4 flex gap-1" role="group" aria-label="Language selection">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={
                  "min-h-[44px] min-w-[44px] rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
                  (locale === "en"
                    ? "bg-white text-gray-900"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600")
                }
                aria-pressed={locale === "en"}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("zh")}
                className={
                  "min-h-[44px] min-w-[44px] rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
                  (locale === "zh"
                    ? "bg-white text-gray-900"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600")
                }
                aria-pressed={locale === "zh"}
              >
                中文
              </button>
            </div>
          </div>

          {/* ---- Column 2: For Families ---- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              {t("common.footer.families.heading" as TranslationKey)}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/search"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.families.search" as TranslationKey)}
                </Link>
              </li>
              <li>
                <Link
                  to="/ccs-guide"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.families.ccsGuide" as TranslationKey)}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.families.about" as TranslationKey)}
                </Link>
              </li>
            </ul>
          </div>

          {/* ---- Column 3: For Educators ---- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              {t("common.footer.educators.heading" as TranslationKey)}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/jobs"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.educators.findJobs" as TranslationKey)}
                </Link>
              </li>
              <li>
                <Link
                  to="/educators/signup"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.educators.signup" as TranslationKey)}
                </Link>
              </li>
            </ul>
          </div>

          {/* ---- Column 4: For Centers ---- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              {t("common.footer.centers.heading" as TranslationKey)}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/center/onboard"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.centers.listCenter" as TranslationKey)}
                </Link>
              </li>
              <li>
                <Link
                  to="/center/onboard#pricing"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.centers.pricing" as TranslationKey)}
                </Link>
              </li>
              <li>
                <Link
                  to="/signin"
                  className="min-h-[44px] inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t("common.footer.centers.login" as TranslationKey)}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ---- Bottom bar ---- */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-700 pt-8 sm:flex-row">
          <p className="text-sm text-gray-500">
            {t("common.footer.copyright" as TranslationKey, { year })}
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {t("common.footer.privacyPolicy" as TranslationKey)}
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {t("common.footer.termsOfService" as TranslationKey)}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
