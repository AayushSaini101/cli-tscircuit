import * as fs from "node:fs"
import * as path from "node:path"
import { Command } from "commander"
import { setupTsciProject } from "lib/shared/setup-tsci-packages"
import { generateTsConfig } from "lib/shared/generate-ts-config"
import { writeFileIfNotExists } from "lib/shared/write-file-if-not-exists"
import { generateGitIgnoreFile } from "lib/shared/generate-gitignore-file"
import { generatePackageJson } from "lib/shared/generate-package-json"
import { version as currentVersion } from "package.json"
import { detectPackageManager } from "lib/shared/detect-pkg-manager"

export const registerInit = (program: Command) => {
  program
    .command("init")
    .description(
      "Initialize a new TSCircuit project in the specified directory (or current directory if none is provided)",
    )
    .argument(
      "[directory]",
      "Directory name (optional, defaults to current directory)",
    )
    .action(async (directory?: string) => {
      // Step 1: Check for the latest version using fetch
      try {
        const response = await fetch(
          "https://registry.npmjs.org/@tscircuit/cli",
        )
        const data = await response.json()
        const latestVersion = data["dist-tags"].latest
        const packageManager = detectPackageManager()
        if (latestVersion !== currentVersion) {
          console.warn(
            `⚠️ You are using version ${currentVersion}, but the latest version is ${latestVersion}. Consider updating with "${packageManager} install -g @tscircuit/cli@latest".`,
          )
        } else {
          console.info(
            `✅ You are using the latest version (${currentVersion}).`,
          )
        }
      } catch (error) {
        console.error(
          "⚠️ Could not check the latest version. Please check your network connection.",
        )
      }

      // Step 2: Initialize the project
      const projectDir = directory
        ? path.resolve(process.cwd(), directory)
        : process.cwd()

      // Ensure the directory exists
      fs.mkdirSync(projectDir, { recursive: true })

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
`,
      )

      writeFileIfNotExists(
        path.join(projectDir, ".npmrc"),
        `
@tsci:registry=https://npm.tscircuit.com
`,
      )

      // Generate package.json
      generatePackageJson(projectDir)
      // Generate tsconfig.json
      generateTsConfig(projectDir)
      // Create .gitignore file
      generateGitIgnoreFile(projectDir)
      // Setup project dependencies
      setupTsciProject(projectDir)

      console.info(
        `🎉 Initialization complete! Run ${
          directory ? `"cd ${directory}" & ` : ""
        }"tsci dev" to start developing.`,
      )
      process.exit(0)
    })
}
