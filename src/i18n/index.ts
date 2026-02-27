/**
 * LittleBridge i18n — Internationalization Provider
 *
 * Provides bilingual (EN/ZH) support with:
 * - Browser language auto-detection (Accept-Language)
 * - Manual toggle persisted to localStorage + Supabase user profile
 * - useTranslation() hook for accessing translations
 * - <Trans> component for string interpolation
 * - Type-safe translation keys
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

import en from "./en.json";
import zh from "./zh.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported locales */
export type Locale = "en" | "zh";

/** Default locale when detection fails */
const DEFAULT_LOCALE: Locale = "en";

/** localStorage key for persisted language preference */
const STORAGE_KEY = "littlebridge_locale";

/**
 * Recursively build a union of dot-separated paths for every leaf value in T.
 *
 * Example:
 *   { a: { b: "hello" } }  =>  "a.b"
 */
type DotPaths<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: DotPaths<
        T[K],
        Prefix extends "" ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

/** All valid translation keys derived from en.json */
export type TranslationKey = DotPaths<typeof en>;

/** The shape of a single locale's translation file */
export type Translations = typeof en;

// ---------------------------------------------------------------------------
// Translation map
// ---------------------------------------------------------------------------

const translations: Record<Locale, Translations> = { en, zh };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Walk a nested object by a dot-separated path.
 * Returns the leaf string or the path itself as a fallback.
 */
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : path;
}

/**
 * Replace `{variable}` placeholders in a string with values from `vars`.
 *
 * Also handles a minimal `{count, plural, one {...} other {...}}` syntax so
 * the English file can express basic plurals without a heavy library.
 */
function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;

  return template.replace(/\{([^}]+)\}/g, (_match, expr: string) => {
    // Simple variable: {name}
    if (vars[expr] !== undefined) {
      return String(vars[expr]);
    }

    // Plural expression: {count, plural, one {item} other {items}}
    const pluralMatch = expr.match(
      /^(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}$/,
    );
    if (pluralMatch) {
      const [, countVar, one, other] = pluralMatch;
      const count = Number(vars[countVar]);
      return count === 1 ? one : other;
    }

    // Unknown placeholder — return as-is
    return `{${expr}}`;
  });
}

/**
 * Detect the user's preferred locale from the browser.
 *
 * Priority:
 * 1. localStorage (explicit user choice)
 * 2. navigator.language / navigator.languages (Accept-Language)
 * 3. DEFAULT_LOCALE
 */
function detectLocale(): Locale {
  // 1. Check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "zh") {
        return stored;
      }
    } catch {
      // localStorage may be blocked (e.g. WeChat in-app browser privacy mode)
    }
  }

  // 2. Check browser language
  if (typeof navigator !== "undefined") {
    const languages =
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language];

    for (const lang of languages) {
      const normalised = lang.toLowerCase();
      if (
        normalised.startsWith("zh") ||
        normalised.startsWith("cmn") // Mandarin BCP-47
      ) {
        return "zh";
      }
      if (normalised.startsWith("en")) {
        return "en";
      }
    }
  }

  return DEFAULT_LOCALE;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface I18nContextValue {
  /** Current locale */
  locale: Locale;

  /**
   * Switch locale. Persists to localStorage and optionally updates the user
   * profile in Supabase (if a `supabaseClient` was provided to the provider).
   */
  setLocale: (locale: Locale) => void;

  /**
   * Retrieve a translated string by its dot-path key.
   *
   * ```ts
   * t("common.buttons.submit")         // "Submit"
   * t("landing.hero.subtitle", { count: 50 })
   * ```
   */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;

  /** The full translations object for the current locale */
  translations: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Minimal Supabase client interface — only what we need to persist locale.
 * Keeps this module free of a hard @supabase/supabase-js dependency.
 */
interface SupabaseClientLike {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
  from: (table: string) => {
    update: (
      values: Record<string, unknown>,
    ) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ error: unknown }>;
    };
  };
}

export interface I18nProviderProps {
  children: ReactNode;

  /** Initial locale override. If omitted, auto-detected. */
  defaultLocale?: Locale;

  /**
   * Optional Supabase client. When provided, locale changes are persisted to
   * the `profiles.preferred_language` column for the current user.
   */
  supabaseClient?: SupabaseClientLike;
}

