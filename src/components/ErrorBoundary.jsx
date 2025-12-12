import React from 'react';
import * as Sentry from "@sentry/react";
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Sentry captures this automatically if configured, but we can log context here
    }

    handleReset = () => {
        this.setState({ hasError: false });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl text-center border border-red-100 dark:border-red-900/30">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Our autonomous agents have been notified of this anomaly.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={this.handleReset} variant="outline">
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default Sentry.withErrorBoundary(ErrorBoundary, {
    fallback: <ErrorBoundary />, // Recursion safety fallback
});
