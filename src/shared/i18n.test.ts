import { describe, it, expect } from "bun:test"
import { initI18n, t, getLocale, setLocale } from "./i18n"

describe("i18n", () => {
  it("detects and loads default locale", () => {
    initI18n()
    expect(getLocale()).toBe("en")
    expect(t("common.confirm")).toBe("Confirm")
  })

  it("returns key as fallback when not found", () => {
    initI18n()
    expect(t("nonexistent.key")).toBe("nonexistent.key")
  })

  it("supports parameter interpolation", () => {
    initI18n()
    expect(t("doctor.checking", { name: "Bun" })).toBe("Checking Bun...")
  })

  it("switches locale at runtime with setLocale", () => {
    initI18n()
    setLocale("zh-CN")
    expect(getLocale()).toBe("zh-CN")
    expect(t("common.confirm")).toBe("确认")
  })

  it("loads and uses zh-CN translations via init option", () => {
    initI18n({ locale: "zh-CN", fallback: "en" })
    expect(t("common.cancel")).toBe("取消")
  })

  it("returns key when param missing from message", () => {
    initI18n()
    expect(t("doctor.checking")).toBe("Checking {{name}}...")
  })
})
