import { expect, test } from './fixtures'

test.describe('pet profile', () => {
  test('switching pets changes the name, banner and medication list', async ({ page, isMobile }) => {
    await page.goto('/pets') // redirects to the first pet (Mochi)

    const meds = page.getByRole('region', { name: 'Active medications' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mochi')
    const mochiUrl = page.url()
    await expect(page.getByRole('region', { name: 'Mochi', exact: true })).toHaveClass(/bg-pet-peach/)
    await expect(page.getByText('Cat · Domestic shorthair · Female')).toBeVisible()
    await expect(meds.getByText('Ear drops', { exact: true })).toBeVisible()
    await expect(meds.getByText('Antibiotic', { exact: true })).toBeHidden()

    const switcher = page.getByRole('navigation', { name: isMobile ? 'Switch pet' : 'Your pets' })
    await switcher.getByRole('link', { name: 'Bantay' }).click()

    await expect(page).not.toHaveURL(mochiUrl)
    await expect(page).toHaveURL(/\/pets\/[0-9a-f-]{36}$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bantay')
    await expect(page.getByRole('region', { name: 'Bantay', exact: true })).toHaveClass(/bg-pet-mint/)
    await expect(page.getByText('Dog · Aspin · Male')).toBeVisible()
    await expect(meds.getByText('Antibiotic', { exact: true })).toBeVisible()
    await expect(meds.getByText('Joint supplement', { exact: true })).toBeVisible()
    await expect(meds.getByText('Ear drops', { exact: true })).toBeHidden()
  })

  test('editing the profile updates the banner', async ({ page }) => {
    await page.goto('/pets') // redirects to the first pet (Mochi)
    await page.getByRole('button', { name: /^Edit/ }).filter({ visible: true }).click()

    const form = page.getByRole('region', { name: "Edit Mochi's profile" })
    await form.getByLabel('Age').fill('3 years')
    await form.getByLabel('Weight').fill('4.2 kg')
    await form.getByRole('button', { name: 'Save' }).click()

    await expect(form).toBeHidden()
    const banner = page.getByRole('region', { name: 'Mochi', exact: true })
    await expect(banner).toContainText('3 years')
    await expect(banner).toContainText('4.2 kg')

    await page.reload()
    await expect(page.getByRole('region', { name: 'Mochi', exact: true })).toContainText('3 years')
  })

  test('phone tabs switch between profile sections', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Tabs are phone-only; desktop shows every card.')
    await page.goto('/pets') // redirects to the first pet (Mochi)

    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('region', { name: 'Care details' })).toBeVisible()

    await page.getByRole('tab', { name: 'Health' }).click()
    await expect(page.getByRole('tab', { name: 'Health' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('region', { name: 'Weight trend' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Care details' })).toBeHidden()
  })
})
