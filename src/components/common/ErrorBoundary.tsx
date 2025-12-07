import { Component, type ErrorInfo, type ReactNode } from 'react';
import { analyzeError } from '../../utils/errorHandler';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            const { code, message } = analyzeError(this.state.error);
            const errorDetails = `Error Code: ${code}\nMessage: ${message}\nOriginal: ${this.state.error?.message}\nStack: ${this.state.error?.stack || 'N/A'}`;

            const handleCopy = () => {
                navigator.clipboard.writeText(errorDetails).then(() => {
                    alert('Error details copied to clipboard');
                });
            };

            return (
                <div className="fixed inset-0 bg-90s-animated flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl border-4 border-red-500 animate-bounce-in relative overflow-hidden">
                        {/* Error Code Badge */}
                        <div className="absolute top-4 right-4 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-mono font-bold border border-red-200">
                            {code}
                        </div>

                        <div className="text-6xl mb-4">😵</div>
                        <h1 className="text-2xl font-black text-red-500 mb-2">Oops! Game Over?</h1>
                        <p className="text-gray-600 mb-4">
                            The game encountered a critical error.
                        </p>

                        <div className="bg-gray-100 p-4 rounded-xl mb-4 text-left font-mono text-xs text-gray-500 relative group overflow-hidden">
                            <p className="font-bold text-gray-700 mb-1">{message}</p>
                            <p className="truncate opacity-75">{code}</p>

                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 bg-white hover:bg-gray-200 text-gray-600 p-2 rounded-lg shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Copy Error Details"
                            >
                                📋
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCopy}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-xl font-bold transition-colors"
                            >
                                Copy Error 📋
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="flex-1 btn-90s bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg jelly-hover"
                            >
                                Restart 🔄
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