export function I18nProvider({
  children,
  defaultLocale,
  supabaseClient,
}: I18nProviderProps): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(
    defaultLocale ?? detectLocale,
  );

  // Sync <html lang="..."> attribute whenever locale changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore — see WeChat note above
      }

      // Persist to Supabase user profile (fire-and-forget)
      if (supabaseClient) {
        (async () => {
          try {
            const {
              data: { user },
            } = await supabaseClient.auth.getUser();
            if (user) {
              await supabaseClient
                .from("profiles")
                .update({ preferred_language: next })
                .eq("id", user.id);
            }
          } catch {
            // Non-critical — the localStorage value is the primary source
          }
        })();
      }
    },
    [supabaseClient],
  );

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const raw = getNestedValue(translations[locale], key);
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      translations: translations[locale],
    }),
    [locale, setLocale, t],
  );

  return React.createElement(I18nContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the i18n context from any component.
 *
 * ```tsx
 * function MyComponent() {
 *   const { t, locale, setLocale } = useTranslation();
 *   return <h1>{t("landing.hero.titleLine1")}</h1>;
 * }
 * ```
 */
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error(
      "useTranslation() must be used within an <I18nProvider>. " +
        "Wrap your app with <I18nProvider> in your root layout.",
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// <Trans> component
// ---------------------------------------------------------------------------

export interface TransProps {
  /** Dot-path translation key */
  i18nKey: TranslationKey;

  /** Interpolation variables */
  values?: Record<string, string | number>;

  /**
   * Named components to render inside the translated string.
   *
   * Use `<0>...</0>`, `<1>...</1>` etc. in the translation string to mark
   * where components should wrap content. Or use named tags like
   * `<termsLink>Terms</termsLink>`.
   *
   * ```tsx
   * <Trans
   *   i18nKey="auth.signUp.termsAgreement"
   *   components={{
   *     termsLink: <a href="/terms" />,
   *     privacyLink: <a href="/privacy" />,
   *   }}
   * />
   * ```
   */
  components?: Record<string, React.ReactElement>;

  /** Fallback content if the key is missing */
  fallback?: string;
}

/**
 * Component-based translation with support for embedded React elements.
 *
 * For simple strings, `t()` from useTranslation is simpler. Use `<Trans>`
 * when the translated string contains links, bold text, or other components.
 */
export function Trans({
  i18nKey,
  values,
  components,
  fallback,
}: TransProps): React.ReactElement {
  const { t } = useTranslation();
  const raw = t(i18nKey, values);

  // If there are no component slots, return plain text
  if (!components || Object.keys(components).length === 0) {
    return React.createElement(React.Fragment, null, raw || fallback || i18nKey);
  }

  // Parse `<name>content</name>` patterns and wrap with the corresponding
  // component from the `components` map.
  const parts: ReactNode[] = [];
  let remaining = raw;
  let partIndex = 0;

  // Match <tagName>...content...</tagName>
  const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(remaining)) !== null) {
    // Push text before the tag
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    const [, tagName, content] = match;
    const component = components[tagName];

    if (component) {
      parts.push(
        React.cloneElement(component, { key: partIndex++ }, content),
      );
    } else {
      // No matching component — render content as text
      parts.push(content);
    }

    lastIndex = match.index + match[0].length;
  }

  // Push any trailing text
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return React.createElement(React.Fragment, null, ...parts);
}

// ---------------------------------------------------------------------------
// LanguageToggle convenience component
// ---------------------------------------------------------------------------

export interface LanguageToggleProps {
  /** Additional CSS class names */
  className?: string;
}

/**
 * A simple EN | 中文 toggle button.
 *
 * ```tsx
 * <LanguageToggle className="text-sm" />
 * ```
 */
export function LanguageToggle({
  className,
}: LanguageToggleProps): React.ReactElement {
  const { locale, setLocale, t } = useTranslation();

  const toggle = useCallback(() => {
    setLocale(locale === "en" ? "zh" : "en");
  }, [locale, setLocale]);

  return React.createElement(
    "button",
    {
      type: "button",
      onClick: toggle,
      className,
      "aria-label": t("accessibility.languageToggle" as TranslationKey),
      title: t("common.language.toggle" as TranslationKey),
    },
    locale === "en" ? "中文" : "English",
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { en, zh, translations };
export type { Locale as Language, I18nContextValue };
