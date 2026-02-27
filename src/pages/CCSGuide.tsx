import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import {
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  Calculator,
} from "lucide-react";

// ---------------------------------------------------------------------------
// CCS Guide -- Child Care Subsidy explainer page
// ---------------------------------------------------------------------------

/** Accordion item for FAQ section */
function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition min-h-[44px]"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-800 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function CCSGuide() {
  const { t } = useTranslation();

  // FAQ accordion state — only one open at a time
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // Income bracket data
  const brackets = [
    {
      key: "bracket1" as const,
      income: t("ccs.incomeBrackets.bracket1.income"),
      subsidy: t("ccs.incomeBrackets.bracket1.subsidy"),
      example: t("ccs.incomeBrackets.bracket1.example"),
    },
    {
      key: "bracket2" as const,
      income: t("ccs.incomeBrackets.bracket2.income"),
      subsidy: t("ccs.incomeBrackets.bracket2.subsidy"),
      example: t("ccs.incomeBrackets.bracket2.example"),
    },
    {
      key: "bracket3" as const,
      income: t("ccs.incomeBrackets.bracket3.income"),
      subsidy: t("ccs.incomeBrackets.bracket3.subsidy"),
      example: t("ccs.incomeBrackets.bracket3.example"),
    },
    {
      key: "bracket4" as const,
      income: t("ccs.incomeBrackets.bracket4.income"),
      subsidy: t("ccs.incomeBrackets.bracket4.subsidy"),
      example: t("ccs.incomeBrackets.bracket4.example"),
    },
  ];

  // FAQ data
  const faqs = [
    {
      question: t("ccs.faq.q1.question"),
      answer: t("ccs.faq.q1.answer"),
    },
    {
      question: t("ccs.faq.q2.question"),
      answer: t("ccs.faq.q2.answer"),
    },
    {
      question: t("ccs.faq.q3.question"),
      answer: t("ccs.faq.q3.answer"),
    },
    {
      question: t("ccs.faq.q4.question"),
      answer: t("ccs.faq.q4.answer"),
    },
    {
      question: t("ccs.faq.q5.question"),
      answer: t("ccs.faq.q5.answer"),
    },
  ];

  return (
    <main className="bg-white">
      {/* ------------------------------------------------------------------ */}
      {/* Header / Hero                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 mb-6">
            <DollarSign className="w-7 h-7 text-primary-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {t("ccs.title")}
          </h1>

          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            {t("ccs.subtitle")}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* What is CCS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {t("ccs.howItWorks")}
          </h2>

          <p className="mt-4 text-gray-600 leading-relaxed">
            {t("ccs.whatIsCcs")}
          </p>

          <p className="mt-4 text-gray-600 leading-relaxed">
            {t("ccs.howItWorksDescription")}
          </p>

          {/* Key point callout */}
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-emerald-800 text-sm font-medium">
              {t("ccs.mostFamiliesSave")}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Income Bracket Table                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {t("ccs.incomeBrackets.title")}
          </h2>

          {/* Desktop table */}
          <div className="mt-8 hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary-600 text-white">
                  <th className="text-left py-3 px-4 rounded-tl-lg font-semibold text-sm">
                    Family Income
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">
                    Subsidy
                  </th>
                  <th className="text-center py-3 px-4 rounded-tr-lg font-semibold text-sm">
                    Approx. Daily Gap Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((b, i) => (
                  <tr
                    key={b.key}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-4 px-4 text-gray-800 text-sm font-medium">
                      {b.income}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {b.subsidy}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-emerald-600 font-semibold text-sm">
                      {b.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-8 md:hidden space-y-4">
            {brackets.map((b) => (
              <div
                key={b.key}
                className="border border-gray-200 rounded-lg p-5 bg-white"
              >
                <p className="font-semibold text-gray-800 text-sm">
                  {b.income}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {b.subsidy}
                  </span>
                  <span className="text-emerald-600 font-semibold text-sm">
                    {b.example}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <p className="mt-6 text-sm text-gray-500 text-center leading-relaxed max-w-xl mx-auto">
            These are approximate figures based on a $150/day fee. Your actual
            subsidy depends on your family income, activity level, and the
            center&apos;s fees.
          </p>

          {/* Link to calculator */}
          <div className="mt-6 text-center">
            <a
              href="https://www.servicesaustralia.gov.au/child-care-subsidy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              <Calculator className="w-4 h-4" />
              Use the official Services Australia calculator
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How to Apply                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800">
            How to Apply for CCS
          </h2>

          <div className="mt-8 space-y-6">
            {[
              {
                num: 1,
                title: "Create a MyGov account",
                desc: "Visit my.gov.au and create an account if you don't already have one. You'll need an email address and a form of ID.",
              },
              {
                num: 2,
                title: "Link to Centrelink",
                desc: "From your MyGov account, link to Centrelink. You'll need your tax file number (TFN) to complete this step.",
              },
              {
                num: 3,
                title: "Complete a Child Care Subsidy assessment",
                desc: "In your Centrelink account, complete the CCS assessment online. You'll provide income details and activity information (work, study, etc.).",
              },
              {
                num: 4,
                title: "Give your CRN to your childcare center",
                desc: "Once approved, provide your Customer Reference Number (CRN) and your child's CRN to the center. The subsidy will be applied directly to your fees.",
              },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Government link */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <a
              href="https://www.servicesaustralia.gov.au/child-care-subsidy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Visit the official government guide on Services Australia
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p className="mt-1 text-xs text-gray-500">
              Need help in Chinese? Call the Centrelink multilingual phone
              service: 131 202 and request Mandarin or Cantonese interpretation.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ Accordion                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {t("ccs.faq.title")}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === i}
                onToggle={() => toggleFaq(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-primary-600 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Ready to find a CCS-approved center?
            </h2>
            <p className="mt-3 text-white/90 max-w-lg mx-auto">
              All centers on LittleBridge are CCS-approved unless otherwise
              noted. Search for bilingual centers near you.
            </p>
            <Link
              to="/search"
              className="inline-flex items-center justify-center mt-8 bg-white text-primary-600 rounded-md px-8 py-3 font-semibold hover:bg-primary-50 transition min-h-[44px]"
            >
              Browse Centers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
