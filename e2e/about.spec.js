// E2E smoke: the public /geocon/about page should render the GEOCON
// manifesto + key trust signals + footer + sticky header. This is the
// only page that's auth-free and exercises the v3.1 design system end-
// to-end (sticky header, breadcrumb, trust strip, Crimson Pro display
// type, manifesto two-column grid, IUCN compliance card).

import { test, expect } from "@playwright/test";

test.describe("/geocon/about — public marketing page", () => {
  test("renders manifesto + trust signals + footer", async ({ page }) => {
    await page.goto("/geocon/about");

    // Display headline (Crimson Pro / Arial Black for the GEOCON word)
    await expect(page.getByRole("heading", { name: /^GEOCON$/ })).toBeVisible();

    // Manifesto contrasts: both sides should be present
    await expect(page.getByText(/A research-only atlas of endemic geophytes/i)).toBeVisible();
    await expect(page.getByText(/Not a marketplace/i)).toBeVisible();
    await expect(page.getByText(/Not a patent owner/i)).toBeVisible();

    // IUCN compliance card with at least one of the five guarantees
    await expect(page.getByText(/No money columns/i)).toBeVisible();

    // Footer brand line
    await expect(page.getByText(/Venn BioVentures/i)).toBeVisible();
  });

  test("sticky header survives scroll", async ({ page }) => {
    await page.goto("/geocon/about");
    await page.waitForLoadState("networkidle");

    // Find the sticky header's <header> wrapper inside <main id="main">.
    const header = page.locator("main#main header");
    await expect(header).toBeVisible();

    // Breadcrumb should render at least Atlas › About
    await expect(header.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();

    // Scroll the body 1500px down — header should stay at viewport top.
    await page.evaluate(() => window.scrollTo(0, 1500));
    const top = await header.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThanOrEqual(1); // allow sub-pixel rounding
  });

  test("CTA links route into the atlas", async ({ page }) => {
    await page.goto("/geocon/about");

    // "Explore the globe →" should link to /geocon/explore
    const exploreLink = page.getByRole("link", { name: /Explore the globe/i });
    await expect(exploreLink).toBeVisible();
    await expect(exploreLink).toHaveAttribute("href", "/geocon/explore");
  });
});
