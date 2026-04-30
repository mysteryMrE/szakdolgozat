import { expect, test } from "@playwright/test";
import {
  loginViaUi,
  logoutViaUi,
  makeUniqueUsername,
  registerViaUi,
  validPassword,
  backendUrl,
} from "./utils";

const existingUser = `existingUser${Date.now()}`;

test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext();
  await request.post(`${backendUrl}/users/register`, {
    data: {
      username: existingUser,
      password: validPassword,
    },
  });
});

test.describe("Auth user stories", () => {
  test("1.1 Regisztráció helyesen", async ({ page }) => {
    const username = makeUniqueUsername("regOk");
    await registerViaUi(page, username, validPassword);
    await expect(
      page.getByText(new RegExp(`^${username.substring(0, 10)}`, "i")),
    ).toBeVisible();
  });

  const registerCases = [
    {
      name: "eltérő jelszavak",
      password: "DifferentPass1A",
      password2: "DifferentPass2B",
      username: undefined,
      error: "A jelszavak nem egyeznek meg",
    },
    {
      name: "rövid jelszó",
      password: "Short1",
      password2: undefined,
      username: undefined,
      error: "A jelszónak legalább 8 karakter hosszúnak kell lennie",
    },
    {
      name: "nagybetű nélküli jelszó",
      password: "lowercase1a",
      password2: undefined,
      username: undefined,
      error: "A jelszónak tartalmaznia kell legalább egy nagybetűt",
    },
    {
      name: "kisbetű nélküli jelszó",
      password: "UPPERCASE1A",
      password2: undefined,
      username: undefined,
      error: "A jelszónak tartalmaznia kell legalább egy kisbetűt",
    },
    {
      name: "szám nélküli jelszó",
      password: "NoNumberPassA",
      password2: undefined,
      username: undefined,
      error: "A jelszónak tartalmaznia kell legalább egy számot",
    },
    {
      name: "túl hosszú jelszó",
      password: "A".repeat(100) + "1a",
      password2: undefined,
      username: undefined,
      error: "A jelszó túl hosszú",
    },
    {
      name: "nem egyedi felhasználónév",
      password: validPassword,
      password2: undefined,
      username: existingUser,
      error: "A felhasználónév foglalt",
    },
    {
      name: "túl rövid felhasználónév",
      password: validPassword,
      password2: undefined,
      username: "ab",
      error: "Érvénytelen felhasználónév",
    },
    {
      name: "túl hosszú felhasználónév",
      password: validPassword,
      password2: undefined,
      username: "a".repeat(33),
      error: "Érvénytelen felhasználónév",
    },
    {
      name: "érvénytelen karakterek - * - a felhasználónévben",
      password: validPassword,
      password2: undefined,
      username: "invalid*user",
      error: "Érvénytelen felhasználónév",
    },
  ];

  registerCases.forEach(({ name, password, password2, error, username }) => {
    test(`1.2 Regisztráció helytelenül - ${name}`, async ({ page }) => {
      await page.goto("/register");

      await page
        .getByLabel("Név")
        .fill(username || makeUniqueUsername("regBad"));
      await page.getByLabel("Jelszó", { exact: true }).fill(password);
      await page.getByLabel("Jelszó megerősítése").fill(password2 || password);

      await page.getByRole("button", { name: "Regisztráció" }).click();

      await expect(page.getByRole("alert")).toContainText(error);
    });
  });

  test("2.1 Bejelentkezés helyesen", async ({ page }) => {
    await loginViaUi(page, existingUser, validPassword);
  });

  const loginCases = [
    {
      name: "helytelen jelszó",
      password: "WrongPass1A",
      username: undefined,
      error: "Érvénytelen felhasználónév vagy jelszó",
    },
    {
      name: "nem létező felhasználónév",
      password: undefined,
      username: `missing${Date.now()}`,
      error: "Érvénytelen felhasználónév vagy jelszó",
    },
  ];

  loginCases.forEach(({ name, password, username, error }) => {
    test(`2.2 Bejelentkezés helytelenül - ${name}`, async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("Név").fill(username || existingUser);
      await page
        .getByLabel("Jelszó", { exact: true })
        .fill(password || validPassword);
      await page.getByRole("button", { name: "Bejelentkezés" }).click();

      await expect(page.getByRole("alert")).toContainText(error);
    });
  });

  test("3 Kijelentkezés", async ({ page }) => {
    const username = makeUniqueUsername("logout");
    await registerViaUi(page, username, validPassword);

    await page.getByRole("link", { name: "Barkácsolás" }).click();

    await expect(page).toHaveURL(/\/playground/);
    await expect(
      page.getByRole("heading", { name: "Barkácsolás" }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Kijelentkezés" }),
    ).toBeVisible();
    await logoutViaUi(page);

    await expect(page).toHaveURL("/login");
  });
});
