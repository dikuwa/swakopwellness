import { relations, sql } from "drizzle-orm";
import { boolean, integer, index, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(sql`lower(${table.email})`)],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    system: boolean("system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("roles_name_unique").on(sql`lower(${table.name})`)],
);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId), index("sessions_expires_at_idx").on(table.expiresAt)],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const businessSettings = pgTable("business_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  address: text("address").notNull(),
  telephone: text("telephone").notNull(),
  email: text("email").notNull(),
  operatingHours: text("operating_hours").notNull(),
  appointmentModel: text("appointment_model").notNull(),
  currencyCode: text("currency_code").notNull().default("NAD"),
  currencySymbol: text("currency_symbol").notNull().default("N$"),
  medicalDisclaimer: text("medical_disclaimer").notNull(),
  technologyImageId: uuid("technology_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  documentDetails: jsonb("document_details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessSettingsRelations = relations(businessSettings, ({ one }) => ({
  technologyImage: one(mediaAssets, { fields: [businessSettings.technologyImageId], references: [mediaAssets.id] }),
}));

export const communicationSettings = pgTable("communication_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  enableCalls: boolean("enable_calls").notNull().default(true),
  mainPhone: text("main_phone").notNull(),
  enableEmailContact: boolean("enable_email_contact").notNull().default(true),
  businessEmail: text("business_email").notNull(),
  bookingNotificationEmail: text("booking_notification_email"),
  acknowledgementEmail: text("acknowledgement_email"),
  replyToEmail: text("reply_to_email"),
  enableWhatsapp: boolean("enable_whatsapp").notNull().default(false),
  whatsappNumber: text("whatsapp_number"),
  whatsappDefaultMessage: text("whatsapp_default_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingRules = pgTable("booking_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  openingTime: text("opening_time").notNull().default("08:00"),
  closingTime: text("closing_time").notNull().default("17:00"),
  timezone: text("timezone").notNull().default("Africa/Windhoek"),
  requestMode: text("request_mode").notNull().default("manual_confirmation"),
  duplicateWindowMinutes: integer("duplicate_window_minutes").notNull().default(30),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceCategories = pgTable(
  "service_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("service_categories_slug_unique").on(table.slug)],
);

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull(),
  publicUrl: text("public_url"),
  altText: text("alt_text"),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id").references(() => serviceCategories.id, { onDelete: "set null" }),
    featuredImageId: uuid("featured_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull(),
    priceCents: integer("price_cents").notNull(),
    durationMinutes: integer("duration_minutes"),
    benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
    whatToExpect: text("what_to_expect"),
    preparation: text("preparation"),
    safetyInformation: text("safety_information"),
    publicVisible: boolean("public_visible").notNull().default(true),
    bookingEnabled: boolean("booking_enabled").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("services_slug_unique").on(table.slug), index("services_public_idx").on(table.publicVisible, table.active, table.sortOrder)],
);

export const serviceImages = pgTable(
  "service_images",
  {
    serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
    mediaAssetId: uuid("media_asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.serviceId, table.mediaAssetId] })],
);

export const serviceFaqs = pgTable("service_faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceQuestions = pgTable("service_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  flaggedAnswer: text("flagged_answer").notNull().default("yes"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  publicVisible: boolean("public_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const policies = pgTable(
  "policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    body: text("body").notNull(),
    publicVisible: boolean("public_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("policies_slug_unique").on(table.slug)],
);

export const mediaAssetsRelations = relations(mediaAssets, ({ many }) => ({
  services: many(services),
  businessSettings: many(businessSettings),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, { fields: [services.categoryId], references: [serviceCategories.id] }),
  featuredImage: one(mediaAssets, { fields: [services.featuredImageId], references: [mediaAssets.id] }),
  images: many(serviceImages),
  faqs: many(serviceFaqs),
  questions: many(serviceQuestions),
}));

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    normalizedPhone: text("normalized_phone"),
    email: text("email"),
    normalizedEmail: text("normalized_email"),
    whatsappNumber: text("whatsapp_number"),
    normalizedWhatsapp: text("normalized_whatsapp"),
    preferredContactMethod: text("preferred_contact_method").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastBookingAt: timestamp("last_booking_at", { withTimezone: true }),
  },
  (table) => [
    index("clients_normalized_phone_idx").on(table.normalizedPhone),
    index("clients_normalized_email_idx").on(table.normalizedEmail),
    index("clients_normalized_whatsapp_idx").on(table.normalizedWhatsapp),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    serviceName: text("service_name").notNull(),
    servicePriceCents: integer("service_price_cents").notNull(),
    serviceDurationMinutes: integer("service_duration_minutes"),
    preferredAt: timestamp("preferred_at", { withTimezone: true }).notNull(),
    alternativeAt: timestamp("alternative_at", { withTimezone: true }),
    status: text("status").notNull(),
    source: text("source").notNull(),
    preferredContactMethod: text("preferred_contact_method").notNull(),
    clientType: text("client_type").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bookings_status_preferred_idx").on(table.status, table.preferredAt),
    index("bookings_client_id_idx").on(table.clientId),
    index("bookings_created_at_idx").on(table.createdAt),
  ],
);

export const bookingStatusHistory = pgTable("booking_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingAnswers = pgTable("booking_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").references(() => serviceQuestions.id, { onDelete: "set null" }),
  questionText: text("question_text").notNull(),
  answer: text("answer").notNull(),
  flagged: boolean("flagged").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  client: one(clients, { fields: [bookings.clientId], references: [clients.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  statusHistory: many(bookingStatusHistory),
  answers: many(bookingAnswers),
}));

export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("chat_messages_conversation_idx").on(table.conversationId, table.createdAt)],
);

export const chatToolEvents = pgTable("chat_tool_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  status: text("status").notNull(),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  booking: one(bookings, { fields: [chatConversations.bookingId], references: [bookings.id] }),
  client: one(clients, { fields: [chatConversations.clientId], references: [clients.id] }),
  messages: many(chatMessages),
  toolEvents: many(chatToolEvents),
}));

export const followUps = pgTable(
  "follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    method: text("method").notNull(),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
    internalNote: text("internal_note"),
    status: text("status").notNull().default("pending"),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("follow_ups_status_due_idx").on(table.status, table.dueAt), index("follow_ups_assigned_due_idx").on(table.assignedUserId, table.dueAt)],
);

export const followUpsRelations = relations(followUps, ({ one }) => ({
  client: one(clients, { fields: [followUps.clientId], references: [clients.id] }),
  booking: one(bookings, { fields: [followUps.bookingId], references: [bookings.id] }),
  assignedUser: one(users, { fields: [followUps.assignedUserId], references: [users.id] }),
}));

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("activity_log_entity_idx").on(table.entityType, table.entityId), index("activity_log_created_idx").on(table.createdAt)],
);

