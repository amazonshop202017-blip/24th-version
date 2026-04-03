import { useInterfaceTheme } from '@/contexts/InterfaceThemeContext';

interface ChartGradientDefsProps {
  /** 'vertical' for vertical bar charts (bottom→top), 'horizontal' for horizontal bar charts (left→right) */
  direction?: 'vertical' | 'horizontal';
  /** Unique prefix to avoid ID collisions when multiple charts on same page */
  idPrefix?: string;
}

/**
 * SVG gradient definitions for bar charts.
 * Only renders when gradient mode is enabled in Interface Theme.
 * Place inside <BarChart> or <ComposedChart> as a child — it renders <defs>.
 */
export const ChartGradientDefs = ({ direction = 'vertical', idPrefix = '' }: ChartGradientDefsProps) => {
  const { theme } = useInterfaceTheme();

  if (theme.mode !== 'gradient') return null;

  const profitId = `${idPrefix}profitGradient`;
  const lossId = `${idPrefix}lossGradient`;

  // Vertical bars: bottom→top for profit, top→bottom for loss
  // Horizontal bars: left→right for profit, right→left for loss
  const profitCoords = direction === 'horizontal'
    ? { x1: '0', y1: '0', x2: '1', y2: '0' }
    : { x1: '0', y1: '1', x2: '0', y2: '0' };

  const lossCoords = direction === 'horizontal'
    ? { x1: '1', y1: '0', x2: '0', y2: '0' }
    : { x1: '0', y1: '0', x2: '0', y2: '1' };

  return (
    <defs>
      <linearGradient id={profitId} {...profitCoords}>
        <stop offset="0%" stopColor="hsl(var(--profit))" stopOpacity={0.3} />
        <stop offset="100%" stopColor="hsl(var(--profit))" stopOpacity={0.85} />
      </linearGradient>
      <linearGradient id={lossId} {...lossCoords}>
        <stop offset="0%" stopColor="hsl(var(--loss))" stopOpacity={0.3} />
        <stop offset="100%" stopColor="hsl(var(--loss))" stopOpacity={0.85} />
      </linearGradient>
    </defs>
  );
};

/**
 * Hook that returns the correct fill value based on gradient mode.
 * @param idPrefix - same prefix passed to ChartGradientDefs
 */
export const useGradientFill = (idPrefix = '') => {
  const { theme } = useInterfaceTheme();
  const isGradient = theme.mode === 'gradient';

  const profitFill = isGradient ? `url(#${idPrefix}profitGradient)` : 'hsl(var(--profit))';
  const lossFill = isGradient ? `url(#${idPrefix}lossGradient)` : 'hsl(var(--loss))';

  const getFill = (isPositive: boolean) => isPositive ? profitFill : lossFill;

  return { profitFill, lossFill, getFill, isGradient };
};
