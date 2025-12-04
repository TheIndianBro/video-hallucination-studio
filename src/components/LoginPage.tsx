import { useAuth } from '../context/AuthContext';
import { Activity, CheckCircle } from 'lucide-react';

export const LoginPage = () => {
    const { login, isLoading } = useAuth();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#09090b] to-[#09090b] -z-10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md p-8 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-xl shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-muted text-sm">Sign in to access Video Hallucination Studio</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={login}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 py-3 px-4 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-center gap-6 text-xs text-muted">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Enterprise Ready</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>SOC2 Compliant</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
