import type { Command } from "commander";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { setupTsciProject } from "lib/shared/setup-tsci-packages";
import { generateTsConfig } from "lib/shared/generate-ts-config";
import { writeFileIfNotExists } from "lib/shared/write-file-if-not-exists";
import { generateGitIgnoreFile } from "lib/shared/generate-gitignore-file";
import { generatePackageJson } from "lib/shared/generate-package-json";
import { version as currentVersion } from "package.json"; // Ensure this path is correct

export const registerInit = (program: Command) => {
  program
    .command("init")
    .description(
      "Initialize a new TSCircuit project in the specified directory (or current directory if none is provided)"
    )
    .argument(
      "[directory]",
      "Directory name (optional, defaults to current directory)"
    )
    .action((directory?: string) => {
      // Step 1: Check for the latest version
      try {
        const latestVersion = execSync("npm view tsci version", {
          encoding: "utf-8",
        }).trim();

        if (latestVersion !== currentVersion) {
          console.warn(
            `⚠️ You are using version ${currentVersion}, but the latest version is ${latestVersion}. Consider updating with "npm install -g tsci@latest".`
          );
        } else {
          console.info(`✅ You are using the latest version (${currentVersion}).`);
        }
      } catch (error) {
        console.error("⚠️ Could not check the latest version. Please check your network connection.");
      }

      // Step 2: Initialize the project
      const projectDir = directory
        ? path.resolve(process.cwd(), directory)
        : process.cwd();

      // Ensure the directory exists
      fs.mkdirSync(projectDir, { recursive: true });

      // Create essential project files
      writeFileIfNotExists(
        path.join(projectDir, "index.tsx"),
        `
export default () => (
  <board width="10mm" height="10mm">
    <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
    <capacitor capacitance="1000pF" footprint="0402" name="C1" schX={-3} pcbX={-3} />
    <trace from=".R1 > .pin1" to=".C1 > .pin1" />
  </board>
);
`
      );

      writeFileIfNotExists(
        path.join(projectDir, ".npmrc"),
        `
@tsci:registry=https://npm.tscircuit.com
`
      );

      // Generate package.json
      generatePackageJson(projectDir);
      // Generate tsconfig.json
      generateTsConfig(projectDir);
      // Create .gitignore file
      generateGitIgnoreFile(projectDir);
      // Setup project dependencies
      setupTsciProject(projectDir);

      console.info(
        `🎉 Initialization complete! Run ${
          directory ? `"cd ${directory}" & ` : ""
        }"tsci dev" to start developing.`
      );
      process.exit(0);
    });
};
