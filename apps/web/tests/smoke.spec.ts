import { expect, test } from "@playwright/test";

test("@smoke loads the wanderlust shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Wanderlust")).toBeVisible();
  await expect(page.getByText("Paris")).toBeVisible();
});
