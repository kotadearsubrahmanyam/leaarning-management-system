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
    
    // Count and view feeStructure items
    const countRes = await client.query('SELECT count(*)::int as count FROM "FeeStructure"');
    console.log('Total fee structure rows:', countRes.rows[0].count);
    
    // Let's get a few samples of feeStructure
    const sampleRes = await client.query(`
      SELECT fs.*, u.name, u.email, u.semester
      FROM "FeeStructure" fs
      JOIN "User" u ON fs."userId" = u.id
      ORDER BY fs."createdAt" DESC
      LIMIT 10;
    `);
    
    console.log('Sample FeeStructure items:');
    sampleRes.rows.forEach(r => {
      console.log(`Student: ${r.name} (${r.email}), Sem: ${r.semester}, FeeSem: ${r.semester}, Type: ${r.feeType}, Amount: ${r.amount}, Paid: ${r.paidAmount}, Status: ${r.status}`);
    });
    
    // Check if there are any students with 0 or null amounts
    const zeroRes = await client.query(`
      SELECT count(*)::int as count
      FROM "FeeStructure"
      WHERE amount = 0;
    `);
    console.log('FeeStructure items with amount = 0:', zeroRes.rows[0].count);
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
