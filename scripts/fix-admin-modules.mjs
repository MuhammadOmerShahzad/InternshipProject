#!/usr/bin/env node
/**
 * Fix admin user's registered_modules to match the format used by AddUserDrawer
 * Format: "ModuleName_SubModuleName" or "ModuleName_" for no-submodule modules
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 })

// Matches exactly what getFormattedModules() in AddUserDrawer produces
// Format: "ModuleName_SubModuleName" or "ModuleName_" for no-submodule modules
const ALL_MODULE_KEYS = [
    // Licenses (has submodules)
    'Licenses_Trade Licenses',
    'Licenses_Staff Medicals',
    'Licenses_Tourism Licenses',
    'Licenses_Labour Licenses',

    // Approvals (has submodules)
    'Approvals_Outer Spaces',

    // Vehicles (has submodules)
    'Vehicles_Maintenance',
    'Vehicles_Token Taxes',
    'Vehicles_Route Permits',

    // Health Safety Environment (has submodules)
    'Health Safety Environment_Monthly Inspection',
    'Health Safety Environment_Quarterly Audit',
    'Health Safety Environment_Expiry of Cylinders',
    'Health Safety Environment_Training Status',
    'Health Safety Environment_Incidents',

    // Taxation (has submodules)
    'Taxation_Marketing / BillBoards Taxes',
    'Taxation_Profession Tax',

    // Certificates (has submodules)
    'Certificates_Electric Fitness Test',

    // Security (no submodules)
    'Security_',

    // Rental Agreements (no submodules)
    'Rental Agreements_',

    // User Management (no submodules)
    'User Management_',
]

try {
    const arrayLiteral = `ARRAY[${ALL_MODULE_KEYS.map(k => `'${k.replace(/'/g, "''")}'`).join(',')}]::text[]`

    const [updated] = await sql.unsafe(`
        UPDATE users
        SET registered_modules = ${arrayLiteral}
        WHERE email = 'admin@loop.com'
        RETURNING id, email, array_length(registered_modules, 1) as module_count
    `)

    if (!updated) {
        console.log('❌ User not found — trying admin@muawin.com')
        const [updated2] = await sql.unsafe(`
            UPDATE users
            SET registered_modules = ${arrayLiteral}
            WHERE email = 'admin@muawin.com'
            RETURNING id, email, array_length(registered_modules, 1) as module_count
        `)
        if (updated2) {
            console.log(`✅ Fixed: ${updated2.email} — ${updated2.module_count} module keys`)
        }
    } else {
        console.log(`✅ Fixed: ${updated.email} — ${updated.module_count} module keys`)
        console.log('\nModule keys stored:')
        ALL_MODULE_KEYS.forEach(k => console.log(`  - ${k}`))
    }
} catch (err) {
    console.error('❌ Error:', err.message)
} finally {
    await sql.end()
}
