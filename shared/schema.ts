import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (for Auth0)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Auth0 user ID (e.g., "auth0|123456789")
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isApproved: boolean("is_approved").default(false),
  isAdmin: boolean("is_admin").default(false),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  userTemplate: text("user_template"),
  fewShots: text("few_shots"),
  inputSchema: jsonb("input_schema"),
  outputSchema: jsonb("output_schema"),
  // Enhanced capabilities
  capabilities: jsonb("capabilities"), // frontend, knowledge, triggers, etc.
  knowledgeBaseConfig: jsonb("knowledge_base_config"), // embedding settings, context injection rules
  frontendConfig: jsonb("frontend_config"), // UI configuration, forms, dashboards
  triggerConfig: jsonb("trigger_config"), // autonomous trigger settings
  dataFabricConfig: jsonb("data_fabric_config"), // data source connections
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tools = pgTable("tools", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  type: text("type").notNull(), // builtin|http|mcp
  spec: jsonb("spec").notNull(), // input schema, endpoint, method, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const flows = pgTable("flows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").default(1),
  inputSchema: jsonb("input_schema"),
  outputSchema: jsonb("output_schema"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const steps = pgTable("steps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: uuid("flow_id").notNull().references(() => flows.id, { onDelete: 'cascade' }),
  idx: integer("idx").notNull(), // order
  kind: text("kind").notNull(), // agent|tool
  refId: uuid("ref_id").notNull(), // agents.id or tools.id
  config: jsonb("config"), // per-step overrides
  createdAt: timestamp("created_at").defaultNow(),
});

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: uuid("flow_id").notNull().references(() => flows.id, { onDelete: 'cascade' }),
  sessionId: text("session_id").notNull(),
  status: text("status").notNull(), // queued|running|success|error
  input: jsonb("input"),
  output: jsonb("output"),
  context: jsonb("context"), // shared context between steps
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const logs = pgTable("logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: 'cascade' }),
  ts: timestamp("ts").defaultNow(),
  level: text("level").notNull(), // info|warn|error
  tags: jsonb("tags").notNull(), // {session, agent, step, tool, mcp}
  message: text("message").notNull(),
  payload: jsonb("payload"),
});

