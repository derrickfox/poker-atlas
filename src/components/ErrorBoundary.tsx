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
    const { error } = this.state;
    // AI_CHANGE: Tool: ChatGPT via Team Workspace; Model: GPT-6.2-Sol.
    // Timestamp: 2026-11-17T15:38:38-05:00 (revision request prepared).
    // Purpose: Announce rendering failures using a persistent alert region.
    // Reason: Expose errors to assistive technology while preserving the existing visual layout.
    return (
      <>
        <div
          role="alert"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          {error ? `${this.props.label} could not be rendered. ${error.message}` : null}
        </div>
        {error ? (
          <div className="notice">
            <strong>{this.props.label} could not be rendered.</strong>
            <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12.5 }}>
              {error.message}
            </div>
          </div>
        ) : this.props.children}
      </>
    );
  }
}
