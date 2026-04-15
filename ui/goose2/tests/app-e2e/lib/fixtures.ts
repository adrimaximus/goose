import type { TestDriver } from "./test-driver-client";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Click a nav item and wait for its page heading to appear.
 * `navTestId` — the data-testid on the nav button (e.g. "nav-skills")
 * `heading`   — the h1 text that confirms the page has loaded
 */
export async function navigateTo(
  driver: TestDriver,
  navTestId: string,
  heading: string,
): Promise<void> {
  await driver.click(`[data-testid="${navTestId}"]`);
  await driver.waitForText(heading, { selector: "h1" });
}

// ---------------------------------------------------------------------------
// Polling helpers
// ---------------------------------------------------------------------------

/**
 * Poll until `selector` matches zero elements or the timeout expires.
 * Useful after async delete operations where the list re-renders after the
 * server responds.
 */
export async function waitForAbsent(
  driver: TestDriver,
  selector: string,
  timeoutMs = 5000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let count = 1;
  while (count > 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
    count = await driver.count(selector);
  }
}
