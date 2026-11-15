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

  test('shows the last and next vaccination and deworming', async ({ page, isMobile }) => {
    await page.goto('/pets') // Mochi
    const preventive = page.getByRole('region', { name: 'Vaccines & deworming' })
    await expect(preventive).toContainText('Oct 2, 2026') // last deworming visit
    await expect(preventive.getByRole('link', { name: 'Schedule vaccination' })).toBeVisible()

    const switcher = page.getByRole('navigation', { name: isMobile ? 'Switch pet' : 'Your pets' })
    await switcher.getByRole('link', { name: 'Bantay' }).click()
    await expect(page.getByRole('region', { name: 'Vaccines & deworming' })).toContainText('Nov 17 · In 4 days')
  })

  test('“Log visit” opens the visit form for this pet', async ({ page, isMobile }) => {
    await page.goto('/pets') // Mochi
    if (isMobile) await page.getByRole('tab', { name: 'Health' }).click()
    await page.getByRole('region', { name: 'Vet visits' }).getByRole('link', { name: 'Log visit' }).click()

    const form = page.getByRole('region', { name: 'Log a vet visit' })
    await expect(form.getByLabel('Pet')).toHaveValue(/[0-9a-f-]{36}/)
    await expect(form.getByLabel('Pet').locator('option:checked')).toHaveText('Mochi')
  })

  test('deleting a pet asks first, then removes it and its records everywhere', async ({ page }) => {
    await page.goto('/pets')
    const bantayLink = page.getByRole('link', { name: 'Bantay' }).filter({ visible: true }).first()
    await bantayLink.click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bantay')

    await page.getByRole('button', { name: /^Edit/ }).filter({ visible: true }).click()
    const form = page.getByRole('region', { name: "Edit Bantay's profile" })
    await form.getByRole('button', { name: 'Delete Bantay' }).click()

    const dialog = page.getByRole('dialog', { name: 'Delete Bantay?' })
    await expect(dialog).toContainText('3 medications, 2 vet visits, 2 symptom entries, 3 photos and files')
    await expect(dialog).toContainText('This can’t be undone.')

    // Cancelling keeps everything.
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bantay')

    await form.getByRole('button', { name: 'Delete Bantay' }).click()
    await dialog.getByRole('button', { name: 'Delete Bantay' }).click()

    await expect(page.getByText('Bantay was deleted.')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mochi')

    await page.reload()
    await expect(page.getByRole('link', { name: 'Bantay' })).toHaveCount(0)

    // Bantay's medicines and visits are gone from the other screens too.
    await page.goto('/medications')
    await expect(page.getByRole('button', { name: 'Active (1)' })).toBeVisible()
    await page.goto('/visits')
    await expect(page.getByRole('list', { name: 'Visit history' }).getByRole('listitem')).toHaveCount(2)
    await expect(page.getByRole('list', { name: 'Upcoming appointments' })).toHaveCount(0)
  })
})
