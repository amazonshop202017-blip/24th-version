import { TradeFormData, TradeEntry } from '@/types/trade';

export interface MT5ImportResult {
  success: boolean;
  tradesImported: number;
  rowsSkipped: number;
  errors: string[];
}

// ========================
// STEP 1 — HTML → CSV
// ========================

export function parseMT5HtmlToCSV(htmlContent: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const rows = doc.querySelectorAll('tr');
  const capturedRows: string[][] = [];
  let capturing = false;
  
  for (const row of rows) {
    // Check for section headers (th with colspan)
    const thElements = row.querySelectorAll('th[colspan]');
    
    for (const th of thElements) {
      const headerText = th.textContent?.trim() || '';
      
      if (headerText === 'Positions') {
        capturing = true;
        continue;
      }
      
      // Stop capturing when another colspan header is encountered after capture started
      if (capturing && headerText !== 'Positions' && headerText.length > 0) {
        capturing = false;
        break;
      }
    }
    
    if (!capturing) continue;
    
    // Capture cells from this row
    const cells = row.querySelectorAll('td, th');
    const rowData: string[] = [];
    
    for (const cell of cells) {
      // Exclude cells with class "hidden"
      if (cell.classList.contains('hidden')) continue;
      
      const cellText = cell.textContent?.trim() || '';
      rowData.push(cellText);
    }
    
    // Add row only if it contains at least one cell
    if (rowData.length > 0) {
      capturedRows.push(rowData);
    }
  }
  
  if (capturedRows.length === 0) {
    throw new Error('No Positions section found in MT5 HTML file');
  }
  
  // Construct CSV
  const csvLines = capturedRows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  );
  
  return csvLines.join('\n');
}

// ========================
// STEP 2 — CSV → Trades
// ========================

interface ColumnIndexes {
  time1: number;      // Entry time
  time2: number;      // Exit time
  symbol: number;
  type: number;
  volume: number;
  price1: number;     // Entry price
  price2: number;     // Exit price
  commission: number;
  profit: number;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function findColumnIndexes(headers: string[]): ColumnIndexes {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Find Time columns (there should be two)
  const timeIndexes: number[] = [];
  normalizedHeaders.forEach((h, i) => {
    if (h === 'time') timeIndexes.push(i);
  });
  
  // Find Price columns (there should be two)
  const priceIndexes: number[] = [];
  normalizedHeaders.forEach((h, i) => {
    if (h === 'price') priceIndexes.push(i);
  });
  
  const symbolIndex = normalizedHeaders.indexOf('symbol');
  const typeIndex = normalizedHeaders.indexOf('type');
  const volumeIndex = normalizedHeaders.indexOf('volume');
  const commissionIndex = normalizedHeaders.indexOf('commission');
  const profitIndex = normalizedHeaders.indexOf('profit');
  
  // Validate required columns
  const missing: string[] = [];
  
  if (timeIndexes.length < 2) missing.push('Time (need 2 columns)');
  if (symbolIndex === -1) missing.push('Symbol');
  if (typeIndex === -1) missing.push('Type');
  if (volumeIndex === -1) missing.push('Volume');
  if (priceIndexes.length < 2) missing.push('Price (need 2 columns)');
  if (commissionIndex === -1) missing.push('Commission');
  if (profitIndex === -1) missing.push('Profit');
  
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }
  
  return {
    time1: timeIndexes[0],
    time2: timeIndexes[1],
    symbol: symbolIndex,
    type: typeIndex,
    volume: volumeIndex,
    price1: priceIndexes[0],
    price2: priceIndexes[1],
    commission: commissionIndex,
    profit: profitIndex,
  };
}

function parseMT5DateTime(dateTimeStr: string): string {
  // Format: YYYY.MM.DD HH:MM:SS → ISO format
  const cleaned = dateTimeStr.trim();
  const [datePart, timePart] = cleaned.split(' ');
  
  if (!datePart || !timePart) {
    throw new Error(`Invalid datetime format: ${dateTimeStr}`);
  }
  
  const [year, month, day] = datePart.split('.');
  const isoDate = `${year}-${month}-${day}T${timePart}`;
  
  return isoDate;
}

