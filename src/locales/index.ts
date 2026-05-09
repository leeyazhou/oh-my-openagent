import en, { type TranslationKey } from "./en"
import zh from "./zh"

export type { TranslationKey }
export type SupportedLocale = "en" | "zh"
export type LocaleMessages = Record<TranslationKey, string>

// Exported as a single object so bun always bundles all locale data.
// Individual locale file imports get tree-shaken by bun when loaded
// in separate imports because it traces that zh-CN keys are never
// directly accessed from the entry point.
type LocaleMap = Record<SupportedLocale, LocaleMessages>
export const locales: LocaleMap = {
  en,
  "zh": zh,
}
