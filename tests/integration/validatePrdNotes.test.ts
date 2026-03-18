import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFile = promisify(execFileCallback);
const scriptPath = path.resolve(process.cwd(), "scripts", "validatePrdNotes.mjs");
const tempDirectories = new Set<string>();

async function createPrdFile(userStories: unknown[]) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "prd-validation-"));
  tempDirectories.add(tempDirectory);

  const prdPath = path.join(tempDirectory, "prd.json");
  await writeFile(prdPath, JSON.stringify({ userStories }, null, 2), "utf8");
  return prdPath;
}

async function createTempProjectRoot() {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "prd-validation-root-"));
  tempDirectories.add(tempDirectory);
  return tempDirectory;
}

async function createTaskPrdFile(
  tempRoot: string,
  taskDirectoryName: string,
  userStories: unknown[],
) {
  const taskDirectoryPath = path.join(tempRoot, "tasks", taskDirectoryName);
  await mkdir(taskDirectoryPath, { recursive: true });
  await writeFile(
    path.join(taskDirectoryPath, "prd.json"),
    JSON.stringify({ userStories }, null, 2),
    "utf8",
  );
}

afterEach(async () => {
  await Promise.all(
    [...tempDirectories].map(async (tempDirectory) => {
      await rm(tempDirectory, { recursive: true, force: true });
      tempDirectories.delete(tempDirectory);
    }),
  );
});

describe("validatePrdNotes script", () => {
  it("passes when approved stories include notes", async () => {
    const prdPath = await createPrdFile([
      { id: "US-001", passes: true, notes: "Validated with tests and typecheck output." },
      { id: "US-002", passes: false, notes: "" },
    ]);

    const { stdout, stderr } = await execFile(process.execPath, [scriptPath, prdPath]);

    expect(stderr).toBe("");
    expect(stdout).toContain("Validation passed");
  });

  it("fails when passes=true has empty notes", async () => {
    const prdPath = await createPrdFile([
      { id: "US-001", passes: true, notes: "   " },
      { id: "US-002", passes: true, notes: "Has evidence." },
    ]);

    try {
      await execFile(process.execPath, [scriptPath, prdPath]);
      throw new Error("Expected command to fail");
    } catch (error) {
      const execError = error as Error & { code?: number; stderr?: string };
      expect(execError.code).toBe(1);
      expect(execError.stderr).toContain("US-001");
      expect(execError.stderr).toContain("passes=true requires non-empty notes");
    }
  });

  it("auto-discovers a single active task prd.json when path is omitted", async () => {
    const tempRoot = await createTempProjectRoot();
    await createTaskPrdFile(tempRoot, "task-01", [{ id: "US-001", passes: true, notes: "ok" }]);
    await createTaskPrdFile(tempRoot, "[DONE] task-00", [
      { id: "US-001", passes: true, notes: "" },
    ]);

    const { stdout, stderr } = await execFile(process.execPath, [scriptPath], { cwd: tempRoot });
    expect(stderr).toBe("");
    expect(stdout).toContain("Validation passed");
    expect(stdout).toContain(path.join("tasks", "task-01", "prd.json"));
  });

  it("fails when multiple active task prd.json files are present and no path is provided", async () => {
    const tempRoot = await createTempProjectRoot();
    await createTaskPrdFile(tempRoot, "task-a", [{ id: "US-001", passes: true, notes: "ok" }]);
    await createTaskPrdFile(tempRoot, "task-b", [{ id: "US-002", passes: true, notes: "ok" }]);

    try {
      await execFile(process.execPath, [scriptPath], { cwd: tempRoot });
      throw new Error("Expected command to fail");
    } catch (error) {
      const execError = error as Error & { code?: number; stderr?: string };
      expect(execError.code).toBe(1);
      expect(execError.stderr).toContain("Multiple active task prd.json files found");
      expect(execError.stderr).toContain(path.join("tasks", "task-a", "prd.json"));
      expect(execError.stderr).toContain(path.join("tasks", "task-b", "prd.json"));
    }
  });
});
