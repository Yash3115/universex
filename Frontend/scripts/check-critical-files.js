import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");

const criticalFiles = ["src/utils/imageUtils.js"];
const importExtensions = ["", ".js", ".jsx", ".ts", ".tsx", ".json", ".css"];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);

const errors = [];

const toPosix = (value) => value.split(path.sep).join("/");

const existsWithExactCase = (baseDirectory, relativePath) => {
  const parts = relativePath.split(/[\\/]+/).filter(Boolean);
  let current = baseDirectory;

  for (const part of parts) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
      return false;
    }

    const entries = fs.readdirSync(current);
    if (!entries.includes(part)) {
      return false;
    }

    current = path.join(current, part);
  }

  return fs.existsSync(current);
};

const resolveRelativeImport = (importerPath, rawSpecifier) => {
  const specifier = rawSpecifier.split(/[?#]/)[0];
  if (!specifier.startsWith(".")) return true;

  const importerDirectory = path.dirname(importerPath);
  const baseCandidate = path.resolve(importerDirectory, specifier);
  const candidates = [
    ...importExtensions.map((extension) => `${baseCandidate}${extension}`),
    ...importExtensions.filter(Boolean).map((extension) => path.join(baseCandidate, `index${extension}`)),
  ];

  return candidates.some((candidate) => {
    const relativeCandidate = path.relative(projectRoot, candidate);
    return !relativeCandidate.startsWith("..") && existsWithExactCase(projectRoot, relativeCandidate);
  });
};

const collectSourceFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
};

for (const file of criticalFiles) {
  if (!existsWithExactCase(projectRoot, file)) {
    errors.push(`Missing critical file or casing mismatch: ${file}`);
  }
}

const importPatterns = [
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
  /import\s*\(\s*["']([^"']+)["']\s*\)/g,
];

for (const file of collectSourceFiles(srcRoot)) {
  const source = fs.readFileSync(file, "utf8");

  for (const pattern of importPatterns) {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(source)) !== null) {
      const specifier = match[1];
      if (!resolveRelativeImport(file, specifier)) {
        errors.push(`Unresolved relative import in ${toPosix(path.relative(projectRoot, file))}: ${specifier}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error("\n[prebuild] Deployment safety checks failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("\nFix the missing file, import path, or filename casing before deploying.\n");
  process.exit(1);
}

console.log("[prebuild] Verified critical files and relative imports.");