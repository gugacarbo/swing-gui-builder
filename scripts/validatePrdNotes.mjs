import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);

export function findStoriesMissingNotes(prdData) {
  const userStories = Array.isArray(prdData?.userStories) ? prdData.userStories : [];

  return userStories.flatMap((story, index) => {
    if (story?.passes !== true) {
      return [];
    }

    const notes = typeof story?.notes === "string" ? story.notes.trim() : "";
    if (notes.length > 0) {
      return [];
    }

    const storyId =
      typeof story?.id === "string" && story.id.length > 0 ? story.id : `index:${index}`;
    return [{ storyId, index }];
  });
}

export async function validatePrdFile(prdPath) {
  const resolvedPath = path.resolve(prdPath);
  const fileContent = await readFile(resolvedPath, "utf8");
  const prdData = JSON.parse(fileContent);

  return {
    resolvedPath,
    invalidStories: findStoriesMissingNotes(prdData),
  };
}

export async function findActiveTaskPrdPath(tasksRootPath = path.resolve(process.cwd(), "tasks")) {
  const entries = await readdir(tasksRootPath, { withFileTypes: true });
  const activeTaskDirectories = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("task-"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const prdCandidates = [];
  for (const taskDirectory of activeTaskDirectories) {
    const candidatePrdPath = path.join(tasksRootPath, taskDirectory, "prd.json");
    try {
      await access(candidatePrdPath);
      prdCandidates.push(candidatePrdPath);
    } catch {
      // Ignore directories without prd.json
    }
  }

  if (prdCandidates.length === 1) {
    return prdCandidates[0];
  }

  if (prdCandidates.length === 0) {
    throw new Error(
      `No active task prd.json found under ${tasksRootPath}. Pass an explicit PRD path as an argument.`,
    );
  }

  const candidatesList = prdCandidates.map((candidate) => `- ${candidate}`).join("\n");
  throw new Error(
    `Multiple active task prd.json files found. Pass an explicit PRD path as an argument.\n${candidatesList}`,
  );
}

export async function runCli(argv = process.argv.slice(2)) {
  try {
    const targetPath = argv[0] ?? (await findActiveTaskPrdPath());
    const { resolvedPath, invalidStories } = await validatePrdFile(targetPath);
    if (invalidStories.length === 0) {
      console.log(`Validation passed: ${resolvedPath}`);
      return 0;
    }

    console.error(`Validation failed: ${resolvedPath}`);
    for (const invalidStory of invalidStories) {
      console.error(`- ${invalidStory.storyId}: passes=true requires non-empty notes`);
    }

    return 1;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Validation failed: ${errorMessage}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
