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
        console.error("[ERROR BOUNDARY] Caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white text-center">
                    <h1 className="text-4xl font-black mb-4 text-red-500">Oups ! Quelque chose a mal tourné.</h1>
                    <p className="text-slate-400 mb-8 max-w-md">Une erreur est survenue lors du rendu de l'application. Veuillez rafraîchir la page.</p>
                    <pre className="bg-black/50 p-4 rounded-xl text-xs text-red-300 overflow-auto max-w-full mb-8">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-4 bg-emerald-500 rounded-2xl font-bold shadow-lg shadow-emerald-500/20"
                    >
                        Rafraîchir la page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
