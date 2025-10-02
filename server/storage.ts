import {
  users, projects, agents, tools, flows, steps, runs, logs, secrets, templates,
  knowledgeBases, knowledgeItems, embeddings, dataSources, dataConnections,
  agentIntegrations, autonomousTriggers, triggerEvents, uiComponents, agentUis,
  type User, type UpsertUser, type Project, type InsertProject,
  type Agent, type InsertAgent, type Tool, type InsertTool,
  type Flow, type InsertFlow, type Step, type InsertStep,
  type Run, type InsertRun, type Log, type InsertLog,
  type Secret, type InsertSecret, type Template, type InsertTemplate,
  type KnowledgeBase, type InsertKnowledgeBase,
  type KnowledgeItem, type InsertKnowledgeItem,
  type Embedding, type InsertEmbedding,
  type DataSource, type InsertDataSource,
  type DataConnection, type InsertDataConnection,
  type AgentIntegration, type InsertAgentIntegration,
  type AutonomousTrigger, type InsertAutonomousTrigger,
  type TriggerEvent, type InsertTriggerEvent,
  type UiComponent, type InsertUiComponent,
  type AgentUi, type InsertAgentUi,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  approveUser(userId: string, approvedBy: string): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  
  // Agent operations
  getAgents(projectId: string): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent>;
  deleteAgent(id: string): Promise<void>;
  
  // Tool operations
  getTools(projectId: string): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, updates: Partial<InsertTool>): Promise<Tool>;
  deleteTool(id: string): Promise<void>;
  
  // Flow operations
  getFlows(projectId: string): Promise<Flow[]>;
  getFlow(id: string): Promise<Flow | undefined>;
  createFlow(flow: InsertFlow): Promise<Flow>;
  updateFlow(id: string, updates: Partial<InsertFlow>): Promise<Flow>;
  deleteFlow(id: string): Promise<void>;
  
  // Step operations
  getSteps(flowId: string): Promise<Step[]>;
  createStep(step: InsertStep): Promise<Step>;
  updateStep(id: string, updates: Partial<InsertStep>): Promise<Step>;
  deleteStep(id: string): Promise<void>;
  
  // Run operations
  getRuns(flowId: string): Promise<Run[]>;
  getRun(id: string): Promise<Run | undefined>;
  createRun(run: InsertRun): Promise<Run>;
  updateRun(id: string, updates: Partial<InsertRun>): Promise<Run>;
  
  // Log operations
  getLogs(runId: string): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Secret operations
  getSecrets(projectId: string): Promise<Secret[]>;
  getSecret(projectId: string, key: string): Promise<Secret | undefined>;
  createSecret(secret: InsertSecret): Promise<Secret>;
  updateSecret(id: string, updates: Partial<InsertSecret>): Promise<Secret>;
  deleteSecret(id: string): Promise<void>;
  
  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;

  // Knowledge Base operations
  getKnowledgeBases(agentId: string): Promise<KnowledgeBase[]>;
  getKnowledgeBase(id: string): Promise<KnowledgeBase | undefined>;
  createKnowledgeBase(knowledgeBase: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBase(id: string, updates: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase>;
  deleteKnowledgeBase(id: string): Promise<void>;

  // Knowledge Item operations
  getKnowledgeItems(knowledgeBaseId: string): Promise<KnowledgeItem[]>;
  getKnowledgeItem(id: string): Promise<KnowledgeItem | undefined>;
  createKnowledgeItem(knowledgeItem: InsertKnowledgeItem): Promise<KnowledgeItem>;
  updateKnowledgeItem(id: string, updates: Partial<InsertKnowledgeItem>): Promise<KnowledgeItem>;
  deleteKnowledgeItem(id: string): Promise<void>;

  // Embedding operations
  getEmbeddings(knowledgeItemId: string): Promise<Embedding[]>;
  createEmbedding(embedding: InsertEmbedding): Promise<Embedding>;
  searchEmbeddings(queryEmbedding: number[], limit: number, knowledgeBaseId?: string): Promise<Array<Embedding & { similarity: number }>>;

  // Data Source operations
  getDataSources(projectId: string): Promise<DataSource[]>;
  getDataSource(id: string): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, updates: Partial<InsertDataSource>): Promise<DataSource>;
  deleteDataSource(id: string): Promise<void>;

  // Data Connection operations
  getDataConnections(agentId: string): Promise<DataConnection[]>;
  getDataConnection(id: string): Promise<DataConnection | undefined>;
  createDataConnection(dataConnection: InsertDataConnection): Promise<DataConnection>;
  updateDataConnection(id: string, updates: Partial<InsertDataConnection>): Promise<DataConnection>;
  deleteDataConnection(id: string): Promise<void>;

  // Integration operations
  getIntegrations(agentId: string): Promise<AgentIntegration[]>;
  getIntegration(id: string): Promise<AgentIntegration | undefined>;
  createIntegration(integration: InsertAgentIntegration): Promise<AgentIntegration>;
  updateIntegration(id: string, updates: Partial<InsertAgentIntegration>): Promise<AgentIntegration>;
  deleteIntegration(id: string): Promise<void>;

  // Trigger operations
  getTriggers(agentId: string): Promise<AutonomousTrigger[]>;
  getTrigger(id: string): Promise<AutonomousTrigger | undefined>;
  createTrigger(trigger: InsertAutonomousTrigger): Promise<AutonomousTrigger>;
  updateTrigger(id: string, updates: Partial<InsertAutonomousTrigger>): Promise<AutonomousTrigger>;
  deleteTrigger(id: string): Promise<void>;

  // Trigger Event operations
  getTriggerEvents(triggerId: string): Promise<TriggerEvent[]>;
  createTriggerEvent(event: InsertTriggerEvent): Promise<TriggerEvent>;
  updateTriggerEvent(id: string, updates: Partial<InsertTriggerEvent>): Promise<TriggerEvent>;

  // UI Component operations
  getUiComponents(agentUiId: string): Promise<UiComponent[]>;
  getUiComponent(id: string): Promise<UiComponent | undefined>;
  createUiComponent(component: InsertUiComponent): Promise<UiComponent>;
  updateUiComponent(id: string, updates: Partial<InsertUiComponent>): Promise<UiComponent>;
  deleteUiComponent(id: string): Promise<void>;

  // Agent UI operations
  getAgentUis(agentId: string): Promise<AgentUi[]>;
  getAgentUi(id: string): Promise<AgentUi | undefined>;
  createAgentUi(agentUi: InsertAgentUi): Promise<AgentUi>;
  updateAgentUi(id: string, updates: Partial<InsertAgentUi>): Promise<AgentUi>;
  deleteAgentUi(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // If we have an ID, try to find and update by ID first
    if (userData.id) {
      const existingUser = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);
      
      if (existingUser.length > 0) {
        // Update existing user by ID
        const [user] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return user;
      }
    }
    
    // Fallback: try to find by email for legacy users
    if (userData.email) {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      if (existingUser.length > 0) {
        // Update existing user found by email
        const [user] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser[0].id))
          .returning();
        return user;
      }
    }
    
    // Create new user with the provided ID or generate one
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id || `auth0|${Date.now()}`, // Use provided ID or generate fallback
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
      })
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isApproved, false)).orderBy(desc(users.createdAt));
  }

  async approveUser(userId: string, approvedBy: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  // Agent operations
  async getAgents(projectId: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.projectId, projectId)).orderBy(desc(agents.updatedAt));
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db.insert(agents).values(agent).returning();
    return newAgent;
  }

  async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent> {
    const [updatedAgent] = await db
      .update(agents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  // Tool operations
  async getTools(projectId: string): Promise<Tool[]> {
    return await db.select().from(tools).where(eq(tools.projectId, projectId));
  }

  async getTool(id: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [newTool] = await db.insert(tools).values(tool).returning();
    return newTool;
  }

  async updateTool(id: string, updates: Partial<InsertTool>): Promise<Tool> {
    const [updatedTool] = await db
      .update(tools)
      .set(updates)
      .where(eq(tools.id, id))
      .returning();
    return updatedTool;
  }

  async deleteTool(id: string): Promise<void> {
    await db.delete(tools).where(eq(tools.id, id));
  }

  // Flow operations
  async getFlows(projectId: string): Promise<Flow[]> {
    return await db.select().from(flows).where(eq(flows.projectId, projectId)).orderBy(desc(flows.updatedAt));
  }

  async getFlow(id: string): Promise<Flow | undefined> {
    const [flow] = await db.select().from(flows).where(eq(flows.id, id));
    return flow;
  }

  async createFlow(flow: InsertFlow): Promise<Flow> {
    const [newFlow] = await db.insert(flows).values(flow).returning();
    return newFlow;
  }

  async updateFlow(id: string, updates: Partial<InsertFlow>): Promise<Flow> {
    const [updatedFlow] = await db
      .update(flows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(flows.id, id))
      .returning();
    return updatedFlow;
  }

  async deleteFlow(id: string): Promise<void> {
    await db.delete(flows).where(eq(flows.id, id));
  }

  // Step operations
  async getSteps(flowId: string): Promise<Step[]> {
    return await db.select().from(steps).where(eq(steps.flowId, flowId)).orderBy(steps.idx);
  }

  async createStep(step: InsertStep): Promise<Step> {
    const [newStep] = await db.insert(steps).values(step).returning();
    return newStep;
  }

  async updateStep(id: string, updates: Partial<InsertStep>): Promise<Step> {
    const [updatedStep] = await db
      .update(steps)
      .set(updates)
      .where(eq(steps.id, id))
      .returning();
    return updatedStep;
  }

  async deleteStep(id: string): Promise<void> {
    await db.delete(steps).where(eq(steps.id, id));
  }

  // Run operations
  async getRuns(flowId: string): Promise<Run[]> {
    return await db.select().from(runs).where(eq(runs.flowId, flowId)).orderBy(desc(runs.createdAt));
  }

  async getRun(id: string): Promise<Run | undefined> {
    const [run] = await db.select().from(runs).where(eq(runs.id, id));
    return run;
  }

  async createRun(run: InsertRun): Promise<Run> {
    const [newRun] = await db.insert(runs).values(run).returning();
    return newRun;
  }

  async updateRun(id: string, updates: Partial<InsertRun>): Promise<Run> {
    const [updatedRun] = await db
      .update(runs)
      .set(updates)
      .where(eq(runs.id, id))
      .returning();
    return updatedRun;
  }

  // Log operations
  async getLogs(runId: string): Promise<Log[]> {
    return await db.select().from(logs).where(eq(logs.runId, runId)).orderBy(logs.ts);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(log).returning();
    return newLog;
  }

  // Secret operations
  async getSecrets(projectId: string): Promise<Secret[]> {
    return await db.select().from(secrets).where(eq(secrets.projectId, projectId));
  }

  async getSecret(projectId: string, key: string): Promise<Secret | undefined> {
    const [secret] = await db.select().from(secrets)
      .where(and(eq(secrets.projectId, projectId), eq(secrets.key, key)));
    return secret;
  }

  async createSecret(secret: InsertSecret): Promise<Secret> {
    const [newSecret] = await db.insert(secrets).values(secret).returning();
    return newSecret;
  }

  async updateSecret(id: string, updates: Partial<InsertSecret>): Promise<Secret> {
    const [updatedSecret] = await db
      .update(secrets)
      .set(updates)
      .where(eq(secrets.id, id))
      .returning();
    return updatedSecret;
  }

  async deleteSecret(id: string): Promise<void> {
    await db.delete(secrets).where(eq(secrets.id, id));
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.isPublic, true));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  // Knowledge Base operations
  async getKnowledgeBases(agentId: string): Promise<KnowledgeBase[]> {
    return await db.select().from(knowledgeBases).where(eq(knowledgeBases.agentId, agentId)).orderBy(desc(knowledgeBases.updatedAt));
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | undefined> {
    const [knowledgeBase] = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, id));
    return knowledgeBase;
  }

  async createKnowledgeBase(knowledgeBase: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [newKnowledgeBase] = await db.insert(knowledgeBases).values(knowledgeBase).returning();
    return newKnowledgeBase;
  }

  async updateKnowledgeBase(id: string, updates: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase> {
    const [updatedKnowledgeBase] = await db
      .update(knowledgeBases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeBases.id, id))
      .returning();
    return updatedKnowledgeBase;
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));
  }

  // Knowledge Item operations
  async getKnowledgeItems(knowledgeBaseId: string): Promise<KnowledgeItem[]> {
    return await db.select().from(knowledgeItems).where(eq(knowledgeItems.knowledgeBaseId, knowledgeBaseId)).orderBy(desc(knowledgeItems.createdAt));
  }

  async getKnowledgeItem(id: string): Promise<KnowledgeItem | undefined> {
    const [knowledgeItem] = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, id));
    return knowledgeItem;
  }

  async createKnowledgeItem(knowledgeItem: InsertKnowledgeItem): Promise<KnowledgeItem> {
    const [newKnowledgeItem] = await db.insert(knowledgeItems).values(knowledgeItem).returning();
    return newKnowledgeItem;
  }

  async updateKnowledgeItem(id: string, updates: Partial<InsertKnowledgeItem>): Promise<KnowledgeItem> {
    const [updatedKnowledgeItem] = await db
      .update(knowledgeItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeItems.id, id))
      .returning();
    return updatedKnowledgeItem;
  }

  async deleteKnowledgeItem(id: string): Promise<void> {
    await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));
  }

  // Embedding operations
  async getEmbeddings(knowledgeItemId: string): Promise<Embedding[]> {
    return await db.select().from(embeddings).where(eq(embeddings.knowledgeItemId, knowledgeItemId));
  }

  async createEmbedding(embedding: InsertEmbedding): Promise<Embedding> {
    const [newEmbedding] = await db.insert(embeddings).values(embedding).returning();
    return newEmbedding;
  }

  async searchEmbeddings(queryEmbedding: number[], limit: number = 10, knowledgeBaseId?: string): Promise<Array<Embedding & { similarity: number }>> {
    // This is a basic implementation - in production you'd use vector similarity search
    // For now, we'll return embeddings with a mock similarity score
    let query = db.select().from(embeddings);
    
    if (knowledgeBaseId) {
      // Join with knowledgeItems to filter by knowledgeBaseId
      query = db.select({
        id: embeddings.id,
        knowledgeItemId: embeddings.knowledgeItemId,
        chunkIndex: embeddings.chunkIndex,
        chunkText: embeddings.chunkText,
        vector: embeddings.vector,
        metadata: embeddings.metadata,
        createdAt: embeddings.createdAt,
      }).from(embeddings)
        .innerJoin(knowledgeItems, eq(embeddings.knowledgeItemId, knowledgeItems.id))
        .where(eq(knowledgeItems.knowledgeBaseId, knowledgeBaseId));
    }
    
    const results = await query.limit(limit);
    
    // Add mock similarity scores - in production this would be calculated using vector similarity
    return results.map((embedding, index) => ({
      ...embedding,
      similarity: Math.max(0.5, 1 - (index * 0.1)) // Mock decreasing similarity
    }));
  }

  // Data Source operations
  async getDataSources(projectId: string): Promise<DataSource[]> {
    return await db.select().from(dataSources).where(eq(dataSources.projectId, projectId)).orderBy(desc(dataSources.updatedAt));
  }

  async getDataSource(id: string): Promise<DataSource | undefined> {
    const [dataSource] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return dataSource;
  }

  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const [newDataSource] = await db.insert(dataSources).values(dataSource).returning();
    return newDataSource;
  }

  async updateDataSource(id: string, updates: Partial<InsertDataSource>): Promise<DataSource> {
    const [updatedDataSource] = await db
      .update(dataSources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataSources.id, id))
      .returning();
    return updatedDataSource;
  }

  async deleteDataSource(id: string): Promise<void> {
    await db.delete(dataSources).where(eq(dataSources.id, id));
  }

  // Data Connection operations
  async getDataConnections(agentId: string): Promise<DataConnection[]> {
    return await db.select().from(dataConnections).where(eq(dataConnections.agentId, agentId)).orderBy(desc(dataConnections.createdAt));
  }

  async getDataConnection(id: string): Promise<DataConnection | undefined> {
    const [dataConnection] = await db.select().from(dataConnections).where(eq(dataConnections.id, id));
    return dataConnection;
  }

  async createDataConnection(dataConnection: InsertDataConnection): Promise<DataConnection> {
    const [newDataConnection] = await db.insert(dataConnections).values(dataConnection).returning();
    return newDataConnection;
  }

  async updateDataConnection(id: string, updates: Partial<InsertDataConnection>): Promise<DataConnection> {
    const [updatedDataConnection] = await db
      .update(dataConnections)
      .set(updates)
      .where(eq(dataConnections.id, id))
      .returning();
    return updatedDataConnection;
  }

  async deleteDataConnection(id: string): Promise<void> {
    await db.delete(dataConnections).where(eq(dataConnections.id, id));
  }

  // Integration operations
  async getIntegrations(agentId: string): Promise<AgentIntegration[]> {
    return await db.select().from(agentIntegrations).where(eq(agentIntegrations.agentId, agentId)).orderBy(desc(agentIntegrations.updatedAt));
  }

  async getIntegration(id: string): Promise<AgentIntegration | undefined> {
    const [integration] = await db.select().from(agentIntegrations).where(eq(agentIntegrations.id, id));
    return integration;
  }

  async createIntegration(integration: InsertAgentIntegration): Promise<AgentIntegration> {
    const [newIntegration] = await db.insert(agentIntegrations).values(integration).returning();
    return newIntegration;
  }

  async updateIntegration(id: string, updates: Partial<InsertAgentIntegration>): Promise<AgentIntegration> {
    const [updatedIntegration] = await db
      .update(agentIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentIntegrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deleteIntegration(id: string): Promise<void> {
    await db.delete(agentIntegrations).where(eq(agentIntegrations.id, id));
  }

  // Trigger operations
  async getTriggers(agentId: string): Promise<AutonomousTrigger[]> {
    return await db.select().from(autonomousTriggers).where(eq(autonomousTriggers.agentId, agentId)).orderBy(desc(autonomousTriggers.updatedAt));
  }

  async getTrigger(id: string): Promise<AutonomousTrigger | undefined> {
    const [trigger] = await db.select().from(autonomousTriggers).where(eq(autonomousTriggers.id, id));
    return trigger;
  }

  async createTrigger(trigger: InsertAutonomousTrigger): Promise<AutonomousTrigger> {
    const [newTrigger] = await db.insert(autonomousTriggers).values(trigger).returning();
    return newTrigger;
  }

  async updateTrigger(id: string, updates: Partial<InsertAutonomousTrigger>): Promise<AutonomousTrigger> {
    const [updatedTrigger] = await db
      .update(autonomousTriggers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(autonomousTriggers.id, id))
      .returning();
    return updatedTrigger;
  }

  async deleteTrigger(id: string): Promise<void> {
    await db.delete(autonomousTriggers).where(eq(autonomousTriggers.id, id));
  }

  // Trigger Event operations
  async getTriggerEvents(triggerId: string): Promise<TriggerEvent[]> {
    return await db.select().from(triggerEvents).where(eq(triggerEvents.triggerId, triggerId)).orderBy(desc(triggerEvents.createdAt));
  }

  async createTriggerEvent(event: InsertTriggerEvent): Promise<TriggerEvent> {
    const [newEvent] = await db.insert(triggerEvents).values(event).returning();
    return newEvent;
  }

  async updateTriggerEvent(id: string, updates: Partial<InsertTriggerEvent>): Promise<TriggerEvent> {
    const [updatedEvent] = await db
      .update(triggerEvents)
      .set(updates)
      .where(eq(triggerEvents.id, id))
      .returning();
    return updatedEvent;
  }

  // UI Component operations
  async getUiComponents(agentUiId: string): Promise<UiComponent[]> {
    return await db.select().from(uiComponents).where(eq(uiComponents.agentUiId, agentUiId)).orderBy(desc(uiComponents.createdAt));
  }

  async getUiComponent(id: string): Promise<UiComponent | undefined> {
    const [component] = await db.select().from(uiComponents).where(eq(uiComponents.id, id));
    return component;
  }

  async createUiComponent(component: InsertUiComponent): Promise<UiComponent> {
    const [newComponent] = await db.insert(uiComponents).values(component).returning();
    return newComponent;
  }

  async updateUiComponent(id: string, updates: Partial<InsertUiComponent>): Promise<UiComponent> {
    const [updatedComponent] = await db
      .update(uiComponents)
      .set(updates)
      .where(eq(uiComponents.id, id))
      .returning();
    return updatedComponent;
  }

  async deleteUiComponent(id: string): Promise<void> {
    await db.delete(uiComponents).where(eq(uiComponents.id, id));
  }

  // Agent UI operations
  async getAgentUis(agentId: string): Promise<AgentUi[]> {
    return await db.select().from(agentUis).where(eq(agentUis.agentId, agentId)).orderBy(desc(agentUis.updatedAt));
  }

  async getAgentUi(id: string): Promise<AgentUi | undefined> {
    const [agentUi] = await db.select().from(agentUis).where(eq(agentUis.id, id));
    return agentUi;
  }

  async createAgentUi(agentUi: InsertAgentUi): Promise<AgentUi> {
    const [newAgentUi] = await db.insert(agentUis).values(agentUi).returning();
    return newAgentUi;
  }

  async updateAgentUi(id: string, updates: Partial<InsertAgentUi>): Promise<AgentUi> {
    const [updatedAgentUi] = await db
      .update(agentUis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentUis.id, id))
      .returning();
    return updatedAgentUi;
  }

  async deleteAgentUi(id: string): Promise<void> {
    await db.delete(agentUis).where(eq(agentUis.id, id));
  }
}

export const storage = new DatabaseStorage();
