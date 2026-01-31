import { useState, useEffect, useRef } from 'react';
import { useGlobalFilters, DisplayMode } from '@/contexts/GlobalFiltersContext';

// Extended chart display type including new options
export type ChartDisplayType = 'dollar' | 'percent' | 'winrate' | 'tradecount' | 'tickpip' | 'privacy';

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
    default:
      return 'Return ($)';
  }
};
