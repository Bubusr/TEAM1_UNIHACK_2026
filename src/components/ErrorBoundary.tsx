import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected garden hiccup.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh w-full pastel-studio-bg flex items-center justify-center p-4">
          <div className="cream-card max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFEAF0] border-2 border-[#E6B8C5] flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-[#B6536D]" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-[20px] font-extrabold text-[#4B3C46]">
                Sanctuary Resting
              </h1>
              <p className="text-[13px] font-medium text-[#8A747E]">
                {this.state.errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="buttercup-cta w-full rounded-full py-2.5 px-5 font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Sanctuary</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
