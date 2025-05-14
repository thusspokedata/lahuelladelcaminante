#!/usr/bin/env node

import { execSync } from "child_process";

// Define directories to include (only lint these)
// Remove 'src/hooks' since it doesn't exist
const includeDirs: string[] = ["src/app", "src/components", "src/lib"];

try {
  // Create a command that only targets specific directories
  const command = `npx eslint --ext .js,.jsx,.ts,.tsx ${includeDirs.join(" ")}`;

  // Run ESLint only on included directories
  execSync(command, {
    encoding: "utf-8",
    stdio: "inherit",
  });

} catch {
  // If ESLint fails, the exit code will be propagated automatically
  process.exit(1);
}
