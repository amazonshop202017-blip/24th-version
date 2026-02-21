import { TradeEntry } from '@/types/trade';

export interface FeeRule {
  id: string;
  /** @deprecated Use accountIds */
  accountId?: string;
  /** @deprecated Use accountNames */
  accountName?: string;
  accountIds: string[];
  accountNames: string[];
  symbol: string;
  mode: 'per-contract' | 'per-execution';
  apply: 'all' | 'entry-only' | 'exit-only';
  feeValue: number;
}

const FEE_RULES_STORAGE_KEY = 'trading-journal-fee-rules';

/** Migrate legacy single-account rule to multi-account */
const migrateRule = (raw: any): FeeRule => {
  if (raw.accountIds && raw.accountNames) return raw as FeeRule;
  return {
    ...raw,
    accountIds: raw.accountId ? [raw.accountId] : [],
    accountNames: raw.accountName ? [raw.accountName] : [],
  };
};

export function loadFeeRules(): FeeRule[] {
  try {
    const stored = localStorage.getItem(FEE_RULES_STORAGE_KEY);
    if (!stored) return [];
    return (JSON.parse(stored) as any[]).map(migrateRule);
  } catch {
    return [];
  }
}

export function findMatchingFeeRule(
  rules: FeeRule[],
  accountName: string,
  symbol: string
): FeeRule | null {
  return rules.find(r => r.accountNames.includes(accountName) && r.symbol === symbol) || null;
}

/**
 * Calculate fee from a matching rule and the trade's entries array.
 * Returns 0 if no rule or no entries.
 */
export function calculateFeeFromRule(
  rule: FeeRule,
  entries: TradeEntry[],
  side: 'LONG' | 'SHORT'
): number {
  if (!rule || entries.length === 0) return 0;

  const entryType = side === 'LONG' ? 'BUY' : 'SELL';
  const exitType = side === 'LONG' ? 'SELL' : 'BUY';

  const entryExecutions = entries.filter(e => e.type === entryType);
  const exitExecutions = entries.filter(e => e.type === exitType);

  if (rule.mode === 'per-execution') {
    switch (rule.apply) {
      case 'all':
        return rule.feeValue * entries.length;
      case 'entry-only':
        return rule.feeValue * entryExecutions.length;
      case 'exit-only':
        return rule.feeValue * exitExecutions.length;
    }
  }

  // per-contract mode
  const sumQty = (execs: TradeEntry[]) =>
    execs.reduce((sum, e) => sum + e.quantity, 0);

  switch (rule.apply) {
    case 'all':
      return rule.feeValue * sumQty(entries);
    case 'entry-only':
      return rule.feeValue * sumQty(entryExecutions);
    case 'exit-only':
      return rule.feeValue * sumQty(exitExecutions);
  }
}