function parseNumber(value: string): number {
  const cleaned = value.trim().replace(/\s/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseCSVToTrades(
  csvContent: string,
  accountName: string,
  accountId: string
): { trades: TradeFormData[]; skipped: number } {
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const indexes = findColumnIndexes(headers);
  
  const trades: TradeFormData[] = [];
  let skipped = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);
    
    try {
      const entryTimeStr = values[indexes.time1];
      const exitTimeStr = values[indexes.time2];
      const symbol = values[indexes.symbol]?.trim();
      const typeStr = values[indexes.type]?.toLowerCase().trim();
      const volumeStr = values[indexes.volume];
      const entryPriceStr = values[indexes.price1];
      const exitPriceStr = values[indexes.price2];
      const commissionStr = values[indexes.commission];
      const profitStr = values[indexes.profit];
      
      // Validate required fields
      const entryPrice = parseNumber(entryPriceStr);
      const exitPrice = parseNumber(exitPriceStr);
      const volume = parseNumber(volumeStr);
      const profit = parseNumber(profitStr);
      
      if (!entryPrice || !exitPrice || !volume) {
        skipped++;
        continue;
      }
      
      // Parse direction
      const side: 'LONG' | 'SHORT' = typeStr === 'buy' ? 'LONG' : 'SHORT';
      
      // Parse dates
      const entryDateTime = parseMT5DateTime(entryTimeStr);
      const exitDateTime = parseMT5DateTime(exitTimeStr);
      
      // Parse fees (commission is typically negative in MT5)
      const commission = Math.abs(parseNumber(commissionStr));
      
      // Calculate gross PnL: netPnl = grossPnl - fees, so grossPnl = netPnl + fees
      const netPnl = profit;
      const grossPnl = netPnl + commission;
      
      // Create entry and exit trades
      const entries: TradeEntry[] = [];
      
      if (side === 'LONG') {
        // LONG: Entry = BUY, Exit = SELL
        entries.push({
          id: crypto.randomUUID(),
          type: 'BUY',
          datetime: entryDateTime,
          quantity: volume,
          price: entryPrice,
          charges: commission / 2, // Split commission between entry and exit
        });
        entries.push({
          id: crypto.randomUUID(),
          type: 'SELL',
          datetime: exitDateTime,
          quantity: volume,
          price: exitPrice,
          charges: commission / 2,
        });
      } else {
        // SHORT: Entry = SELL, Exit = BUY
        entries.push({
          id: crypto.randomUUID(),
          type: 'SELL',
          datetime: entryDateTime,
          quantity: volume,
          price: entryPrice,
          charges: commission / 2,
        });
        entries.push({
          id: crypto.randomUUID(),
          type: 'BUY',
          datetime: exitDateTime,
          quantity: volume,
          price: exitPrice,
          charges: commission / 2,
        });
      }
      
      const trade: TradeFormData = {
        symbol,
        side,
        instrument: 'Futures', // MT5 is typically forex/futures
        entries,
        tradeRisk: 0,
        tradeTarget: 0,
        accountName,
        accountId,
        tags: [],
        notes: '',
        manualGrossPnl: grossPnl,
      };
      
      trades.push(trade);
    } catch (err) {
      skipped++;
      continue;
    }
  }
  
  return { trades, skipped };
}

// Main import function
export async function importMT5Trades(
  file: File,
  accountName: string,
  accountId: string,
  addTrade: (data: TradeFormData) => void
): Promise<MT5ImportResult> {
  const errors: string[] = [];
  
  try {
    const htmlContent = await file.text();
    
    // Step 1: HTML → CSV
    const csvContent = parseMT5HtmlToCSV(htmlContent);
    
    // Step 2: CSV → Trades
    const { trades, skipped } = parseCSVToTrades(csvContent, accountName, accountId);
    
    if (trades.length === 0) {
      return {
        success: false,
        tradesImported: 0,
        rowsSkipped: skipped,
        errors: ['No valid trades found in the file'],
      };
    }
    
    // Add all trades
    for (const trade of trades) {
      addTrade(trade);
    }
    
    return {
      success: true,
      tradesImported: trades.length,
      rowsSkipped: skipped,
      errors: [],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    errors.push(errorMessage);
    
    return {
      success: false,
      tradesImported: 0,
      rowsSkipped: 0,
      errors,
    };
  }
}
