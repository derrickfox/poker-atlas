// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Catches render errors from a variant's tutorial or practice screen and shows what failed
//          instead of blanking the whole app.
// Reason: Tutorial scripts are generated per variant, so a single bad script should degrade to a
//         readable message on that one page rather than unmounting the entire tree.

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  label: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}]`, error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.label !== this.props.label && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="notice">
          <strong>{this.props.label} could not be rendered.</strong>
          <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12.5 }}>
            {this.state.error.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
