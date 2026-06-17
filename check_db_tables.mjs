import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:\\Users\\susanna\\OneDrive\\Desktop\\INTERN\\leaarning-management-system\\.env' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const client = await pool.connect();
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'AcademicEvent';
    `);
    console.log('Columns of AcademicEvent:', columns.rows);
    client.release();
  } catch (error) {
    console.error('Error connecting to DB:', error);
  } finally {
    await pool.end();
  }
}

main();
