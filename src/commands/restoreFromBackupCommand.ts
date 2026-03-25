import * as vscode from "vscode";
import { CanvasPanel } from "../canvas/CanvasPanel";
import {
  DEFAULT_BACKUP_EXTENSION,
  extractBackupTimestampToken,
  isBackupFileNameForSource,
} from "../merger/JavaFileMerger";

interface BackupCandidate {
  fileName: string;
  uri: vscode.Uri;
  sortTime: number;
}

const BACKUP_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;

function toSlashSeparated(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function getFileName(filePath: string): string {
  const normalizedPath = toSlashSeparated(filePath);
  const lastSlashIndex = normalizedPath.lastIndexOf("/");

  return lastSlashIndex >= 0 ? normalizedPath.slice(lastSlashIndex + 1) : normalizedPath;
}

function getDirectoryPath(filePath: string): string {
  const normalizedPath = toSlashSeparated(filePath);
  const lastSlashIndex = normalizedPath.lastIndexOf("/");
  if (lastSlashIndex < 0) {
    return ".";
  }

  const directoryPath = normalizedPath.slice(0, lastSlashIndex);
  if (directoryPath.length === 0) {
    return normalizedPath.startsWith("/") ? "/" : ".";
  }

  return filePath.includes("\\") ? directoryPath.replace(/\//g, "\\") : directoryPath;
}

function joinFilePath(directoryPath: string, entryName: string): string {
  const usesBackslash = directoryPath.includes("\\");
  const separator = usesBackslash ? "\\" : "/";
  const normalizedDirectory =
    directoryPath.endsWith("/") || directoryPath.endsWith("\\")
      ? directoryPath.slice(0, -1)
      : directoryPath;

  return `${normalizedDirectory}${separator}${entryName}`;
}

function parseBackupTimestamp(token: string | undefined): number {
  if (!token || !BACKUP_TIMESTAMP_PATTERN.test(token)) {
    return Number.NaN;
  }

  const normalizedIso = token.replace(
    /(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z/,
    "$1:$2:$3.$4Z",
  );

  return Date.parse(normalizedIso);
}

async function findBackupCandidates(sourceFilePath: string): Promise<BackupCandidate[]> {
  const sourceFileName = getFileName(sourceFilePath);
  const sourceDirectoryUri = vscode.Uri.file(getDirectoryPath(sourceFilePath));
  const entries = await vscode.workspace.fs.readDirectory(sourceDirectoryUri);
  const candidates: BackupCandidate[] = [];

  for (const [entryName, entryType] of entries) {
    if (entryType !== vscode.FileType.File) {
      continue;
    }

    if (!isBackupFileNameForSource(sourceFileName, entryName, DEFAULT_BACKUP_EXTENSION)) {
      continue;
    }

    const candidateUri = vscode.Uri.file(joinFilePath(sourceDirectoryUri.fsPath, entryName));
    let sortTime = Number.NEGATIVE_INFINITY;

    const timestampToken = extractBackupTimestampToken(
      sourceFileName,
      entryName,
      DEFAULT_BACKUP_EXTENSION,
    );
    const parsedTimestamp = parseBackupTimestamp(timestampToken);
    if (!Number.isNaN(parsedTimestamp)) {
      sortTime = parsedTimestamp;
    } else {
      try {
        const stat = await vscode.workspace.fs.stat(candidateUri);
        sortTime = stat.mtime;
      } catch (_) {
        sortTime = Number.NEGATIVE_INFINITY;
      }
    }

    candidates.push({
      fileName: entryName,
      uri: candidateUri,
      sortTime,
    });
  }

  return candidates.sort((left, right) => {
    if (left.sortTime !== right.sortTime) {
      return right.sortTime - left.sortTime;
    }

    return right.fileName.localeCompare(left.fileName);
  });
}

export function inferSourcePathFromBackupPath(backupFilePath: string): string {
  if (!backupFilePath.endsWith(DEFAULT_BACKUP_EXTENSION)) {
    return backupFilePath;
  }

  const withoutExtension = backupFilePath.slice(0, -DEFAULT_BACKUP_EXTENSION.length);
  if (withoutExtension.length === 0) {
    return backupFilePath;
  }

  const lastDot = withoutExtension.lastIndexOf(".");
  if (lastDot < 0) {
    return withoutExtension;
  }

  const trailingToken = withoutExtension.slice(lastDot + 1);
  if (BACKUP_TIMESTAMP_PATTERN.test(trailingToken)) {
    return withoutExtension.slice(0, lastDot);
  }

  return withoutExtension;
}

export async function restoreLatestBackupForSource(
  sourceFilePath: string,
  outputChannel: vscode.OutputChannel,
): Promise<boolean> {
  const backupCandidates = await findBackupCandidates(sourceFilePath);
  if (backupCandidates.length === 0) {
    outputChannel.appendLine(`No backup files found for ${sourceFilePath}`);
    vscode.window.showWarningMessage(`No backup files found for ${getFileName(sourceFilePath)}.`);
    return false;
  }

  const [backupToRestore] = backupCandidates;
  const choice = await vscode.window.showWarningMessage(
    `Restore ${getFileName(sourceFilePath)} from backup ${backupToRestore.fileName}?`,
    "Restore",
    "Cancel",
  );
  if (choice !== "Restore") {
    return false;
  }

  const backupContent = await vscode.workspace.fs.readFile(backupToRestore.uri);
  await vscode.workspace.fs.writeFile(vscode.Uri.file(sourceFilePath), backupContent);

  outputChannel.appendLine(`Restored ${sourceFilePath} from backup ${backupToRestore.uri.fsPath}`);
  vscode.window.showInformationMessage(
    `Restored ${getFileName(sourceFilePath)} from ${backupToRestore.fileName}.`,
  );

  return true;
}

async function restoreFromPickedBackup(outputChannel: vscode.OutputChannel): Promise<boolean> {
  const pickedFiles = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    openLabel: "Select backup file to restore",
    filters: {
      "Backup Files": ["bak"],
    },
    defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
  });

  if (!pickedFiles || pickedFiles.length === 0) {
    return false;
  }

  const backupUri = pickedFiles[0];
  const sourceFilePath = inferSourcePathFromBackupPath(backupUri.fsPath);
  if (sourceFilePath === backupUri.fsPath) {
    vscode.window.showWarningMessage("Could not infer source file path from selected backup.");
    return false;
  }

  const choice = await vscode.window.showWarningMessage(
    `Restore ${getFileName(sourceFilePath)} from ${getFileName(backupUri.fsPath)}?`,
    "Restore",
    "Cancel",
  );
  if (choice !== "Restore") {
    return false;
  }

  const backupContent = await vscode.workspace.fs.readFile(backupUri);
  await vscode.workspace.fs.writeFile(vscode.Uri.file(sourceFilePath), backupContent);
  outputChannel.appendLine(`Restored ${sourceFilePath} from backup ${backupUri.fsPath}`);
  vscode.window.showInformationMessage(
    `Restored ${getFileName(sourceFilePath)} from ${getFileName(backupUri.fsPath)}.`,
  );

  return true;
}

export function registerRestoreFromBackupCommand(
  outputChannel: vscode.OutputChannel,
): vscode.Disposable {
  return vscode.commands.registerCommand(
    "swingGuiBuilder.restoreFromBackup",
    async (sourceFilePathArg?: string) => {
      try {
        const sourceFilePath =
          sourceFilePathArg && sourceFilePathArg.trim().length > 0
            ? sourceFilePathArg
            : CanvasPanel.currentPanel?.getSourceFile?.();

        if (sourceFilePath) {
          await restoreLatestBackupForSource(sourceFilePath, outputChannel);
          return;
        }

        await restoreFromPickedBackup(outputChannel);
      } catch (error) {
        outputChannel.appendLine(`Error restoring backup: ${error}`);
        vscode.window.showErrorMessage("Could not restore from backup. See output for details.");
      }
    },
  );
}
