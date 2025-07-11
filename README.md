# benchmark


## Sandbox 

```
🏁 Starting sandbox benchmark comparison...

Starting E2B benchmark...
Starting Daytona benchmark...
[dotenv@17.2.0] injecting env (0) from .env (tip: ⚙️  override existing env vars with { override: true })
[dotenv@17.2.0] injecting env (0) from .env.local (tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit)

=== Sandbox Benchmark Results ===
Provider  Sandbox        File           Total          Status
----------------------------------------------------------------------
E2B       2247.57ms      299.48ms       2547.06ms      ✅ Success
Daytona   1727.43ms      686.49ms       2415.49ms      ✅ Success

=== Performance Comparison ===
🏆 Fastest overall: Daytona (2415.49ms)
🚀 Fastest sandbox creation: Daytona (1727.43ms)
📁 Fastest file creation: E2B (299.48ms)
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run sandbox.ts
```

This project was created using `bun init` in bun v1.2.17. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
