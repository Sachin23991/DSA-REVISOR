import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // TODO: Send to Sentry when integrated
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            An unexpected error occurred. Don't worry, your data is safe.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-left overflow-auto max-h-40">
                                <p className="text-sm font-mono text-red-600 dark:text-red-400">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-3 bg-royal-500 hover:bg-royal-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-dark-border dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium flex items-center gap-2 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
