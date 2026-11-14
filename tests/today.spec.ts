import { expect, test } from '@playwright/test'

test.describe('today', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('marking the overdue antibiotic as given updates the summary, and Undo reverts it', async ({ page }) => {
    const summary = page.getByRole('region', { name: 'Doses given' })
    await expect(summary).toContainText('2 / 4')

    const schedule = page.getByRole('list', { name: 'Medication schedule' })
    const antibiotic = schedule.getByRole('listitem').filter({ hasText: 'Antibiotic' })
    const name = antibiotic.getByText('Antibiotic', { exact: true })

    await expect(antibiotic.getByText('Overdue', { exact: true }).filter({ visible: true })).toBeVisible()
    await expect(name).not.toHaveCSS('text-decoration-line', 'line-through')

    await antibiotic.getByRole('button', { name: 'Mark given' }).click()

    await expect(summary).toContainText('3 / 4')
    await expect(antibiotic.getByText('Overdue', { exact: true })).toHaveCount(0)
    await expect(name).toHaveCSS('text-decoration-line', 'line-through')

    await antibiotic.getByRole('button', { name: 'Undo' }).click()

    await expect(summary).toContainText('2 / 4')
    await expect(antibiotic.getByText('Overdue', { exact: true }).filter({ visible: true })).toBeVisible()
    await expect(name).not.toHaveCSS('text-decoration-line', 'line-through')
  })

  test('the progress bar follows the dose count', async ({ page }) => {
    const bar = page.getByRole('progressbar', { name: 'Doses given today' })
    await expect(bar).toHaveAttribute('value', '2')
    await page
      .getByRole('list', { name: 'Medication schedule' })
      .getByRole('listitem')
      .filter({ hasText: 'Antibiotic' })
      .getByRole('button', { name: 'Mark given' })
      .click()
    await expect(bar).toHaveAttribute('value', '3')
  })
})
