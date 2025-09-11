import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { executionEngine } from "./executionEngine";
import { insertProjectSchema, insertAgentSchema, insertToolSchema, insertFlowSchema, insertRunSchema } from "@shared/schema";
import { seedAllTemplates } from "./seedTemplates";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Agent routes
  app.get('/api/projects/:projectId/agents', isAuthenticated, async (req, res) => {
    try {
      const agents = await storage.getAgents(req.params.projectId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.post('/api/projects/:projectId/agents', isAuthenticated, async (req, res) => {
    try {
      const agentData = insertAgentSchema.parse({ ...req.body, projectId: req.params.projectId });
      const agent = await storage.createAgent(agentData);
      res.json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put('/api/agents/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAgentSchema.partial().parse(req.body);
      const agent = await storage.updateAgent(req.params.id, updates);
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  // Tool routes
  app.get('/api/projects/:projectId/tools', isAuthenticated, async (req, res) => {
    try {
      const tools = await storage.getTools(req.params.projectId);
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.post('/api/projects/:projectId/tools', isAuthenticated, async (req, res) => {
    try {
      const toolData = insertToolSchema.parse({ ...req.body, projectId: req.params.projectId });
      const tool = await storage.createTool(toolData);
      res.json(tool);
    } catch (error) {
      console.error("Error creating tool:", error);
      res.status(500).json({ message: "Failed to create tool" });
    }
  });

  // Flow routes
  app.get('/api/projects/:projectId/flows', isAuthenticated, async (req, res) => {
    try {
      const flows = await storage.getFlows(req.params.projectId);
      res.json(flows);
    } catch (error) {
      console.error("Error fetching flows:", error);
      res.status(500).json({ message: "Failed to fetch flows" });
    }
  });

  app.post('/api/projects/:projectId/flows', isAuthenticated, async (req, res) => {
    try {
      const flowData = insertFlowSchema.parse({ ...req.body, projectId: req.params.projectId });
      const flow = await storage.createFlow(flowData);
      res.json(flow);
    } catch (error) {
      console.error("Error creating flow:", error);
      res.status(500).json({ message: "Failed to create flow" });
    }
  });

  app.get('/api/flows/:id', isAuthenticated, async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.id);
      if (!flow) {
        return res.status(404).json({ message: "Flow not found" });
      }
      res.json(flow);
    } catch (error) {
      console.error("Error fetching flow:", error);
      res.status(500).json({ message: "Failed to fetch flow" });
    }
  });

  app.get('/api/flows/:id/steps', isAuthenticated, async (req, res) => {
    try {
      const steps = await storage.getSteps(req.params.id);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching steps:", error);
      res.status(500).json({ message: "Failed to fetch steps" });
    }
  });

  // Run routes
  app.post('/api/flows/:id/run', isAuthenticated, async (req, res) => {
    try {
      const runData = insertRunSchema.parse({
        flowId: req.params.id,
        sessionId: `run_${Date.now()}`,
        status: 'queued',
        input: req.body.input || {},
        context: {}
      });
      
      const run = await storage.createRun(runData);
      
      // Start execution asynchronously
      executionEngine.executeFlow(run.id).catch((error: unknown) => {
        console.error("Flow execution error:", error);
      });
      
      res.json(run);
    } catch (error) {
      console.error("Error starting run:", error);
      res.status(500).json({ message: "Failed to start run" });
    }
  });

  app.get('/api/runs/:id', isAuthenticated, async (req, res) => {
    try {
      const run = await storage.getRun(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching run:", error);
      res.status(500).json({ message: "Failed to fetch run" });
    }
  });

  app.get('/api/runs/:id/logs', isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Template routes
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Manual template seeding endpoint
  app.post('/api/templates/seed', async (req, res) => {
    try {
      console.log('🌱 Manual template seeding triggered...');
      const result = await seedAllTemplates();
      res.json({
        success: result.success,
        message: result.success ? 'Templates seeded successfully' : 'Template seeding failed',
        templates: result.templates || [],
        error: result.error || null
      });
    } catch (error) {
      console.error("Error seeding templates:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to seed templates", 
        error: error 
      });
    }
  });

  // Text-to-Agent route
  app.post('/api/text-to-agent', isAuthenticated, async (req, res) => {
    try {
      const { description, inputs, projectId } = req.body;
      
      // This would use OpenAI to generate the flow structure
      // For now, return a basic structure
      const generatedFlow = {
        name: "Generated Flow",
        description: description,
        agents: [],
        tools: [],
        steps: []
      };
      
      res.json(generatedFlow);
    } catch (error) {
      console.error("Error generating agent flow:", error);
      res.status(500).json({ message: "Failed to generate agent flow" });
    }
  });

  // Setup WebSocket server for real-time logs
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribe_run') {
          // Subscribe to run updates
          const runId = message.runId;
          ws.send(JSON.stringify({
            type: 'subscribed',
            runId: runId
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Store WebSocket server for execution engine to broadcast logs
  (httpServer as any).wss = wss;

  return httpServer;
}
