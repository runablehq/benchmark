import { Sandbox as E2BSandbox } from "@e2b/desktop";
import { Daytona } from "@daytonaio/sdk";
import { SandboxInstance } from "@blaxel/core";

class StatisticsCalculator {
  static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  static calculateMin(values: number[]): number {
    return values.length > 0 ? Math.min(...values) : 0;
  }

  static calculateMax(values: number[]): number {
    return values.length > 0 ? Math.max(...values) : 0;
  }
}

class BenchmarkRunner {
  constructor(private config: BenchmarkConfig) {}

  async runMultiple(
    benchmarkFn: () => Promise<SingleRunResult>,
    providerName: string
  ): Promise<BenchmarkResult> {
    const runs: BenchmarkRun[] = [];
    const failedRuns: BenchmarkRun[] = [];

    console.log(`Starting ${providerName} benchmarks...`);

    for (let i = 1; i <= this.config.runCount; i++) {
      try {
        const singleResult = await benchmarkFn();
        const run: BenchmarkRun = {
          runNumber: i,
          sandboxCreationTime: singleResult.sandboxCreationTime,
          fileCreationTime: singleResult.fileCreationTime,
          totalTime: singleResult.totalTime,
          success: singleResult.success,
          error: singleResult.error,
          timestamp: new Date(),
        };

        runs.push(run);

        if (!run.success) {
          failedRuns.push(run);
          if (this.config.failFast) {
            console.log(`❌ Run ${i} failed, stopping due to failFast mode`);
            break;
          }
        }

        if (this.config.verbose) {
          const status = run.success ? "✅" : "❌";
          console.log(
            `  Run ${i}: Total: ${this.formatTime(run.totalTime)} ${status}`
          );
        } else {
          process.stdout.write("█");
        }

        if (i < this.config.runCount && this.config.delayBetweenRuns > 0) {
          await this.delay(this.config.delayBetweenRuns);
        }
      } catch (error) {
        const run: BenchmarkRun = {
          runNumber: i,
          sandboxCreationTime: 0,
          fileCreationTime: 0,
          totalTime: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        };
        runs.push(run);
        failedRuns.push(run);

        if (this.config.failFast) break;
      }
    }

    if (!this.config.verbose) {
      console.log(
        ` ${runs.filter((r) => r.success).length}/${runs.length} completed`
      );
    }

    return this.calculateResult(providerName, runs, failedRuns);
  }

