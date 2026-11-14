import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const screens = [
  { name: 'Today', path: '/' },
  { name: 'Pet profile', path: '/pets/mochi' },
  { name: 'Medications', path: '/medications' },
  { name: 'Vet visits', path: '/visits' },
  { name: 'Log a symptom', path: '/log' },
]

test.describe('accessibility (axe, WCAG 2.1 AA)', () => {
  for (const { name, path } of screens) {
    test(`${name} has no detectable violations`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      // Print a readable summary instead of a huge object diff.
      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
      )
      expect(summary, summary.join('\n\n')).toEqual([])
    })
  }
})
