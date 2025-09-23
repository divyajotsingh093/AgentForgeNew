import { readFile } from 'fs/promises';
import { join } from 'path';
import type { FlowDef } from './engine/types';

// Load flow definition from JSON file
export async function loadFlow(flowName: string): Promise<FlowDef> {
  try {
    const flowPath = join(process.cwd(), 'server', 'flows', `${flowName}.json`);
    const flowData = await readFile(flowPath, 'utf-8');
    const flow = JSON.parse(flowData) as FlowDef;
    
    return flow;
  } catch (error) {
    throw new Error(`Failed to load flow "${flowName}": ${(error as Error).message}`);
  }
}

// Load all available flows
export async function loadAllFlows(): Promise<FlowDef[]> {
  const flows: FlowDef[] = [];
  
  try {
    // For now, load known flows
    const flowNames = ['meeting-actions'];
    
    for (const flowName of flowNames) {
      try {
        const flow = await loadFlow(flowName);
        flows.push(flow);
      } catch (error) {
        console.warn(`Failed to load flow "${flowName}":`, error);
      }
    }
    
    return flows;
  } catch (error) {
    console.error('Failed to load flows:', error);
    return [];
  }
}

// Get flow by ID
export async function getFlowById(flowId: string): Promise<FlowDef | null> {
  const flows = await loadAllFlows();
  return flows.find(f => f.id === flowId) || null;
}