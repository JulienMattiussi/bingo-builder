# E2E Tests

End-to-end tests for Bingo Builder using [Playwright](https://playwright.dev/).

## Setup

Install dependencies and Playwright browsers:

```bash
cd e2e
npm install
npx playwright install chromium
```

Or from the project root:

```bash
make install-e2e
```

## Running Tests

### Headless Mode (CI)

```bash
npm run test
```

Or from project root:

```bash
make test-e2e
```

### UI Mode (Interactive)

```bash
npm run test:ui
```

Or:

```bash
make test-e2e-ui
```

### Headed Mode (Visible Browser)

```bash
npm run test:headed
```

Or:

```bash
make test-e2e-headed
```

### Debug Mode

```bash
npm run test:debug
```

Or:

```bash
make test-e2e-debug
```

## Test Structure

Tests are organized in the `tests/` directory:

- `home.spec.ts` - Home page navigation and display tests
- `create-card.spec.ts` - Card creation flow tests
- `play-card.spec.ts` - Card playing and interaction tests
- `profile.spec.ts` - Profile page and user management tests

## Prerequisites

The E2E tests require both backend and frontend servers to be running. The Playwright configuration will automatically start them before running tests.

### Ports

- Backend: `http://localhost:3001` (or `BACKEND_PORT` env var)
- Frontend: `http://localhost:3000` (or `FRONTEND_PORT` env var)

### Environment Variables

You can customize ports by setting:

```bash
export BACKEND_PORT=3001
export FRONTEND_PORT=3000
```

## Test Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

Reports are generated in `playwright-report/`.

## Code Generation

Generate test code by recording interactions:

```bash
npm run test:codegen
```

This opens a browser where you can interact with the app, and Playwright will generate test code for you.

## CI/CD

Tests are configured to run in CI mode with:
- 2 retries on failure
- Single worker (no parallelization)
- Screenshots on failure
- Traces on first retry

## Writing Tests

Example test structure:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
```

See [Playwright documentation](https://playwright.dev/docs/writing-tests) for more details.

## Troubleshooting

### Tests fail with "Cannot connect to server"

Make sure backend and frontend are running, or let Playwright start them automatically (configured in `playwright.config.ts`).

### Browser not found

Install browsers:

```bash
npx playwright install chromium
```

### Port conflicts

Change ports in environment variables or stop conflicting services.
