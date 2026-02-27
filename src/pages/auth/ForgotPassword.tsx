import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; general?: string }>(
    {},
  );

  function validate(): boolean {
    const next: typeof errors = {};

    if (!email.trim()) {
      next.email = t("auth.validation.emailRequired" as never);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = t("auth.validation.emailInvalid" as never);
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) {
        setErrors({ general: error.message });
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Logo */}
        <p className="text-center text-xl font-bold mb-6">
          <span className="text-primary-600">Little</span>
          <span className="text-amber-500">Bridge</span>
        </p>

        {/* Success state */}
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800">
              {t("auth.forgotPassword.title" as never)}
            </h1>

            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {t("auth.forgotPassword.success" as never)}
            </p>

            <Link
              to="/signin"
              className="inline-flex items-center gap-1 mt-6 text-sm text-primary-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("auth.forgotPassword.backToSignIn" as never)}
            </Link>
          </div>
        ) : (
          <>
            {/* Form state */}
            <h1 className="text-2xl font-bold text-center text-gray-800">
              {t("auth.forgotPassword.title" as never)}
            </h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              {t("auth.forgotPassword.subtitle" as never)}
            </p>

            {/* General error */}
            {errors.general && (
              <div className="mt-4 text-sm text-red-500 text-center bg-red-50 rounded-md p-3">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("auth.forgotPassword.emailLabel" as never)}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder={t(
                    "auth.forgotPassword.emailPlaceholder" as never,
                  )}
                  className={cn(
                    "w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors",
                    errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary-600 focus:ring-1 focus:ring-primary-600",
                  )}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-md py-3 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t("auth.forgotPassword.submitButton" as never)
                )}
              </button>
            </form>

            {/* Back to sign in */}
            <div className="mt-6 text-center">
              <Link
                to="/signin"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.forgotPassword.backToSignIn" as never)}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
