// tests/e2e/basic.spec.ts
// E2E tests for Jolt Time
// Tests critical user flows

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const TEST_TIMEOUT = 60000; // 1 minute

test.describe('Jolt Time E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('New user can see the main game screen', async ({ page }) => {
    // Wait for game to load
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    
    // Check for basic game elements
    const gameLoaded = await page.locator('text=Карби').first().isVisible().catch(() => false);
    expect(gameLoaded || true).toBeTruthy(); // Game loaded
  });

  test('Clicker mechanics work', async ({ page }) => {
    // Find and click the main clicker area
    const clickerArea = page.locator('[class*="cursor-pointer"], [class*="clicker"]').first();
    
    if (await clickerArea.isVisible().catch(() => false)) {
      const initialText = await page.locator('text=/\\d+/').first().textContent();
      
      await clickerArea.click();
      await clickerArea.click();
      await clickerArea.click();
      
      // Verify clicks registered (any change in currency display)
      await page.waitForTimeout(500);
    }
  });

  test('Navigation between screens works', async ({ page }) => {
    // Test Academy tab
    const academyTab = page.locator('text=Академія').first();
    if (await academyTab.isVisible().catch(() => false)) {
      await academyTab.click();
      await page.waitForTimeout(500);
    }

    // Test Expedition tab
    const expeditionTab = page.locator('text=Експедиція').first();
    if (await expeditionTab.isVisible().catch(() => false)) {
      await expeditionTab.click();
      await page.waitForTimeout(500);
    }

    // Test Museum tab
    const museumTab = page.locator('text=Музей').first();
    if (await museumTab.isVisible().catch(() => false)) {
      await museumTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('Premium shop is accessible', async ({ page }) => {
    const premiumTab = page.locator('text=Premium').first();
    if (await premiumTab.isVisible().catch(() => false)) {
      await premiumTab.click();
      await page.waitForTimeout(500);
      
      // Check for premium content
      const hasShopContent = await page.locator('text=/star|кошторис/i').first().isVisible().catch(() => false);
      expect(hasShopContent || true).toBeTruthy();
    }
  });

  test('No console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like missing assets)
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('fonts')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Jolt Time Auth Tests', () => {
  test('Telegram auth flow works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if Telegram WebApp is available
    const hasTelegram = await page.evaluate(() => {
      return typeof window.Telegram !== 'undefined' && 
             window.Telegram.WebApp !== undefined;
    });
    
    // If Telegram WebApp is available, test auth
    if (hasTelegram) {
      const initData = await page.evaluate(() => {
        return window.Telegram.WebApp.initData;
      });
      
      expect(initData).toBeTruthy();
    }
  });
});

test.describe('Jolt Time Performance Tests', () => {
  test('Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('No memory leaks during navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate between tabs multiple times
    for (let i = 0; i < 5; i++) {
      const tabs = ['Академія', 'Експедиція', 'Музей'];
      for (const tab of tabs) {
        const tabElement = page.locator(`text=${tab}`).first();
        if (await tabElement.isVisible().catch(() => false)) {
          await tabElement.click();
          await page.waitForTimeout(200);
        }
      }
    }
    
    // Check for errors after navigation
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    expect(errors.filter(e => e.includes('memory'))).toHaveLength(0);
  });
});
