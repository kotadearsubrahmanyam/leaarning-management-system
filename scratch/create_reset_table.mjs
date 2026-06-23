import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = `
CREATE TABLE IF NOT EXISTS "PasswordResetRequest" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "tempPassword" text,
  "resetToken" text,
  "tokenExpiry" timestamp (3),
  "createdAt" timestamp (3) NOT NULL DEFAULT now(),
  "resolvedAt" timestamp (3),
  "resolvedBy" text REFERENCES "User"("id") ON DELETE SET NULL
);
`;

async function main() {
  console.log("Connecting to DB and creating table...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Table 'PasswordResetRequest' created successfully or already exists!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
