import { describe, it, expect } from "vitest"
import { parseThemeTokenBlocks, extractCornerStyleFromCss } from "../css"

const sampleCss = `/* Theme: Nebula */
/* Light Mode */
:root[data-theme="nebula"] {
  --background: oklch(1 0 0);
  --foreground: oklch(0.2 0 0);
  --corner-style: squircle;
}

/* Dark Mode */
.dark[data-theme="nebula"] {
  --background: oklch(0.15 0 0);
  --foreground: oklch(0.95 0 0);
  --corner-style: squircle;
}`

describe("parseThemeTokenBlocks", () => {
  it("extrahiert Light- und Dark-Tokens korrekt", () => {
    const { light, dark } = parseThemeTokenBlocks("nebula", sampleCss)
    expect(light["--background"]).toBe("oklch(1 0 0)")
    expect(light["--foreground"]).toBe("oklch(0.2 0 0)")
    expect(dark["--background"]).toBe("oklch(0.15 0 0)")
    expect(dark["--foreground"]).toBe("oklch(0.95 0 0)")
  })

  it("gibt leere Maps zurueck wenn cssText null ist", () => {
    const { light, dark } = parseThemeTokenBlocks("foo", null)
    expect(light).toEqual({})
    expect(dark).toEqual({})
  })

  it("spiegelt Dark-Werte in Light wenn nur Dark vorhanden ist", () => {
    const darkOnly = `.dark[data-theme="x"] { --a: red; }`
    const { light, dark } = parseThemeTokenBlocks("x", darkOnly)
    expect(dark["--a"]).toBe("red")
    expect(light["--a"]).toBe("red")
  })

  it("ignoriert Tokens anderer Themes", () => {
    const multiTheme = `:root[data-theme="a"] { --foo: 1; } :root[data-theme="b"] { --foo: 2; }`
    const a = parseThemeTokenBlocks("a", multiTheme)
    const b = parseThemeTokenBlocks("b", multiTheme)
    expect(a.light["--foo"]).toBe("1")
    expect(b.light["--foo"]).toBe("2")
  })

  it("eskapiert Regex-Sonderzeichen im Theme-ID", () => {
    const css = `:root[data-theme="my.theme"] { --a: 1; }`
    const { light } = parseThemeTokenBlocks("my.theme", css)
    expect(light["--a"]).toBe("1")
  })
})

describe("extractCornerStyleFromCss", () => {
  it("liest squircle aus Light-Block", () => {
    expect(extractCornerStyleFromCss("nebula", sampleCss)).toBe("squircle")
  })

  it("liefert rounded als Default wenn Token fehlt", () => {
    const css = `:root[data-theme="x"] { --background: red; }`
    expect(extractCornerStyleFromCss("x", css)).toBe("rounded")
  })

  it("liefert rounded fuer unbekannte Werte (Whitelist)", () => {
    const css = `:root[data-theme="x"] { --corner-style: banana; }`
    expect(extractCornerStyleFromCss("x", css)).toBe("rounded")
  })

  it("liefert rounded fuer null-CSS", () => {
    expect(extractCornerStyleFromCss("x", null)).toBe("rounded")
  })
})
