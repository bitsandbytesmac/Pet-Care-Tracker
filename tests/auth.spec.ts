import { expect, test, type Page } from '@playwright/test'

// These tests start signed out (plain Playwright test, not the seeded fixture).

const uniqueEmail = () => `e2e-${crypto.randomUUID()}@petcare.test`
const PASSWORD = 'correct horse battery'

async function signUp(page: Page, email: string) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Create your account' })).toBeVisible()
  await page.getByLabel('Your name').fill('Test Owner')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
}

test.describe('authentication', () => {
  test('signed-out visitors are sent to sign in, then back where they were going', async ({ page }) => {
    const email = uniqueEmail()
    await signUp(page, email)
    await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
    await page.context().clearCookies()

    await page.goto('/medications')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/medications$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Medications' })).toBeVisible()
  })

  test('a wrong password shows an error and does not sign in', async ({ page }) => {
    const email = uniqueEmail()
    await signUp(page, email)
    await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
    await page.context().clearCookies()

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('not the password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('alert')).toHaveText('That email and password don’t match.')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('a new account starts empty, can add a pet, and can sign out', async ({ page }) => {
    await signUp(page, uniqueEmail())

    await expect(page.getByRole('region', { name: 'Get started' })).toBeVisible()
    await page.getByRole('region', { name: 'Get started' }).getByRole('link', { name: 'Add a pet' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Add a pet' })).toBeVisible()
    await page.getByLabel('Name').fill('Kuting')
    await page.getByLabel('Species').selectOption('Cat')
    await page.getByLabel('Breed').fill('Puspin')
    await page.getByRole('button', { name: 'Mint' }).click()
    await page.getByRole('button', { name: 'Save pet' }).click()

    await expect(page).toHaveURL(/\/pets\/[0-9a-f-]{36}$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kuting')
    await expect(page.getByRole('region', { name: 'Kuting' })).toHaveClass(/bg-pet-mint/)
    await expect(page.getByText('Cat · Puspin · Female')).toBeVisible()

    await page.goto('/')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('an expired session sends the user back to sign in', async ({ page }) => {
    await signUp(page, uniqueEmail())
    await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()

    await page.context().clearCookies()
    // Any API call now gets 401; the app notices and redirects.
    await page.getByRole('link', { name: 'Add a pet' }).filter({ visible: true }).first().click()
    await page.getByLabel('Name').fill('Ghost')
    await page.getByRole('button', { name: 'Save pet' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
