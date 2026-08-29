import { ReviewHistoryItem } from '../../types';

const STORAGE_KEY = 'devpulse_review_history_v1';

const SEEDED_HISTORY: ReviewHistoryItem[] = [
  {
    id: 'rev-001',
    title: 'Commit #a1b2c3d: Billing & Checkout Integration',
    timestamp: Date.now() - 3600 * 1000 * 24 * 2,
    commitId: 'a1b2c3d',
    riskScore: 86,
    riskLevel: 'HIGH',
    findingsCount: 4,
    resolvedCount: 3,
    changedFiles: 2,
    summary: 'Detected breaking signature change on calculate_price() breaking checkout.py caller.',
  },
  {
    id: 'rev-002',
    title: 'Commit #f4e3d2c: Security Token Verification & DB Query',
    timestamp: Date.now() - 3600 * 1000 * 24 * 5,
    commitId: 'f4e3d2c',
    riskScore: 92,
    riskLevel: 'CRITICAL',
    findingsCount: 5,
    resolvedCount: 5,
    changedFiles: 3,
    summary: 'Detected raw string SQL interpolation and PyJWT CVE-2022-29217 vulnerability.',
  },
  {
    id: 'rev-003',
    title: 'Commit #8e7d6c5: Payment Gateway Return Schema Refactor',
    timestamp: Date.now() - 3600 * 1000 * 24 * 9,
    commitId: '8e7d6c5',
    riskScore: 65,
    riskLevel: 'MEDIUM',
    findingsCount: 2,
    resolvedCount: 2,
    changedFiles: 2,
    summary: 'Identified return property rename in chargeCustomer() payload.',
  },
];

export function getReviewHistory(): ReviewHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEEDED_HISTORY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_HISTORY;
  } catch {
    return SEEDED_HISTORY;
  }
}

export function saveReviewToHistory(item: ReviewHistoryItem): void {
  try {
    const history = getReviewHistory();
    const updated = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Graceful fallback
  }
}
