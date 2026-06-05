import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const defaultFiles = [
  "scripts/02-production-auth-and-marketplace.sql",
  "scripts/03-marketplace-persistence.sql",
];

function readEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [name, ...rest] = line.split("=");
        const value = rest
          .join("=")
          .trim()
          .replace(/^['"]|['"]$/g, "");
        return [name.trim(), value];
      }),
  );
}

const env = {
  ...readEnvFile(join(root, ".env.local")),
  ...process.env,
};

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const files = process.argv.slice(2);
const sqlFiles = files.length ? files : defaultFiles;
const sql = neon(env.DATABASE_URL);

function splitSqlStatements(source) {
  const statements = [];
  let current = "";
  let singleQuoted = false;
  let doubleQuoted = false;
  let dollarTag = "";

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] || "";
    current += char;

    if (
      !singleQuoted &&
      !doubleQuoted &&
      !dollarTag &&
      char === "-" &&
      next === "-"
    ) {
      while (index + 1 < source.length && source[index + 1] !== "\n") {
        index += 1;
        current += source[index];
      }
      continue;
    }

    if (
      !doubleQuoted &&
      !dollarTag &&
      char === "'" &&
      source[index - 1] !== "\\"
    ) {
      singleQuoted = !singleQuoted;
      continue;
    }

    if (
      !singleQuoted &&
      !dollarTag &&
      char === '"' &&
      source[index - 1] !== "\\"
    ) {
      doubleQuoted = !doubleQuoted;
      continue;
    }

    if (!singleQuoted && !doubleQuoted && char === "$") {
      const rest = source.slice(index);
      const match = rest.match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        const tag = match[0];
        if (!dollarTag) {
          dollarTag = tag;
          current += tag.slice(1);
          index += tag.length - 1;
          continue;
        }
        if (dollarTag === tag) {
          dollarTag = "";
          current += tag.slice(1);
          index += tag.length - 1;
          continue;
        }
      }
    }

    if (!singleQuoted && !doubleQuoted && !dollarTag && char === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
    }
  }

  const finalStatement = current.trim();
  if (finalStatement) statements.push(finalStatement);
  return statements;
}

for (const file of sqlFiles) {
  const path = join(root, file);
  const statement = readFileSync(path, "utf8");
  console.log(`Applying ${file}`);
  const statements = splitSqlStatements(statement);
  for (const nextStatement of statements) {
    await sql.query(nextStatement);
  }
}

const [summary] = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM categories) AS categories,
    (SELECT COUNT(*)::int FROM users WHERE user_type = 'vendor') AS vendors,
    (SELECT COUNT(*)::int FROM users WHERE user_type = 'logistics') AS logistics,
    (SELECT COUNT(*)::int FROM listings WHERE available = TRUE) AS listings
`;

console.log(
  JSON.stringify({
    seeded: true,
    categories: summary.categories,
    vendors: summary.vendors,
    logistics: summary.logistics,
    listings: summary.listings,
  }),
);
