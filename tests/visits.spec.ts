import { expect, test } from '@playwright/test'

test.describe('vet visits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visits')
  })

  test('shows the upcoming visit', async ({ page }) => {
    const upcoming = page.getByRole('region', { name: 'Annual check-up & vaccines' })
    await expect(upcoming).toBeVisible()
    await expect(upcoming).toContainText('In 4 days')
    await expect(upcoming).toContainText('Tue, Nov 17 · 10:00 AM')
  })

  test('filtering by Mochi shows only Mochi’s visits', async ({ page }) => {
    const history = page.getByRole('list', { name: 'Visit history' })
    await expect(history.getByRole('listitem')).toHaveCount(3)

    await page.getByRole('button', { name: 'Mochi', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Mochi', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(history.getByRole('listitem')).toHaveCount(2)
    await expect(history.getByText('Ear irritation')).toBeVisible()
    await expect(history.getByText('Routine deworming')).toBeVisible()
    await expect(history.getByText('Skin infection on hind leg')).toBeHidden()

    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(history.getByRole('listitem')).toHaveCount(3)
  })

  test('clicking a visit updates the details panel', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The details panel is desktop-only; phones show a timeline.')

    const details = page.getByRole('region', { name: 'Visit details' })
    await expect(details.getByRole('heading', { name: 'Skin infection on hind leg' })).toBeVisible()
    await expect(details).toContainText('Antibiotic · 1 tablet with food, twice daily, 14 days')

    await page.getByRole('button', { name: /Ear irritation/ }).click()

    await expect(page.getByRole('button', { name: /Ear irritation/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(details.getByRole('heading', { name: 'Ear irritation' })).toBeVisible()
    await expect(details).toContainText('Ear drops · 2 drops, left ear, twice daily, 10 days')
    await expect(details.getByRole('heading', { name: 'Skin infection on hind leg' })).toBeHidden()
  })
})
