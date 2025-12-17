import { test, expect } from "@playwright/test"

test.describe("Example E2E Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    const appUrl = process.env.APP_URL || "http://localhost:3000"
    await page.goto(appUrl)
    await expect(page).toHaveTitle(/Next.js/i)
  })

  test("page has basic structure", async ({ page }) => {
    const appUrl = process.env.APP_URL || "http://localhost:3000"
    await page.goto(appUrl)
    const body = page.locator("body")
    await expect(body).toBeVisible()
  })
})
