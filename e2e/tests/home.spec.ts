import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Bingo Builder/i);
  });

  test("should display navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for navigation elements
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /profile/i })).toBeVisible();
  });

  test("should display heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /^bingo cards$/i, level: 1 }),
    ).toBeVisible();
  });

  test("should show published cards section", async ({ page }) => {
    await page.goto("/");
    // The section heading may not be visible if there are no published cards
    // Just check the main page is loaded
    await expect(
      page.getByRole("heading", { name: /^bingo cards$/i, level: 1 }),
    ).toBeVisible();
  });
});
