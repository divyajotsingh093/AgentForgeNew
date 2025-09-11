import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { executionEngine } from "./executionEngine";
import { insertProjectSchema, insertAgentSchema, insertToolSchema, insertFlowSchema, insertRunSchema } from "@shared/schema";
import { seedAllTemplates } from "./seedTemplates";

export async function registerRoutes(app: Express, server?: Server): Promise<Server> {
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

  // Template instantiation route
  app.post('/api/templates/:templateId/instantiate', isAuthenticated, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const { projectId, name, description, config } = req.body;
      const userId = req.user.claims.sub;

      // Validate required parameters
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      // Get the template
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Validate project belongs to user
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }

      // Extract template data
      const templateData = template.templateData as any;
      
      // Create the flow
      const flowName = name || `${template.name} - ${new Date().toLocaleDateString()}`;
      const flowDescription = description || template.description;
      
      const flowData = insertFlowSchema.parse({
        projectId,
        name: flowName,
        description: flowDescription,
        inputSchema: templateData.inputSchema,
        outputSchema: templateData.outputSchema,
      });

      const createdFlow = await storage.createFlow(flowData);

      // Create agents from template
      const agentMap = new Map<string, string>(); // template name -> database id
      for (const templateAgent of templateData.agents || []) {
        const agentData = insertAgentSchema.parse({
          projectId,
          name: templateAgent.name,
          description: templateAgent.description,
          systemPrompt: templateAgent.systemPrompt,
          userTemplate: templateAgent.userTemplate,
          fewShots: templateAgent.fewShots || null,
          inputSchema: templateAgent.inputSchema,
          outputSchema: templateAgent.outputSchema,
        });

        const createdAgent = await storage.createAgent(agentData);
        agentMap.set(templateAgent.name, createdAgent.id);
      }

      // Create tools from template
      const toolMap = new Map<string, string>(); // template name -> database id
      for (const templateTool of templateData.tools || []) {
        // Apply configuration overrides (like database_id for Notion)
        let toolSpec = { ...templateTool.spec };
        if (config && config.notion_database_id && templateTool.name === 'notion.create_tasks') {
          toolSpec.inputSchema.properties.database_id.default = config.notion_database_id;
        }

        const toolData = insertToolSchema.parse({
          projectId,
          name: templateTool.name,
          type: templateTool.type,
          spec: toolSpec,
        });

        const createdTool = await storage.createTool(toolData);
        toolMap.set(templateTool.name, createdTool.id);
      }

      // Create steps from template
      for (const templateStep of templateData.steps || []) {
        let refId: string;

        if (templateStep.kind === 'agent') {
          refId = agentMap.get(templateStep.name);
        } else if (templateStep.kind === 'tool') {
          refId = toolMap.get(templateStep.name);
        } else {
          throw new Error(`Unknown step kind: ${templateStep.kind}`);
        }

        if (!refId) {
          throw new Error(`Reference not found for step: ${templateStep.name}`);
        }

        // Apply step configuration
        let stepConfig = templateStep.config || {};
        if (config && config.export_target) {
          stepConfig.export_target = config.export_target;
        }

        const stepData = insertStepSchema.parse({
          flowId: createdFlow.id,
          idx: templateStep.idx,
          kind: templateStep.kind,
          refId,
          config: stepConfig,
        });

        await storage.createStep(stepData);
      }

      // Create secrets if needed
      if (templateData.secrets && config && config.secrets) {
        for (const secretTemplate of templateData.secrets) {
          if (config.secrets[secretTemplate.key]) {
            const secretData = insertSecretSchema.parse({
              projectId,
              key: secretTemplate.key,
              valueEnc: config.secrets[secretTemplate.key], // In real implementation, this would be encrypted
            });

            await storage.createSecret(secretData);
          }
        }
      }

      res.json({ 
        success: true,
        flowId: createdFlow.id,
        flow: createdFlow,
        message: "Template instantiated successfully"
      });
    } catch (error) {
      console.error("Error instantiating template:", error);
      res.status(500).json({ message: "Failed to instantiate template" });
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
  const httpServer = server || createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribe_run' && message.runId) {
          // Store runId on the WebSocket connection
          (ws as any).runId = message.runId;
          
          // Verify the run exists
          const run = await storage.getRun(message.runId);
          if (!run) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Run not found'
            }));
            return;
          }
          
          // Send current run status
          ws.send(JSON.stringify({
            type: 'run_status',
            data: {
              status: run.status,
              sessionId: run.sessionId,
              createdAt: run.createdAt,
              completedAt: run.completedAt
            }
          }));
          
          // Send existing logs for this run
          const logs = await storage.getLogs(message.runId);
          logs.forEach(log => {
            ws.send(JSON.stringify({
              type: 'log',
              data: {
                id: log.id,
                timestamp: log.ts,
                level: log.level,
                tags: log.tags,
                message: log.message,
                payload: log.payload
              }
            }));
          });
          
          ws.send(JSON.stringify({
            type: 'subscribed',
            runId: message.runId
          }));
          
          console.log(`Client subscribed to run ${message.runId}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Store WebSocket server for execution engine to broadcast logs
  (httpServer as any).wss = wss;
  executionEngine.setWebSocketServer(wss);

  return httpServer;
}
