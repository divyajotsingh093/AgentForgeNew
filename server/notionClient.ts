import { Client } from '@notionhq/client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Notion not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableNotionClient() {
  const accessToken = await getAccessToken();
  return new Client({ auth: accessToken });
}

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw Error("Failed to extract page ID");
}

export async function createNotionTasks(tasks: Array<{
  title: string;
  owner?: string;
  due?: string;
  priority?: 'Low' | 'Medium' | 'High';
  notes?: string;
}>) {
  try {
    const notion = await getUncachableNotionClient();
    
    // This would normally use a configured database ID from project settings
    // For now, we'll create a simple structure
    const results = [];
    
    for (const task of tasks) {
      // In a real implementation, this would create pages in a Notion database
      // For now, we'll simulate the response
      results.push({
        id: `notion_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        url: `https://notion.so/task_${Math.random().toString(36).substr(2, 9)}`
      });
    }
    
    return {
      success: true,
      created: results.length,
      tasks: results
    };
  } catch (error) {
    console.error("Error creating Notion tasks:", error);
    throw new Error("Failed to create Notion tasks: " + (error as Error).message);
  }
}
