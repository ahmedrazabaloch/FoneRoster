import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white border-4 border-black shadow-brutal-xl p-8 max-w-lg">
                        <h1 className="text-3xl font-black uppercase mb-4 text-red-600">
                            Something Went Wrong
                        </h1>
                        <p className="font-bold text-gray-700 mb-4">
                            The application encountered an unexpected error.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-black text-white px-6 py-3 font-black uppercase border-2 border-black shadow-brutal hover:translate-y-1 transition-all"
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
