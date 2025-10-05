import { db } from "../db.js";
import { featureFlags, projectFeatureFlags } from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";

interface FeatureFlagConfig {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
}

class FeatureFlagService {
  private cache: Map<string, boolean> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  async isEnabled(flagKey: string, projectId?: string): Promise<boolean> {
    const cacheKey = projectId ? `${flagKey}:${projectId}` : flagKey;
    
    // Check cache
    const cachedValue = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (cachedValue !== undefined && expiry && Date.now() < expiry) {
      return cachedValue;
    }

    // Fetch from database
    let enabled = false;

    if (projectId) {
      // Check project-specific override first
      const projectFlag = await db
        .select({ enabled: projectFeatureFlags.enabled })
        .from(projectFeatureFlags)
        .innerJoin(featureFlags, eq(featureFlags.id, projectFeatureFlags.featureFlagId))
        .where(
          and(
            eq(featureFlags.key, flagKey),
            eq(projectFeatureFlags.projectId, projectId)
          )
        )
        .limit(1);

      if (projectFlag.length > 0) {
        enabled = projectFlag[0].enabled;
      } else {
        // Fall back to global flag
        enabled = await this.getGlobalFlag(flagKey);
      }
    } else {
      enabled = await this.getGlobalFlag(flagKey);
    }

    // Update cache
    this.cache.set(cacheKey, enabled);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    return enabled;
  }

  private async getGlobalFlag(flagKey: string): Promise<boolean> {
    const flag = await db
      .select({ enabled: featureFlags.enabled, rolloutPercentage: featureFlags.rolloutPercentage })
      .from(featureFlags)
      .where(eq(featureFlags.key, flagKey))
      .limit(1);

    if (flag.length === 0) {
      return false;
    }

    const enabled = flag[0].enabled ?? false;
    const rollout = flag[0].rolloutPercentage ?? 100;
    
    // Simple rollout: if rolloutPercentage is set, use random sampling
    if (rollout < 100) {
      return enabled && Math.random() * 100 < rollout;
    }

    return enabled;
  }

  async createFlag(config: FeatureFlagConfig): Promise<void> {
    await db.insert(featureFlags).values({
      key: config.key,
      name: config.name,
      description: config.description,
      enabled: config.enabled,
      rolloutPercentage: config.rolloutPercentage ?? 100,
      conditions: config.conditions,
    }).onConflictDoNothing({
      target: featureFlags.key,
    });

    this.clearCache();
  }

  async setProjectFlag(projectId: string, flagKey: string, enabled: boolean): Promise<void> {
    const flag = await db
      .select({ id: featureFlags.id })
      .from(featureFlags)
      .where(eq(featureFlags.key, flagKey))
      .limit(1);

    if (flag.length === 0) {
      throw new Error(`Feature flag '${flagKey}' not found`);
    }

    await db.insert(projectFeatureFlags).values({
      projectId,
      featureFlagId: flag[0].id,
      enabled,
    }).onConflictDoUpdate({
      target: [projectFeatureFlags.projectId, projectFeatureFlags.featureFlagId],
      set: { enabled }
    });

    this.clearCache();
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const featureFlagService = new FeatureFlagService();

// Feature flag keys
export const FeatureFlags = {
  LANGGRAPH_ENGINE: 'langgraph_engine',
  POLICY_ENGINE: 'policy_engine',
  TELEMETRY_DETAILED: 'telemetry_detailed',
  SKILLS_REGISTRY: 'skills_registry',
  MCP_CLIENT: 'mcp_client',
  MCP_SERVER: 'mcp_server',
  HUMAN_IN_LOOP: 'human_in_loop',
  PARALLEL_EXECUTION: 'parallel_execution',
} as const;

// Initialize default feature flags
export async function initializeFeatureFlags(): Promise<void> {
  const flags: FeatureFlagConfig[] = [
    {
      key: FeatureFlags.LANGGRAPH_ENGINE,
      name: 'LangGraph Execution Engine',
      description: 'Use LangGraph for advanced workflow orchestration (parallel, conditional, loops)',
      enabled: false, // Start disabled, gradually roll out
      rolloutPercentage: 0,
    },
    {
      key: FeatureFlags.POLICY_ENGINE,
      name: 'Policy Engine',
      description: 'Enable policy enforcement for latency, cost, quality, and PII',
      enabled: false,
      rolloutPercentage: 0,
    },
    {
      key: FeatureFlags.TELEMETRY_DETAILED,
      name: 'Detailed Telemetry',
      description: 'Capture detailed execution metrics for learning and optimization',
      enabled: true, // Enable by default for observability
    },
    {
      key: FeatureFlags.SKILLS_REGISTRY,
      name: 'Skills Registry',
      description: 'Enable skills registry for reusable agent capabilities',
      enabled: false,
    },
    {
      key: FeatureFlags.MCP_CLIENT,
      name: 'MCP Client',
      description: 'Allow agents to invoke external MCP tools',
      enabled: false,
    },
    {
      key: FeatureFlags.MCP_SERVER,
      name: 'MCP Server',
      description: 'Expose Vortic flows and tools via MCP protocol',
      enabled: false,
    },
    {
      key: FeatureFlags.HUMAN_IN_LOOP,
      name: 'Human-in-the-Loop',
      description: 'Enable human approval gates in workflows',
      enabled: true, // Enable by default for safety
    },
    {
      key: FeatureFlags.PARALLEL_EXECUTION,
      name: 'Parallel Execution',
      description: 'Execute independent workflow steps in parallel (requires LangGraph)',
      enabled: false,
    },
  ];

  for (const flag of flags) {
    await featureFlagService.createFlag(flag);
  }
}