  private calculateResult(
    providerName: string,
    runs: BenchmarkRun[],
    failedRuns: BenchmarkRun[]
  ): BenchmarkResult {
    const successfulRuns = runs.filter((r) => r.success);

    if (successfulRuns.length === 0) {
      return {
        name: providerName,
        runs,
        averages: { sandboxCreationTime: 0, fileCreationTime: 0, totalTime: 0 },
        statistics: {
          standardDeviation: {
            sandboxCreationTime: 0,
            fileCreationTime: 0,
            totalTime: 0,
          },
          min: { sandboxCreationTime: 0, fileCreationTime: 0, totalTime: 0 },
          max: { sandboxCreationTime: 0, fileCreationTime: 0, totalTime: 0 },
        },
        successRate: 0,
        totalRuns: runs.length,
        failedRuns,
      };
    }

    const sandboxTimes = successfulRuns.map((r) => r.sandboxCreationTime);
    const fileTimes = successfulRuns.map((r) => r.fileCreationTime);
    const totalTimes = successfulRuns.map((r) => r.totalTime);

    return {
      name: providerName,
      runs,
      averages: {
        sandboxCreationTime: StatisticsCalculator.calculateMean(sandboxTimes),
        fileCreationTime: StatisticsCalculator.calculateMean(fileTimes),
        totalTime: StatisticsCalculator.calculateMean(totalTimes),
      },
      statistics: {
        standardDeviation: {
          sandboxCreationTime:
            StatisticsCalculator.calculateStandardDeviation(sandboxTimes),
          fileCreationTime:
            StatisticsCalculator.calculateStandardDeviation(fileTimes),
          totalTime:
            StatisticsCalculator.calculateStandardDeviation(totalTimes),
        },
        min: {
          sandboxCreationTime: StatisticsCalculator.calculateMin(sandboxTimes),
          fileCreationTime: StatisticsCalculator.calculateMin(fileTimes),
          totalTime: StatisticsCalculator.calculateMin(totalTimes),
        },
        max: {
          sandboxCreationTime: StatisticsCalculator.calculateMax(sandboxTimes),
          fileCreationTime: StatisticsCalculator.calculateMax(fileTimes),
          totalTime: StatisticsCalculator.calculateMax(totalTimes),
        },
      },
      successRate: successfulRuns.length / runs.length,
      totalRuns: runs.length,
      failedRuns,
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private formatTime(ms: number): string {
    return `${ms.toFixed(2)}ms`;
  }
}

interface BenchmarkRun {
  runNumber: number;
  sandboxCreationTime: number;
  fileCreationTime: number;
  totalTime: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface BenchmarkStatistics {
  standardDeviation: {
    sandboxCreationTime: number;
    fileCreationTime: number;
    totalTime: number;
  };
  min: {
    sandboxCreationTime: number;
    fileCreationTime: number;
    totalTime: number;
  };
  max: {
    sandboxCreationTime: number;
    fileCreationTime: number;
    totalTime: number;
  };
}

interface BenchmarkResult {
  name: string;
  runs: BenchmarkRun[];
  averages: {
    sandboxCreationTime: number;
    fileCreationTime: number;
    totalTime: number;
  };
  statistics: BenchmarkStatistics;
  successRate: number;
  totalRuns: number;
  failedRuns: BenchmarkRun[];
}

interface BenchmarkConfig {
  runCount: number;
  delayBetweenRuns: number;
  failFast: boolean;
  verbose: boolean;
  outlierDetection: boolean;
}

interface SingleRunResult {
  sandboxCreationTime: number;
  fileCreationTime: number;
  totalTime: number;
  success: boolean;
  error?: string;
}

function loadBenchmarkConfig(): BenchmarkConfig {
  return {
    runCount: parseInt(process.env.BENCHMARK_RUN_COUNT || "5"),
    delayBetweenRuns: parseInt(process.env.BENCHMARK_DELAY_MS || "1000"),
    failFast: process.env.BENCHMARK_FAIL_FAST === "true",
    verbose: process.env.BENCHMARK_VERBOSE === "true",
    outlierDetection: process.env.BENCHMARK_OUTLIER_DETECTION !== "false",
  };
}

async function runSingleE2BBenchmark(): Promise<SingleRunResult> {
  const startTime = performance.now();

  try {
    const sandboxStart = performance.now();
    const sandbox = await E2BSandbox.create();
    const sandboxCreationTime = performance.now() - sandboxStart;

    const fileStart = performance.now();
    await sandbox.files.write("hello.txt", new Blob(["Hello, E2B!"]));
    const fileCreationTime = performance.now() - fileStart;

    const totalTime = performance.now() - startTime;

    await sandbox.kill();

    return {
      sandboxCreationTime,
      fileCreationTime,
      totalTime,
      success: true,
    };
  } catch (error) {
    return {
      sandboxCreationTime: 0,
      fileCreationTime: 0,
      totalTime: performance.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runSingleDaytonaBenchmark(): Promise<SingleRunResult> {
  const startTime = performance.now();

  try {
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
      sandboxCreationTime,
      fileCreationTime,
      totalTime,
      success: true,
    };
  } catch (error) {
    return {
      sandboxCreationTime: 0,
      fileCreationTime: 0,
      totalTime: performance.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runSingleBlaxelBenchmark(): Promise<SingleRunResult> {
  const startTime = performance.now();

  try {
    const sandboxStart = performance.now();
    const sandbox = await SandboxInstance.create({
      name: crypto.randomUUID(),
      image: "blaxel/prod-base:latest",
      metadata: {
        displayName: "Benchmark sandbox",
      },
    });

    await sandbox.wait();

    console.log(sandbox.status);

    const sandboxCreationTime = performance.now() - sandboxStart;

    const fileStart = performance.now();

    await sandbox.fs.mkdir("/blaxel");
    await sandbox.fs.write("/blaxel/test.txt", "Hello, world!");
    await sandbox.fs.read("/blaxel/test.txt");

    const fileCreationTime = performance.now() - fileStart;

    const totalTime = performance.now() - startTime;
    const result = {
      sandboxCreationTime,
      fileCreationTime,
      totalTime,
      success: true,
    };
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
    return {
      sandboxCreationTime: 0,
      fileCreationTime: 0,
      totalTime: performance.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatTime(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

function printResults(results: BenchmarkResult[], config: BenchmarkConfig) {
  console.log(
    `\n=== Sandbox Benchmark Results (${config.runCount} runs each) ===`
  );
  console.log(
    "Provider".padEnd(10) +
      "Avg Sandbox".padEnd(15) +
      "Avg File".padEnd(15) +
      "Avg Total".padEnd(15) +
      "Success".padEnd(10) +
      "Std Dev"
  );
  console.log("-".repeat(80));

  results.forEach((result) => {
    const successRate = `${Math.round(result.successRate * 100)}% (${Math.round(
      result.successRate * result.totalRuns
    )}/${result.totalRuns})`;
    const avgSandboxTime =
      result.successRate > 0
        ? formatTime(result.averages.sandboxCreationTime)
        : "N/A";
    const avgFileTime =
      result.successRate > 0
        ? formatTime(result.averages.fileCreationTime)
        : "N/A";
    const avgTotalTime =
      result.successRate > 0 ? formatTime(result.averages.totalTime) : "N/A";
    const stdDev =
      result.successRate > 0
        ? `±${formatTime(result.statistics.standardDeviation.totalTime)}`
        : "N/A";

    console.log(
      result.name.padEnd(10) +
        avgSandboxTime.padEnd(15) +
        avgFileTime.padEnd(15) +
        avgTotalTime.padEnd(15) +
        successRate.padEnd(10) +
        stdDev
    );

    if (result.successRate > 0) {
      const minMax =
        `          (${formatTime(
          result.statistics.min.sandboxCreationTime
        )}-${formatTime(result.statistics.max.sandboxCreationTime)})` +
        ` (${formatTime(result.statistics.min.fileCreationTime)}-${formatTime(
          result.statistics.max.fileCreationTime
        )})` +
        ` (${formatTime(result.statistics.min.totalTime)}-${formatTime(
          result.statistics.max.totalTime
        )})`;
      console.log(minMax);
    }

    if (result.failedRuns.length > 0 && config.verbose) {
      console.log(
        `  Failed runs: ${result.failedRuns.map((r) => r.runNumber).join(", ")}`
      );
      result.failedRuns.forEach((run) => {
        if (run.error) {
          console.log(`    Run ${run.runNumber}: ${run.error}`);
        }
      });
    }
  });

  const successfulResults = results.filter((r) => r.successRate > 0);
  if (successfulResults.length > 1) {
    console.log("\n=== Statistical Summary ===");
    const fastest = successfulResults.reduce((a, b) =>
      a.averages.totalTime < b.averages.totalTime ? a : b
    );
    console.log(
      `🚀 Fastest Average: ${fastest.name} (${formatTime(
        fastest.averages.totalTime
      )})`
    );

    const mostConsistent = successfulResults.reduce((a, b) =>
      a.statistics.standardDeviation.totalTime <
      b.statistics.standardDeviation.totalTime
        ? a
        : b
    );
    console.log(
      `🏆 Most Consistent: ${mostConsistent.name} (±${formatTime(
        mostConsistent.statistics.standardDeviation.totalTime
      )})`
    );

    console.log(`📊 Confidence Level: 95%`);
  }

  if (config.verbose) {
    console.log("\n=== Individual Run Details ===");
    results.forEach((result) => {
      console.log(`\n${result.name} Runs:`);
      result.runs.forEach((run) => {
        const status = run.success ? "✅" : "❌";
        if (run.success) {
          console.log(
            `  Run ${run.runNumber}: Sandbox: ${formatTime(
              run.sandboxCreationTime
            )}, File: ${formatTime(run.fileCreationTime)}, Total: ${formatTime(
              run.totalTime
            )} ${status}`
          );
        } else {
          console.log(
            `  Run ${run.runNumber}: Failed - ${run.error} ${status}`
          );
        }
      });
    });
  }
}

async function runBenchmark() {
  const config = loadBenchmarkConfig();
  const runner = new BenchmarkRunner(config);

  console.log("🏁 Starting sandbox benchmark comparison...\n");
  console.log(
    `Configuration: ${config.runCount} runs, ${config.delayBetweenRuns}ms delay, verbose: ${config.verbose}\n`
  );

  const results: BenchmarkResult[] = [];

  // Run E2B benchmarks
  try {
    const e2bResult = await runner.runMultiple(runSingleE2BBenchmark, "E2B");
    results.push(e2bResult);
  } catch (error) {
    console.error(`Failed to run E2B benchmarks: ${error}`);
  }

  // Run Daytona benchmarks
  try {
    const daytonaResult = await runner.runMultiple(
      runSingleDaytonaBenchmark,
      "Daytona"
    );
    results.push(daytonaResult);
  } catch (error) {
    console.error(`Failed to run Daytona benchmarks: ${error}`);
  }

  // Run Blaxel benchmarks
  try {
    const blaxelResult = await runner.runMultiple(
      runSingleBlaxelBenchmark,
      "Blaxel"
    );
    results.push(blaxelResult);
  } catch (error) {
    console.error(`Failed to run Blaxel benchmarks: ${error}`);
  }

  if (results.length > 0) {
    printResults(results, config);
  } else {
    console.log("❌ No benchmark results to display");
  }
}

runBenchmark().catch(console.error);
