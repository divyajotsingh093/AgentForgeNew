import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth0";
import { executionEngine } from "./executionEngine";
import { langGraphEngine } from "./langGraphEngine";
import { EmbeddingService } from "./embeddingService";
import { 
  insertProjectSchema, insertAgentSchema, insertToolSchema, insertFlowSchema, insertRunSchema, insertStepSchema, insertSecretSchema,
  insertKnowledgeBaseSchema, insertKnowledgeItemSchema, insertEmbeddingSchema,
  insertDataSourceSchema, insertDataConnectionSchema, insertAgentIntegrationSchema,
  insertAutonomousTriggerSchema, insertTriggerEventSchema, insertUiComponentSchema, insertAgentUiSchema
} from "@shared/schema";
import { seedAllTemplates } from "./seedTemplates";

export async function registerRoutes(app: Express, server?: Server): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow text files, code files, and documents
      const allowedTypes = [
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'application/javascript',
        'application/typescript',
        'text/html',
        'text/css',
        'text/xml'
      ];
      
      if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not supported`), false);
      }
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.get('/api/projects/:projectId/agents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const agents = await storage.getAgents(projectId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.post('/api/projects/:projectId/agents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const agentData = insertAgentSchema.parse({ ...req.body, projectId });
      const agent = await storage.createAgent(agentData);
      res.json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put('/api/agents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.id;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const updates = insertAgentSchema.partial().parse(req.body);
      const updatedAgent = await storage.updateAgent(agentId, updates);
      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.get('/api/agents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.id;
      
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Validate agent ownership through project
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // Knowledge Base routes
  app.get('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const knowledgeBases = await storage.getKnowledgeBases(agentId);
      res.json(knowledgeBases);
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      res.status(500).json({ message: "Failed to fetch knowledge bases" });
    }
  });

  app.post('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const knowledgeBaseData = insertKnowledgeBaseSchema.parse({ 
        ...req.body, 
        agentId 
      });
      const knowledgeBase = await storage.createKnowledgeBase(knowledgeBaseData);
      res.json(knowledgeBase);
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      res.status(500).json({ message: "Failed to create knowledge base" });
    }
  });

  app.put('/api/knowledge-bases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const knowledgeBaseId = req.params.id;
      
      // Validate knowledge base ownership through agent and project
      const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
      if (!knowledgeBase) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      const agent = await storage.getAgent(knowledgeBase.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Knowledge base access denied" });
      }
      
      const updates = insertKnowledgeBaseSchema.partial().parse(req.body);
      const updatedKnowledgeBase = await storage.updateKnowledgeBase(knowledgeBaseId, updates);
      res.json(updatedKnowledgeBase);
    } catch (error) {
      console.error("Error updating knowledge base:", error);
      res.status(500).json({ message: "Failed to update knowledge base" });
    }
  });

  app.delete('/api/knowledge-bases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const knowledgeBaseId = req.params.id;
      
      // Validate knowledge base ownership through agent and project
      const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
      if (!knowledgeBase) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      const agent = await storage.getAgent(knowledgeBase.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Knowledge base access denied" });
      }
      
      await storage.deleteKnowledgeBase(knowledgeBaseId);
      res.json({ message: "Knowledge base deleted successfully" });
    } catch (error) {
      console.error("Error deleting knowledge base:", error);
      res.status(500).json({ message: "Failed to delete knowledge base" });
    }
  });

  // Knowledge Item routes
  app.get('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const knowledgeBaseId = req.params.knowledgeBaseId;
      
      // Validate knowledge base ownership through agent and project
      const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
      if (!knowledgeBase) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      const agent = await storage.getAgent(knowledgeBase.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Knowledge base access denied" });
      }
      
      const items = await storage.getKnowledgeItems(knowledgeBaseId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching knowledge items:", error);
      res.status(500).json({ message: "Failed to fetch knowledge items" });
    }
  });

  app.post('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertKnowledgeItemSchema.parse({
        ...req.body,
        knowledgeBaseId: req.params.knowledgeBaseId
      });
      const item = await storage.createKnowledgeItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating knowledge item:", error);
      res.status(500).json({ message: "Failed to create knowledge item" });
    }
  });

  app.put('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertKnowledgeItemSchema.partial().parse(req.body);
      const item = await storage.updateKnowledgeItem(req.params.id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating knowledge item:", error);
      res.status(500).json({ message: "Failed to update knowledge item" });
    }
  });

  app.delete('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKnowledgeItem(req.params.id);
      res.json({ message: "Knowledge item deleted successfully" });
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
      res.status(500).json({ message: "Failed to delete knowledge item" });
    }
  });

  // File upload and processing route
  app.post('/api/knowledge-bases/:knowledgeBaseId/upload', 
    isAuthenticated, 
    upload.single('file'), 
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const knowledgeBaseId = req.params.knowledgeBaseId;
        
        // Validate knowledge base ownership through agent and project
        const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
        if (!knowledgeBase) {
          return res.status(404).json({ message: "Knowledge base not found" });
        }
        
        const agent = await storage.getAgent(knowledgeBase.agentId);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
        
        const project = await storage.getProject(agent.projectId);
        if (!project || project.userId !== userId) {
          return res.status(403).json({ message: "Knowledge base access denied" });
        }
        
        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Process the uploaded file with embeddings
        try {
          console.log(`🔄 Starting file processing for ${req.file.originalname}...`);
          
          const result = await EmbeddingService.processUploadedFile(
            knowledgeBaseId,
            req.file
          );
          
          console.log(`✅ File processing completed: ${result.itemCount} items, ${result.embeddingsCount} embeddings`);
          
          res.json({
            message: "File uploaded and processed successfully",
            totalChunks: result.totalChunks,
            embeddingsCount: result.embeddingsCount,
            itemCount: result.itemCount,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
          });
        } catch (processingError) {
          console.error("Error processing file:", processingError);
          
          // Create a basic knowledge item as fallback
          const fallbackItemData = insertKnowledgeItemSchema.parse({
            knowledgeBaseId,
            type: 'file',
            title: req.file.originalname,
            content: EmbeddingService.extractTextFromFile(
              req.file.buffer,
              req.file.mimetype,
              req.file.originalname
            ),
            metadata: {
              mimeType: req.file.mimetype,
              filename: req.file.originalname,
              uploadedAt: new Date().toISOString(),
              size: req.file.size,
              processingError: processingError.message,
              processingFailed: true
            }
          });
          
          const fallbackItem = await storage.createKnowledgeItem(fallbackItemData);
          
          res.json({
            message: "File uploaded but processing failed - saved as basic item",
            knowledgeItems: [fallbackItem],
            embeddings: 0,
            totalChunks: 0,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            warning: "Embedding generation failed",
            error: processingError.message
          });
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ 
          message: "Failed to upload file",
          error: error.message 
        });
      }
    }
  );

  // Embedding search route
  app.post('/api/knowledge-bases/:knowledgeBaseId/search', isAuthenticated, async (req, res) => {
    try {
      const { query, limit = 10 } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // TODO: Implement proper vector search
      // For now, return empty results
      const results = await storage.searchEmbeddings(query, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });

  // Data Source routes (Data Fabric)
  app.get('/api/projects/:projectId/data-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const dataSources = await storage.getDataSources(projectId);
      res.json(dataSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post('/api/projects/:projectId/data-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const dataSourceData = insertDataSourceSchema.parse({ 
        ...req.body, 
        projectId 
      });
      const dataSource = await storage.createDataSource(dataSourceData);
      res.json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      res.status(500).json({ message: "Failed to create data source" });
    }
  });

  app.put('/api/data-sources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dataSourceId = req.params.id;
      
      // Validate data source ownership through project
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: "Data source not found" });
      }
      
      const project = await storage.getProject(dataSource.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Data source access denied" });
      }
      
      const updates = insertDataSourceSchema.partial().parse(req.body);
      const updatedDataSource = await storage.updateDataSource(dataSourceId, updates);
      res.json(updatedDataSource);
    } catch (error) {
      console.error("Error updating data source:", error);
      res.status(500).json({ message: "Failed to update data source" });
    }
  });

  app.delete('/api/data-sources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dataSourceId = req.params.id;
      
      // Validate data source ownership through project
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: "Data source not found" });
      }
      
      const project = await storage.getProject(dataSource.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Data source access denied" });
      }
      
      await storage.deleteDataSource(dataSourceId);
      res.json({ message: "Data source deleted successfully" });
    } catch (error) {
      console.error("Error deleting data source:", error);
      res.status(500).json({ message: "Failed to delete data source" });
    }
  });

  // Data Connection routes
  app.get('/api/agents/:agentId/data-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const connections = await storage.getDataConnections(agentId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching data connections:", error);
      res.status(500).json({ message: "Failed to fetch data connections" });
    }
  });

  app.post('/api/agents/:agentId/data-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const connectionData = insertDataConnectionSchema.parse({
        ...req.body,
        agentId
      });
      const connection = await storage.createDataConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating data connection:", error);
      res.status(500).json({ message: "Failed to create data connection" });
    }
  });

  app.put('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertDataConnectionSchema.partial().parse(req.body);
      const connection = await storage.updateDataConnection(req.params.id, updates);
      res.json(connection);
    } catch (error) {
      console.error("Error updating data connection:", error);
      res.status(500).json({ message: "Failed to update data connection" });
    }
  });

  app.delete('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDataConnection(req.params.id);
      res.json({ message: "Data connection deleted successfully" });
    } catch (error) {
      console.error("Error deleting data connection:", error);
      res.status(500).json({ message: "Failed to delete data connection" });
    }
  });

  // Autonomous Triggers routes
  app.get('/api/agents/:agentId/triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const triggers = await storage.getTriggers(agentId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching triggers:", error);
      res.status(500).json({ message: "Failed to fetch triggers" });
    }
  });

  app.post('/api/agents/:agentId/triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const triggerData = insertAutonomousTriggerSchema.parse({
        ...req.body,
        agentId
      });
      const trigger = await storage.createTrigger(triggerData);
      res.json(trigger);
    } catch (error) {
      console.error("Error creating trigger:", error);
      res.status(500).json({ message: "Failed to create trigger" });
    }
  });

  app.put('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAutonomousTriggerSchema.partial().parse(req.body);
      const trigger = await storage.updateTrigger(req.params.id, updates);
      res.json(trigger);
    } catch (error) {
      console.error("Error updating trigger:", error);
      res.status(500).json({ message: "Failed to update trigger" });
    }
  });

  app.delete('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTrigger(req.params.id);
      res.json({ message: "Trigger deleted successfully" });
    } catch (error) {
      console.error("Error deleting trigger:", error);
      res.status(500).json({ message: "Failed to delete trigger" });
    }
  });

  // Trigger execution endpoint
  app.post('/api/triggers/:id/execute', isAuthenticated, async (req, res) => {
    try {
      const trigger = await storage.getTrigger(req.params.id);
      if (!trigger) {
        return res.status(404).json({ message: "Trigger not found" });
      }

      // TODO: Implement trigger execution logic
      // This would integrate with the execution engine
      
      const eventData = insertTriggerEventSchema.parse({
        triggerId: req.params.id,
        eventType: 'manual',
        payload: req.body,
        status: 'triggered'
      });
      
      const event = await storage.createTriggerEvent(eventData);
      res.json({ message: "Trigger executed successfully", event });
    } catch (error) {
      console.error("Error executing trigger:", error);
      res.status(500).json({ message: "Failed to execute trigger" });
    }
  });

  // UI Components routes
  app.get('/api/agent-uis/:agentUiId/components', isAuthenticated, async (req, res) => {
    try {
      const components = await storage.getUiComponents(req.params.agentUiId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching UI components:", error);
      res.status(500).json({ message: "Failed to fetch UI components" });
    }
  });

  app.post('/api/agent-uis/:agentUiId/components', isAuthenticated, async (req, res) => {
    try {
      const componentData = insertUiComponentSchema.parse({
        ...req.body,
        agentUiId: req.params.agentUiId
      });
      const component = await storage.createUiComponent(componentData);
      res.json(component);
    } catch (error) {
      console.error("Error creating UI component:", error);
      res.status(500).json({ message: "Failed to create UI component" });
    }
  });

  app.put('/api/ui-components/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertUiComponentSchema.partial().parse(req.body);
      const component = await storage.updateUiComponent(req.params.id, updates);
      res.json(component);
    } catch (error) {
      console.error("Error updating UI component:", error);
      res.status(500).json({ message: "Failed to update UI component" });
    }
  });

  app.delete('/api/ui-components/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteUiComponent(req.params.id);
      res.json({ message: "UI component deleted successfully" });
    } catch (error) {
      console.error("Error deleting UI component:", error);
      res.status(500).json({ message: "Failed to delete UI component" });
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

  app.post('/api/flows/:id/steps', isAuthenticated, async (req, res) => {
    try {
      const stepData = insertStepSchema.parse({ 
        ...req.body, 
        flowId: req.params.id 
      });
      const step = await storage.createStep(stepData);
      res.json(step);
    } catch (error) {
      console.error("Error creating step:", error);
      res.status(500).json({ message: "Failed to create step" });
    }
  });

  app.put('/api/steps/:id', isAuthenticated, async (req, res) => {
    try {
      const step = await storage.updateStep(req.params.id, req.body);
      res.json(step);
    } catch (error) {
      console.error("Error updating step:", error);
      res.status(500).json({ message: "Failed to update step" });
    }
  });

  app.delete('/api/steps/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteStep(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting step:", error);
      res.status(500).json({ message: "Failed to delete step" });
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

  // LangGraph execution routes
  app.post('/api/langgraph/test/meeting-actions', async (req, res) => {
    try {
      console.log('🚀 Starting LangGraph test execution...');
      
      const result = await langGraphEngine.testMeetingActionsFlow();
      
      console.log('✅ LangGraph test execution completed:', result.status);
      
      res.json({
        success: true,
        message: "LangGraph test execution completed",
        result
      });
    } catch (error) {
      console.error("❌ LangGraph test execution failed:", error);
      res.status(500).json({ 
        success: false,
        message: "LangGraph test execution failed", 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/langgraph/flows/:flowName/run', async (req, res) => {
    try {
      const { flowName } = req.params;
      const { input = {}, sessionId = `session_${Date.now()}` } = req.body;
      
      console.log(`🚀 Starting LangGraph execution for flow: ${flowName}`);
      
      const result = await langGraphEngine.executeFlowByName(flowName, sessionId, input);
      
      console.log(`✅ LangGraph execution completed for ${flowName}:`, result.status);
      
      res.json({
        success: true,
        message: `LangGraph execution completed for ${flowName}`,
        result
      });
    } catch (error) {
      console.error(`❌ LangGraph execution failed for flow:`, error);
      res.status(500).json({ 
        success: false,
        message: "LangGraph execution failed", 
        error: (error as Error).message 
      });
    }
  });

  // Test endpoints (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/test/embedding', isAuthenticated, async (req, res) => {
      try {
        const { text = "This is a test text for embedding generation." } = req.body;
        
        // Limit test text size
        if (text.length > 1000) {
          return res.status(400).json({ 
            success: false,
            message: "Test text too long (max 1000 characters)" 
          });
        }
        
        console.log('🧪 Testing embedding generation for text:', text.substring(0, 50) + '...');
        
        const { EmbeddingService } = await import('./embeddingService');
        const embedding = await EmbeddingService.generateEmbedding(text);
        
        console.log('✅ Successfully generated embedding, length:', embedding.length);
        
        res.json({
          success: true,
          message: "Embedding generated successfully",
          embeddingLength: embedding.length,
          textLength: text.length
        });
      } catch (error) {
        console.error("❌ Embedding generation test failed:", error);
        res.status(500).json({ 
          success: false,
          message: "Embedding generation failed", 
          error: (error as Error).message 
        });
      }
    });

    // Test RAG search endpoint (development only)
    app.post('/api/test/rag-search', isAuthenticated, async (req, res) => {
      try {
        const { 
          query = "What is AgentFlow?", 
          knowledgeBaseId = "1e92d15e-26f8-4f32-9a29-669de638f273",
          threshold = 0.3
        } = req.body;
        
        console.log(`🧪 Testing RAG search for query: "${query}"`);
        
        // First, check if the knowledge base exists
        const kb = await storage.getKnowledgeBase(knowledgeBaseId);
        console.log(`📋 Knowledge base exists: ${kb ? 'Yes' : 'No'}`, kb ? `(${kb.name})` : '');
        
        // Check how many knowledge items are in this knowledge base
        const knowledgeItems = await storage.getKnowledgeItems(knowledgeBaseId);
        console.log(`📄 Knowledge items in KB: ${knowledgeItems.length}`);
        
        // Check total embeddings across all knowledge items
        let totalEmbeddings = 0;
        for (const item of knowledgeItems) {
          const embeddings = await storage.getEmbeddings(item.id);
          totalEmbeddings += embeddings.length;
        }
        console.log(`🔢 Total embeddings: ${totalEmbeddings}`);
        
        const { EmbeddingService } = await import('./embeddingService');
        const results = await EmbeddingService.searchSimilar(knowledgeBaseId, query, 10, threshold);
        
        console.log(`✅ RAG search found ${results.length} results`);
        
        res.json({
          success: true,
          query,
          knowledgeBaseId,
          threshold,
          debug: {
            knowledgeBaseExists: !!kb,
            knowledgeBaseName: kb?.name,
            knowledgeItemsCount: knowledgeItems.length,
            totalEmbeddings
          },
          resultsCount: results.length,
          results: results.map(r => ({
            similarity: r.similarity,
            chunkText: r.chunkText.substring(0, 200) + '...',
            metadata: r.metadata
          }))
        });
      } catch (error) {
        console.error("❌ RAG search test failed:", error);
        res.status(500).json({ 
          success: false,
          message: "RAG search failed", 
          error: (error as Error).message 
        });
      }
    });

    // Test agent RAG integration endpoint (development only)
    app.post('/api/test/agent-rag', isAuthenticated, async (req, res) => {
      try {
        const { userMessage = "What is AgentFlow?", agentId } = req.body;
        
        console.log(`🧪 Testing agent RAG integration for query: "${userMessage}"`);
        
        // First, create a mock agent with knowledge base association if agentId not provided
        let testAgentId = agentId;
        if (!testAgentId) {
          // Use the existing knowledge base
          const knowledgeBaseId = "1e92d15e-26f8-4f32-9a29-669de638f273";
          
          // Create a mock agent data
          const mockAgent = {
            projectId: "b9882355-4895-4a2d-9efc-e0d80d8d30fc",
            name: "RAG Test Agent",
            description: "Test agent for RAG functionality",
            systemPrompt: "You are a helpful assistant that answers questions about AgentFlow using your knowledge base.",
            userTemplate: "{{input}}",
          };
          
          // Create the agent
          const agent = await storage.createAgent(mockAgent);
          testAgentId = agent.id;
          
          // Associate the knowledge base with the agent
          await storage.updateKnowledgeBase(knowledgeBaseId, { agentId: testAgentId });
          
          console.log(`🤖 Created test agent ${testAgentId} and associated with KB ${knowledgeBaseId}`);
        }
        
        // Test the RAG-enabled agent response generation
        const { generateAgentResponse } = await import('./openaiClient');
        const response = await generateAgentResponse(
          "You are a helpful assistant that answers questions about AgentFlow using your knowledge base.",
          userMessage,
          {},
          testAgentId
        );
        
        console.log(`✅ Generated agent response with RAG`);
        
        res.json({
          success: true,
          userMessage,
          agentId: testAgentId,
          response,
          message: "RAG integration test completed successfully"
        });
      } catch (error) {
        console.error("❌ Agent RAG test failed:", error);
        res.status(500).json({ 
          success: false,
          message: "Agent RAG test failed", 
          error: (error as Error).message 
        });
      }
    });
  }

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
      const userId = req.user.id;

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
          refId = agentMap.get(templateStep.name) || '';
        } else if (templateStep.kind === 'tool') {
          refId = toolMap.get(templateStep.name) || '';
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

  // Agent-specific route to get single agent
  app.get('/api/agents/:id', isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // Knowledge Base routes
  app.get('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req, res) => {
    try {
      const knowledgeBases = await storage.getKnowledgeBases(req.params.agentId);
      res.json(knowledgeBases);
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      res.status(500).json({ message: "Failed to fetch knowledge bases" });
    }
  });

  app.post('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req, res) => {
    try {
      const knowledgeBaseData = insertKnowledgeBaseSchema.parse({ ...req.body, agentId: req.params.agentId });
      const knowledgeBase = await storage.createKnowledgeBase(knowledgeBaseData);
      res.json(knowledgeBase);
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      res.status(500).json({ message: "Failed to create knowledge base" });
    }
  });

  app.put('/api/knowledge-bases/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertKnowledgeBaseSchema.partial().parse(req.body);
      const knowledgeBase = await storage.updateKnowledgeBase(req.params.id, updates);
      res.json(knowledgeBase);
    } catch (error) {
      console.error("Error updating knowledge base:", error);
      res.status(500).json({ message: "Failed to update knowledge base" });
    }
  });

  app.delete('/api/knowledge-bases/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKnowledgeBase(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge base:", error);
      res.status(500).json({ message: "Failed to delete knowledge base" });
    }
  });

  // Knowledge Item routes
  app.get('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req, res) => {
    try {
      const knowledgeItems = await storage.getKnowledgeItems(req.params.knowledgeBaseId);
      res.json(knowledgeItems);
    } catch (error) {
      console.error("Error fetching knowledge items:", error);
      res.status(500).json({ message: "Failed to fetch knowledge items" });
    }
  });

  app.post('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req, res) => {
    try {
      const knowledgeItemData = insertKnowledgeItemSchema.parse({ ...req.body, knowledgeBaseId: req.params.knowledgeBaseId });
      const knowledgeItem = await storage.createKnowledgeItem(knowledgeItemData);
      res.json(knowledgeItem);
    } catch (error) {
      console.error("Error creating knowledge item:", error);
      res.status(500).json({ message: "Failed to create knowledge item" });
    }
  });

  app.put('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertKnowledgeItemSchema.partial().parse(req.body);
      const knowledgeItem = await storage.updateKnowledgeItem(req.params.id, updates);
      res.json(knowledgeItem);
    } catch (error) {
      console.error("Error updating knowledge item:", error);
      res.status(500).json({ message: "Failed to update knowledge item" });
    }
  });

  app.delete('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKnowledgeItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
      res.status(500).json({ message: "Failed to delete knowledge item" });
    }
  });

  // Data Source routes
  app.get('/api/projects/:projectId/data-sources', isAuthenticated, async (req, res) => {
    try {
      const dataSources = await storage.getDataSources(req.params.projectId);
      res.json(dataSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post('/api/projects/:projectId/data-sources', isAuthenticated, async (req, res) => {
    try {
      const dataSourceData = insertDataSourceSchema.parse({ ...req.body, projectId: req.params.projectId });
      const dataSource = await storage.createDataSource(dataSourceData);
      res.json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      res.status(500).json({ message: "Failed to create data source" });
    }
  });

  app.put('/api/data-sources/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertDataSourceSchema.partial().parse(req.body);
      const dataSource = await storage.updateDataSource(req.params.id, updates);
      res.json(dataSource);
    } catch (error) {
      console.error("Error updating data source:", error);
      res.status(500).json({ message: "Failed to update data source" });
    }
  });

  app.delete('/api/data-sources/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDataSource(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting data source:", error);
      res.status(500).json({ message: "Failed to delete data source" });
    }
  });

  // Data Connection routes
  app.get('/api/agents/:agentId/data-connections', isAuthenticated, async (req, res) => {
    try {
      const dataConnections = await storage.getDataConnections(req.params.agentId);
      res.json(dataConnections);
    } catch (error) {
      console.error("Error fetching data connections:", error);
      res.status(500).json({ message: "Failed to fetch data connections" });
    }
  });

  app.post('/api/agents/:agentId/data-connections', isAuthenticated, async (req, res) => {
    try {
      const dataConnectionData = insertDataConnectionSchema.parse({ ...req.body, agentId: req.params.agentId });
      const dataConnection = await storage.createDataConnection(dataConnectionData);
      res.json(dataConnection);
    } catch (error) {
      console.error("Error creating data connection:", error);
      res.status(500).json({ message: "Failed to create data connection" });
    }
  });

  app.put('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertDataConnectionSchema.partial().parse(req.body);
      const dataConnection = await storage.updateDataConnection(req.params.id, updates);
      res.json(dataConnection);
    } catch (error) {
      console.error("Error updating data connection:", error);
      res.status(500).json({ message: "Failed to update data connection" });
    }
  });

  app.delete('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDataConnection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting data connection:", error);
      res.status(500).json({ message: "Failed to delete data connection" });
    }
  });

  // Integration routes
  app.get('/api/projects/:projectId/integrations', isAuthenticated, async (req, res) => {
    try {
      const integrations = await storage.getIntegrations(req.params.projectId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/projects/:projectId/integrations', isAuthenticated, async (req, res) => {
    try {
      const integrationData = insertAgentIntegrationSchema.parse({ ...req.body, agentId: req.params.agentId });
      const integration = await storage.createIntegration(integrationData);
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.put('/api/integrations/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAgentIntegrationSchema.partial().parse(req.body);
      const integration = await storage.updateIntegration(req.params.id, updates);
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  app.delete('/api/integrations/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteIntegration(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  // Trigger routes
  app.get('/api/agents/:agentId/triggers', isAuthenticated, async (req, res) => {
    try {
      const triggers = await storage.getTriggers(req.params.agentId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching triggers:", error);
      res.status(500).json({ message: "Failed to fetch triggers" });
    }
  });

  app.post('/api/agents/:agentId/triggers', isAuthenticated, async (req, res) => {
    try {
      const triggerData = insertAutonomousTriggerSchema.parse({ ...req.body, agentId: req.params.agentId });
      const trigger = await storage.createTrigger(triggerData);
      res.json(trigger);
    } catch (error) {
      console.error("Error creating trigger:", error);
      res.status(500).json({ message: "Failed to create trigger" });
    }
  });

  app.put('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAutonomousTriggerSchema.partial().parse(req.body);
      const trigger = await storage.updateTrigger(req.params.id, updates);
      res.json(trigger);
    } catch (error) {
      console.error("Error updating trigger:", error);
      res.status(500).json({ message: "Failed to update trigger" });
    }
  });

  app.delete('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTrigger(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trigger:", error);
      res.status(500).json({ message: "Failed to delete trigger" });
    }
  });

  // Trigger Execution routes
  app.get('/api/triggers/:triggerId/executions', isAuthenticated, async (req, res) => {
    try {
      const executions = await storage.getTriggerEvents(req.params.triggerId);
      res.json(executions);
    } catch (error) {
      console.error("Error fetching trigger executions:", error);
      res.status(500).json({ message: "Failed to fetch trigger executions" });
    }
  });

  app.post('/api/triggers/:triggerId/executions', isAuthenticated, async (req, res) => {
    try {
      const executionData = insertTriggerEventSchema.parse({ ...req.body, triggerId: req.params.triggerId });
      const execution = await storage.createTriggerEvent(executionData);
      res.json(execution);
    } catch (error) {
      console.error("Error creating trigger execution:", error);
      res.status(500).json({ message: "Failed to create trigger execution" });
    }
  });

  // Frontend Component routes
  app.get('/api/agents/:agentId/frontend-components', isAuthenticated, async (req, res) => {
    try {
      const components = await storage.getUiComponents(req.params.agentId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching frontend components:", error);
      res.status(500).json({ message: "Failed to fetch frontend components" });
    }
  });

  app.post('/api/agents/:agentId/frontend-components', isAuthenticated, async (req, res) => {
    try {
      const componentData = insertUiComponentSchema.parse({ ...req.body, agentUiId: req.params.agentUiId });
      const component = await storage.createUiComponent(componentData);
      res.json(component);
    } catch (error) {
      console.error("Error creating frontend component:", error);
      res.status(500).json({ message: "Failed to create frontend component" });
    }
  });

  app.put('/api/frontend-components/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertUiComponentSchema.partial().parse(req.body);
      const component = await storage.updateUiComponent(req.params.id, updates);
      res.json(component);
    } catch (error) {
      console.error("Error updating frontend component:", error);
      res.status(500).json({ message: "Failed to update frontend component" });
    }
  });

  app.delete('/api/frontend-components/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteUiComponent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting frontend component:", error);
      res.status(500).json({ message: "Failed to delete frontend component" });
    }
  });

  // Frontend Layout routes
  app.get('/api/agents/:agentId/frontend-layouts', isAuthenticated, async (req, res) => {
    try {
      const layouts = await storage.getAgentUis(req.params.agentId);
      res.json(layouts);
    } catch (error) {
      console.error("Error fetching frontend layouts:", error);
      res.status(500).json({ message: "Failed to fetch frontend layouts" });
    }
  });

  app.post('/api/agents/:agentId/frontend-layouts', isAuthenticated, async (req, res) => {
    try {
      const layoutData = insertAgentUiSchema.parse({ ...req.body, agentId: req.params.agentId });
      const layout = await storage.createAgentUi(layoutData);
      res.json(layout);
    } catch (error) {
      console.error("Error creating frontend layout:", error);
      res.status(500).json({ message: "Failed to create frontend layout" });
    }
  });

  app.put('/api/frontend-layouts/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAgentUiSchema.partial().parse(req.body);
      const layout = await storage.updateAgentUi(req.params.id, updates);
      res.json(layout);
    } catch (error) {
      console.error("Error updating frontend layout:", error);
      res.status(500).json({ message: "Failed to update frontend layout" });
    }
  });

  app.delete('/api/frontend-layouts/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAgentUi(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting frontend layout:", error);
      res.status(500).json({ message: "Failed to delete frontend layout" });
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
