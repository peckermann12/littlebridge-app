import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import {
  Heart,
  Globe,
  Shield,
  CheckCircle,
  Mail,
  ArrowRight,
  ImageIcon,
  MessageCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// About Page -- June's founder story & trust signals
// ---------------------------------------------------------------------------

export default function About() {
  const { t } = useTranslation();

  return (
    <main className="bg-white">
      {/* ------------------------------------------------------------------ */}
      {/* Hero -- June's story                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          {/* Founder photo placeholder */}
          <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto border-4 border-white shadow-lg flex items-center justify-center text-gray-400">
            <ImageIcon className="w-10 h-10" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mt-6">
            {t("about.title")}
          </h1>

          <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-700 mt-4">
            {t("about.founderStory.title")}
          </h2>

          {/* Founder story -- 3 paragraphs */}
          <div className="mt-8 space-y-5 text-lg text-gray-600 leading-relaxed">
            <p>{t("about.founderStory.paragraph1")}</p>
            <p>{t("about.founderStory.paragraph2")}</p>
            <p>{t("about.founderStory.paragraph3")}</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Mission Statement                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            {t("about.mission.title")}
          </h2>

          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            {t("about.mission.statement")}
          </p>

          {/* Three value cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition">
              <Heart className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-gray-800">
                Every family deserves to be understood
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Your child should feel safe, heard, and at home from the very
                first day of care.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition">
              <Globe className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-gray-800">
                Language should never be a barrier
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Whether it is you, your parents, or your in-laws doing drop-off,
                everyone should be able to communicate with the staff.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition">
              <Shield className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-gray-800">
                Your data, your control
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Australian-owned, Australian privacy law, and your information is
                only ever shared with centers you choose to contact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Trust Signals                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
            {t("about.trust.title")}
          </h2>

          <ul className="mt-8 space-y-4 max-w-xl mx-auto">
            {(
              [
                "about.trust.signal1",
                "about.trust.signal2",
                "about.trust.signal3",
                "about.trust.signal4",
                "about.trust.signal5",
              ] as const
            ).map((key) => (
              <li key={key} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-gray-700">{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Team                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10">
            Meet the Team
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-lg mx-auto">
            {/* June */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-800">June</h3>
              <p className="text-sm text-gray-500">
                Co-founder &middot; Early Childhood Educator
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Chinese-Australian mum. 10+ years in childcare.
              </p>
            </div>

            {/* Peter */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-800">Peter</h3>
              <p className="text-sm text-gray-500">
                Co-founder &middot; Technology
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Building the platform families deserve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Contact                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Questions? Reach out to June directly.
          </h2>

          <a
            href="mailto:hello@littlebridge.com.au"
            className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            <Mail className="w-5 h-5" />
            hello@littlebridge.com.au
          </a>

          {/* WeChat QR placeholder */}
          <div className="mt-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 mx-auto flex flex-col items-center justify-center text-gray-400">
              <MessageCircle className="w-8 h-8 mb-1" />
              <span className="text-xs">WeChat QR</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Scan to add on WeChat
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {t("landing.cta.title")}
          </h2>
          <p className="mt-3 text-lg text-white/90">
            {t("landing.cta.subtitle")}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center justify-center mt-8 bg-white text-primary-600 rounded-md px-8 py-3 font-semibold hover:bg-primary-50 transition min-h-[44px]"
          >
            {t("landing.hero.ctaFamily")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </main>
  );
}
