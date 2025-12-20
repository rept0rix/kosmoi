
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught Error caught by GlobalErrorBoundary:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-6">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-slate-200">
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-red-100/50 rounded-full flex items-center justify-center border-4 border-red-50">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900">Something went wrong</h1>
                        <p className="text-center text-slate-500 mb-6">
                            The application encountered an unexpected error.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-900 rounded-lg p-4 mb-6 overflow-auto max-h-48 text-left border border-slate-800">
                                <p className="text-red-400 font-mono text-xs break-words">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <div className="mt-2 text-slate-500 font-mono text-[10px] whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Reload Application
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
