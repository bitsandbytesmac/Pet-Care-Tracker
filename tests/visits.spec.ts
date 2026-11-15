import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

/** The history list; phones show it as a timeline, desktop as a master/detail list. */
const historyList = (page: Page) => page.getByRole('list', { name: 'Visit history' })
const upcomingList = (page: Page) => page.getByRole('list', { name: 'Upcoming appointments' })

/** Open a past visit's details: click it on desktop, expand its timeline card on phones. */
async function openVisit(page: Page, title: string, isMobile: boolean): Promise<Locator> {
  if (isMobile) {
    const card = page.getByRole('article', { name: title })
    await card.getByRole('button', { expanded: false }).click()
    return card
  }
  // Match by visible text rather than a regex: titles can contain characters like "(".
  await historyList(page)
    .getByRole('button')
    .filter({ hasText: title })
    .first()
    .click()
  return page.getByRole('region', { name: 'Visit details' })
}

test.describe('vet visits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visits')
  })

  test('shows the upcoming appointment, separate from the history', async ({ page }) => {
    const upcoming = upcomingList(page).getByRole('article', { name: 'Annual check-up & vaccines' })
    await expect(upcoming).toBeVisible()
    await expect(upcoming).toContainText('In 4 days')
    await expect(upcoming).toContainText('Vaccination')
    await expect(upcoming).toContainText('Tue, Nov 17 · 10:00 AM')
    await expect(upcoming).toContainText('Reminder: 1 day before')
    // Not due yet, so it can be edited but not marked done.
    await expect(upcoming.getByRole('button', { name: 'Mark as done' })).toHaveCount(0)
    await expect(historyList(page).getByText('Annual check-up & vaccines')).toHaveCount(0)
  })

  test('filtering by Mochi shows only Mochi’s visits', async ({ page }) => {
    const history = historyList(page)
    await expect(history.getByRole('listitem')).toHaveCount(3)

    await page.getByRole('button', { name: 'Mochi', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Mochi', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(history.getByRole('listitem')).toHaveCount(2)
    await expect(history.getByText('Ear irritation')).toBeVisible()
    await expect(history.getByText('Routine deworming')).toBeVisible()
    await expect(history.getByText('Skin infection on hind leg')).toBeHidden()
    await expect(page.getByText('No appointments scheduled.', { exact: false })).toBeVisible()

    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(history.getByRole('listitem')).toHaveCount(3)
  })

  test('filtering by type finds deworming records', async ({ page }) => {
    await page.getByLabel('Type').selectOption('Deworming')
    await expect(historyList(page).getByRole('listitem')).toHaveCount(1)
    await expect(historyList(page)).toContainText('Routine deworming')
  })

  test('clicking a visit updates the details panel', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The details panel is desktop-only; phones expand timeline cards.')

    const details = page.getByRole('region', { name: 'Visit details' })
    await expect(details.getByRole('heading', { name: 'Skin infection on hind leg' })).toBeVisible()
    await expect(details).toContainText('Antibiotic · 1 tablet with food, twice daily, 14 days')
    await expect(details).toContainText('1,250.00')

    const earIrritation = historyList(page).getByRole('button', { name: /Ear irritation/ })
    await earIrritation.click()

    await expect(earIrritation).toHaveAttribute('aria-pressed', 'true')
    await expect(details.getByRole('heading', { name: 'Ear irritation' })).toBeVisible()
    await expect(details).toContainText('Ear drops · 2 drops, left ear, twice daily, 10 days')
    await expect(details.getByRole('heading', { name: 'Skin infection on hind leg' })).toBeHidden()
  })

  test('logs a past vet visit with its findings and cost', async ({ page, isMobile }) => {
    await page.getByRole('button', { name: 'Log vet visit' }).click()
    const form = page.getByRole('region', { name: 'Log a vet visit' })
    await form.getByLabel('Pet').selectOption({ label: 'Bantay' })
    await form.getByLabel('Visit type').selectOption('Vaccination')
    await form.getByLabel('Reason for visit').fill('Rabies booster')
    await form.getByLabel('Date').fill('2026-11-12')
    await form.getByLabel('Vet or clinic').fill('Happy Paws Clinic')
    await form.getByLabel('Diagnosis or findings').fill('Healthy, no reaction')
    await form.getByLabel('Treatment or medication').fill('Rabies vaccine')
    await form.getByLabel('Cost').fill('850')
    await form.getByRole('button', { name: 'Save visit' }).click()

    await expect(page.getByText('Visit saved to Bantay’s history.')).toBeVisible()
    await expect(form).toBeHidden()

    await page.reload()
    await expect(historyList(page).getByRole('listitem')).toHaveCount(4)
    const details = await openVisit(page, 'Rabies booster', isMobile)
    await expect(details).toContainText('Healthy, no reaction')
    await expect(details).toContainText('Rabies vaccine')
    await expect(details).toContainText('850.00')
    await expect(details).toContainText('Happy Paws Clinic')
  })

  test('explains what is missing instead of saving', async ({ page }) => {
    await page.getByRole('button', { name: 'Log vet visit' }).click()
    const form = page.getByRole('region', { name: 'Log a vet visit' })
    await form.getByRole('button', { name: 'Save visit' }).click()
    await expect(form.getByRole('alert')).toHaveText('Add the reason for the visit.')

    await form.getByLabel('Reason for visit').fill('Checkup')
    await form.getByLabel('Date').fill('2026-12-01')
    await form.getByRole('button', { name: 'Save visit' }).click()
    await expect(form.getByRole('alert')).toContainText('can’t be in the future')
  })

  test('schedules an appointment with a reminder', async ({ page }) => {
    await page.getByRole('button', { name: 'Schedule' }).click()
    const form = page.getByRole('region', { name: 'Schedule an appointment' })
    await expect(form.getByRole('button', { name: 'Upcoming' })).toHaveAttribute('aria-pressed', 'true')
    // Findings belong to a finished visit, so they aren't asked for yet.
    await expect(form.getByLabel('Diagnosis or findings')).toHaveCount(0)

    await form.getByLabel('Pet').selectOption({ label: 'Mochi' })
    await form.getByLabel('Visit type').selectOption('Deworming')
    await form.getByLabel('Reason for visit').fill('Quarterly deworming')
    await form.getByLabel('Date').fill('2026-11-20')
    await form.getByLabel('Time').fill('14:00')
    await form.getByLabel('Reminder').selectOption({ label: '1 week before' })
    await form.getByRole('button', { name: 'Schedule' }).click()

    await expect(page.getByText('Appointment scheduled for Mochi on Nov 20.')).toBeVisible()
    await page.reload()
    const appointment = upcomingList(page).getByRole('article', { name: 'Quarterly deworming' })
    await expect(appointment).toContainText('In 7 days')
    await expect(appointment).toContainText('Fri, Nov 20 · 2:00 PM')
    await expect(appointment).toContainText('Reminder: 1 week before')
  })

  test('marks an appointment that is due as done', async ({ page }) => {
    await page.getByRole('button', { name: 'Schedule' }).click()
    const form = page.getByRole('region', { name: 'Schedule an appointment' })
    await form.getByLabel('Reason for visit').fill('Dental cleaning')
    await form.getByLabel('Visit type').selectOption('Dental care')
    await form.getByRole('button', { name: 'Schedule' }).click()

    const appointment = upcomingList(page).getByRole('article', { name: 'Dental cleaning' })
    await expect(appointment).toContainText('Today')
    await appointment.getByRole('button', { name: 'Mark as done' }).click()

    const done = page.getByRole('region', { name: 'Mark visit as done' })
    await done.getByLabel('Diagnosis or findings').fill('Mild tartar removed')
    await done.getByRole('button', { name: 'Save visit' }).click()

    await expect(page.getByText('Visit updated.')).toBeVisible()
    await page.reload()
    await expect(upcomingList(page).getByText('Dental cleaning')).toHaveCount(0)
    await expect(historyList(page)).toContainText('Dental cleaning')
  })

  test('edits a past visit, then deletes it after confirming', async ({ page, isMobile }) => {
    const details = await openVisit(page, 'Ear irritation', isMobile)
    await details.getByRole('button', { name: 'Edit Ear irritation' }).click()

    const form = page.getByRole('region', { name: 'Edit visit' })
    await form.getByLabel('Reason for visit').fill('Ear irritation (left)')
    await form.getByRole('button', { name: 'Save visit' }).click()
    await expect(page.getByText('Visit updated.')).toBeVisible()
    await page.reload()
    await expect(historyList(page)).toContainText('Ear irritation (left)')

    const reopened = await openVisit(page, 'Ear irritation (left)', isMobile)
    await reopened.getByRole('button', { name: 'Edit Ear irritation (left)' }).click()
    await page.getByRole('region', { name: 'Edit visit' }).getByRole('button', { name: 'Delete visit' }).click()

    const dialog = page.getByRole('dialog', { name: 'Delete this visit?' })
    await expect(dialog).toContainText('Medicines prescribed at this visit stay in Medications.')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(historyList(page)).toContainText('Ear irritation (left)')

    await page.getByRole('region', { name: 'Edit visit' }).getByRole('button', { name: 'Delete visit' }).click()
    await dialog.getByRole('button', { name: 'Delete visit' }).click()
    await expect(page.getByText('Visit deleted.')).toBeVisible()

    await page.reload()
    await expect(historyList(page).getByRole('listitem')).toHaveCount(2)
    await expect(historyList(page)).not.toContainText('Ear irritation')
  })
})
