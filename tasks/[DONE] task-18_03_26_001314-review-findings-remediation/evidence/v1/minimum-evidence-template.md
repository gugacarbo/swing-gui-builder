# Minimum Evidence Template v1

Use this template to register remediation evidence for one finding in a reproducible way.

## Template

```yaml
finding_id: ""
files_changed:
  - path: ""
    summary: ""
commands:
  - command: ""
    purpose: ""
command_output:
  - command: ""
    output: ""
links:
  - label: ""
    target: ""
```

## Completed Example (CF-01)

```yaml
finding_id: "CF-01"
files_changed:
  - path: "tasks/task-18_03_26_001314-review-findings-remediation/evidence/v1/minimum-evidence-template.md"
    summary: "Created versioned evidence template with required fields."
  - path: "tasks/task-18_03_26_001314-review-findings-remediation/prd.json"
    summary: "Recorded US-001 completion evidence in notes and set passes=true."
commands:
  - command: "pnpm run typecheck"
    purpose: "Verify TypeScript contracts after documentation updates."
command_output:
  - command: "pnpm run typecheck"
    output: "PASS (exit code 0)"
links:
  - label: "Task requirement CF-01 context"
    target: "tasks/task-18_03_26_001314-review-findings-remediation/req-review-findings-remediation.md"
  - label: "Task progress log"
    target: "tasks/task-18_03_26_001314-review-findings-remediation/progress.txt"
```
