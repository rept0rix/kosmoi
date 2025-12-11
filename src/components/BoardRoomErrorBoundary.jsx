import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy } from 'lucide-react';

class BoardRoomErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("BoardRoom Crash:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8">
                    <Alert variant="destructive" className="max-w-2xl bg-white shadow-xl border-red-200">
                        <AlertTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                            Board Room Crashed
                        </AlertTitle>
                        <AlertDescription className="mt-4">
                            <p className="mb-4 text-slate-600">
                                Something went wrong within the Board Room logic.
                                Please send the details below to the developer.
                            </p>

                            <div className="bg-slate-950 text-slate-300 p-4 rounded-lg overflow-auto max-h-[300px] text-xs font-mono mb-4">
                                <p className="text-red-400 font-bold mb-2">{this.state.error?.toString()}</p>
                                <pre>{this.state.errorInfo?.componentStack}</pre>
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={() => window.location.reload()}>
                                    <RefreshCw className="w-4 h-4 mr-2" /> Reload Page
                                </Button>
                                <Button variant="outline" onClick={() => {
                                    navigator.clipboard.writeText(`${this.state.error}\n${this.state.errorInfo.componentStack}`);
                                }}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy Error
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        return this.props.children;
    }
}

export default BoardRoomErrorBoundary;
