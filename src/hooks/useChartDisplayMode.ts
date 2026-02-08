import { useState, useEffect, useRef } from 'react';
import { useGlobalFilters, DisplayMode } from '@/contexts/GlobalFiltersContext';

// Extended chart display type including new options
export type ChartDisplayType = 'dollar' | 'percent' | 'winrate' | 'tradecount' | 'tickpip' | 'privacy' | 'avg_hold_time' | 'longest_duration' | 'long_winrate' | 'short_winrate' | 'tradecount_long' | 'tradecount_short' | 'avg_win' | 'avg_loss' | 'largest_win' | 'largest_loss' | 'avg_trades_per_day' | 'median_trades_per_day' | '90th_percentile_trades';

/**
 * Maps the global DisplayMode to a chart-specific DisplayType.
 * This is used ONLY for initial chart defaults, not ongoing sync.
 * 
 * Mapping:
 * - dollar → dollar (Return $)
 * - percentage → percent (Return %)
 * - tickpip → tickpip (Tick / Pip)
 * - privacy → privacy (Privacy)
 */
export const mapGlobalToChartDisplay = (globalMode: DisplayMode): ChartDisplayType => {
  switch (globalMode) {
    case 'dollar':
      return 'dollar';
    case 'percentage':
      return 'percent';
    case 'tickpip':
      return 'tickpip';
    case 'privacy':
      // Privacy removed from chart dropdowns - fall back to dollar
      return 'dollar';
    default:
      return 'dollar';
  }
};

/**
 * Hook for chart display mode that respects global filter as DEFAULT only.
 * 
 * Behavior:
 * - On INITIAL mount: Uses global DisplayMode mapped to chart display type
 * - After mount: Chart state is fully independent from global filter
 * - User changes to chart dropdown are local only
 * - Global filter changes do NOT affect already-mounted charts
 * 
 * @param defaultDisplayType - Fallback default if no global preference
 * @param useGlobalDefault - Whether to use global filter as default (true for left/single charts, false for right charts)
 */
export const useChartDisplayMode = (
  defaultDisplayType: ChartDisplayType = 'dollar',
  useGlobalDefault: boolean = true
) => {
  const { displayMode } = useGlobalFilters();
  const initializedRef = useRef(false);
  
  // Calculate the initial value once
  const getInitialValue = (): ChartDisplayType => {
    if (useGlobalDefault) {
      return mapGlobalToChartDisplay(displayMode);
    }
    return defaultDisplayType;
  };
  
  const [displayType, setDisplayType] = useState<ChartDisplayType>(getInitialValue);
  
  // Only set initial value on first render - never sync afterwards
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, []);
  
  return {
    displayType,
    setDisplayType,
  };
};

/**
 * Get display label for each chart display option
 */
export const getDisplayLabel = (displayType: ChartDisplayType): string => {
  switch (displayType) {
    case 'dollar':
      return 'Return ($)';
    case 'percent':
      return 'Return (%)';
    case 'winrate':
      return 'Winrate (%)';
    case 'tradecount':
      return 'Trade Count';
    case 'tickpip':
      return 'Tick / Pip';
    case 'privacy':
      return 'Privacy';
    case 'avg_hold_time':
      return 'Avg Hold Time';
    case 'longest_duration':
      return 'Longest Duration';
    case 'long_winrate':
      return 'Long Win %';
    case 'short_winrate':
      return 'Short Win %';
    case 'tradecount_long':
      return 'Trade Count (Long)';
    case 'tradecount_short':
      return 'Trade Count (Short)';
    case 'avg_win':
      return 'Average Win';
    case 'avg_loss':
      return 'Average Loss';
    case 'largest_win':
      return 'Largest Win';
    case 'largest_loss':
      return 'Largest Loss';
    case 'avg_trades_per_day':
      return 'Avg Trades/Day';
    case 'median_trades_per_day':
      return 'Median Trades/Day';
    case '90th_percentile_trades':
      return '90th Pctl Trades';
    default:
      return 'Return ($)';
  }
};

/**
 * Format duration in minutes to precise human-readable string (e.g., "2H 10M", "1D 3H 20M")
 * Does NOT round values - preserves exact breakdown into days, hours, minutes.
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) {
    return '<1M';
  }
  
  const totalMinutes = Math.floor(minutes);
  const days = Math.floor(totalMinutes / 1440);
  const remainingAfterDays = totalMinutes % 1440;
  const hours = Math.floor(remainingAfterDays / 60);
  const mins = remainingAfterDays % 60;
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days}D`);
  }
  if (hours > 0) {
    parts.push(`${hours}H`);
  }
  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins}M`);
  }
  
  return parts.join(' ');
};

/**
 * Format duration for Y-axis tick (compact format for axis readability)
 * Uses same precise format but shorter for axis labels
 */
export const formatDurationTick = (minutes: number): string => {
  if (minutes < 1) {
    return '0M';
  }
  
  const totalMinutes = Math.floor(minutes);
  const days = Math.floor(totalMinutes / 1440);
  const remainingAfterDays = totalMinutes % 1440;
  const hours = Math.floor(remainingAfterDays / 60);
  const mins = remainingAfterDays % 60;
  
  // For Y-axis, show abbreviated version
  if (days > 0 && hours > 0) {
    return `${days}D ${hours}H`;
  }
  if (days > 0) {
    return `${days}D`;
  }
  if (hours > 0 && mins > 0) {
    return `${hours}H ${mins}M`;
  }
  if (hours > 0) {
    return `${hours}H`;
  }
  return `${mins}M`;
};
