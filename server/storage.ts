import {
  users, projects, agents, tools, flows, steps, runs, logs, secrets, templates,
  type User, type UpsertUser, type Project, type InsertProject,
  type Agent, type InsertAgent, type Tool, type InsertTool,
  type Flow, type InsertFlow, type Step, type InsertStep,
  type Run, type InsertRun, type Log, type InsertLog,
  type Secret, type InsertSecret, type Template, type InsertTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export const storage = new DatabaseStorage();
