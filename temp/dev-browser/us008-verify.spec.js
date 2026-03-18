const { test, expect } = require('playwright/test');
const fs = require('fs');
const path = require('path');

test.use({ browserName: 'chromium', channel: 'msedge' });

test('US-008 browser verification', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('swing-gui-builder.sidebar.palette-collapsed', 'false');
    window.localStorage.setItem('swing-gui-builder.sidebar.hierarchy-collapsed', 'false');
  });

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  const paletteHeading = page.getByRole('heading', { name: 'Palette' });
  const hierarchyHeading = page.getByRole('heading', { name: 'Hierarchy' });
  await expect(paletteHeading).toBeVisible();
  await expect(hierarchyHeading).toBeVisible();

  const sidebarOrder = await page.evaluate(() => {
    const sidebar = document.querySelector('main > section > aside');
    if (!sidebar) return [];
    return Array.from(sidebar.querySelectorAll(':scope > section')).map((section) => {
      const heading = section.querySelector('h2');
      return heading ? heading.textContent?.trim() ?? '' : '';
    });
  });

  const [paletteBox, hierarchyBox] = await Promise.all([
    paletteHeading.boundingBox(),
    hierarchyHeading.boundingBox(),
  ]);

  if (!paletteBox || !hierarchyBox) {
    throw new Error('Could not read panel header positions for sidebar order check.');
  }

  const isPaletteAboveHierarchy = paletteBox.y < hierarchyBox.y;

  const secretText = 'supersecret42';
  await page.evaluate((payload) => {
    window.postMessage(
      {
        type: 'loadState',
        state: {
          className: 'MainWindow',
          frameWidth: 1024,
          frameHeight: 768,
          components: [
            {
              id: 'password-field-1',
              type: 'PasswordField',
              variableName: 'passwordField1',
              x: 180,
              y: 150,
              width: 180,
              height: 36,
              text: payload.secret,
              backgroundColor: '#ffffff',
              textColor: '#000000',
              fontFamily: 'Arial',
              fontSize: 12,
              eventMethodName: '',
            },
          ],
        },
      },
      '*',
    );
  }, { secret: secretText });

  const passwordComponent = page.getByLabel('PasswordField component');
  await expect(passwordComponent).toBeVisible();

  const passwordPreviewText = ((await passwordComponent.innerText()) || '').trim();
  const containsMaskBullet = /•/.test(passwordPreviewText);
  const containsPlainText = passwordPreviewText.includes(secretText);
  const containsGenericFallback = passwordPreviewText.includes('PasswordField');

  const screenshotPath = path.resolve(process.cwd(), 'temp', 'dev-browser', 'us008-ux-verification.png');
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`EVIDENCE::${JSON.stringify({
    sidebarOrder,
    isPaletteAboveHierarchy,
    paletteY: paletteBox.y,
    hierarchyY: hierarchyBox.y,
    passwordPreviewText,
    containsMaskBullet,
    containsPlainText,
    containsGenericFallback,
    screenshotPath,
  })}`);

  expect(sidebarOrder[0]).toBe('Palette');
  expect(sidebarOrder[1]).toBe('Hierarchy');
  expect(isPaletteAboveHierarchy).toBe(true);
  expect(containsMaskBullet).toBe(true);
  expect(containsPlainText).toBe(false);
  expect(containsGenericFallback).toBe(false);
});

