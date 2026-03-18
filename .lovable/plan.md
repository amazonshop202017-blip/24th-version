

# Store Contract Size Per Trade

## Summary
Change the Contract Size from being dynamically read from the registry on every P&L calculation to being captured once at trade creation time and stored permanently on each trade object. This ensures historical trades are never affected by future settings changes.

## Changes

### 1. Add `contractSize` field to Trade interface
**File:** `src/types/trade.ts`
- Add `contractSize?: number` to the `Trade` interface (optional for backward compatibility).

### 2. Update `calculateTradeMetrics` to use stored value
**File:** `src/types/trade.ts`
- Change line 176 from reading `getContractSizeForSymbol(trade.symbol)` to reading `trade.contractSize ?? 1`.
- Remove the import of `getContractSizeForSymbol` from this file entirely.

### 3. Store contractSize at trade creation (manual trades)
**File:** `src/components/trades/TradeModal.tsx`
- In `handleSubmit`, when building `tradeData`:
  - For **new trades**: read `getContractSizeForSymbol(symbol)` (or from context `contractSizes`) and set `contractSize` on the trade object.
  - For **edits**: preserve the existing `editingTrade.contractSize` -- never re-read from registry.

### 4. Store contractSize at import time (MT5 imports)
**File:** `src/lib/mt5Import.ts`
- Accept a `contractSizes` record parameter in `parseCSVToTrades` and `importMT5Trades`.
- For each imported trade, look up the contract size for that symbol and store it as `contractSize` on the `TradeFormData`.

**File:** `src/components/settings/AccountImportModal.tsx`
- Pass `contractSizes` from context into the `importMT5Trades` call.

### 5. Store contractSize when duplicating trades
**File:** `src/pages/Trades.tsx`
- No changes needed -- duplicated trades already spread all fields from the original trade via `const { id, createdAt, updatedAt, ...tradeData } = trade`, so `contractSize` is automatically carried over.

### 6. Backward compatibility migration for existing trades
**File:** `src/hooks/useTrades.ts`
- Add a new migration step in the `useEffect` load block:
  - If `trade.contractSize` is `undefined`, assign it from `getContractSizeForSymbol(trade.symbol)` (reading the current registry value).
  - This runs once and is persisted back to localStorage.
- Import `getContractSizeForSymbol` in this file for the one-time migration only.

### 7. Registry module cleanup
**File:** `src/lib/contractSizeRegistry.ts`
- No changes. The registry continues to exist as the "template" for new trades. It is no longer referenced by `calculateTradeMetrics` but is still used by the migration and trade creation flows.

## Technical Details

### Data flow after this change

```text
Settings (Registry)  --->  New Trade Creation  --->  trade.contractSize (stored permanently)
                                                          |
                                                          v
                                                   calculateTradeMetrics uses trade.contractSize
```

### Files touched (6 files)
1. `src/types/trade.ts` -- add field, update calculation
2. `src/components/trades/TradeModal.tsx` -- snapshot contractSize on save
3. `src/lib/mt5Import.ts` -- accept and store contractSize
4. `src/components/settings/AccountImportModal.tsx` -- pass contractSizes
5. `src/hooks/useTrades.ts` -- one-time migration for existing trades
6. No UI changes anywhere

### What does NOT change
- Tick Size behavior
- TP/SL logic
- R-Multiple logic
- UI / Settings pages
- Fee logic
- Filtering or chart behavior
- The registry module itself (still used as template source)