export const documentNumberSequences = pgTable(
  "document_number_sequences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentType: text("document_type").notNull().unique(),
    prefix: text("prefix").notNull(),
    nextNumber: integer("next_number").notNull().default(1),
    padding: integer("padding").notNull().default(5),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountType: text("discount_type"),
    discountValue: integer("discount_value"),
    discountCents: integer("discount_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    balanceCents: integer("balance_cents").notNull(),
    status: text("status").notNull().default("draft"),
    notes: text("notes"),
    terms: text("terms"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("invoices_client_idx").on(table.clientId),
    index("invoices_booking_idx").on(table.bookingId),
    index("invoices_status_idx").on(table.status),
  ],
);

export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("line_items_invoice_idx").on(table.invoiceId)],
);

export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quotationNumber: text("quotation_number").notNull().unique(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountType: text("discount_type"),
    discountValue: integer("discount_value"),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    status: text("status").notNull().default("draft"),
    convertedToInvoiceId: uuid("converted_to_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    notes: text("notes"),
    terms: text("terms"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectedReason: text("rejected_reason"),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quotations_client_idx").on(table.clientId),
    index("quotations_status_idx").on(table.status),
  ],
);

export const quotationLineItems = pgTable(
  "quotation_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("line_items_quotation_idx").on(table.quotationId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    amountCents: integer("amount_cents").notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    method: text("method").notNull(),
    reference: text("reference"),
    notes: text("notes"),
    recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, { onDelete: "set null" }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    voidedByUserId: uuid("voided_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_client_idx").on(table.clientId),
    index("payments_invoice_idx").on(table.invoiceId),
    index("payments_date_idx").on(table.paymentDate),
  ],
);

