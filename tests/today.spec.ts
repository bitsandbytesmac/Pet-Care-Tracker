import { expect, test } from './fixtures'

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

    // Saved to the server: still given after a reload.
    await page.reload()
    await expect(summary).toContainText('3 / 4')
    await expect(name).toHaveCSS('text-decoration-line', 'line-through')

    await antibiotic.getByRole('button', { name: 'Undo' }).click()

    await expect(summary).toContainText('2 / 4')
    await expect(antibiotic.getByText('Overdue', { exact: true }).filter({ visible: true })).toBeVisible()
    await expect(name).not.toHaveCSS('text-decoration-line', 'line-through')
  })

  test('overdue follows the clock', async ({ page }) => {
    const schedule = page.getByRole('list', { name: 'Medication schedule' })
    const row = (name: string, time: string) =>
      schedule.getByRole('listitem').filter({ hasText: name }).filter({ hasText: time })
    // The clock is 7:30 PM: the 6 PM antibiotic is overdue, the 9 PM ear drops are not yet.
    await expect(row('Antibiotic', '6:00 PM').getByText('Overdue', { exact: true }).filter({ visible: true })).toBeVisible()
    await expect(row('Ear drops', '9:00 PM').getByText('Due', { exact: true }).filter({ visible: true })).toBeVisible()
  })

  test('rolls back and explains when saving a dose fails', async ({ page }) => {
    await page.route('**/api/doses/*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Database is down' }) }),
    )
    const summary = page.getByRole('region', { name: 'Doses given' })
    await page
      .getByRole('list', { name: 'Medication schedule' })
      .getByRole('listitem')
      .filter({ hasText: 'Antibiotic' })
      .getByRole('button', { name: 'Mark given' })
      .click()

    await expect(page.getByRole('alert')).toContainText('Couldn’t save that dose. Database is down')
    await expect(summary).toContainText('2 / 4')
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
