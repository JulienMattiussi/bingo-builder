import { test, expect, Page } from "@playwright/test";

test.describe("Play Card Flow", () => {
  // Helper to create a test card
  async function createTestCard(page: Page) {
    await page.goto("/create");

    // Set player nickname if prompted
    const playerNameInput = page.getByPlaceholder(/your (name|nickname)/i);
    if (await playerNameInput.isVisible()) {
      await playerNameInput.fill("E2EPlayer");
      await page.getByRole("button", { name: /continue/i }).click();
    }

    // Fill in card details
    await page.getByPlaceholder(/enter card title/i).fill("E2E Play Test Card");

    // Fill all tiles (4x6 grid = 24 tiles by default)
    const tiles = page.locator(".bingo-tile textarea");
    const tileCount = await tiles.count();

    for (let i = 0; i < tileCount; i++) {
      await tiles.nth(i).fill(`Play Item ${i + 1}`);
    }

    // Save the card
    await page.getByRole("button", { name: /save card/i }).click();

    // Name modal may appear again if creating first card
    const nameModalInput = page.getByPlaceholder(/your (name|nickname)/i);
    if (await nameModalInput.isVisible({ timeout: 2000 })) {
      await nameModalInput.fill("E2EPlayer");
      await page.getByRole("button", { name: /continue/i }).click();
    }

    // Should redirect to home
    await page.waitForURL(/.*\/(home|$)/, { timeout: 10000 });
  }

  test("should publish and play a card", async ({ page }) => {
    // Create a card first
    await createTestCard(page);

    // Should be on home page now
    await expect(page).toHaveURL(/.*\/(home|$)/);

    // Find the unpublished card
    const cardItem = page
      .locator(".card-item", {
        hasText: "E2E Play Test Card",
      })
      .first();
    await expect(cardItem).toBeVisible();

    // Click Edit button to go to edit page
    await cardItem.getByRole("link", { name: /edit/i }).click();

    // Wait for edit page
    await expect(page).toHaveURL(/.*edit/);

    // Set up dialog handler before clicking publish
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("publish");
      dialog.accept();
    });

    // Click Publish button
    await page.getByRole("button", { name: /publish card/i }).click();

    // Wait for redirect to home
    await page.waitForURL(/.*\/(home|$)/, { timeout: 5000 });

    // Now find and play the published card
    await page.getByRole("link", { name: /play/i }).first().click();

    // Should be on the play page
    await expect(page).toHaveURL(/.*play/);
    await expect(
      page.getByRole("heading", { name: /E2E Play Test Card/i }),
    ).toBeVisible();
  });

  test("should check tiles when playing", async ({ page }) => {
    // Navigate to home first
    await page.goto("/");

    // Look for any published card to play
    const playLink = page.getByRole("link", { name: /play/i }).first();

    if (await playLink.isVisible()) {
      await playLink.click();

      // Wait for play page to load
      await page.waitForURL(/.*play/);

      // Click a tile to check it
      const firstTile = page.locator(".bingo-tile").first();
      await firstTile.click();

      // Tile should have checked class
      await expect(firstTile).toHaveClass(/checked/);

      // Progress info should be visible
      await expect(page.locator(".progress-info")).toBeVisible();
    }
  });

  test("should save progress in localStorage", async ({ page }) => {
    await page.goto("/");

    // Find a published card
    const playLink = page.getByRole("link", { name: /play/i }).first();

    if (await playLink.isVisible()) {
      await playLink.click();
      await page.waitForURL(/.*play/);

      // Check a tile
      const firstTile = page.locator(".bingo-tile").first();
      await firstTile.click();

      // Get card ID from URL
      const url = page.url();
      const cardId = url.match(/play\/([a-f0-9]+)/)?.[1];

      if (cardId) {
        // Check localStorage
        const storedData = await page.evaluate((id) => {
          return localStorage.getItem(`bingo-card-${id}`);
        }, cardId);

        expect(storedData).toBeTruthy();
        expect(JSON.parse(storedData as string)).toContain(0); // First tile should be checked
      }
    }
  });
});
