import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

const cwd = process.cwd();
const possiblePaths = [resolve(cwd, ".env"), resolve(cwd, "../.env"), resolve(cwd, "../../.env")];

let env = config({ path: possiblePaths[0] });
for (const envPath of possiblePaths.slice(1)) {
  if (env.parsed?.DATABASE_URL || process.env.DATABASE_URL) {
    break;
  }
  env = config({ path: envPath });
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.parsed?.DATABASE_URL || process.env.DATABASE_URL!,
  },
});
