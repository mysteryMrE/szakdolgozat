import { expect, test } from "@playwright/test";

test.describe("Learn user stories", () => {
  const cases = [
    { name: "Minimax", buttonName: "Minimax", heading: "Minimax" },
    { name: "Menace", buttonName: "Menace", heading: "MENACE" },
    { name: "Random", buttonName: "Random", heading: "Random ellenfél" },
    {
      name: "Neuronháló",
      buttonName: "Neuronháló",
      heading: "Neuron és Neuronháló",
    },
    {
      name: "Genetikus algoritmus",
      buttonName: "Genetikus algoritmus",
      heading: "Genetikus algoritmus",
    },
    {
      name: "Visszaterjesztés",
      buttonName: "Visszaterjesztés",
      heading: "Visszaterjesztés",
    },
  ];
  for (const { name, buttonName, heading } of cases) {
    test(
      "5.1 Algoritmus működésének megtekintése - " + name,
      async ({ page }) => {
        await page.goto("/learn");

        const learnContentMenu = page.getByLabel("Learn content menu");
        await expect(learnContentMenu).toBeVisible();
        await learnContentMenu.click();

        const menuContainer = page.locator(".absolute");
        await expect(menuContainer).toBeVisible();
        await expect(menuContainer.getByText("Minimax")).toBeVisible();
        await expect(menuContainer.getByText("Menace")).toBeVisible();
        await expect(menuContainer.getByText("Random")).toBeVisible();
        await expect(menuContainer.getByText("Neuronháló")).toBeVisible();
        await expect(
          menuContainer.getByText("Genetikus algoritmus"),
        ).toBeVisible();
        await expect(menuContainer.getByText("Visszaterjesztés")).toBeVisible();
        await menuContainer.getByText(buttonName).click();

        await expect(
          page.getByRole("heading", { name: heading, exact: true }),
        ).toBeVisible();
      },
    );
  }

  test("5.2 Algoritmus animáció megtekintése - Random", async ({ page }) => {
    await page.goto("/learn");

    const interactiveButton = page.getByLabel("Spinning Wheel");
    await expect(interactiveButton).toBeVisible();
    await interactiveButton.click();

    await expect(page.locator(".animate-pulse")).toBeVisible();
  });

  test("5.2 Algoritmus animáció megtekintése - Menace", async ({ page }) => {
    await page.goto("/learn");

    const learnContentMenu = page.getByLabel("Learn content menu");
    await expect(learnContentMenu).toBeVisible();
    await learnContentMenu.click();

    const buttonNames = [
      "Menace",
      "Győzelem",
      "Gyufásdoboz kiválasztása",
      "Gyöngy kihúzása",
    ];

    for (const buttonName of buttonNames) {
      const button = page.getByRole("button", { name: buttonName });
      await expect(button).toBeVisible();
      await button.click();
    }

    await expect(page.locator(".animate-pulse")).toBeVisible();
  });

  test("5.2 Algoritmus animáció megtekintése - Minimax", async ({ page }) => {
    await page.goto("/learn");

    const learnContentMenu = page.getByLabel("Learn content menu");
    await expect(learnContentMenu).toBeVisible();
    await learnContentMenu.click();

    let button = page.getByRole("button", { name: "Minimax" });
    await expect(button).toBeVisible();
    await button.click();
    button = page.getByRole("button", { name: "Kezdő állás" });
    await expect(button).toBeVisible();
    await button.click();

    await expect(page.getByText("O (Min)").first()).toBeVisible();
  });

  test("5.2 Algoritmus animáció megtekintése - Visszaterjesztés", async ({
    page,
  }) => {
    await page.goto("/learn");

    const learnContentMenu = page.getByLabel("Learn content menu");
    await expect(learnContentMenu).toBeVisible();
    await learnContentMenu.click();

    let button = page.getByRole("button", { name: "Visszaterjesztés" });
    await expect(button).toBeVisible();
    await button.click();
    button = page.getByLabel("next state");
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByText("Rejtett réteg értékei.")).toBeVisible();
  });

  test.fixme("5.2 Algoritmus animáció megtekintése - Neuronháló", async ({
    page,
  }) => {});
  test.fixme("5.2 Algoritmus animáció megtekintése - Genetikus algoritmus", async ({
    page,
  }) => {});
});
