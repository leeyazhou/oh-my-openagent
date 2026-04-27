import en from "./en"
import zhCN from "./zh-CN"

// Exported as a single object so bun always bundles all locale data.
// Individual locale file imports get tree-shaken by bun when loaded
// in separate imports because it traces that zh-CN keys are never
// directly accessed from the entry point.
type LocaleMap = Record<string, Record<string, string>>
export const locales: LocaleMap = {
  en,
  "zh-CN": zhCN,
}
