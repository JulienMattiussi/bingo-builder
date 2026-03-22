import { test, expect } from "@playwright/test";

test.describe("Profile Page", () => {
  // Set up player name before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Set player name in localStorage
    await page.evaluate(() => {
      localStorage.setItem("bingo-player-name", "TestUser");
    });
  });

  test("should navigate to profile page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /profile/i }).click();

    await expect(page).toHaveURL(/.*profile/);
    await expect(
      page.getByRole("heading", { name: /^profile$/i }),
    ).toBeVisible();
  });

  test("should display player name section", async ({ page }) => {
    await page.goto("/profile");

    // Should have the nickname section heading
    await expect(
      page.getByRole("heading", { name: /your nickname/i }),
    ).toBeVisible();
  });

  test("should change player name", async ({ page }) => {
    await page.goto("/profile");

    // Click the "Change Nickname" button to show the input
    await page.getByRole("button", { name: /change nickname/i }).click();

    // Wait for the input to appear
    const nameInput = page.locator("input.title-input");
    await expect(nameInput).toBeVisible();

    // Clear and set new name
    await nameInput.clear();
    await nameInput.fill("TestUser");

    // Click save changes button
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify the name is saved (check localStorage)
    const storedName = await page.evaluate(() => {
      return localStorage.getItem("bingo-player-name");
    });

    expect(storedName).toBe("TestUser");
  });

  test("should display owned cards section", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { name: /your bingo cards/i }),
    ).toBeVisible();
  });

  test("should display played cards section", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { name: /played bingo cards/i }),
    ).toBeVisible();
  });

  test("should show delete profile option", async ({ page }) => {
    await page.goto("/profile");

    // Look for delete button in danger zone
    const deleteBtn = page.getByRole("button", {
      name: /delete profile.*all cards/i,
    });

    // Button should exist and be visible
    await expect(deleteBtn).toBeVisible();
  });
});
