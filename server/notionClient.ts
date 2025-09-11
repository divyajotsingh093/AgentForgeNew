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
}>, databaseId?: string | null) {
  try {
    const results = [];
    
    if (!databaseId) {
      // If no database ID provided, return a simulated response with helpful message
      console.warn("No Notion database ID provided, simulating task creation");
      
      for (const task of tasks) {
        results.push({
          id: `simulated_${Math.random().toString(36).substr(2, 9)}`,
          title: task.title,
          url: `https://notion.so/simulated_task_${Math.random().toString(36).substr(2, 9)}`,
          status: 'simulated'
        });
      }
      
      return {
        success: true,
        created: results.length,
        tasks: results,
        warning: 'No database ID provided - tasks were simulated. Set NOTION_DATABASE_ID or provide database_id in tool spec.'
      };
    }
    
    // Only create Notion client when we actually need it (when databaseId is present)
    const notion = await getUncachableNotionClient();
    
    // Attempt to create real tasks in Notion database
    for (const task of tasks) {
      try {
        const properties: any = {
          'Name': {
            title: [
              {
                text: {
                  content: task.title
                }
              }
            ]
          }
        };
        
        // Add optional properties if they exist in the database schema
        if (task.owner) {
          properties['Owner'] = {
            rich_text: [
              {
                text: {
                  content: task.owner
                }
              }
            ]
          };
        }
        
        if (task.due) {
          properties['Due Date'] = {
            date: {
              start: task.due
            }
          };
        }
        
        if (task.priority) {
          properties['Priority'] = {
            select: {
              name: task.priority
            }
          };
        }
        
        if (task.notes) {
          properties['Notes'] = {
            rich_text: [
              {
                text: {
                  content: task.notes
                }
              }
            ]
          };
        }
        
        const response = await notion.pages.create({
          parent: {
            database_id: databaseId
          },
          properties
        });
        
        results.push({
          id: response.id,
          title: task.title,
          url: response.url,
          status: 'created'
        });
        
      } catch (taskError) {
        console.error(`Error creating task "${task.title}":`, taskError);
        
        // Add failed task to results with error info
        results.push({
          id: `failed_${Math.random().toString(36).substr(2, 9)}`,
          title: task.title,
          url: null,
          status: 'failed',
          error: (taskError as Error).message
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'created').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    return {
      success: successCount > 0,
      created: successCount,
      failed: failedCount,
      tasks: results,
      message: `Successfully created ${successCount} tasks${failedCount > 0 ? `, ${failedCount} failed` : ''}`
    };
    
  } catch (error) {
    console.error("Error creating Notion tasks:", error);
    
    // Return structured error response instead of throwing
    return {
      success: false,
      created: 0,
      failed: tasks.length,
      tasks: tasks.map(task => ({
        id: `error_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        url: null,
        status: 'error',
        error: (error as Error).message
      })),
      error: "Failed to create Notion tasks: " + (error as Error).message
    };
  }
}
