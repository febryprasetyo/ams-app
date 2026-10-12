import { test, expect } from '@playwright/test';

test('serves the GAJIANICH login, production icon, and private metadata', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/login');
  await expect(page).toHaveTitle(/GAJIANICH/);
  await expect(page.getByRole('heading', { name: 'GAJIANICH', exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Masukkan username')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  const icon = page.locator('link[rel="icon"]').last();
  await expect(icon).toHaveAttribute('href', /favicon\.ico\?v=gajianich/);
  const response = await request.get((await icon.getAttribute('href'))!);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('image/');
  expect(errors).toEqual([]);
});

test('redirects an unauthenticated dashboard visit to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('does not serve starter framework assets', async ({ request }) => {
  for (const path of ['/next.svg', '/vercel.svg']) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test('shows the branded missing-page screen', async ({ page }) => {
  const response = await page.goto('/halaman-audit-tidak-ada');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kembali ke beranda' })).toBeVisible();
  await expect(page.getByText('GAJIANICH', { exact: true })).toBeVisible();
});
