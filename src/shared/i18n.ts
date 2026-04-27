import { locales } from "../locales"

let currentLang = "en"
let fallbackLang = "en"

function detectLocale(): string {
  const envLang = process.env.LANG ?? ""
  const lang = envLang.split(".")[0]?.split("_")[0]?.toLowerCase() ?? "en"

  const supported: Record<string, string> = {
    zh: "zh-CN",
    ja: "ja",
  }

  return supported[lang] ?? "en"
}

/**
 * Initialize the i18n module.
 * Auto-detects locale from LANG env var if not specified.
 */
export function initI18n(opts?: { locale?: string; fallback?: string }): void {
  currentLang = opts?.locale ?? detectLocale()
  if (opts?.fallback) {
    fallbackLang = opts.fallback
  }

  if (!locales[currentLang]) {
    currentLang = "en"
  }
}

/**
 * Get the current locale code.
 */
export function getLocale(): string {
  return currentLang
}

/**
 * Set locale at runtime.
 */
export function setLocale(lang: string): void {
  if (locales[lang]) {
    currentLang = lang
  }
}

/**
 * Translate a key with optional interpolation parameters.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const msg =
    locales[currentLang]?.[key] ??
    locales[fallbackLang]?.[key] ??
    key

  if (!params) return msg
  return msg.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name]
    return value != null ? String(value) : `{{${name}}}`
  })
}
