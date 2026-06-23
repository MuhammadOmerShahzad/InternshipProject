#!/usr/bin/env node
/**
 * Check existing zones/branches, then create Admin user safely
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 })

try {
    // Show existing zones
    const zones = await sql`SELECT id, name, code FROM zones ORDER BY name`
    console.log(`\n📍 Existing Zones (${zones.length}):`)
    zones.forEach(z => console.log(`   [${z.code}] ${z.name} — ${z.id}`))

    // Show existing branches
    const branches = await sql`
        SELECT b.id, b.name, z.name as zone_name
        FROM branches b JOIN zones z ON b.zone_id = z.id
        ORDER BY b.name
    `
    console.log(`\n🏢 Existing Branches (${branches.length}):`)
    branches.forEach(b => console.log(`   ${b.name} (${b.zone_name}) — ${b.id}`))

    // Show existing users
    const users = await sql`SELECT id, email, first_name, last_name, role FROM users ORDER BY created_at`
    console.log(`\n👤 Existing Users (${users.length}):`)
    users.forEach(u => console.log(`   [${u.role}] ${u.first_name} ${u.last_name} <${u.email}> — ${u.id}`))

} catch (err) {
    console.error('❌ Error:', err.message)
} finally {
    await sql.end()
}
