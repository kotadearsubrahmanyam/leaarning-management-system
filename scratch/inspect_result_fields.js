const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("--- RESULT RECORDS FOR 25CSE002 ---");
  const res = await pool.query('SELECT * FROM "Result" WHERE "userId" = \'bf007c6f-df9d-4914-9655-f5ba59930e9a\'');
  console.log(res.rows);
  
  process.exit(0);
}

main().catch(console.error);
