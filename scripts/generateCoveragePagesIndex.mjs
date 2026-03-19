import fs from "node:fs";
import path from "node:path";

const pagesRoot = process.argv[2] ?? "pages-output";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compareReports(left, right) {
  if (left.name === "main") return -1;
  if (right.name === "main") return 1;

  const leftVersion = left.name.startsWith("v") ? left.name.slice(1) : left.name;
  const rightVersion = right.name.startsWith("v") ? right.name.slice(1) : right.name;

  const leftParts = leftVersion.split(".").map((part) => Number(part) || 0);
  const rightParts = rightVersion.split(".").map((part) => Number(part) || 0);

  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (rightParts[index] ?? 0) - (leftParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return left.name.localeCompare(right.name);
}

function getLabel(reportName) {
  return reportName === "main" ? "Latest" : reportName;
}

function buildReportCards(reports) {
  if (reports.length === 0) {
    return '<p class="empty">Nenhum relatório de cobertura disponível.</p>';
  }

  return reports
    .map((report) => {
      const title = escapeHtml(getLabel(report.name));
      const branch = escapeHtml(report.name);
      const href = `${encodeURIComponent(report.path)}/index.html`;

      return `
        <a class="card" href="${href}">
          <span class="card-label">${title}</span>
          <span class="card-meta">Branch ${branch}</span>
        </a>`;
    })
    .join("\n");
}

const entries = fs
  .readdirSync(pagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => entry.name === "main" || /^v\d+(?:\.\d+)*(?:[-+].+)?$/i.test(entry.name))
  .map((entry) => ({ name: entry.name, path: entry.name }))
  .sort(compareReports);

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Coverage Reports</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --panel: rgba(17, 24, 39, 0.82);
      --panel-border: rgba(148, 163, 184, 0.18);
      --text: #e5eefb;
      --muted: #94a3b8;
      --accent: #60a5fa;
      --accent-strong: #93c5fd;
      --shadow: 0 20px 50px rgba(2, 6, 23, 0.45);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(96, 165, 250, 0.22), transparent 35%),
        radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.16), transparent 30%),
        linear-gradient(180deg, #0b1020 0%, #0f172a 100%);
    }

    main {
      width: min(960px, calc(100% - 32px));
      margin: 0 auto;
      padding: 48px 0 56px;
    }

    .hero {
      display: grid;
      gap: 12px;
      margin-bottom: 28px;
    }

    .eyebrow {
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.78rem;
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1.05;
    }

    .subtitle {
      margin: 0;
      max-width: 62ch;
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 32px;
    }

    .card,
    .empty {
      border: 1px solid var(--panel-border);
      background: var(--panel);
      backdrop-filter: blur(14px);
      border-radius: 18px;
      box-shadow: var(--shadow);
    }

    .card {
      display: grid;
      gap: 8px;
      padding: 20px;
      color: inherit;
      text-decoration: none;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(96, 165, 250, 0.55);
      background: rgba(17, 24, 39, 0.94);
    }

    .card-label {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--accent-strong);
    }

    .card-meta {
      color: var(--muted);
      font-size: 0.92rem;
    }

    .empty {
      padding: 20px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="eyebrow">GitHub Pages</div>
      <h1>Coverage Reports</h1>
      <p class="subtitle">Selecione uma versão para abrir os relatórios combinados de cobertura gerados pelo pipeline.</p>
    </section>
    <section class="grid" aria-label="Coverage report versions">
      ${buildReportCards(entries)}
    </section>
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(pagesRoot, "index.html"), html);
