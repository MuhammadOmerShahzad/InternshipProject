'use client';

export default function LoadingScreen() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                {/* Animated Logo */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f15a22] to-[#ff6b35] flex items-center justify-center animate-pulse">
                        <svg
                            className="w-10 h-10 text-white animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    </div>
                    {/* Spinning ring animation */}
                    <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-[#f15a22] animate-spin" />
                </div>

                {/* Loading text */}
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Loading Muawin
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Preparing your dashboard...
                    </p>
                </div>

                {/* Loading dots animation */}
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f15a22] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 rounded-full bg-[#f15a22] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 rounded-full bg-[#f15a22] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
