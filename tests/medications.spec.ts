import { expect, test } from '@playwright/test'

test.describe('medications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/medications')
  })

  test('the Active / Completed toggle switches the list', async ({ page }) => {
    const main = page.getByRole('main')
    const activeToggle = page.getByRole('button', { name: 'Active (3)' })
    const completedToggle = page.getByRole('button', { name: 'Completed (2)' })

    await expect(activeToggle).toHaveAttribute('aria-pressed', 'true')
    await expect(main.getByText('Antibiotic', { exact: true })).toBeVisible()
    await expect(main.getByText('Ear drops', { exact: true })).toBeVisible()
    await expect(main.getByText('Dewormer', { exact: true })).toBeHidden()

    await completedToggle.click()

    await expect(completedToggle).toHaveAttribute('aria-pressed', 'true')
    await expect(activeToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(main.getByText('Dewormer', { exact: true })).toBeVisible()
    await expect(main.getByText('Anti-itch spray', { exact: true })).toBeVisible()
    await expect(main.getByText('Antibiotic', { exact: true })).toBeHidden()

    await activeToggle.click()
    await expect(main.getByText('Antibiotic', { exact: true })).toBeVisible()
  })

  test('shows the refill alert for the joint supplement', async ({ page }) => {
    await expect(page.getByText('Refill soon: Joint supplement')).toBeVisible()
    await expect(page.getByText('About 5 days left for Bantay')).toBeVisible()

    await page.getByRole('button', { name: 'Mark as refilled' }).click()
    await expect(page.getByText('Refill soon: Joint supplement')).toBeHidden()
  })

  test('adding a medication puts it in the list and on today’s schedule', async ({ page, isMobile }) => {
    if (isMobile) await page.getByRole('button', { name: 'Add medication' }).click()

    const form = page.getByRole('region', { name: 'Add medication' })
    await form.getByLabel('Medicine name').fill('Probiotic')
    await form.getByLabel('Pet').selectOption({ label: 'Mochi' })
    await form.getByLabel('Dose').fill('1 sachet')
    await form.getByLabel('How often').selectOption('Once daily')
    await form.getByLabel('For how long').fill('5 days')
    await form.getByRole('button', { name: 'Save medication' }).click()

    await expect(form.getByRole('status')).toHaveText('Probiotic added for Mochi.')
    await expect(page.getByRole('button', { name: 'Active (4)' })).toBeVisible()
    await expect(page.getByRole('main').getByText('Probiotic', { exact: true })).toBeVisible()

    // Navigate client-side (a full reload would reset the in-memory state).
    const nav = page.getByRole('navigation', { name: isMobile ? 'Tab bar' : 'Sidebar' })
    await nav.getByRole('link', { name: 'Today', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Doses given' })).toContainText('2 / 5')
  })
})
