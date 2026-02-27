import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({ general: t("auth.signIn.error" as never) });
        setSubmitting(false);
        return;
      }

      // If there's a returnUrl, go there
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
        return;
      }

      // Fetch the profile to determine where to navigate
      // The AuthContext will also fetch it, but we need it now for routing
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role, onboarding_completed")
          .eq("id", user.id)
          .single();

        if (userProfile) {
          if (
            userProfile.role === "family" &&
            !userProfile.onboarding_completed
          ) {
            navigate("/family/profile", { replace: true });
          } else if (
            userProfile.role === "center" &&
            !userProfile.onboarding_completed
          ) {
            navigate("/center/profile", { replace: true });
          } else if (userProfile.role === "family") {
            navigate("/family/profile", { replace: true });
          } else if (userProfile.role === "center") {
            navigate("/center/dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else {
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      setErrors({ general: t("auth.signIn.error" as never) });
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

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {t("auth.signIn.title" as never)}
        </h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          {t("auth.signIn.subtitle" as never)}
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
              htmlFor="signin-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("auth.signIn.emailLabel" as never)}
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder={t("auth.signIn.emailPlaceholder" as never)}
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
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="signin-password"
                className="block text-sm font-medium text-gray-700"
              >
                {t("auth.signIn.passwordLabel" as never)}
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:underline"
              >
                {t("auth.signIn.forgotPassword" as never)}
              </Link>
            </div>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder={t("auth.signIn.passwordPlaceholder" as never)}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-md py-3 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("auth.signIn.submitButton" as never)
            )}
          </button>
        </form>

        {/* Bottom link */}
        <p className="text-sm text-center text-gray-500 mt-6">
          {t("auth.signIn.noAccount" as never)}{" "}
          <Link
            to="/signup"
            className="text-primary-600 hover:underline font-medium"
          >
            {t("auth.signIn.signUpLink" as never)}
          </Link>
        </p>
      </div>
    </div>
  );
}
