import { expect, test } from "@playwright/test";
import {
  makeNetworkName,
  openPlaygroundAsFreshUser,
  createNetwork,
} from "./utils";

/*
AI assisted regex and locator expressions were used.
*/

test.describe("Playground user stories", () => {
  test("6.1 Saját neuronháló létrehozása", async ({ page }) => {
    await openPlaygroundAsFreshUser(page);
    await createNetwork(page, makeNetworkName("net"));
  });

  test("6.2.1 Saját neuronháló szerkesztése", async ({ page }) => {
    await openPlaygroundAsFreshUser(page);
    const row = await createNetwork(page, makeNetworkName("edi"));

    await row.getByRole("button", { name: "Szerkesztés" }).click();
    await expect(
      page.getByRole("heading", { name: "Szerkesztő" }),
    ).toBeVisible();
  });

  test("6.2.2 Saját neuronháló szerkesztése, réteg beállítás - új réteg hozzáadása", async ({
    page,
  }) => {
    await openPlaygroundAsFreshUser(page);
    const networkName = makeNetworkName("add");
    const row = await createNetwork(page, networkName);

    await row.getByRole("button", { name: "Szerkesztés" }).click();
    await expect(
      page.getByRole("heading", { name: "Szerkesztő" }),
    ).toBeVisible();

    const addLayerBlock = page.getByLabel("Új réteg").locator("..").locator("..");
    await addLayerBlock.getByRole("button", { name: "Hozzáadás" }).click();
    await page.getByRole("button", { name: "Mentés" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: networkName }),
    ).toContainText(/18,\s*\d+,\s*9/);
  });

  test("6.2.2 Saját neuronháló szerkesztése, réteg beállítás - réteg törlése", async ({
    page,
  }) => {
    await openPlaygroundAsFreshUser(page);
    const networkName = makeNetworkName("del");
    const row = await createNetwork(page, networkName);

    await row.getByRole("button", { name: "Szerkesztés" }).click();
    await expect(
      page.getByRole("heading", { name: "Szerkesztő" }),
    ).toBeVisible();

    const addLayerBlock = page.getByLabel("Új réteg").locator("..").locator("..");
    await addLayerBlock.getByRole("button", { name: "Hozzáadás" }).click();
    await page.getByRole("button", { name: "Mentés" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: networkName }),
    ).toContainText(/18,\s*\d+,\s*9/);

    // delete the added layer
    const neuronToDelete = page.locator('[data-id="L1N0"]');
    await neuronToDelete.click();
    await page
      .getByText("Kiválasztott neuron törlése")
      .locator("..")
      .getByRole("button", { name: "Törlés" })
      .click();
    await page.getByRole("button", { name: "Mentés" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: networkName }),
    ).toContainText("18, 9");
  });

  test("6.2.3 Saját neuronháló szerkesztése, neuron paraméterek", async ({
    page,
  }) => {
    await openPlaygroundAsFreshUser(page);
    const networkName = makeNetworkName("net");
    const row = await createNetwork(page, networkName);

    await row.getByRole("button", { name: "Szerkesztés" }).click();
    await expect(
      page.getByRole("heading", { name: "Szerkesztő" }),
    ).toBeVisible();

    const neuronToEdit = page.locator('[data-id="L1N0"]');
    await neuronToEdit.click();
    await page.getByLabel("Torzítás").fill("100");
    await page.getByLabel("Torzítás").blur();

    const weightToEdit = page.locator('[data-id="label-e0-0-0"]');
    await weightToEdit.click();
    await page.getByLabel("Súly").fill("100");
    await page.getByLabel("Súly").blur();

    await expect(neuronToEdit).toHaveText("100.00");
    await expect(weightToEdit).toHaveText("100.00");
  });

  test("6.2.4 Saját neuronháló szerkesztése, név állítása", async ({
    page,
  }) => {
    await openPlaygroundAsFreshUser(page);
    const originalName = makeNetworkName("old");
    const newName = makeNetworkName("new");
    const row = await createNetwork(page, originalName);

    await row.getByRole("button", { name: "Szerkesztés" }).click();
    await page.getByLabel("Név").fill(newName);
    await page.getByRole("button", { name: "Mentés" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: originalName }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("row").filter({ hasText: newName }),
    ).toBeVisible();
  });

  test("6.3 Saját neuronháló mentése", async ({ page }) => {
    await openPlaygroundAsFreshUser(page);
    const originalName = makeNetworkName("old");
    const newName = makeNetworkName("new");
    const row = await createNetwork(page, originalName);

    await row.getByRole("button", { name: "Szerkesztés" }).click();
    await page.getByLabel("Név").fill(newName);
    const addLayerBlock = page.getByLabel("Új réteg").locator("..").locator("..");
    await addLayerBlock.getByRole("button", { name: "Hozzáadás" }).click();

    await page.getByRole("button", { name: "Mentés" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: originalName }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("row").filter({ hasText: newName }),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: newName }),
    ).toContainText(/18,\s*\d+,\s*9/);
  });

  test("6.4 Saját neuronháló megtekintése", async ({ page }) => {
    // Viewing is available as editing without saving
    await openPlaygroundAsFreshUser(page);
    const row = await createNetwork(page, makeNetworkName("vie"));

    await row.getByRole("button", { name: "Szerkesztés" }).click();
    await expect(
      page.getByRole("heading", { name: "Szerkesztő" }),
    ).toBeVisible();
    let layer = "L0";
    for (let neuron = 0; neuron < 18; neuron++) {
      await expect(
        page.locator(`[data-id="${layer}N${neuron}"]`),
      ).toBeVisible();
    }
    layer = "L1";
    for (let neuron = 0; neuron < 9; neuron++) {
      await expect(
        page.locator(`[data-id="${layer}N${neuron}"]`),
      ).toBeVisible();
    }
  });

  test("6.5 Saját neuronháló törlése", async ({ page }) => {
    await openPlaygroundAsFreshUser(page);
    const networkName = makeNetworkName("del");
    const row = await createNetwork(page, networkName);

    await row.getByRole("button", { name: "Törlés" }).click();
    await expect(page.locator("tr", { hasText: networkName })).toHaveCount(0);
  });

  test("6.6.1 Saját neuronháló tanítása, paraméterek megadása", async ({
    page,
  }) => {
    await openPlaygroundAsFreshUser(page);
    const row = await createNetwork(page, makeNetworkName("tra"));

    await row.getByRole("button", { name: "Tanítás" }).click();

    const epochsInput = page.getByLabel("Iterációk száma");
    const learningRateInput = page.getByLabel("Kezdeti tanulási ráta");
    const earlyStoppingInput = page.getByLabel(
      "Korai terminálási határ (veszteség)",
    );

    await epochsInput.fill("10");
    await learningRateInput.fill("0.01");
    await earlyStoppingInput.fill("0.01");

    await expect(epochsInput).toHaveValue("10");
    await expect(learningRateInput).toHaveValue("0.01");
    await expect(earlyStoppingInput).toHaveValue("0.01");
  });

  test("6.6.2 Saját neuronháló tanítása, tanítás indítása", async ({
    page,
  }) => {
    await openPlaygroundAsFreshUser(page);
    const row = await createNetwork(page, makeNetworkName("tra"));

    await row.getByRole("button", { name: "Tanítás" }).click();
    await page.getByLabel("Iterációk száma").fill("10");

    await page.getByRole("button", { name: "Tanítás indítása" }).click();

    await expect(page.getByText("Státusz:")).toBeVisible();
    await expect(
      page.getByText(/Várakozás|Folyamatban|Kész|Hiba/),
    ).toBeVisible();
    await expect(page.getByText("Iterációk: 10")).toBeVisible({
      timeout: 30000,
    });
  });

  test("6.6.3 Saját neuronháló tanításakor progresszió megjelenítése", async ({
    page,
  }) => {
    await openPlaygroundAsFreshUser(page);
    const row = await createNetwork(
      page,
      makeNetworkName("prg"),
    );

    await row.getByRole("button", { name: "Tanítás" }).click();
    await page.getByLabel("Iterációk száma").fill("10");
    await page.getByRole("button", { name: "Tanítás indítása" }).click();

    await expect(page.getByText("Előrehaladás:")).toBeVisible();
    await expect(page.getByText("Pontosság:", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Line chart")).toBeVisible({ timeout: 30000 });
  });
});
