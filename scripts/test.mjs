import { createServer } from "vite";

async function runAllTests() {
  console.log("🧪 Running unit test suite...");
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const urlStateTest = await server.ssrLoadModule("./src/lib/urlState.test.ts");
    urlStateTest.runUrlStateTests();
    console.log("  ✓ urlState tests passed");

    const promptChipsTest = await server.ssrLoadModule("./src/lib/ai/promptChips.test.ts");
    promptChipsTest.runPromptChipTests();
    console.log("  ✓ promptChips tests passed");

    console.log("🎉 All unit tests passed successfully!");
  } finally {
    await server.close();
  }
}

runAllTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
