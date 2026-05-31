"use client";
// React class-based error boundary. Wrap any widget that's allowed to
// fail without taking down the whole page. The fallback can be a
// React node, null (silent), or a function (error, reset) => node.
//
//   <ErrorBoundary label="my-widget" fallback={null}>
//     <MyWidget />
//   </ErrorBoundary>
//
// Boundaries only catch render-phase errors and lifecycle errors inside
// their subtree. Async/promise rejections inside effects bypass them —
// for those see components/shared/GlobalErrorHandler.

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const label = this.props.label || "unknown";
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${label}]`, error?.message || error, info?.componentStack);
    if (typeof window !== "undefined" && window.Sentry?.captureException) {
      try {
        window.Sentry.captureException(error, {
          tags: { boundary: label },
          contexts: { react: { componentStack: info?.componentStack || null } },
        });
      } catch { /* never let telemetry break recovery */ }
    }
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (typeof fallback === "function") return fallback(this.state.error, this.reset);
      if (fallback !== undefined) return fallback;
      // Default fallback: hidden. Boundaries should be opt-in noisy
      // by passing a fallback explicitly.
      return null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
