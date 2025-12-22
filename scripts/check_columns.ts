import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    // Try to get one row to see the keys
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
        console.log('Error accessing table:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Found columns:', Object.keys(data[0]).join(', '));
    } else {
        console.log('⚠️ Table exists but is empty. Cannot deduce columns easily via select.');
    }
}

checkSchema();
