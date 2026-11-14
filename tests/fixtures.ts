import { test as base, expect } from '@playwright/test'

/** The browser's clock in every test: Friday Nov 13, 7:30 PM local, so the 6 PM antibiotic is overdue and 9 PM is due. */
export const TODAY = '2026-11-13'
export const NOW = new Date(`${TODAY}T19:30:00`)

/**
 * `page` comes signed in as a brand-new user seeded with the sample data (Mochi, Bantay, …).
 * Every test gets its own account, so tests can run in parallel and never see each other's changes.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(NOW)
    // page.request shares the browser context's cookies, so the session cookie lands in the browser.
    const response = await page.request.post('/api/dev/demo-session', { data: { today: TODAY } })
    expect(response.ok(), await response.text()).toBe(true)
    await use(page)
  },
})

export { expect }
