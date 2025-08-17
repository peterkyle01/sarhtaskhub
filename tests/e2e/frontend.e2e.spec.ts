import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let _page: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    _page = await context.newPage()
  })

  test('can go on homepage', async () => {
    await _page.goto('http://localhost:3000')

    await expect(_page).toHaveTitle(/Payload Blank Template/)

    const heading = _page.locator('h1').first()

    await expect(heading).toHaveText('Welcome to your new project.')
  })
})
