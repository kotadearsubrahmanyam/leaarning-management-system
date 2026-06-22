import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const userId = 'f626b31e-adbd-47c4-92b4-af2518050840'; // 25cse001@test.com
  const currentSemester = 3;
  const totalSemesters = 8;
  
  try {
    const client = await pool.connect();
    
    // Simulate ensureDefaultFeesExist for sem 1
    for (let sem = 1; sem <= totalSemesters; sem++) {
      console.log(`Seeding sem ${sem}...`);
      
      // Fetch student
      const studentRes = await client.query('SELECT * FROM "User" WHERE id = $1', [userId]);
      const student = studentRes.rows[0];
      if (!student) {
        console.log('Student not found!');
        break;
      }
      
      const hostelAmount = student.residentStatus === "HOSTELER" ? 30000 : 0;
      const busAmount = student.residentStatus === "DAYSCHOLAR_BUS" ? 15000 : 0;
      const tuitionAmount = student.isFeeReimbursed ? 0 : 50000;
      
      const defaultFees = [
        { feeType: "TUITION", amount: tuitionAmount, dueDate: new Date("2026-05-15") },
        { feeType: "BUS", amount: busAmount, dueDate: new Date("2026-06-20") },
        { feeType: "HOSTEL", amount: hostelAmount, dueDate: new Date("2026-06-20") },
        { feeType: "EXAM", amount: 2000, dueDate: new Date("2026-06-25") },
        { feeType: "PLACEMENT", amount: 5000, dueDate: new Date("2026-06-30") }
      ];
      
      console.log(`Sem ${sem} default fees amounts:`, defaultFees.map(f => `${f.feeType}: ${f.amount}`));
    }
    
    client.release();
  } catch (error) {
    console.error('Error in simulation:', error);
  } finally {
    await pool.end();
  }
}

main();
