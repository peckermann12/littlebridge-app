import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Users, Building2, ArrowLeft, Loader2 } from "lucide-react";

type Role = "family" | "center";

export default function SignUp() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedRole = searchParams.get("role") as Role | null;
  const returnUrl = searchParams.get("returnUrl");

  // Step 1: role selection, Step 2: registration form
  const [step, setStep] = useState<1 | 2>(preselectedRole ? 2 : 1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(
    preselectedRole === "family" || preselectedRole === "center"
      ? preselectedRole
      : null,
  );

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};

    if (!email.trim()) {
      next.email = t("auth.validation.emailRequired" as never);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = t("auth.validation.emailInvalid" as never);
    }

    if (!password) {
      next.password = t("auth.validation.passwordRequired" as never);
    } else if (password.length < 8) {
      next.password = t("auth.validation.passwordMin" as never);
    }

    if (!confirmPassword) {
      next.confirmPassword = t(
        "auth.validation.confirmPasswordRequired" as never,
      );
    } else if (password !== confirmPassword) {
      next.confirmPassword = t("auth.validation.passwordMismatch" as never);
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !selectedRole) return;

    setSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: selectedRole },
        },
      });

      if (error) {
        setErrors({ general: error.message });
        setSubmitting(false);
        return;
      }

      // Insert into profiles table
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          role: selectedRole,
          email,
          preferred_language: locale,
        });

        if (profileError) {
          // Profile might already exist via a database trigger -- not fatal
          console.warn("Profile insert warning:", profileError.message);
        }
      }

      // Navigate to verify-email page
      navigate("/verify-email", { state: { email } });
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const roles: { value: Role; icon: typeof Users; titleKey: string; descKey: string }[] = [
    {
      value: "family",
      icon: Users,
      titleKey: "auth.roleSelection.family.title",
      descKey: "auth.signUp.familyDesc",
    },
    {
      value: "center",
      icon: Building2,
      titleKey: "auth.roleSelection.center.title",
      descKey: "auth.signUp.centerDesc",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Logo */}
        <p className="text-center text-xl font-bold mb-6">
          <span className="text-primary-600">Little</span>
          <span className="text-amber-500">Bridge</span>
        </p>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {step === 1
            ? t("auth.roleSelection.title" as never)
            : t("auth.signUp.title" as never)}
        </h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          {step === 1
            ? t("auth.roleSelection.subtitle" as never)
            : t("auth.signUp.subtitle" as never)}
        </p>

        {/* General error */}
        {errors.general && (
          <div className="mt-4 text-sm text-red-500 text-center bg-red-50 rounded-md p-3">
            {errors.general}
          </div>
        )}

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div className="mt-6 space-y-3">
            {roles.map(({ value, icon: Icon, titleKey, descKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRole(value)}
                className={cn(
                  "w-full flex items-start gap-4 border rounded-md p-4 text-left transition-colors min-h-[44px]",
                  selectedRole === value
                    ? "border-primary-600 bg-blue-50 ring-2 ring-primary-600"
                    : "border-gray-200 hover:border-gray-300",
                )}
              >
                {/* Radio indicator */}
                <span
                  className={cn(
                    "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    selectedRole === value
                      ? "border-primary-600"
                      : "border-gray-300",
                  )}
                >
                  {selectedRole === value && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                  )}
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800">
                      {t(titleKey as never)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {t(descKey as never)}
                  </p>
                </div>
              </button>
            ))}

            <button
              type="button"
              disabled={!selectedRole}
              onClick={() => setStep(2)}
              className={cn(
                "w-full py-3 rounded-md font-medium text-white transition-colors min-h-[44px]",
                selectedRole
                  ? "bg-primary-600 hover:bg-primary-700"
                  : "bg-gray-300 cursor-not-allowed",
              )}
            >
              {t("auth.roleSelection.continueButton" as never, {
                role: selectedRole
                  ? t(`auth.roleSelection.${selectedRole}.title` as never)
                  : "",
              })}
            </button>
          </div>
        )}

        {/* Step 2: Registration form */}
        {step === 2 && (
          <>
            {/* Back button */}
            {!preselectedRole && (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrors({});
                }}
                className="mt-4 flex items-center gap-1 text-sm text-primary-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.signUp.back" as never)}
              </button>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("auth.signUp.emailLabel" as never)}
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder={t("auth.signUp.emailPlaceholder" as never)}
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

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("auth.signUp.passwordLabel" as never)}
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder={t("auth.signUp.passwordPlaceholder" as never)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors",
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary-600 focus:ring-1 focus:ring-primary-600",
                  )}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("auth.signUp.confirmPasswordLabel" as never)}
                </label>
                <input
                  id="signup-confirm-password"
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
                    "auth.signUp.confirmPasswordPlaceholder" as never,
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
                  t("auth.signUp.submitButton" as never)
                )}
              </button>
            </form>
          </>
        )}

        {/* Bottom links */}
        <p className="text-sm text-center text-gray-500 mt-6">
          {t("auth.signUp.hasAccount" as never)}{" "}
          <Link
            to="/signin"
            className="text-primary-600 hover:underline font-medium"
          >
            {t("auth.signUp.signInLink" as never)}
          </Link>
        </p>

        <p className="text-xs text-center text-gray-400 mt-4">
          {t("auth.signUp.guestNote" as never)}
        </p>
      </div>
    </div>
  );
}
