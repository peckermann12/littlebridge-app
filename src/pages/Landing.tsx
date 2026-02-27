import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import {
  Search,
  Heart,
  MessageCircle,
  CheckCircle,
  Star,
  ArrowRight,
  Users,
  Building2,
  GraduationCap,
  Shield,
  MapPin,
  ImageIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export default function Landing() {
  const { t } = useTranslation();

  return (
    <main className="overscroll-none">
      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1 -- Hero                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Left -- Copy */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 leading-tight max-w-2xl">
                {t("landing.hero.titleLine1")}
                <br />
                <span className="text-primary-600">
                  {t("landing.hero.titleLine2")}
                </span>
              </h1>

              <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto md:mx-0">
                {t("landing.hero.subtitle")}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  to="/search"
                  className="inline-flex items-center justify-center bg-primary-600 text-white rounded-md px-6 py-3 text-lg font-medium hover:bg-primary-700 transition min-h-[44px]"
                >
                  <Search className="w-5 h-5 mr-2" />
                  {t("landing.hero.ctaFamily")}
                </Link>
                <Link
                  to="/educators/signup"
                  className="inline-flex items-center justify-center border border-primary-600 text-primary-600 rounded-md px-6 py-3 text-lg font-medium hover:bg-primary-50 transition min-h-[44px]"
                >
                  {t("landing.hero.ctaEducator")}
                </Link>
              </div>

              {/* Trust line */}
              <p className="mt-6 text-sm text-gray-500">
                <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                {t("landing.hero.trustedBy")}
              </p>
            </div>

            {/* Right -- Placeholder hero image */}
            <div className="flex-1 hidden md:block">
              <div className="rounded-2xl bg-primary-100 h-64 md:h-80 w-full max-w-md mx-auto flex flex-col items-center justify-center text-primary-600/60">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">Family photo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2 -- Value Props (3 cards)                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              {t("landing.valueProp.title")}
            </h2>
            <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
              {t("landing.valueProp.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 -- Find bilingual programs */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {t("landing.valueProp.card1.title")}
              </h3>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                {t("landing.valueProp.card1.description")}
              </p>
              <Link
                to="/search"
                className="inline-flex items-center mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {t("landing.hero.ctaFamily")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Card 2 -- Cultural connection */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-lg bg-accent-50 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {t("landing.valueProp.card2.title")}
              </h3>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                {t("landing.valueProp.card2.description")}
              </p>
              <Link
                to="/about"
                className="inline-flex items-center mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {t("common.buttons.learnMore")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Card 3 -- Communication */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {t("landing.valueProp.card3.title")}
              </h3>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                {t("landing.valueProp.card3.description")}
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {t("common.buttons.getStarted")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3 -- For Families / For Educators / For Centers            */}
      {/* ------------------------------------------------------------------ */}

      {/* For Families */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Placeholder image */}
            <div className="flex-1 order-2 md:order-1">
              <div className="rounded-2xl bg-primary-100 h-56 md:h-72 w-full max-w-md mx-auto flex flex-col items-center justify-center text-primary-600/60">
                <Users className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">Family illustration</span>
              </div>
            </div>

            {/* Copy */}
            <div className="flex-1 order-1 md:order-2">
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                {t("landing.forFamilies.sectionTitle")}
              </span>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-gray-800">
                {t("landing.forFamilies.title")}
              </h2>
              <p className="mt-3 text-gray-500 leading-relaxed">
                {t("landing.forFamilies.description")}
              </p>
              <ul className="mt-6 space-y-3">
                {(
                  [
                    "landing.forFamilies.benefit1",
                    "landing.forFamilies.benefit2",
                    "landing.forFamilies.benefit3",
                    "landing.forFamilies.benefit4",
                  ] as const
                ).map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 text-sm">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/search"
                className="inline-flex items-center mt-8 bg-primary-600 text-white rounded-md px-6 py-3 font-medium hover:bg-primary-700 transition min-h-[44px]"
              >
                {t("landing.forFamilies.cta")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Educators */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Copy */}
            <div className="flex-1">
              <span className="text-sm font-semibold text-accent-500 uppercase tracking-wide">
                {t("landing.forEducators.sectionTitle")}
              </span>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-gray-800">
                {t("landing.forEducators.title")}
              </h2>
              <p className="mt-3 text-gray-500 leading-relaxed">
                {t("landing.forEducators.description")}
              </p>
              <ul className="mt-6 space-y-3">
                {(
                  [
                    "landing.forEducators.benefit1",
                    "landing.forEducators.benefit2",
                    "landing.forEducators.benefit3",
                    "landing.forEducators.benefit4",
                  ] as const
                ).map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 text-sm">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/educators/signup"
                className="inline-flex items-center mt-8 bg-primary-600 text-white rounded-md px-6 py-3 font-medium hover:bg-primary-700 transition min-h-[44px]"
              >
                {t("landing.forEducators.cta")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* Placeholder image */}
            <div className="flex-1">
              <div className="rounded-2xl bg-accent-100 h-56 md:h-72 w-full max-w-md mx-auto flex flex-col items-center justify-center text-accent-500/60">
                <GraduationCap className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">Educator illustration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Centers */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Placeholder image */}
            <div className="flex-1 order-2 md:order-1">
              <div className="rounded-2xl bg-emerald-100 h-56 md:h-72 w-full max-w-md mx-auto flex flex-col items-center justify-center text-emerald-500/60">
                <Building2 className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">Center illustration</span>
              </div>
            </div>

            {/* Copy */}
            <div className="flex-1 order-1 md:order-2">
              <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                {t("landing.forCenters.sectionTitle")}
              </span>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-gray-800">
                {t("landing.forCenters.title")}
              </h2>
              <p className="mt-3 text-gray-500 leading-relaxed">
                {t("landing.forCenters.description")}
              </p>
              <ul className="mt-6 space-y-3">
                {(
                  [
                    "landing.forCenters.benefit1",
                    "landing.forCenters.benefit2",
                    "landing.forCenters.benefit3",
                    "landing.forCenters.benefit4",
                  ] as const
                ).map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 text-sm">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  to="/center/onboard"
                  className="inline-flex items-center bg-primary-600 text-white rounded-md px-6 py-3 font-medium hover:bg-primary-700 transition min-h-[44px]"
                >
                  {t("landing.forCenters.cta")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <span className="text-sm text-gray-500">
                  {t("landing.forCenters.pricing")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4 -- How It Works                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
            {t("landing.howItWorks.title")}
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-6 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-0.5 border-t-2 border-dashed border-gray-300" />

            {(
              [
                {
                  key: "landing.howItWorks.family.step1",
                  num: 1,
                },
                {
                  key: "landing.howItWorks.family.step2",
                  num: 2,
                },
                {
                  key: "landing.howItWorks.family.step3",
                  num: 3,
                },
                {
                  key: "landing.howItWorks.family.step4",
                  num: 4,
                },
              ] as const
            ).map(({ key, num }) => (
              <div key={key} className="flex flex-col items-center text-center relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  {num}
                </div>
                <h3 className="mt-4 font-semibold text-gray-800">
                  {t(`${key}.title` as any)}
                </h3>
                <p className="mt-2 text-sm text-gray-500 max-w-[220px]">
                  {t(`${key}.description` as any)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5 -- Testimonials                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-12">
            {t("landing.socialProof.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(
              [
                {
                  quoteKey: "landing.socialProof.testimonial1.quote",
                  authorKey: "landing.socialProof.testimonial1.author",
                  roleKey: "landing.socialProof.testimonial1.role",
                },
                {
                  quoteKey: "landing.socialProof.testimonial2.quote",
                  authorKey: "landing.socialProof.testimonial2.author",
                  roleKey: "landing.socialProof.testimonial2.role",
                },
                {
                  quoteKey: "landing.socialProof.testimonial3.quote",
                  authorKey: "landing.socialProof.testimonial3.author",
                  roleKey: "landing.socialProof.testimonial3.role",
                },
              ] as const
            ).map(({ quoteKey, authorKey, roleKey }, i) => (
              <div
                key={quoteKey}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className="w-4 h-4 fill-amber-500 text-amber-500"
                    />
                  ))}
                </div>

                <blockquote className="text-gray-700 text-sm leading-relaxed italic">
                  &ldquo;{t(quoteKey)}&rdquo;
                </blockquote>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">
                    {t(authorKey)}
                  </p>
                  <p className="text-xs text-gray-500">{t(roleKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 6 -- CTA Banner                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-primary-600 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {t("landing.cta.title")}
          </h2>
          <p className="mt-3 text-lg text-white/90 max-w-2xl mx-auto">
            {t("landing.cta.subtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="inline-flex items-center justify-center bg-white text-primary-600 rounded-md px-6 py-3 font-semibold hover:bg-primary-50 transition min-h-[44px]"
            >
              {t("landing.cta.familyButton")}
            </Link>
            <Link
              to="/center/onboard"
              className="inline-flex items-center justify-center border-2 border-white text-white rounded-md px-6 py-3 font-semibold hover:bg-white/10 transition min-h-[44px]"
            >
              {t("landing.cta.centerButton")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
