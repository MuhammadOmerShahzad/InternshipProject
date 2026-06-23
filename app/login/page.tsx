'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '@/lib/actions/auth';
import { useUser } from '@/lib/context/UserContext';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useUser();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    const reason = searchParams.get('reason');

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get message based on redirect reason
    const getReasonMessage = () => {
        switch (reason) {
            case 'timeout':
                return 'Your session has expired due to inactivity. Please sign in again.';
            case 'session_expired':
                return 'Your session has expired. Please sign in again.';
            default:
                return null;
        }
    };

    const reasonMessage = getReasonMessage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('[LOGIN] Submitting login form with email:', email);
            const result = await login(email, password);
            console.log('[LOGIN] Server response received:', JSON.stringify(result));

            if (result && result.success) {
                console.log('[LOGIN] Login successful, result:', result);
                console.log('[LOGIN] About to redirect to:', redirectTo);
                // Don't wait for refreshUser - redirect immediately, user context will load data
                try {
                    await router.push(redirectTo);
                    console.log('[LOGIN] router.push completed');
                } catch (pushErr) {
                    console.error('[LOGIN] router.push failed, using fallback:', pushErr);
                    // Fallback to window.location if router.push fails
                    window.location.href = redirectTo;
                }
                console.log('[LOGIN] Redirect triggered');
            } else {
                const errorMsg = result?.error || 'Login failed. Please try again.';
                console.log('[LOGIN] Login failed:', errorMsg);
                setError(errorMsg);
            }
        } catch (e) {
            console.error('[LOGIN] Exception caught:', e);
            console.error('[LOGIN] Error details:', e instanceof Error ? e.message : String(e));
            setError(e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[url('/images/backgrounds/signin_background.png')] bg-cover bg-center p-4 font-sans">
            <div className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row p-4 md:p-6 gap-6 md:gap-12 items-center">

                {/* Left Side - Image */}
                <div className="hidden md:block w-1/2 h-[600px] relative rounded-2xl overflow-hidden">
                    <Image
                        src='/images/backgrounds/signin.png'
                        alt="Welcome to Muawin"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center py-8 md:pr-12">

                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative w-72 h-20 mb-2">
                            <Image
                                src='/images/logos/LOOP_Title (1).png'
                                alt="Muawin Logo"
                                fill
                                className="object-contain"
                            />
                        </div>

                        <h2 className="text-[#F9572A] font-bold text-3xl tracking-wide mt-2 font-[family-name:var(--font-cocon)]">
                            SIGN IN
                        </h2>
                        <div className="w-20 h-1.5 bg-[#F9572A] rounded-full mt-4"></div>
                    </div>

                    {/* Session Timeout/Expiry Message */}
                    {reasonMessage && (
                        <div className="w-full max-w-md mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center">
                            {reasonMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="w-full max-w-md mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">

                        {/* Email Input */}
                        <div className="relative group">
                            <label
                                htmlFor="email"
                                className="absolute -top-3 left-4 bg-white px-1 text-sm text-gray-500 font-normal transition-all"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 px-4 bg-white border border-[#F9572A] rounded-lg text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#F9572A] transition-colors"
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative group">
                            <label
                                htmlFor="password"
                                className="absolute -top-3 left-4 bg-white px-1 text-sm text-gray-500 font-normal transition-all"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-14 px-4 bg-white border border-[#F9572A] rounded-lg text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#F9572A] transition-colors pr-12"
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-6 h-6" />
                                ) : (
                                    <Eye className="w-6 h-6" />
                                )}
                            </button>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-[#F9572A] hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-[#F9572A] hover:bg-[#e0481d] text-white font-bold text-base tracking-wider rounded-full shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    SIGNING IN...
                                </>
                            ) : (
                                'LOGIN'
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}

// Loading fallback for Suspense
function LoginLoading() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[url('/images/backgrounds/background.jpg')] bg-cover bg-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#F9572A]" />
                <p className="text-white text-lg">Loading...</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}
