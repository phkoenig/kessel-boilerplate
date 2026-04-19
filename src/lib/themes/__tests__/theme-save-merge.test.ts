import { describe, it, expect } from "vitest"
import {
  buildThemeCss,
  mergePendingTokenChanges,
  verifySavedThemeMatchesPending,
  assertParsedThemeTokens,
  type ThemePendingTokenValue,
} from "../theme-save-merge"

describe("buildThemeCss", () => {
  it("baut Light-Block mit :root-Selektor", () => {
    const css = buildThemeCss("foo", { "--a": "red", "--b": "blue" }, false)
    expect(css).toContain(`:root[data-theme="foo"] {`)
    expect(css).toContain("  --a: red;")
    expect(css).toContain("  --b: blue;")
  })

  it("baut Dark-Block mit .dark-Selektor", () => {
    const css = buildThemeCss("foo", { "--a": "black" }, true)
    expect(css).toContain(`.dark[data-theme="foo"] {`)
    expect(css).toContain("  --a: black;")
  })
})

describe("mergePendingTokenChanges", () => {
  it("merged Light- und Dark-Werte in die Maps", () => {
    const light: Record<string, string> = { "--existing": "old" }
    const dark: Record<string, string> = {}
    const pending = new Map<string, ThemePendingTokenValue>([
      ["--a", { light: "red", dark: "darkred" }],
      ["--b", { light: "blue", dark: "" }],
    ])
    mergePendingTokenChanges(light, dark, pending)
    expect(light).toEqual({ "--existing": "old", "--a": "red", "--b": "blue" })
    expect(dark).toEqual({ "--a": "darkred" })
  })

  it("ignoriert leere Strings (kein Ueberschreiben)", () => {
    const light: Record<string, string> = { "--a": "keep" }
    const dark: Record<string, string> = { "--a": "keep" }
    const pending = new Map<string, ThemePendingTokenValue>([["--a", { light: "   ", dark: "" }]])
    mergePendingTokenChanges(light, dark, pending)
    expect(light["--a"]).toBe("keep")
    expect(dark["--a"]).toBe("keep")
  })
})

describe("verifySavedThemeMatchesPending", () => {
  const cssOk = `:root[data-theme="x"] { --a: red; } .dark[data-theme="x"] { --a: darkred; }`

  it("wirft nichts bei leerer pending-Map", () => {
    expect(() => verifySavedThemeMatchesPending("x", cssOk, new Map())).not.toThrow()
  })

  it("wirft wenn CSS leer", () => {
    const pending = new Map([["--a", { light: "red", dark: "" }]])
    expect(() => verifySavedThemeMatchesPending("x", null, pending)).toThrow(/leer/i)
  })

  it("wirft bei Abweichung zwischen pending und storage", () => {
    const pending = new Map([["--a", { light: "blue", dark: "" }]])
    expect(() => verifySavedThemeMatchesPending("x", cssOk, pending)).toThrow(/Verifikation/)
  })

  it("wirft nicht bei Match", () => {
    const pending = new Map([["--a", { light: "red", dark: "darkred" }]])
    expect(() => verifySavedThemeMatchesPending("x", cssOk, pending)).not.toThrow()
  })
})

describe("assertParsedThemeTokens", () => {
  it("wirft nicht wenn CSS zu kurz", () => {
    expect(() => assertParsedThemeTokens("x", "", {}, {})).not.toThrow()
    expect(() => assertParsedThemeTokens("x", "/* short */", {}, {})).not.toThrow()
  })

  it("wirft nicht wenn CSS das Theme gar nicht erwaehnt", () => {
    expect(() =>
      assertParsedThemeTokens("x", `:root { --a: 1; } /* padding padding */`, {}, {})
    ).not.toThrow()
  })

  it("wirft wenn Theme erwaehnt aber keine Tokens geparst", () => {
    const css = `:root[data-theme="x"] { /* empty */ }   `.padEnd(50, " ")
    expect(() => assertParsedThemeTokens("x", css, {}, {})).toThrow(/Variablen gelesen/)
  })

  it("wirft nicht wenn Theme erwaehnt und Tokens vorhanden", () => {
    const css = `:root[data-theme="x"] { --a: red; }`
    expect(() => assertParsedThemeTokens("x", css, { "--a": "red" }, {})).not.toThrow()
  })
})
