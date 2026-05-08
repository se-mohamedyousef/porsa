"use client";

import { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: any) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-info/20 to-accent-purple/20 dark:from-info/10 dark:to-accent-purple/10 p-4">
                    <div className="bg-background dark:bg-secondary rounded-lg shadow-lg p-8 max-w-md w-full border border-border">
                        <div className="flex items-center justify-center w-12 h-12 bg-error/20 dark:bg-error/30 rounded-full mx-auto mb-4">
                            <svg
                                className="w-6 h-6 text-error"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-foreground text-center mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-muted-foreground text-center mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="mb-4 p-4 bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error/50 rounded-md">
                                <p className="text-sm font-mono text-error break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
