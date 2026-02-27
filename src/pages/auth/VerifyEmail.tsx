import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Mail, Loader2 } from "lucide-react";

const COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const { t } = useTranslation();
  const location = useLocation();

  // Email passed from signup via navigation state
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resending || !email) return;

    setResending(true);
    setResent(false);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (!error) {
        setResent(true);
        setCooldown(COOLDOWN_SECONDS);
      }
    } catch {
      // Silently fail -- the user can try again
    } finally {
      setResending(false);
    }
  }, [cooldown, resending, email]);

  return (
    <div className="bg-gray-50 min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        {/* Logo */}
        <p className="text-xl font-bold mb-6">
          <span className="text-primary-600">Little</span>
          <span className="text-amber-500">Bridge</span>
        </p>

        {/* Mail icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-800">
          {t("auth.verification.title" as never)}
        </h1>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
          {t("auth.verification.message" as never, {
            email: email || "your email",
          })}
        </p>

        {/* Resent confirmation */}
        {resent && (
          <p className="text-sm text-emerald-600 mt-4">
            {t("auth.verification.resendSuccess" as never)}
          </p>
        )}

        {/* Resend button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || !email}
          className={cn(
            "mt-6 w-full py-3 rounded-md font-medium transition-colors min-h-[44px] flex items-center justify-center",
            cooldown > 0 || !email
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700 text-white",
          )}
        >
          {resending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : cooldown > 0 ? (
            t("auth.verification.resendCooldown" as never, {
              seconds: cooldown,
            })
          ) : (
            t("auth.verification.resend" as never)
          )}
        </button>

        {/* Back to sign in */}
        <Link
          to="/signin"
          className="inline-block mt-6 text-sm text-primary-600 hover:underline"
        >
          {t("auth.verification.backToSignIn" as never)}
        </Link>
      </div>
    </div>
  );
}
