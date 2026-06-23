import {
  pgTable,
  uuid,
  text,
  boolean,
  bigint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// =============================================
// 1. ZONES TABLE
// =============================================

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(), // 'A', 'B', 'C', 'D', 'E', 'F'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// =============================================
// 2. BRANCHES TABLE
// =============================================

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull().unique(),
    zoneId: uuid('zone_id')
      .notNull()
      .references(() => zones.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_branches_zone_id').on(table.zoneId)]
)

// =============================================
// 3. USERS TABLE
// =============================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

    // Personal Information
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    email: text('email').notNull().unique(),

    // Auth
    passwordHash: text('password_hash'), // bcrypt hashed password

    // Role & Permissions
    role: text('role').notNull().default('Admin'),

    // Organization Hierarchy
    zoneId: uuid('zone_id')
      .notNull()
      .references(() => zones.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),

    // Module Permissions (array stored as text)
    registeredModules: text('registered_modules').array().default(sql`'{}'`),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    // Theme preference
    themePreference: text('theme_preference').default('light'),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_role').on(table.role),
    index('idx_users_zone_id').on(table.zoneId),
    index('idx_users_branch_id').on(table.branchId),
  ]
)

// =============================================
// 4. FILES TABLE
// =============================================

export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

    // File metadata
    filename: text('filename').notNull(),
    originalFilename: text('original_filename').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    storagePath: text('storage_path').notNull().unique(),

    // Module hierarchy
    moduleSlug: text('module_slug').notNull(),
    submoduleSlug: text('submodule_slug').notNull(),

    // Organization hierarchy
    zoneId: uuid('zone_id')
      .notNull()
      .references(() => zones.id, { onDelete: 'restrict' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'restrict' }),

    // Audit
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_files_module').on(table.moduleSlug, table.submoduleSlug),
    index('idx_files_zone_branch').on(table.zoneId, table.branchId),
    index('idx_files_uploaded_by').on(table.uploadedBy),
    index('idx_files_created_at').on(table.createdAt),
  ]
)

// =============================================
// 5. ANNOUNCEMENTS TABLE
// =============================================

export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

    title: text('title').notNull(),
    message: text('message').notNull(),

    // NULL = all branches, otherwise specific branches
    targetBranches: uuid('target_branches').array(),

    // Audit
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_announcements_created_at').on(table.createdAt),
  ]
)

// =============================================
// 6. TASKS TABLE
// =============================================

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

    title: text('title').notNull(),
    description: text('description'),

    // NULL = all branches, otherwise specific branches
    targetBranches: uuid('target_branches').array(),

    completed: boolean('completed').default(false),

    // Audit
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_tasks_created_at').on(table.createdAt),
    index('idx_tasks_completed').on(table.completed),
  ]
)

// =============================================
// 7. RELATIONS (for Drizzle query API)
// =============================================

export const zonesRelations = relations(zones, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  files: many(files),
}))

export const branchesRelations = relations(branches, ({ one, many }) => ({
  zone: one(zones, { fields: [branches.zoneId], references: [zones.id] }),
  users: many(users),
  files: many(files),
}))

export const usersRelations = relations(users, ({ one }) => ({
  zone: one(zones, { fields: [users.zoneId], references: [zones.id] }),
  branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
}))

export const filesRelations = relations(files, ({ one }) => ({
  zone: one(zones, { fields: [files.zoneId], references: [zones.id] }),
  branch: one(branches, { fields: [files.branchId], references: [branches.id] }),
  uploader: one(users, { fields: [files.uploadedBy], references: [users.id] }),
}))

export const announcementsRelations = relations(announcements, ({ one }) => ({
  creator: one(users, { fields: [announcements.createdBy], references: [users.id] }),
}))

export const tasksRelations = relations(tasks, ({ one }) => ({
  creator: one(users, { fields: [tasks.createdBy], references: [users.id] }),
}))

// =============================================
// 8. INFERRED TYPES (for use throughout the app)
// =============================================

export type Zone = typeof zones.$inferSelect
export type NewZone = typeof zones.$inferInsert

export type Branch = typeof branches.$inferSelect
export type NewBranch = typeof branches.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type File = typeof files.$inferSelect
export type NewFile = typeof files.$inferInsert

export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
