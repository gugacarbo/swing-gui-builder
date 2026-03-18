import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getNestedValue(source, attribute) {
  return attribute.split(".").reduce((value, key) => (value ? value[key] : undefined), source);
}

function getColor(coverage) {
  if (coverage < 80) {
    return "red";
  }

  if (coverage < 90) {
    return "yellow";
  }

  return "brightgreen";
}

function badgeFileName(label) {
  return `${label.toLowerCase().replace(/\W/g, "_")}.png`;
}

async function downloadBadge(url, destination) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download badge from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, buffer);
}

async function removeExistingBadges(outputDir) {
  const entries = await fs.readdir(outputDir, { withFileTypes: true }).catch(() => []);

  await Promise.all(
    entries
      .filter(
        (entry) => entry.isFile() && (entry.name.endsWith(".png") || entry.name.endsWith(".svg")),
      )
      .map((entry) => fs.unlink(path.join(outputDir, entry.name))),
  );
}

async function main() {
  const rootDir = fileURLToPath(new URL("../", import.meta.url));
  const configPath = new URL("../.coveragebadgesrc", import.meta.url);
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const outputDir = path.resolve(rootDir, config[0].outputDir.replace(/^\.\//, ""));

  await fs.mkdir(outputDir, { recursive: true });
  await removeExistingBadges(outputDir);

  for (const item of config) {
    const reportPath = path.resolve(rootDir, item.source.replace(/^\.\//, ""));
    const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
    const coverage = Number.parseFloat(getNestedValue(report, item.attribute));

    if (Number.isNaN(coverage)) {
      throw new Error(`Invalid coverage value for ${item.label}`);
    }

    const badgeText = `${item.label}-${coverage}%-${getColor(coverage)}`;
    const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(badgeText)}.png?style=flat`;
    const outputPath = path.join(outputDir, badgeFileName(item.label));

    await downloadBadge(badgeUrl, outputPath);
    console.log(`Created ${item.label} badge at ${outputPath}`);
  }
}

await main();
