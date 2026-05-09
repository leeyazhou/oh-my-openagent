import { describe, expect, it } from "bun:test"
import { locales } from "../locales"
import { getLocale, initI18n, setLocale, t } from "./i18n"

describe("i18n", () => {
  it("detects and loads default locale", () => {
    initI18n()
    expect(getLocale()).toBe("en")
    expect(t("toast.task_completed")).toBe("Task Completed")
  })

  it("returns key as fallback when not found", () => {
    initI18n()
    expect(t("nonexistent.key")).toBe("nonexistent.key")
  })

  it("supports parameter interpolation", () => {
    initI18n()
    expect(t("toast.task_completion_message", { description: "Bun", duration: "3s" })).toBe("\"Bun\" finished in 3s")
  })

  it("switches locale at runtime with setLocale", () => {
    initI18n()
    setLocale("zh")
    expect(getLocale()).toBe("zh")
    expect(t("toast.task_completed")).toBe("任务完成")
  })

  it("loads and uses zh translations via init option", () => {
    initI18n({ locale: "zh", fallback: "en" })
    expect(t("toast.status_queued")).toBe("排队中")
  })

  it("returns placeholder when param missing from message", () => {
    initI18n()
    expect(t("toast.task_completion_message")).toBe("\"{{description}}\" finished in {{duration}}")
  })

  it("ignores unsupported configured locale values", () => {
    initI18n({ locale: "ja", fallback: "zh" })
    expect(getLocale()).toBe("en")
    expect(t("toast.task_completed")).toBe("Task Completed")
  })
})

describe("locale fallback", () => {
  it("falls back to english when a locale key is missing at runtime", () => {
    const original = locales.zh["toast.task_completed"]

    Object.defineProperty(locales.zh, "toast.task_completed", {
      configurable: true,
      writable: true,
      value: undefined,
    })

    try {
      initI18n({ locale: "zh", fallback: "en" })
      expect(t("toast.task_completed")).toBe("Task Completed")
    } finally {
      Object.defineProperty(locales.zh, "toast.task_completed", {
        configurable: true,
        writable: true,
        value: original,
      })
      initI18n()
    }
  })
})

describe("toast i18n keys", () => {
  it("resolves completion message with interpolation (en)", () => {
    initI18n({ locale: "en" })
    const result = t("toast.task_completion_message", { description: "lint", duration: "12s" })
    expect(result).toBe("\"lint\" finished in 12s")
  })

  it("resolves completion message with interpolation (zh)", () => {
    initI18n({ locale: "zh" })
    const result = t("toast.task_completion_message", { description: "lint", duration: "12s" })
    expect(result).toBe("\"lint\" 完成，耗时 12s")
  })

  it("resolves completion remaining message with interpolation (en)", () => {
    initI18n({ locale: "en" })
    const result = t("toast.task_completion_remaining", { running: 3, queued: 2 })
    expect(result).toBe("Still running: 3 | Queued: 2")
  })

  it("resolves completion remaining message with interpolation (zh)", () => {
    initI18n({ locale: "zh" })
    const result = t("toast.task_completion_remaining", { running: 3, queued: 2 })
    expect(result).toBe("仍在运行: 3 | 排队中: 2")
  })
})
