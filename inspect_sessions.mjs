import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:\\Users\\susanna\\OneDrive\\Desktop\\INTERN\\leaarning-management-system\\.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const client = await pool.connect();
    
    // Check schedule table count
    const schedCount = await client.query(`SELECT COUNT(*) FROM "Schedule";`);
    console.log('Total schedules:', schedCount.rows[0].count);
    
    // Check class sessions count
    const sessCount = await client.query(`SELECT COUNT(*) FROM "ClassSession";`);
    console.log('Total class sessions:', sessCount.rows[0].count);

    // Get a sample of schedules
    if (parseInt(schedCount.rows[0].count) > 0) {
      const sampleScheds = await client.query(`SELECT id, "courseId", "teacherId", date, time FROM "Schedule" LIMIT 5;`);
      console.log('Sample schedules:', sampleScheds.rows);
    }
    
    // Get a sample of class sessions
    if (parseInt(sessCount.rows[0].count) > 0) {
      const sampleSess = await client.query(`SELECT id, "courseId", "facultyId", date, "startTime", "endTime" FROM "ClassSession" LIMIT 5;`);
      console.log('Sample class sessions:', sampleSess.rows);
    }

    client.release();
  } catch (error) {
    console.error('Error connecting to DB:', error);
  } finally {
    await pool.end();
  }
}

main();
