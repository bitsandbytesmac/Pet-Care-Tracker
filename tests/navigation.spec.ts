import { expect, test } from './fixtures'

/** "Pets" opens the first pet's profile; pet ids are UUIDs. */
const PET_URL = /\/pets\/[0-9a-f-]{36}$/

const desktopLinks = [
  { name: 'Today', path: /\/$/, heading: 'Today' },
  { name: 'Pets', path: PET_URL, heading: 'Mochi' },
  { name: 'Medications', path: /\/medications$/, heading: 'Medications' },
  { name: 'Vet visits', path: /\/visits$/, heading: 'Vet visits' },
  { name: 'Symptom log', path: /\/log$/, heading: /symptom log/i },
]

const mobileLinks = [
  { name: 'Today', path: /\/$/, heading: 'Today' },
  { name: 'Pets', path: PET_URL, heading: 'Mochi' },
  { name: 'Meds', path: /\/medications$/, heading: 'Medications' },
  { name: 'Visits', path: /\/visits$/, heading: 'Vet visits' },
  { name: 'Log', path: /\/log$/, heading: /log a symptom/i },
]

test.describe('navigation', () => {
  test('shows the layout for the current screen size', async ({ page, isMobile }) => {
    await page.goto('/')
    const sidebar = page.getByRole('navigation', { name: 'Sidebar' })
    const tabBar = page.getByRole('navigation', { name: 'Tab bar' })

    if (isMobile) {
      await expect(tabBar).toBeVisible()
      await expect(sidebar).toBeHidden()
    } else {
      await expect(sidebar).toBeVisible()
      await expect(tabBar).toBeHidden()
    }
  })

  test('each nav link opens its screen and is marked as current', async ({ page, isMobile }) => {
    await page.goto('/visits')
    const nav = page.getByRole('navigation', { name: isMobile ? 'Tab bar' : 'Sidebar' })
    const links = isMobile ? mobileLinks : desktopLinks

    for (const { name, path, heading } of links) {
      const link = nav.getByRole('link', { name, exact: true })
      await link.click()
      await expect(page).toHaveURL(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expect(link).toHaveAttribute('aria-current', 'page')
      // Only one link in the nav is current at a time.
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
    }
  })
})
