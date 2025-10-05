import { storage } from "./server/storage";
import { executionEngine } from "./server/executionEngine";
import { nanoid } from "nanoid";

async function runEmailFlowTest() {
  console.log("=".repeat(80));
  console.log("EMAIL COMPOSER END-TO-END TEST");
  console.log("=".repeat(80));
  console.log();

  const flowId = "615a1f8e-126a-44be-9ee8-09aca5f7e701";
  const sessionId = `test-session-${nanoid()}`;

  // Test input
  const testInput = {
    recipient_name: "Sarah Johnson",
    email_subject: "Project Update and Next Steps",
    email_context: "Need to inform the team about the successful completion of Phase 1 of the AI Agent Builder project and outline the next steps for Phase 2, including the new features we'll be implementing."
  };

  console.log("📋 TEST INPUT:");
  console.log(JSON.stringify(testInput, null, 2));
  console.log();

  // Create run
  const startTime = Date.now();
  console.log("⏱️  Starting execution at:", new Date().toISOString());
  console.log();

  const run = await storage.createRun({
    flowId,
    sessionId,
    status: "queued",
    input: testInput,
    context: testInput
  });

  console.log("🚀 Created run with ID:", run.id);
  console.log();

  // Execute flow using legacy execution engine
  console.log("🔄 Executing flow with legacy execution engine...");
  console.log();

  try {
    await executionEngine.executeFlow(run.id);

    const executionTime = Date.now() - startTime;

    // Get final run status
    const completedRun = await storage.getRun(run.id);

    console.log("✅ EXECUTION COMPLETED");
    console.log();
    console.log("📊 EXECUTION RESULTS:");
    console.log("-".repeat(80));
    console.log("Status:", completedRun?.status);
    console.log("Execution Time:", executionTime, "ms");
    console.log();

    console.log("📤 OUTPUT:");
    console.log(JSON.stringify(completedRun?.output, null, 2));
    console.log();

    console.log("📝 CONTEXT:");
    console.log(JSON.stringify(completedRun?.context, null, 2));
    console.log();

    // Get logs
    const logs = await storage.getLogs(run.id);
    console.log("📋 EXECUTION LOGS:");
    console.log("-".repeat(80));
    logs.forEach(log => {
      const timestamp = new Date(log.ts).toISOString();
      const tags = JSON.stringify(log.tags);
      console.log(`[${timestamp}] [${log.level.toUpperCase()}] ${tags} - ${log.message}`);
      if (log.payload) {
        console.log("   Payload:", JSON.stringify(log.payload));
      }
    });
    console.log();

    console.log("=".repeat(80));
    console.log("TEST SUMMARY");
    console.log("=".repeat(80));
    console.log("✓ Flow executed successfully");
    console.log("✓ Total execution time:", executionTime, "ms");
    console.log("✓ Logs captured:", logs.length);
    console.log("✓ Status:", completedRun?.status);
    console.log();

    // Extract and display the email body if available
    if (completedRun?.context) {
      const ctx = completedRun.context as any;
      if (ctx.email_body) {
        console.log("📧 GENERATED EMAIL:");
        console.log("-".repeat(80));
        console.log(ctx.email_body);
        console.log("-".repeat(80));
        console.log();
      }
      if (ctx.Email_Composer_output) {
        console.log("🤖 AGENT OUTPUT:");
        console.log("-".repeat(80));
        console.log(ctx.Email_Composer_output);
        console.log("-".repeat(80));
        console.log();
      }
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("❌ EXECUTION FAILED");
    console.error("Error:", (error as Error).message);
    console.error("Execution time:", executionTime, "ms");
    console.error();

    // Try to get logs even on failure
    try {
      const logs = await storage.getLogs(run.id);
      console.log("📋 ERROR LOGS:");
      logs.forEach(log => {
        console.log(`[${log.level.toUpperCase()}] ${log.message}`);
      });
    } catch (logError) {
      console.error("Could not retrieve logs:", (logError as Error).message);
    }
  }
}

// Run the test
runEmailFlowTest()
  .then(() => {
    console.log("Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
