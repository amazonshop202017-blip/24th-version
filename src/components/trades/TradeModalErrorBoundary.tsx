import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useTradeModal } from '@/contexts/TradeModalContext';

interface Props {
  children: ReactNode;
  onClose: () => void;
}

interface State {
  hasError: boolean;
}

class TradeModalErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[TradeModal] Render error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <p className="text-destructive font-medium">Something went wrong loading this trade.</p>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onClose();
            }}
          >
            Close
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrapper to pass the closeModal hook into the class component
export const TradeModalErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { closeModal } = useTradeModal();
  return (
    <TradeModalErrorBoundaryInner onClose={closeModal}>
      {children}
    </TradeModalErrorBoundaryInner>
  );
};
