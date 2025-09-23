import { z } from "zod";
import type { Registry, AgentDef, ToolDef } from "./engine/types";

// Create and configure the registry
export function createRegistry(): Registry {
  const registry: Registry = {
    agents: new Map(),
    tools: new Map()
  };

  // Register pre-built agents
  registerAgents(registry);
  
  // Register pre-built tools
  registerTools(registry);

  return registry;
}

// Register all agents
function registerAgents(registry: Registry) {
  // Transcriber Agent
  registry.agents.set('transcriber', {
    name: 'transcriber',
    systemPrompt: `You are a professional transcription specialist. Your role is to clean up and format audio transcripts into professional, readable text.

Key responsibilities:
- Remove filler words (um, uh, like, you know)
- Fix grammar and punctuation
- Correct obvious speech-to-text errors
- Maintain the original meaning and speaker intent
- Format for readability

Always return your response as JSON with the cleaned transcript.`,
    userTemplate: `Please clean up this transcript and format it professionally:

{{transcript}}

{{audioUrl}}

Return the cleaned transcript in this format:
\`\`\`json
{
  "transcript": "cleaned and formatted transcript here"
}
\`\`\``,
    outputSchema: z.object({
      transcript: z.string().describe("The cleaned and formatted transcript")
    })
  });

  // Summarizer Agent
  registry.agents.set('summarizer', {
    name: 'summarizer',
    systemPrompt: `You are an expert meeting summarizer. Create clear, actionable summaries from meeting transcripts.

Your summaries should include:
- Key discussion points
- Important decisions made
- Open questions that need follow-up
- Next steps identified

Focus on actionable information and maintain professional tone.`,
    userTemplate: `Please create a comprehensive summary of this meeting transcript:

{{transcript}}

Provide the summary in this format:
\`\`\`json
{
  "summary": "main summary of the meeting",
  "decisions": ["decision 1", "decision 2"],
  "openQuestions": ["question 1", "question 2"]
}
\`\`\``,
    outputSchema: z.object({
      summary: z.string().describe("Main summary of the meeting"),
      decisions: z.array(z.string()).describe("Key decisions made"),
      openQuestions: z.array(z.string()).describe("Open questions requiring follow-up")
    })
  });

  // Action Extractor Agent
  registry.agents.set('actionExtractor', {
    name: 'actionExtractor',
    systemPrompt: `You are an expert at extracting actionable tasks from meeting content. Analyze transcripts and summaries to identify specific action items.

Each action item should have:
- Clear, specific task description
- Assigned owner (if mentioned)
- Due date (if mentioned)
- Priority level
- Any relevant notes

Be thorough but realistic - only extract genuine action items.`,
    userTemplate: `Extract actionable tasks from this meeting content:

Transcript: {{transcript}}
Summary: {{summary}}

Return action items in this format:
\`\`\`json
{
  "actions": [
    {
      "task": "specific task description",
      "owner": "person responsible",
      "due": "due date if mentioned",
      "priority": "Low|Medium|High",
      "notes": "additional context if needed"
    }
  ]
}
\`\`\``,
    outputSchema: z.object({
      actions: z.array(z.object({
        task: z.string().describe("The specific task to be completed"),
        owner: z.string().optional().describe("Person responsible for the task"),
        due: z.string().optional().describe("Due date for the task"),
        priority: z.enum(['Low', 'Medium', 'High']).describe("Task priority"),
        notes: z.string().optional().describe("Additional context or notes")
      }))
    })
  });

  // Publisher Agent
  registry.agents.set('publisher', {
    name: 'publisher',
    systemPrompt: `You are a professional report generator. Create polished, comprehensive reports from meeting data.

Your reports should be:
- Well-structured and professional
- Include all key information
- Ready for distribution
- Appropriately formatted

Tailor the tone and format to the audience and context.`,
    userTemplate: `Create a comprehensive meeting report from this information:

Summary: {{summary}}
Actions: {{actions}}
Export Format: {{export}}

Generate a professional report that includes all key information and action items.

Return the report in this format:
\`\`\`json
{
  "report": "full formatted report text",
  "exportResult": "summary of export actions taken"
}
\`\`\``,
    outputSchema: z.object({
      report: z.string().describe("The complete formatted report"),
      exportResult: z.string().optional().describe("Summary of any export actions")
    })
  });
}

// Register all tools
function registerTools(registry: Registry) {
  // Notion Export Tool
  registry.tools.set('notion.export', {
    name: 'notion.export',
    type: 'builtin',
    spec: {
      database_id: process.env.NOTION_DATABASE_ID || null
    },
    inputSchema: z.object({
      databaseId: z.string().optional(),
      tasks: z.array(z.object({
        task: z.string(),
        owner: z.string().optional(),
        due: z.string().optional(),
        priority: z.string().optional(),
        notes: z.string().optional()
      }))
    }),
    outputSchema: z.object({
      success: z.boolean(),
      created: z.number(),
      tasks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        url: z.string()
      }))
    })
  });

  // Speech to Text Tool
  registry.tools.set('speech.to_text', {
    name: 'speech.to_text',
    type: 'builtin',
    spec: {},
    inputSchema: z.object({
      audioUrl: z.string().optional(),
      transcript: z.string().optional()
    }),
    outputSchema: z.object({
      transcript: z.string(),
      success: z.boolean(),
      duration: z.number()
    })
  });

  // Slack Message Tool
  registry.tools.set('slack.post_message', {
    name: 'slack.post_message',
    type: 'builtin',
    spec: {},
    inputSchema: z.object({
      channel: z.string(),
      message: z.string()
    }),
    outputSchema: z.object({
      success: z.boolean(),
      messageId: z.string()
    })
  });
}

// Register a new agent
export function registerAgent(registry: Registry, name: string, agentDef: AgentDef) {
  registry.agents.set(name, agentDef);
}

// Register a new tool
export function registerTool(registry: Registry, name: string, toolDef: ToolDef) {
  registry.tools.set(name, toolDef);
}

// Get registered agent
export function getAgent(registry: Registry, name: string): AgentDef | undefined {
  return registry.agents.get(name);
}

// Get registered tool
export function getTool(registry: Registry, name: string): ToolDef | undefined {
  return registry.tools.get(name);
}