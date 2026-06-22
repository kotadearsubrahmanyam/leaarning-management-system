import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const client = await pool.connect();
    
    // 1. Delete all fee structure records
    const deleteRes = await client.query('DELETE FROM "FeeStructure"');
    console.log(`Deleted ${deleteRes.rowCount} fee structures.`);
    
    // 2. Clear feeStructureId links in payments table
    const updateRes = await client.query('UPDATE "Payment" SET "feeStructureId" = NULL');
    console.log(`Cleared feeStructureId link for ${updateRes.rowCount} payments.`);
    
    client.release();
    console.log('Successfully prepared fee structures for correct dynamic re-seeding!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
