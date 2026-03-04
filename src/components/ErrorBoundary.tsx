'use client';
import React from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) { super(props); this.state = { hasError: false }; }

    static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error.message, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="p-6 text-center">
                    <p className="text-red-600 font-medium">Something went wrong</p>
                    <button onClick={() => this.setState({ hasError: false })}
                        className="mt-2 text-sm underline">Try again</button>
                </div>
            );
        }
        return this.props.children;
    }
}
