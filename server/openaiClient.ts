import OpenAI from "openai";
import { storage } from "./storage";
import { EmbeddingService } from "./embeddingService";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * Retrieve relevant knowledge from agent's knowledge bases
 */
async function retrieveRelevantKnowledge(
  agentId: string, 
  userMessage: string, 
  limit: number = 5
): Promise<string[]> {
  try {
    console.log(`🔍 Retrieving knowledge for agent ${agentId}`);
    
    // Get all knowledge bases associated with this agent
    const knowledgeBases = await storage.getKnowledgeBases(agentId);
    
    if (knowledgeBases.length === 0) {
      console.log(`📝 No knowledge bases found for agent ${agentId}`);
      return [];
    }
    
    const relevantChunks: string[] = [];
    
    // Search each knowledge base for relevant content
    for (const kb of knowledgeBases) {
      try {
        console.log(`🔍 Searching knowledge base: ${kb.name}`);
        
        const results = await EmbeddingService.searchSimilar(
          kb.id,
          userMessage,
          Math.ceil(limit / knowledgeBases.length), // Distribute limit across knowledge bases
          0.001 // Ultra-low threshold to work with mock embeddings
        );
        
        // Add the chunk text to relevant chunks
        for (const result of results) {
          relevantChunks.push(result.chunkText);
        }
        
        console.log(`📊 Found ${results.length} relevant chunks in ${kb.name}`);
      } catch (error) {
        console.error(`Error searching knowledge base ${kb.name}:`, error);
        // Continue with other knowledge bases even if one fails
      }
    }
    
    console.log(`✅ Retrieved ${relevantChunks.length} total knowledge chunks`);
    return relevantChunks.slice(0, limit); // Respect the limit
    
  } catch (error) {
    console.error("Error retrieving relevant knowledge:", error);
    return []; // Return empty array on error, don't break the agent execution
  }
}

export async function generateAgentResponse(
  systemPrompt: string,
  userMessage: string,
  context?: Record<string, any>,
  agentId?: string
): Promise<string> {
  try {
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    let augmentedUserMessage = userMessage;
    let retrievedKnowledge: string[] = [];
    
    // Add knowledge retrieval if agent ID is provided (works with both real and mock embeddings)
    if (agentId) {
      retrievedKnowledge = await retrieveRelevantKnowledge(agentId, userMessage);
      
      if (retrievedKnowledge.length > 0) {
        const knowledgeContext = retrievedKnowledge
          .map((chunk, index) => `[Knowledge ${index + 1}]: ${chunk}`)
          .join('\n\n');
        
        augmentedUserMessage = `Based on the following relevant knowledge from my knowledge base:\n\n${knowledgeContext}\n\n---\n\nUser Query: ${userMessage}`;
        console.log(`🧠 Enhanced prompt with ${retrievedKnowledge.length} knowledge chunks`);
      }
    }

    if (!openai) {
      // If OpenAI isn't configured, return a mock response that includes retrieved knowledge
      console.log("🔄 OpenAI API key not configured, returning mock response with RAG");
      
      let mockResponse = `Mock agent response to: "${userMessage}"\n\nI would normally process this using my system prompt and OpenAI, but the API is not configured.`;
      
      if (retrievedKnowledge.length > 0) {
        mockResponse += `\n\n🧠 Knowledge Retrieved (${retrievedKnowledge.length} chunks):\n`;
        retrievedKnowledge.forEach((chunk, index) => {
          mockResponse += `\n[${index + 1}] ${chunk.substring(0, 150)}...\n`;
        });
        mockResponse += `\nThis knowledge would be included in my actual reasoning process.`;
      } else {
        mockResponse += `\n\n📝 No relevant knowledge found in my knowledge bases.`;
      }
      
      return mockResponse;
    }

    if (context && Object.keys(context).length > 0) {
      messages.push({
        role: "user", 
        content: `Context: ${JSON.stringify(context, null, 2)}\n\n${augmentedUserMessage}`
      });
    } else {
      messages.push({ role: "user", content: augmentedUserMessage });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      // temperature: 0.7, // Disabled - not supported by this model
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate response: " + (error as Error).message);
  }
}

export async function extractStructuredData(
  prompt: string,
  data: string,
  schema: Record<string, any>
): Promise<any> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `${prompt}\n\nReturn the response as JSON matching this schema: ${JSON.stringify(schema)}`
        },
        {
          role: "user",
          content: data
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("OpenAI structured extraction error:", error);
    throw new Error("Failed to extract structured data: " + (error as Error).message);
  }
}

export async function generateFlowFromText(
  description: string,
  expectedInputs?: string
): Promise<any> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    const prompt = `You are an AI agent workflow designer. Generate a complete agent flow based on the user's description.
    
The flow should include:
- A list of agents with their roles, system prompts, and expected inputs/outputs
- A list of tools needed (notion, slack, http, etc.)
- A sequential list of steps connecting agents and tools
- Input and output schemas

Return the response as JSON with this structure:
{
  "name": "Flow Name",
  "description": "Flow description",
  "inputSchema": { "type": "object", "properties": {} },
  "outputSchema": { "type": "object", "properties": {} },
  "agents": [
    {
      "name": "Agent Name",
      "description": "What this agent does",
      "systemPrompt": "You are...",
      "userTemplate": "Process: {{input}}",
      "inputSchema": {},
      "outputSchema": {}
    }
  ],
  "tools": [
    {
      "name": "Tool Name", 
      "type": "builtin|http|mcp",
      "description": "What this tool does",
      "spec": {}
    }
  ],
  "steps": [
    {
      "kind": "agent|tool",
      "name": "Reference to agent or tool name",
      "idx": 0
    }
  ]
}`;

    const userMessage = `Description: ${description}\n${expectedInputs ? `Expected inputs: ${expectedInputs}` : ''}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("Flow generation error:", error);
    throw new Error("Failed to generate flow: " + (error as Error).message);
  }
}
