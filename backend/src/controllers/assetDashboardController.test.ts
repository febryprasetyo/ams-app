import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeAssetKpis, formatPurchaseTrend } from './assetDashboardController';
import router from '../routes/assetRoutes';

describe('Asset Dashboard Controller Logic', () => {
  test('computeAssetKpis aggregates operational counts accurately', () => {
    const mockRows = [
      { status: 'Assigned' },
      { status: 'Available' },
      { status: 'Assigned' },
      { status: 'Maintenance' },
      { status: 'Damaged' },
    ];
    const kpis = computeAssetKpis(mockRows);
    assert.strictEqual(kpis.totalAssets, 5);
    assert.strictEqual(kpis.assignedAssets, 2);
    assert.strictEqual(kpis.availableAssets, 1);
    assert.strictEqual(kpis.maintenanceAssets, 1);
    assert.strictEqual(kpis.damagedAssets, 1);
    assert.strictEqual(kpis.assignedPercentage, 40);
  });

  test('computeAssetKpis handles empty list safely without division by zero', () => {
    const kpis = computeAssetKpis([]);
    assert.strictEqual(kpis.totalAssets, 0);
    assert.strictEqual(kpis.assignedAssets, 0);
    assert.strictEqual(kpis.availableAssets, 0);
    assert.strictEqual(kpis.maintenanceAssets, 0);
    assert.strictEqual(kpis.damagedAssets, 0);
    assert.strictEqual(kpis.assignedPercentage, 0);
  });

  test('formatPurchaseTrend groups acquisition counts by month', () => {
    const mockRecords = [
      { date: new Date('2026-08-10') },
      { date: new Date('2026-08-25') },
      { date: new Date('2026-09-05') },
    ];
    const trend = formatPurchaseTrend(mockRecords, 6, new Date('2026-10-01'));
    assert.ok(Array.isArray(trend));
    const aug = trend.find((t) => t.month === '2026-08');
    assert.strictEqual(aug?.count, 2);
    const sep = trend.find((t) => t.month === '2026-09');
    assert.strictEqual(sep?.count, 1);
  });

  test('dashboard-summary route is registered on asset router before dynamic /:id', () => {
    const stack = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
    const paths = stack.flatMap((layer) => (layer.route ? [layer.route.path] : []));
    assert.ok(paths.includes('/dashboard-summary'), 'should register /dashboard-summary');
    assert.ok(
      paths.indexOf('/dashboard-summary') < paths.indexOf('/:id'),
      '/dashboard-summary must precede /:id to prevent route collision'
    );
  });
});
