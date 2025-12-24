import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // During SSR/build time, return null - client will be created in browser
    if (typeof window === 'undefined') {
        return null as ReturnType<typeof createBrowserClient>
    }

    // On client side, env vars must exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

