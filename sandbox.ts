import { Sandbox as E2BSandbox } from "@e2b/desktop";
import { Daytona } from "@daytonaio/sdk";

interface BenchmarkResult {
  name: string;
  sandboxCreationTime: number;
  fileCreationTime: number;
  totalTime: number;
  success: boolean;
  error?: string;
}

async function benchmarkE2B(): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    console.log("Starting E2B benchmark...");
    
    const sandboxStart = performance.now();
    const sandbox = await E2BSandbox.create();
    const sandboxCreationTime = performance.now() - sandboxStart;
    
    const fileStart = performance.now();
    await sandbox.files.write("hello.txt", new Blob(["Hello, E2B!"]));
    const fileCreationTime = performance.now() - fileStart;
    
    const totalTime = performance.now() - startTime;
    
    await sandbox.kill();
    
    return {
      name: "E2B",
      sandboxCreationTime,
      fileCreationTime,
      totalTime,
      success: true
    };
  } catch (error) {
    return {
      name: "E2B",
      sandboxCreationTime: 0,
      fileCreationTime: 0,
      totalTime: performance.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function benchmarkDaytona(): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    console.log("Starting Daytona benchmark...");
    
    const daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
    });
    
    const sandboxStart = performance.now();
    const sandbox = await daytona.create();
    const sandboxCreationTime = performance.now() - sandboxStart;
    
    const fileStart = performance.now();
    await sandbox.fs.uploadFile(Buffer.from("Hello, Daytona!"), "hello.txt");
    const fileCreationTime = performance.now() - fileStart;
    
    const totalTime = performance.now() - startTime;
    
    return {
      name: "Daytona",
      sandboxCreationTime,
      fileCreationTime,
      totalTime,
      success: true
    };
  } catch (error) {
    return {
      name: "Daytona",
      sandboxCreationTime: 0,
      fileCreationTime: 0,
      totalTime: performance.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function formatTime(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

function printResults(results: BenchmarkResult[]) {
  console.log("\n=== Sandbox Benchmark Results ===");
  console.log("Provider".padEnd(10) + "Sandbox".padEnd(15) + "File".padEnd(15) + "Total".padEnd(15) + "Status");
  console.log("-".repeat(70));
  
  results.forEach(result => {
    const status = result.success ? "✅ Success" : "❌ Failed";
    const sandboxTime = result.success ? formatTime(result.sandboxCreationTime) : "N/A";
    const fileTime = result.success ? formatTime(result.fileCreationTime) : "N/A";
    const totalTime = formatTime(result.totalTime);
    
    console.log(
      result.name.padEnd(10) + 
      sandboxTime.padEnd(15) + 
      fileTime.padEnd(15) + 
      totalTime.padEnd(15) + 
      status
    );
    
    if (!result.success && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 1) {
    console.log("\n=== Performance Comparison ===");
    const fastest = successfulResults.reduce((a, b) => 
      a.totalTime < b.totalTime ? a : b
    );
    console.log(`🏆 Fastest overall: ${fastest.name} (${formatTime(fastest.totalTime)})`);
    
    const fastestSandbox = successfulResults.reduce((a, b) => 
      a.sandboxCreationTime < b.sandboxCreationTime ? a : b
    );
    console.log(`🚀 Fastest sandbox creation: ${fastestSandbox.name} (${formatTime(fastestSandbox.sandboxCreationTime)})`);
    
    const fastestFile = successfulResults.reduce((a, b) => 
      a.fileCreationTime < b.fileCreationTime ? a : b
    );
    console.log(`📁 Fastest file creation: ${fastestFile.name} (${formatTime(fastestFile.fileCreationTime)})`);
  }
}

async function runBenchmark() {
  console.log("🏁 Starting sandbox benchmark comparison...\n");
  
  const results = await Promise.all([
    benchmarkE2B(),
    benchmarkDaytona()
  ]);
  
  printResults(results);
}

runBenchmark().catch(console.error);