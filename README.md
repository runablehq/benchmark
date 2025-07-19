# benchmark


## Sandbox 

```
🏁 Starting sandbox benchmark comparison...

=== Sandbox Benchmark Results (1 runs each) ===
Provider  Avg Sandbox    Avg File       Avg Total      Success   Std Dev
--------------------------------------------------------------------------------
E2B       3645.07ms      412.58ms       4057.65ms      100% (1/1)±0.00ms
          (3645.07ms-3645.07ms) (412.58ms-412.58ms) (4057.65ms-4057.65ms)
Daytona   1735.48ms      817.20ms       2557.49ms      100% (1/1)±0.00ms
          (1735.48ms-1735.48ms) (817.20ms-817.20ms) (2557.49ms-2557.49ms)
Blaxel    10231.41ms     7781.52ms      18012.93ms     100% (1/1)±0.00ms
          (10231.41ms-10231.41ms) (7781.52ms-7781.52ms) (18012.93ms-18012.93ms)
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
