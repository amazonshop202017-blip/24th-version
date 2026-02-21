/**
 * Module-level registry for symbol contract sizes and tick sizes.
 * Synced from SymbolTickSizeContext so that calculateTradeMetrics
 * can look up contract sizes without requiring context access.
 * 
 * This avoids changing 49+ call sites of calculateTradeMetrics.
 */

let _contractSizes: Record<string, number> = {};
let _tickSizes: Record<string, number> = {};

export function setContractSizeRegistry(sizes: Record<string, number>) {
  _contractSizes = sizes;
}

export function getContractSizeForSymbol(symbol: string): number {
  return _contractSizes[symbol] ?? 1;
}

export function setTickSizeRegistry(sizes: Record<string, number>) {
  _tickSizes = sizes;
}

export function getTickSizeForSymbol(symbol: string): number | undefined {
  return _tickSizes[symbol];
}
