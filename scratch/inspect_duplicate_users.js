const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("--- SEARCHING FOR ROLL NUMBER 25CSE002 (CASE INSENSITIVE) ---");
  const res = await pool.query('SELECT id, name, email, role, "departmentId", semester, "rollNumber" FROM "User" WHERE UPPER("rollNumber") = \'25CSE002\'');
  console.log(`Found ${res.rows.length} records:`);
  res.rows.forEach(r => {
    console.log(r);
  });
  
  process.exit(0);
}

main().catch(console.error);
