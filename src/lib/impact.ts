const M3_PER_DOLLAR_PER_DAY = 13.33; // 30,000 m³/hour × 24h / $54,000
const TREE_M3_PER_DAY = 22;
const TOWER_GOAL = 54000;

export function calculateImpact(invested: number) {
  const m3PerDay = Math.round(invested * M3_PER_DOLLAR_PER_DAY);
  const treesEquivalent = Math.round(m3PerDay / TREE_M3_PER_DAY);
  const towerPercent = parseFloat(((invested / TOWER_GOAL) * 100).toFixed(2));
  return { m3PerDay, treesEquivalent, towerPercent };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export { TOWER_GOAL, M3_PER_DOLLAR_PER_DAY, TREE_M3_PER_DAY };
