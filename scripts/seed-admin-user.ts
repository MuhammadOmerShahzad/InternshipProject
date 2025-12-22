// Script to create admin user in Supabase
// Run with: npx tsx scripts/seed-admin-user.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
    console.error('\nMake sure you have SUPABASE_SERVICE_ROLE_KEY in your .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// All available modules
const ALL_MODULES = [
    'Licenses',
    'Licenses_Trade Licenses',
    'Licenses_Staff Medicals',
    'Licenses_Tourism Licenses',
    'Licenses_Labour Licenses',
    'Approvals',
    'Approvals_Outer Spaces',
    'Vehicles',
    'Vehicles_Maintenance',
    'Vehicles_Token Taxes',
    'Vehicles_Route Permits',
    'Taxation',
    'Taxation_Marketing',
    'Taxation_Profession Tax',
    'Certificates',
    'Certificates_Electric Fitness Test',
    'Security',
    'Security_Guard Training',
    'Health Safety Environment',
    'HSE_Monthly Inspection',
    'HSE_Quarterly Audit',
    'HSE_Expiry of Cylinders',
    'HSE_Training Status',
    'HSE_Incidents',
    'Rental Agreements',
    'Admin Policies and SOPs',
];

const ADMIN_USER = {
    email: 'omershahzad@cheezious.com',
    password: 'omer12345',
    name: 'Omer Shahzad',
    role: 'Admin',
    zone: 'A',
    branch: 'Cheezious Headquarters',
    registered_modules: ALL_MODULES,
};

async function seedAdminUser() {
    console.log('🚀 Creating admin user...\n');

    try {
        // Step 1: Create auth user
        console.log('1. Creating auth user...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: ADMIN_USER.email,
            password: ADMIN_USER.password,
            email_confirm: true, // Skip email verification
        });

        if (authError) {
            if (authError.message.includes('already been registered')) {
                console.log('   ⚠️  User already exists in Auth, fetching existing user...');

                // Get user by email
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;

                const existingUser = users?.find(u => u.email === ADMIN_USER.email);
                if (!existingUser) throw new Error('Could not find existing user');

                console.log('   ✓ Found existing auth user:', existingUser.id);

                // Update the users table
                await createOrUpdateUserProfile(existingUser.id);
                return;
            }
            throw authError;
        }

        console.log('   ✓ Auth user created:', authData.user?.id);

        // Step 2: Create/update user profile in users table
        if (authData.user) {
            await createOrUpdateUserProfile(authData.user.id);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

async function createOrUpdateUserProfile(authId: string) {
    console.log('2. Creating/updating user profile in database...');

    // Check if users table exists and has the right columns
    const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = Row not found, which is fine
        // Other errors might mean the table doesn't exist
        console.log('   ⚠️  Note: users table might not exist. Creating anyway...');
    }

    const profileData = {
        auth_id: authId,
        email: ADMIN_USER.email,
        name: ADMIN_USER.name,
        role: ADMIN_USER.role,
        zone: ADMIN_USER.zone,
        branch: ADMIN_USER.branch,
        registered_modules: ADMIN_USER.registered_modules,
        updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
            .from('users')
            .update(profileData)
            .eq('auth_id', authId);

        if (updateError) {
            console.log('   ⚠️  Could not update users table:', updateError.message);
            console.log('   → User can still login, profile data stored in context');
        } else {
            console.log('   ✓ User profile updated');
        }
    } else {
        // Insert new profile
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                ...profileData,
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            console.log('   ⚠️  Could not create users table entry:', insertError.message);
            console.log('   → User can still login, profile data stored in context');
        } else {
            console.log('   ✓ User profile created');
        }
    }

    console.log('\n✅ Admin user setup complete!\n');
    console.log('📧 Email:', ADMIN_USER.email);
    console.log('🔑 Password:', ADMIN_USER.password);
    console.log('👤 Name:', ADMIN_USER.name);
    console.log('🛡️  Role:', ADMIN_USER.role);
    console.log('📍 Zone:', ADMIN_USER.zone);
    console.log('🏢 Branch:', ADMIN_USER.branch);
    console.log('📦 Modules:', ADMIN_USER.registered_modules.length, 'modules');
}

seedAdminUser();