export const receiptLineItems = pgTable(
  "receipt_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    receiptId: uuid("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("line_items_receipt_idx").on(table.receiptId)],
);

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    receiptNumber: text("receipt_number").notNull().unique(),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    amountCents: integer("amount_cents").notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    paymentMethod: text("payment_method").notNull(),
    paymentReference: text("payment_reference"),
    description: text("description"),
    notes: text("notes"),
    receivedByUserId: uuid("received_by_user_id").references(() => users.id, { onDelete: "set null" }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("receipts_client_idx").on(table.clientId),
    index("receipts_invoice_idx").on(table.invoiceId),
    index("receipts_payment_idx").on(table.paymentId),
  ],
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, { fields: [activityLog.userId], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
  lineItems: many(invoiceLineItems),
  payments: many(payments),
  createdBy: one(users, { fields: [invoices.createdByUserId], references: [users.id] }),
  quotations: many(quotations),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceLineItems.invoiceId], references: [invoices.id] }),
  service: one(services, { fields: [invoiceLineItems.serviceId], references: [services.id] }),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  client: one(clients, { fields: [quotations.clientId], references: [clients.id] }),
  booking: one(bookings, { fields: [quotations.bookingId], references: [bookings.id] }),
  lineItems: many(quotationLineItems),
  createdBy: one(users, { fields: [quotations.createdByUserId], references: [users.id] }),
  convertedToInvoice: one(invoices, { fields: [quotations.convertedToInvoiceId], references: [invoices.id] }),
}));

export const quotationLineItemsRelations = relations(quotationLineItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationLineItems.quotationId], references: [quotations.id] }),
  service: one(services, { fields: [quotationLineItems.serviceId], references: [services.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  recordedBy: one(users, { fields: [payments.recordedByUserId], references: [users.id] }),
  voidedBy: one(users, { fields: [payments.voidedByUserId], references: [users.id] }),
  receipts: many(receipts),
}));

export const receiptLineItemsRelations = relations(receiptLineItems, ({ one }) => ({
  receipt: one(receipts, { fields: [receiptLineItems.receiptId], references: [receipts.id] }),
  service: one(services, { fields: [receiptLineItems.serviceId], references: [services.id] }),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  payment: one(payments, { fields: [receipts.paymentId], references: [payments.id] }),
  client: one(clients, { fields: [receipts.clientId], references: [clients.id] }),
  booking: one(bookings, { fields: [receipts.bookingId], references: [bookings.id] }),
  invoice: one(invoices, { fields: [receipts.invoiceId], references: [invoices.id] }),
  receivedBy: one(users, { fields: [receipts.receivedByUserId], references: [users.id] }),
  lineItems: many(receiptLineItems),
}));

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentNumber: text("document_number").notNull().unique(),
    type: text("type").notNull(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    sourceInvoiceId: uuid("source_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    sourceQuotationId: uuid("source_quotation_id").references(() => quotations.id, { onDelete: "set null" }),
    sourceReceiptId: uuid("source_receipt_id").references(() => receipts.id, { onDelete: "set null" }),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    balanceCents: integer("balance_cents").notNull().default(0),
    status: text("status").notNull().default("draft"),
    manualEntry: boolean("manual_entry").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("documents_type_idx").on(table.type),
    index("documents_status_idx").on(table.status),
    index("documents_client_idx").on(table.clientId),
    index("documents_booking_idx").on(table.bookingId),
    index("documents_issue_date_idx").on(table.issueDate),
  ],
);

export const documentLineItems = pgTable(
  "document_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("document_line_items_document_idx").on(table.documentId)],
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  client: one(clients, { fields: [documents.clientId], references: [clients.id] }),
  booking: one(bookings, { fields: [documents.bookingId], references: [bookings.id] }),
  sourceInvoice: one(invoices, { fields: [documents.sourceInvoiceId], references: [invoices.id] }),
  sourceQuotation: one(quotations, { fields: [documents.sourceQuotationId], references: [quotations.id] }),
  sourceReceipt: one(receipts, { fields: [documents.sourceReceiptId], references: [receipts.id] }),
  createdBy: one(users, { fields: [documents.createdByUserId], references: [users.id] }),
  lineItems: many(documentLineItems),
}));

export const documentLineItemsRelations = relations(documentLineItems, ({ one }) => ({
  document: one(documents, { fields: [documentLineItems.documentId], references: [documents.id] }),
  service: one(services, { fields: [documentLineItems.serviceId], references: [services.id] }),
}));

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    index("notifications_created_idx").on(table.createdAt),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
