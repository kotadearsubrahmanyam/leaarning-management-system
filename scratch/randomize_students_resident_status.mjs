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
    
    // 1. Fetch all student users
    const studentsRes = await client.query(`
      SELECT id, name FROM "User"
      WHERE role = 'STUDENT';
    `);
    
    console.log(`Fetched ${studentsRes.rows.length} student users.`);
    
    // 2. Randomize resident status and fee reimbursement
    let updatedCount = 0;
    for (const student of studentsRes.rows) {
      const r1 = Math.random();
      let residentStatus = "DAYSCHOLAR_NORMAL";
      if (r1 < 0.3) {
        residentStatus = "HOSTELER";
      } else if (r1 < 0.6) {
        residentStatus = "DAYSCHOLAR_BUS";
      }
      
      const r2 = Math.random();
      const isFeeReimbursed = r2 < 0.25; // 25% chance of scholarship
      
      await client.query(`
        UPDATE "User"
        SET "residentStatus" = $1, "isFeeReimbursed" = $2
        WHERE id = $3;
      `, [residentStatus, isFeeReimbursed, student.id]);
      updatedCount++;
    }
    
    console.log(`Updated resident status and fee reimbursement for ${updatedCount} students.`);
    
    // 3. Clear existing fee structures so they can re-seed with correct amounts on next fetch
    const deleteRes = await client.query('DELETE FROM "FeeStructure"');
    console.log(`Deleted ${deleteRes.rowCount} old fee structures.`);
    
    const updatePaymentsRes = await client.query('UPDATE "Payment" SET "feeStructureId" = NULL');
    console.log(`Cleared feeStructureId link for ${updatePaymentsRes.rowCount} payments.`);
    
    client.release();
    console.log('Database synchronization completed successfully!');
  } catch (error) {
    console.error('Synchronization failed:', error);
  } finally {
    await pool.end();
  }
}

main();