export const secrets = pgTable("secrets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  key: text("key").notNull(),
  valueEnc: text("value_enc").notNull(), // encrypted
  createdAt: timestamp("created_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  isPublic: boolean("is_public").default(false),
  templateData: jsonb("template_data").notNull(), // flow structure and agents
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Management Tables
export const knowledgeBases = pgTable("knowledge_bases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  embeddingModel: text("embedding_model").default("text-embedding-ada-002"),
  vectorDimensions: integer("vector_dimensions").default(1536),
  chunkSize: integer("chunk_size").default(1000),
  chunkOverlap: integer("chunk_overlap").default(200),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  knowledgeBaseId: uuid("knowledge_base_id").notNull().references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // file|url|text|api
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // file info, url, source, etc.
  isProcessed: boolean("is_processed").default(false),
  processingStatus: text("processing_status").default("pending"), // pending|processing|completed|error
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const embeddings = pgTable("embeddings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  knowledgeItemId: uuid("knowledge_item_id").notNull().references(() => knowledgeItems.id, { onDelete: 'cascade' }),
  chunkIndex: integer("chunk_index").notNull(),
  chunkText: text("chunk_text").notNull(),
  vector: text("vector").notNull(), // JSON encoded vector
  metadata: jsonb("metadata"), // chunk metadata, page numbers, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Data Fabric Tables
export const dataSources = pgTable("data_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  type: text("type").notNull(), // database|api|file|webhook
  connectionConfig: jsonb("connection_config").notNull(), // connection details, credentials
  schema: jsonb("schema"), // data structure definition
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dataConnections = pgTable("data_connections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  dataSourceId: uuid("data_source_id").notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  mappingConfig: jsonb("mapping_config"), // how to map data to agent context
  contextKey: text("context_key"), // key in agent context
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dataMappings = pgTable("data_mappings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  dataConnectionId: uuid("data_connection_id").notNull().references(() => dataConnections.id, { onDelete: 'cascade' }),
  sourceField: text("source_field").notNull(),
  targetField: text("target_field").notNull(),
  transformationRule: jsonb("transformation_rule"), // data transformation logic
  createdAt: timestamp("created_at").defaultNow(),
});

// Integration Tables
export const agentIntegrations = pgTable("agent_integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  integrationType: text("integration_type").notNull(), // openai|notion|slack|custom_api|webhook
  config: jsonb("config").notNull(), // integration-specific configuration
  credentials: text("credentials_enc"), // encrypted credentials
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customApis = pgTable("custom_apis", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  baseUrl: text("base_url").notNull(),
  authType: text("auth_type").notNull(), // none|api_key|bearer|oauth
  authConfig: jsonb("auth_config"), // authentication configuration
  endpoints: jsonb("endpoints").notNull(), // array of endpoint definitions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Autonomous Triggers Tables
export const autonomousTriggers = pgTable("autonomous_triggers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // schedule|webhook|event|condition
  config: jsonb("config").notNull(), // trigger-specific configuration
  conditions: jsonb("conditions"), // conditional logic rules
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const triggerEvents = pgTable("trigger_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  triggerId: uuid("trigger_id").notNull().references(() => autonomousTriggers.id, { onDelete: 'cascade' }),
  eventType: text("event_type").notNull(), // execution|webhook_received|condition_met
  payload: jsonb("payload"), // event data
  status: text("status").notNull(), // success|error|pending
  executionResult: jsonb("execution_result"), // agent execution result
  createdAt: timestamp("created_at").defaultNow(),
});

// LangGraph Execution Tables
export const runCheckpoints = pgTable("run_checkpoints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: 'cascade' }),
  stepIdx: integer("step_idx").notNull(),
  status: text("status").notNull(), // pending|running|success|error
  contextJson: jsonb("context_json").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memory = pgTable("memory", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  key: text("key").notNull(),
  valueJson: jsonb("value_json").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Frontend Capabilities Tables
export const agentUis = pgTable("agent_uis", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  uiType: text("ui_type").notNull(), // form|dashboard|chat|custom
  layout: jsonb("layout").notNull(), // UI layout configuration
  styling: jsonb("styling"), // custom styles, themes
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const uiComponents = pgTable("ui_components", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentUiId: uuid("agent_ui_id").notNull().references(() => agentUis.id, { onDelete: 'cascade' }),
  componentType: text("component_type").notNull(), // input|button|chart|table|text|image
  config: jsonb("config").notNull(), // component configuration
  position: jsonb("position"), // x, y, width, height
  validation: jsonb("validation"), // input validation rules
  actions: jsonb("actions"), // component actions/events
  createdAt: timestamp("created_at").defaultNow(),
});

export const formDefinitions = pgTable("form_definitions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull(), // form field definitions
  validation: jsonb("validation"), // form validation rules
  submitAction: jsonb("submit_action"), // what happens on submit
  styling: jsonb("styling"), // form appearance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  agents: many(agents),
  tools: many(tools),
  flows: many(flows),
  secrets: many(secrets),
  dataSources: many(dataSources),
  customApis: many(customApis),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  project: one(projects, {
    fields: [agents.projectId],
    references: [projects.id],
  }),
  knowledgeBases: many(knowledgeBases),
  dataConnections: many(dataConnections),
  agentIntegrations: many(agentIntegrations),
  autonomousTriggers: many(autonomousTriggers),
  agentUis: many(agentUis),
  formDefinitions: many(formDefinitions),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  project: one(projects, {
    fields: [tools.projectId],
    references: [projects.id],
  }),
}));

export const flowsRelations = relations(flows, ({ one, many }) => ({
  project: one(projects, {
    fields: [flows.projectId],
    references: [projects.id],
  }),
  steps: many(steps),
  runs: many(runs),
}));

export const stepsRelations = relations(steps, ({ one }) => ({
  flow: one(flows, {
    fields: [steps.flowId],
    references: [flows.id],
  }),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  flow: one(flows, {
    fields: [runs.flowId],
    references: [flows.id],
  }),
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  run: one(runs, {
    fields: [logs.runId],
    references: [runs.id],
  }),
}));

export const secretsRelations = relations(secrets, ({ one }) => ({
  project: one(projects, {
    fields: [secrets.projectId],
    references: [projects.id],
  }),
}));

// New table relations
export const knowledgeBasesRelations = relations(knowledgeBases, ({ one, many }) => ({
  agent: one(agents, {
    fields: [knowledgeBases.agentId],
    references: [agents.id],
  }),
  knowledgeItems: many(knowledgeItems),
}));

export const knowledgeItemsRelations = relations(knowledgeItems, ({ one, many }) => ({
  knowledgeBase: one(knowledgeBases, {
    fields: [knowledgeItems.knowledgeBaseId],
    references: [knowledgeBases.id],
  }),
  embeddings: many(embeddings),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  knowledgeItem: one(knowledgeItems, {
    fields: [embeddings.knowledgeItemId],
    references: [knowledgeItems.id],
  }),
}));

export const dataSourcesRelations = relations(dataSources, ({ one, many }) => ({
  project: one(projects, {
    fields: [dataSources.projectId],
    references: [projects.id],
  }),
  dataConnections: many(dataConnections),
}));

export const dataConnectionsRelations = relations(dataConnections, ({ one, many }) => ({
  agent: one(agents, {
    fields: [dataConnections.agentId],
    references: [agents.id],
  }),
  dataSource: one(dataSources, {
    fields: [dataConnections.dataSourceId],
    references: [dataSources.id],
  }),
  dataMappings: many(dataMappings),
}));

export const dataMappingsRelations = relations(dataMappings, ({ one }) => ({
  dataConnection: one(dataConnections, {
    fields: [dataMappings.dataConnectionId],
    references: [dataConnections.id],
  }),
}));

export const agentIntegrationsRelations = relations(agentIntegrations, ({ one }) => ({
  agent: one(agents, {
    fields: [agentIntegrations.agentId],
    references: [agents.id],
  }),
}));

export const customApisRelations = relations(customApis, ({ one }) => ({
  project: one(projects, {
    fields: [customApis.projectId],
    references: [projects.id],
  }),
}));

export const autonomousTriggersRelations = relations(autonomousTriggers, ({ one, many }) => ({
  agent: one(agents, {
    fields: [autonomousTriggers.agentId],
    references: [agents.id],
  }),
  triggerEvents: many(triggerEvents),
}));

export const triggerEventsRelations = relations(triggerEvents, ({ one }) => ({
  trigger: one(autonomousTriggers, {
    fields: [triggerEvents.triggerId],
    references: [autonomousTriggers.id],
  }),
}));

export const agentUisRelations = relations(agentUis, ({ one, many }) => ({
  agent: one(agents, {
    fields: [agentUis.agentId],
    references: [agents.id],
  }),
  uiComponents: many(uiComponents),
}));

export const uiComponentsRelations = relations(uiComponents, ({ one }) => ({
  agentUi: one(agentUis, {
    fields: [uiComponents.agentUiId],
    references: [agentUis.id],
  }),
}));

export const formDefinitionsRelations = relations(formDefinitions, ({ one }) => ({
  agent: one(agents, {
    fields: [formDefinitions.agentId],
    references: [agents.id],
  }),
}));

// LangGraph table relations
export const runCheckpointsRelations = relations(runCheckpoints, ({ one }) => ({
  run: one(runs, {
    fields: [runCheckpoints.runId],
    references: [runs.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Create UpsertUser schema that includes optional id for Auth0 subjects
export const upsertUserSchema = insertUserSchema.extend({
  id: z.string().optional(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
});

export const insertFlowSchema = createInsertSchema(flows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStepSchema = createInsertSchema(steps).omit({
  id: true,
  createdAt: true,
});

export const insertRunSchema = createInsertSchema(runs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  ts: true,
});

export const insertSecretSchema = createInsertSchema(secrets).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

// New table insert schemas
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeItemSchema = createInsertSchema(knowledgeItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({
  id: true,
  createdAt: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataConnectionSchema = createInsertSchema(dataConnections).omit({
  id: true,
  createdAt: true,
});

export const insertDataMappingSchema = createInsertSchema(dataMappings).omit({
  id: true,
  createdAt: true,
});

export const insertAgentIntegrationSchema = createInsertSchema(agentIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomApiSchema = createInsertSchema(customApis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutonomousTriggerSchema = createInsertSchema(autonomousTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTriggerEventSchema = createInsertSchema(triggerEvents).omit({
  id: true,
  createdAt: true,
});

export const insertAgentUiSchema = createInsertSchema(agentUis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUiComponentSchema = createInsertSchema(uiComponents).omit({
  id: true,
  createdAt: true,
});

export const insertFormDefinitionSchema = createInsertSchema(formDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// LangGraph insert schemas
export const insertRunCheckpointSchema = createInsertSchema(runCheckpoints).omit({
  id: true,
  createdAt: true,
});

export const insertMemorySchema = createInsertSchema(memory).omit({
  id: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertFlow = z.infer<typeof insertFlowSchema>;
export type Flow = typeof flows.$inferSelect;
export type InsertStep = z.infer<typeof insertStepSchema>;
export type Step = typeof steps.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertSecret = z.infer<typeof insertSecretSchema>;
export type Secret = typeof secrets.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// New table types
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeItem = z.infer<typeof insertKnowledgeItemSchema>;
export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type InsertEmbedding = z.infer<typeof insertEmbeddingSchema>;
export type Embedding = typeof embeddings.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataConnection = z.infer<typeof insertDataConnectionSchema>;
export type DataConnection = typeof dataConnections.$inferSelect;
export type InsertDataMapping = z.infer<typeof insertDataMappingSchema>;
export type DataMapping = typeof dataMappings.$inferSelect;
export type InsertAgentIntegration = z.infer<typeof insertAgentIntegrationSchema>;
export type AgentIntegration = typeof agentIntegrations.$inferSelect;
export type InsertCustomApi = z.infer<typeof insertCustomApiSchema>;
export type CustomApi = typeof customApis.$inferSelect;
export type InsertAutonomousTrigger = z.infer<typeof insertAutonomousTriggerSchema>;
export type AutonomousTrigger = typeof autonomousTriggers.$inferSelect;
export type InsertTriggerEvent = z.infer<typeof insertTriggerEventSchema>;
export type TriggerEvent = typeof triggerEvents.$inferSelect;
export type InsertAgentUi = z.infer<typeof insertAgentUiSchema>;
export type AgentUi = typeof agentUis.$inferSelect;
export type InsertUiComponent = z.infer<typeof insertUiComponentSchema>;
export type UiComponent = typeof uiComponents.$inferSelect;
export type InsertFormDefinition = z.infer<typeof insertFormDefinitionSchema>;
export type FormDefinition = typeof formDefinitions.$inferSelect;

// LangGraph types
export type InsertRunCheckpoint = z.infer<typeof insertRunCheckpointSchema>;
export type RunCheckpoint = typeof runCheckpoints.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memory.$inferSelect;
