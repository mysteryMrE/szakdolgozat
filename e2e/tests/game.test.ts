import { expect, test } from "@playwright/test";
import {
  openHomeAndWaitForConnection,
  startHumanVsMinimax,
  playerAndMinimax,
  playDraw,
  cellRegex,
} from "./utils";

/*
AI assisted regex and locator expressions were used.
*/

test.describe("Game user stories", () => {
  test("4.1.1 Ellenfelek kiválasztása", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    const xSelect = page.getByLabel("X játékos");
    const oSelect = page.getByLabel("O játékos");

    await expect(xSelect).toBeVisible();
    await expect(oSelect).toBeVisible();
    await xSelect.selectOption("random");
    await oSelect.selectOption("human");
    await expect(xSelect.locator('option[value="human"]')).toBeDisabled();
  });

  test("4.1.2 Lépési várakozás megadása - túl nagy", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    const delayInput = page.getByLabel("Lépés késleltetés (mp)");
    await delayInput.fill("20");
    await delayInput.blur();

    await expect(delayInput).toHaveValue("10");
  });

  test("4.1.2 Lépési várakozás megadása - helyesen", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    const delayInput = page.getByLabel("Lépés késleltetés (mp)");
    await delayInput.fill("8");
    await delayInput.blur();

    await expect(delayInput).toHaveValue("8");
  });

  test("4.1.3 Körök számának megadása - túl nagy", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    const roundsInput = page.getByLabel("Körök száma");
    await roundsInput.fill("121");
    await roundsInput.blur();

    await expect(roundsInput).toHaveValue("100");
  });

  test("4.1.3 Körök számának megadása - helyesen", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    const roundsInput = page.getByLabel("Körök száma");
    await roundsInput.fill("80");
    await roundsInput.blur();

    await expect(roundsInput).toHaveValue("80");
  });

  test("4.1.4 Kör közti várakozás megadása - túl nagy", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    const roundDelayInput = page.getByLabel("Kör késleltetés (mp)");
    await roundDelayInput.fill("20");
    await roundDelayInput.blur();

    await expect(roundDelayInput).toHaveValue("10");
  });

  test("4.1.4 Kör közti várakozás megadása - helyesen", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    const roundDelayInput = page.getByLabel("Kör késleltetés (mp)");
    await roundDelayInput.fill("8");
    await roundDelayInput.blur();

    await expect(roundDelayInput).toHaveValue("8");
  });

  test("4.2 Játék indítása", async ({ page }) => {
    await openHomeAndWaitForConnection(page);

    await page.getByRole("button", { name: "Játék létrehozása" }).click();

    await expect(page.getByRole("button", { name: "Új játék" })).toBeVisible();
    await expect(page.getByLabel("Game statistics")).toBeVisible();
  });

  test("4.3.1 Lépés a játékban, helyesen", async ({ page }) => {
    await openHomeAndWaitForConnection(page);
    await page.getByRole("button", { name: "Játék létrehozása" }).click();

    const firstEmptyCell = page.getByRole("button", {
      name: new RegExp("Sor 1 Oszlop 1: üres", "i"),
    });
    await expect(firstEmptyCell).toBeVisible();
    await firstEmptyCell.click();

    await expect(
      page.getByRole("button", { name: new RegExp("Sor 1 Oszlop 1: X", "i") }),
    ).toBeVisible();
  });

  test("4.3.2 Lépés a játékban, nem következik", async ({ page }) => {
    await openHomeAndWaitForConnection(page);
    const delayInput = page.getByLabel("Lépés késleltetés (mp)");
    await delayInput.fill("8");
    await page.getByRole("button", { name: "Játék létrehozása" }).click();

    const firstCell = page.getByRole("button", { name: new RegExp("Sor 1 Oszlop 1:", "i") });
    const secondCell = page.getByRole("button", { name: new RegExp("Sor 1 Oszlop 2:", "i") });
    await firstCell.click();
    await secondCell.click();

    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("4.3.3 Lépés a játékban, menet nyerése", async ({ page }) => {
    // *losing the round against minimax, so its wining in this case
    await startHumanVsMinimax(page, 2);

    await playerAndMinimax(page, [1, 1], [2, 2]);
    await playerAndMinimax(page, [1, 2], [1, 3]);
    await playerAndMinimax(page, [2, 1], [3, 1]);

    await expect(page.getByTestId("stats-o-wins")).toHaveText("1");
    await expect(
      page.getByRole("button", { name: "Következő kör" }),
    ).toBeVisible();
  });

  test("4.3.4 Lépés a játékban, nincs vége a menetnek", async ({ page }) => {
    await startHumanVsMinimax(page, 1);

    await playerAndMinimax(page, [1, 1], [2, 2]);

    await expect(
      page.getByRole("button", { name: "Következő kör" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: cellRegex(1, 2, "üres") }),
    ).toBeVisible();
  });

  test("4.3.5 Lépés a játékban, döntetlen menet", async ({ page }) => {
    await startHumanVsMinimax(page, 2);

    await playDraw(page);

    await expect(page.getByTestId("stats-draw")).toHaveText("1");
    await expect(
      page.getByRole("button", { name: "Következő kör" }),
    ).toBeVisible();
  });

  test("4.3.6 Játék vége", async ({ page }) => {
    await startHumanVsMinimax(page, 2);

    await playDraw(page);
    await expect(
      page.getByRole("button", { name: "Következő kör" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Következő kör" }).click();

    await playDraw(page);

    await expect(page.getByTestId("stats-rounds")).toHaveText("2 / 2");
    await expect(page.getByTestId("stats-draw")).toHaveText("2");
    await expect(
      page.getByRole("button", { name: "Következő kör" }),
    ).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Új játék" })).toBeVisible();
  });
});
