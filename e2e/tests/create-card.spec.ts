import { test, expect } from "@playwright/test";

test.describe("Create Card Flow", () => {
  test("should navigate to create card page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /create/i }).click();

    await expect(page).toHaveURL(/.*create/);
    await expect(
      page.getByRole("heading", { name: /create new bingo card/i }),
    ).toBeVisible();
  });

  test("should create a new bingo card", async ({ page }) => {
    await page.goto("/create");

    // Set player name if prompted initially
    const initialNameInput = page.getByPlaceholder(/your name/i);
    if (await initialNameInput.isVisible()) {
      await initialNameInput.fill("TestPlayer");
      await page.getByRole("button", { name: /continue/i }).click();
    }

    // Fill in card title
    const titleInput = page.getByPlaceholder(/enter card title/i);
    await titleInput.fill("E2E Test Card");

    // Fill in some tiles
    const tiles = page.locator(".bingo-tile textarea");
    const tileCount = await tiles.count();

    // Fill at least 4 tiles
    for (let i = 0; i < Math.min(4, tileCount); i++) {
      await tiles.nth(i).fill(`Test Item ${i + 1}`);
    }

    // Click save button
    await page.getByRole("button", { name: /save card/i }).click();

    // Name modal may appear again if creating first card
    const nameModalInput = page.getByPlaceholder(/your name/i);
    if (await nameModalInput.isVisible({ timeout: 2000 })) {
      await nameModalInput.fill("TestPlayer");
      await page.getByRole("button", { name: /continue/i }).click();
    }

    // Should redirect to home
    await expect(page).toHaveURL(/.*\/(home|$)/, { timeout: 10000 });
  });

  test("should adjust grid size", async ({ page }) => {
    await page.goto("/create");

    // Set player name if needed
    const playerNameInput = page.getByPlaceholder(/your name/i);
    if (await playerNameInput.isVisible()) {
      await playerNameInput.fill("TestPlayer");
      await page.getByRole("button", { name: /continue/i }).click();
    }

    // Get initial tile count (default is 6x4 = 24 tiles)
    const initialTiles = await page.locator(".bingo-tile").count();

    // Find the Rows control and click the + button to increase rows
    const rowsPlusBtn = page
      .locator("label:has-text('Rows:')")
      .locator("..")
      .locator(".button-group-inline")
      .getByRole("button")
      .nth(1); // Second button is +

    await rowsPlusBtn.click();

    // Check that more tiles are visible
    await page.waitForTimeout(500);
    const newTiles = await page.locator(".bingo-tile").count();
    expect(newTiles).toBeGreaterThan(initialTiles);
  });

  test("should show progress status", async ({ page }) => {
    await page.goto("/create");

    // Set player name if needed
    const playerNameInput = page.getByPlaceholder(/your name/i);
    if (await playerNameInput.isVisible()) {
      await playerNameInput.fill("TestPlayer");
      await page.getByRole("button", { name: /continue/i }).click();
    }

    // Initially should show Draft status
    await expect(page.getByText(/draft/i)).toBeVisible();

    // Fill in title
    await page.getByPlaceholder(/enter card title/i).fill("Progress Test");

    // Fill all tiles
    const tiles = page.locator(".bingo-tile textarea");
    const tileCount = await tiles.count();

    for (let i = 0; i < tileCount; i++) {
      await tiles.nth(i).fill(`Item ${i + 1}`);
    }

    // Should show Complete status
    await expect(page.getByText(/complete/i)).toBeVisible();
  });
});
