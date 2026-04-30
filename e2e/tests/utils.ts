import { expect, type Page } from "@playwright/test";

export const backendUrl = "http://localhost:8000";
export const validPassword = "E2ePassword1A";

export function makeUniqueUsername(prefix = "e2e") {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

export function makeNetworkName(prefix = "e2e", maxLength = 15) {
  const datePart = Date.now().toString();
  const randomPart = Math.floor(Math.random() * 10000).toString();

  const uniqueSuffix = datePart + randomPart;
  const allowedUniqueLength = maxLength - prefix.length - 1;

  const slicedUnique = uniqueSuffix.slice(-allowedUniqueLength);
  return `${prefix}_${slicedUnique}`;
}

export async function registerViaUi(
  page: Page,
  username: string,
  password: string = validPassword,
) {
  await page.goto("/register");
  await page.getByLabel("Név").fill(username);
  await page.getByLabel("Jelszó", { exact: true }).fill(password);
  await page.getByLabel("Jelszó megerősítése").fill(password);
  await page.getByRole("button", { name: "Regisztráció" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: "Kijelentkezés" }),
  ).toBeVisible();
}

export async function loginViaUi(
  page: Page,
  username: string,
  password: string = validPassword,
) {
  await page.goto("/login");
  await page.getByLabel("Név").fill(username);
  await page.getByLabel("Jelszó", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Bejelentkezés" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: "Kijelentkezés" }),
  ).toBeVisible();
}

export async function logoutViaUi(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Kijelentkezés" }).click();
  await expect(page.getByRole("link", { name: "Bejelentkezés" })).toBeVisible();
}

export async function openHomeAndWaitForConnection(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Játék", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Játék létrehozása" }),
  ).toBeEnabled({ timeout: 3000 });
}

export async function openPlaygroundAsFreshUser(page: Page) {
  const username = makeUniqueUsername("pg");
  await registerViaUi(page, username, validPassword);
  await page.getByRole("link", { name: "Barkácsolás" }).click(); // client side routing, no page reload
  //await page.goto('/playground'); // much slower, because it reloads the page
  await expect(
    page.getByRole("heading", { name: "Barkácsolás" }),
  ).toBeVisible();
}

export async function createNetwork(
  page: Page,
  networkName: string,
  layers = "18,9",
) {
  await page.getByLabel("Hálózat neve").fill(networkName);
  await page.getByLabel("Rétegek").fill(layers);
  await page.getByRole("button", { name: "Neuronháló létrehozása" }).click();

  const row = page.getByRole("row").filter({ hasText: networkName });
  await expect(row).toBeVisible();
  return row;
}

export function cellRegex(row: number, col: number, mark: string) {
  return new RegExp(`Sor ${row} Oszlop ${col}: ${mark}`, "i");
}

export async function startHumanVsMinimax(page: Page, rounds = 1) {
  await openHomeAndWaitForConnection(page);

  await page.getByLabel("X játékos").selectOption("human");
  await page.getByLabel("O játékos").selectOption("minimax");

  const roundsInput = page.getByLabel("Körök száma");
  await roundsInput.fill(String(rounds));
  await roundsInput.blur();

  const delayInput = page.getByLabel("Lépés késleltetés (mp)");
  await delayInput.fill("0.02");
  await delayInput.blur();

  const roundDelayInput = page.getByLabel("Kör késleltetés (mp)");
  await roundDelayInput.fill("0.02");
  await roundDelayInput.blur();

  await page.getByRole("button", { name: "Játék létrehozása" }).click();
  await expect(page.getByLabel("Game statistics")).toBeVisible();
}

export async function playerAndMinimax(
  page: Page,
  xMove: [number, number],
  oMove: [number, number],
) {
  await page
    .getByRole("button", { name: cellRegex(xMove[0], xMove[1], "üres") })
    .click();
  await expect(
    page.getByRole("button", { name: cellRegex(xMove[0], xMove[1], "X") }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: cellRegex(oMove[0], oMove[1], "O") }),
  ).toBeVisible({ timeout: 5000 });
}

export async function playDraw(page: Page) {
  await playerAndMinimax(page, [1, 1], [2, 2]);
  await playerAndMinimax(page, [1, 2], [1, 3]);
  await playerAndMinimax(page, [3, 1], [2, 1]);

  await playerAndMinimax(page, [2, 3], [3, 3]);

  await page.getByRole("button", { name: cellRegex(3, 2, "üres") }).click();
  await expect(
    page.getByRole("button", { name: cellRegex(3, 2, "X") }),
  ).toBeVisible();
}
