import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import {
  Check,
  Star,
  Shield,
  MessageSquare,
  Bell,
  Users,
  MapPin,
  DollarSign,
  ArrowRight,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CenterOnboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* ================================================================ */}
      {/* SECTION 1 -- Hero                                                 */}
      {/* ================================================================ */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 max-w-3xl mx-auto">
            Fill Your Vacancies with Families Who Want Bilingual Care
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            LittleBridge connects your center with Mandarin-speaking families
            actively searching for bilingual childcare in Sydney and Melbourne.
          </p>

          {/* Three key numbers */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">200+</div>
              <div className="text-sm text-gray-500 mt-1">
                Families searching for bilingual care
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">30+</div>
              <div className="text-sm text-gray-500 mt-1">
                Suburbs covered in Sydney & Melbourne
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">$99/mo</div>
              <div className="text-sm text-gray-500 mt-1">
                Flat rate, cancel anytime
              </div>
            </div>
          </div>

          <Link
            to="/signup?role=center"
            className="mt-10 inline-flex items-center gap-2 bg-blue-600 text-white text-lg font-semibold rounded-md px-8 py-4 hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            Start Your 30-Day Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 2 -- What You Get                                         */}
      {/* ================================================================ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 text-center">
            Everything included
          </h2>

          <div className="mt-8 space-y-4">
            {[
              {
                icon: Users,
                text: "Bilingual center profile (English + Chinese)",
              },
              {
                icon: MessageSquare,
                text: "Unlimited family enquiries with contact details",
              },
              {
                icon: Zap,
                text: "AI translation -- enquiries arrive in English regardless of what language the family writes",
              },
              {
                icon: Bell,
                text: "SMS + email notifications when new enquiries arrive",
              },
              {
                icon: Shield,
                text: "Enquiry management dashboard",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 py-2"
              >
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 3 -- ROI Comparison                                       */}
      {/* ================================================================ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-8">
            The value is clear
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <h3 className="font-semibold text-red-800 mb-3">
                Without LittleBridge
              </h3>
              <ul className="space-y-2 text-sm text-red-700">
                <li className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  $40-80 per Google Ad lead
                </li>
                <li className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  $3,000-5,000 per agency educator placement
                </li>
                <li className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  No way to reach Chinese-speaking families
                </li>
              </ul>
            </div>

            {/* With */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <h3 className="font-semibold text-emerald-800 mb-3">
                With LittleBridge
              </h3>
              <ul className="space-y-2 text-sm text-emerald-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  $99/month flat
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Unlimited family leads
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  AI-powered translation included
                </li>
              </ul>
            </div>
          </div>

          <p className="text-lg font-semibold text-gray-800 text-center mt-8">
            Each enrolled family = $15,000-25,000/year in revenue
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 4 -- Founding Partner Offer                               */}
      {/* ================================================================ */}
      <section id="founding" className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-8 text-center">
            <span className="inline-block bg-amber-100 text-amber-800 rounded-full px-4 py-1 text-sm font-semibold mb-4">
              Limited -- First 10 Centers
            </span>

            <h2 className="text-2xl font-bold text-gray-800">
              Founding Partner Offer
            </h2>

            <p className="mt-3 text-gray-600">
              3 months completely free. We'll personally ensure you receive at
              least 5 qualified enquiries, or we extend the free period.
            </p>

            <p className="mt-4 text-lg font-bold text-amber-700">
              7 of 10 spots remaining
            </p>

            <Link
              to="/signup?role=center"
              className="mt-6 inline-flex items-center gap-2 bg-amber-500 text-white font-semibold rounded-md px-6 py-3 hover:bg-amber-600 transition-colors min-h-[44px]"
            >
              <Star className="w-4 h-4" />
              Claim Your Spot
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 5 -- Pricing                                              */}
      {/* ================================================================ */}
      <section id="pricing" className="py-16 px-4 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="bg-white border-2 border-blue-600 rounded-xl p-8 shadow-lg text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-gray-900">$99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <span className="text-xs text-gray-400">(incl. GST)</span>

            <div className="mt-3">
              <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-medium">
                30-day free trial
              </span>
            </div>

            <ul className="mt-6 space-y-3 text-left">
              {[
                "Bilingual center profile",
                "Unlimited family enquiries",
                "AI-powered message translation",
                "SMS + email notifications",
                "Enquiry management dashboard",
                "Up to 5 job listings",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to="/signup?role=center"
              className="mt-8 block w-full bg-blue-600 text-white text-lg font-semibold rounded-md py-3 hover:bg-blue-700 transition-colors min-h-[44px] text-center"
            >
              Start Free Trial
            </Link>

            <p className="text-xs text-gray-400 mt-2">
              No lock-in. Cancel anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
