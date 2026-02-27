import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { isDemoMode } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};

    if (!newPassword) {
      next.newPassword = t("auth.validation.newPasswordRequired" as never);
    } else if (newPassword.length < 8) {
      next.newPassword = t("auth.validation.passwordMin" as never);
    }

    if (!confirmPassword) {
      next.confirmPassword = t(
        "auth.validation.confirmPasswordRequired" as never,
      );
    } else if (newPassword !== confirmPassword) {
      next.confirmPassword = t("auth.validation.passwordMismatch" as never);
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
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 600));
      } else {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password: newPassword }),
        });
        if (!res.ok) {
          const data = await res.json();
          setErrors({ general: data.error || "Reset failed" });
          setSubmitting(false);
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/signin", { replace: true });
      }, 2000);
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
        {success ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800">
              {t("auth.forgotPassword.resetTitle" as never)}
            </h1>

            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {t("auth.forgotPassword.resetSuccess" as never)}
            </p>
          </div>
        ) : (
          <>
            {/* Form state */}
            <h1 className="text-2xl font-bold text-center text-gray-800">
              {t("auth.forgotPassword.resetTitle" as never)}
            </h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              {t("auth.forgotPassword.resetSubtitle" as never)}
            </p>

            {/* General error */}
            {errors.general && (
              <div className="mt-4 text-sm text-red-500 text-center bg-red-50 rounded-md p-3">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* New Password */}
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("auth.forgotPassword.newPasswordLabel" as never)}
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword)
                      setErrors((prev) => ({
                        ...prev,
                        newPassword: undefined,
                      }));
                  }}
                  placeholder={t(
                    "auth.forgotPassword.newPasswordPlaceholder" as never,
                  )}
                  className={cn(
                    "w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors",
                    errors.newPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary-600 focus:ring-1 focus:ring-primary-600",
                  )}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("auth.forgotPassword.confirmNewPasswordLabel" as never)}
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                  }}
                  placeholder={t(
                    "auth.forgotPassword.newPasswordPlaceholder" as never,
                  )}
                  className={cn(
                    "w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors",
                    errors.confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary-600 focus:ring-1 focus:ring-primary-600",
                  )}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
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
                  t("auth.forgotPassword.resetButton" as never)
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
