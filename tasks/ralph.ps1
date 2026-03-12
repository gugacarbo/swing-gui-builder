# Ralph Wiggum - Long-running AI agent loop (PowerShell wrapper)
# Usage: ./ralph.ps1 <task-folder> [-Tool amp|claude|copilot] [-MaxIterations N]
# Example: ./ralph.ps1 prd-swing-gui-builder -Tool copilot -MaxIterations 10

param(
    [Parameter(Position = 0, Mandatory = $true)]
    [string]$TaskFolder,

    [Parameter(Position = 1)]
    [ValidateSet("amp", "claude", "copilot")]
    [string]$Tool = "copilot",

    [Parameter(Position = 2)]
    [int]$MaxIterations = 10
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TasksDir = Split-Path -Parent $ScriptDir

# Validate task folder exists
$TaskPath = Join-Path $ScriptDir $TaskFolder
if (-not (Test-Path $TaskPath)) {
    Write-Host "Error: Task folder '$TaskPath' not found." -ForegroundColor Red
    exit 1
}

# Validate prd.json exists
$PrdFile = Join-Path $TaskPath "prd.json"
if (-not (Test-Path $PrdFile)) {
    Write-Host "Error: prd.json not found in '$TaskPath'." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Ralph - Tool: $Tool - Max iterations: $MaxIterations - Task: $TaskFolder" -ForegroundColor Green
Write-Host ""

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "  Ralph Iteration $i of $MaxIterations ($Tool)" -ForegroundColor Cyan
    Write-Host "===============================================================" -ForegroundColor Cyan

    $PromptFile = Join-Path $ScriptDir "prompt.md"

    # Run the selected tool with the ralph prompt
    if ($Tool -eq "amp") {
        $Output = Get-Content $PromptFile | amp --dangerously-allow-all 2>&1
    }
    elseif ($Tool -eq "claude") {
        $ClaudePromptFile = Join-Path $ScriptDir "CLAUDE.md"
        $Output = claude --dangerously-skip-permissions --print $ClaudePromptFile 2>&1
    }
    elseif ($Tool -eq "copilot") {
        $Prompt = Get-Content $PromptFile -Raw
        $Output = copilot -p $Prompt --yolo 2>&1
    }

    # Capture output and display
    Write-Host $Output

    # Check for completion signal
    if ($Output -match "<promise>COMPLETE</promise>") {
        Write-Host ""
        Write-Host "Ralph completed all tasks!" -ForegroundColor Green
        Write-Host "Completed at iteration $i of $MaxIterations" -ForegroundColor Green
        exit 0
    }

    Write-Host "Iteration $i complete. Continuing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Ralph reached max iterations ($MaxIterations) without completing all tasks." -ForegroundColor Yellow
$ProgressFile = Join-Path $TaskPath "progress.txt"
Write-Host "Check $ProgressFile for status." -ForegroundColor Yellow
exit 1
