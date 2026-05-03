export type BadgeType = 'civic' | 'partner' | 'founder';

export function calculateBadge(totalInvested: number): BadgeType {
  if (totalInvested >= 5000) return 'founder';
  if (totalInvested >= 500) return 'partner';
  return 'civic';
}

export const BADGE_CONFIG: Record<BadgeType, { label: string; emoji: string; color: string; minAmount: number; maxAmount: string }> = {
  civic: {
    label: 'Civic Backer',
    emoji: '🌱',
    color: '#00d4aa',
    minAmount: 1,
    maxAmount: '$499',
  },
  partner: {
    label: 'Green Partner',
    emoji: '🌿',
    color: '#00b894',
    minAmount: 500,
    maxAmount: '$4,999',
  },
  founder: {
    label: 'Tower Founder',
    emoji: '🏛️',
    color: '#f59e0b',
    minAmount: 5000,
    maxAmount: 'Unlimited',
  },
};
