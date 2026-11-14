import { expect, test } from '@playwright/test'

test.describe('log a symptom', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/log')
  })

  test('saving an entry shows a confirmation and puts it at the top of History', async ({ page }) => {
    await page.getByRole('button', { name: 'Bantay', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Bantay', exact: true })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Vomiting', exact: true }).click()
    await page.getByRole('button', { name: 'Lethargy', exact: true }).click()
    await page.getByRole('button', { name: 'Moderate', exact: true }).click()
    await page.getByLabel('Notes').fill('Threw up after breakfast, sleepy all afternoon')

    await page.getByRole('button', { name: /^Save entry/ }).click()

    await expect(page.getByRole('status')).toHaveText("Saved to Bantay's log")

    const first = page.getByRole('list', { name: 'Symptom history' }).getByRole('listitem').first()
    await expect(first).toContainText('Bantay')
    await expect(first).toContainText('Vomiting, Lethargy')
    await expect(first).toContainText('Moderate')
    await expect(first).toContainText('Threw up after breakfast')

    // The form resets for the next entry.
    await expect(page.getByRole('button', { name: 'Vomiting', exact: true })).toHaveAttribute('aria-pressed', 'false')
  })

  test('asks for at least one symptom', async ({ page }) => {
    await page.getByRole('button', { name: /^Save entry/ }).click()
    await expect(page.getByRole('alert')).toHaveText('Pick at least one symptom.')
    await expect(page.getByRole('list', { name: 'Symptom history' }).getByRole('listitem')).toHaveCount(4)
  })
})
