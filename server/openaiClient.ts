import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateAgentResponse(
  systemPrompt: string,
  userMessage: string,
  context?: Record<string, any>
): Promise<string> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (context && Object.keys(context).length > 0) {
      messages.push({
        role: "user", 
        content: `Context: ${JSON.stringify(context, null, 2)}\n\n${userMessage}`
      });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      temperature: 0.7,
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
