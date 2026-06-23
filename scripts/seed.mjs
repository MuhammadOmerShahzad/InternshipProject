#!/usr/bin/env node
/**
 * Seed script — creates a default zone, branch, and Admin user
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 })

console.log('🌱 Seeding database...\n')

try {
    // 1. Create a default zone
    const [zone] = await sql`
        INSERT INTO zones (name, code)
        VALUES ('Main Zone', 'MZ-01')
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name, code
    `
    console.log(`✅ Zone: ${zone.name} (${zone.code}) — ${zone.id}`)

    // 2. Create a default branch
    const [branch] = await sql`
        INSERT INTO branches (name, zone_id)
        VALUES ('Main Branch', ${zone.id})
        ON CONFLICT (name) DO UPDATE SET zone_id = EXCLUDED.zone_id
        RETURNING id, name
    `
    console.log(`✅ Branch: ${branch.name} — ${branch.id}`)

    // 3. Create the admin user
    const email = 'admin@loop.com'
    const password = 'admin123'  // plain text (will be hashed when bcrypt is added)

    const [user] = await sql`
        INSERT INTO users (
            first_name, last_name, email, password_hash,
            role, zone_id, branch_id, registered_modules,
            theme_preference
        )
        VALUES (
            'Omer', 'Shahzad', ${email}, ${password},
            'Admin', ${zone.id}, ${branch.id},
            ARRAY['home', 'user-management', 'files', 'announcements', 'tasks'],
            'light'
        )
        ON CONFLICT (email) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            zone_id = EXCLUDED.zone_id,
            branch_id = EXCLUDED.branch_id,
            registered_modules = EXCLUDED.registered_modules
        RETURNING id, email, role, first_name, last_name
    `
    console.log(`\n✅ Admin user created!`)
    console.log(`   Name:     ${user.first_name} ${user.last_name}`)
    console.log(`   Email:    ${user.email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Role:     ${user.role}`)
    console.log(`   ID:       ${user.id}`)

    console.log('\n🎉 Done! You can now log in with:')
    console.log(`   📧 ${email}`)
    console.log(`   🔑 ${password}`)

} catch (err) {
    console.error('❌ Seed failed:', err.message)
} finally {
    await sql.end()
}
