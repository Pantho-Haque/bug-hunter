import { chromium } from 'playwright';

/**
 * Prefer the system Chrome so nobody has to download a second browser, but fall
 * back to Playwright's bundled Chromium where there is no system install (CI
 * images vary). Both harnesses need the same behaviour.
 */
export const launchChrome = async () => {
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    return chromium.launch();
  }
};
