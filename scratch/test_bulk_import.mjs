import pg from 'pg';
import dotenv from 'dotenv';
import { SignJWT } from 'jose';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return secret;
};

const signJwt = async (payload) => {
  const secret = new TextEncoder().encode(getJwtSecretKey());
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
};

async function main() {
  try {
    const client = await pool.connect();
    
    // 1. Get first admin user
    const adminRes = await client.query('SELECT id, email, role FROM "User" WHERE role = \'ADMIN\' LIMIT 1;');
    if (adminRes.rows.length === 0) {
      console.error('No admin user found in database. Cannot run integration test.');
      client.release();
      return;
    }
    const admin = adminRes.rows[0];
    console.log(`Using admin user: ${admin.email} (${admin.id})`);
    
    // 2. Generate token
    const token = await signJwt({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });
    
    // 3. Define new simplified test spreadsheet rows for student import
    // Note: No "Email" or "Roll Number" columns are supplied!
    const testRows = [
      {
        "Name": "E2E Auto Student 1",
        "Department": "CSE",
        "Semester": "3"
      },
      {
        "Name": "E2E Auto Student 2",
        "Department": "NON_EXISTENT_DEPT", // Invalid department
        "Semester": "9" // Invalid semester
      }
    ];

    console.log('\n--- Step 1: Testing Validation API ---');
    const validateRes = await fetch('http://localhost:3000/api/admin/users/import/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({ roleType: 'STUDENT', rows: testRows })
    });
    
    const validateData = await validateRes.json();
    console.log('Validation Status:', validateRes.status);
    console.log('Validation Summary:', validateData.data?.summary);
    console.log('Validation Records Details:');
    validateData.data?.records.forEach(r => {
      console.log(`- Row ${r.rowNumber}: Name="${r.name}", Status=${r.status}, GeneratedRoll=${r.rollNumber}, GeneratedEmail=${r.email}, Errors=${JSON.stringify(r.errors)}`);
    });

    if (validateData.data?.summary.valid > 0) {
      console.log('\n--- Step 2: Testing Import API ---');
      const validRecords = validateData.data.records.filter(r => r.status === 'valid');
      
      const importRes = await fetch('http://localhost:3000/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`
        },
        body: JSON.stringify({ roleType: 'STUDENT', records: validRecords })
      });
      
      const importData = await importRes.json();
      console.log('Import Status:', importRes.status);
      console.log('Import Result Summary:', {
        createdCount: importData.data?.createdCount,
        failedCount: importData.data?.failedCount
      });
      console.log('Generated Credentials:', importData.data?.credentials);

      const generatedRoll = importData.data?.credentials[0]?.rollNumber;

      if (generatedRoll) {
        // 4. Verify in Database
        const dbCheck = await client.query(`SELECT id, name, email, "rollNumber", role FROM "User" WHERE "rollNumber" = '${generatedRoll}';`);
        console.log('\n--- Step 3: Database Verification ---');
        console.log('User found in database:', dbCheck.rows);

        // 5. Cleanup Test Data
        console.log('\n--- Step 4: Cleaning Up Test Data ---');
        await client.query(`DELETE FROM "User" WHERE "rollNumber" = '${generatedRoll}';`);
        await client.query('DELETE FROM "ImportHistory" WHERE "uploadedBy" LIKE \'%' + admin.email + '%\';');
        console.log('Cleanup completed successfully.');
      }
    } else {
      console.error('No valid records to test import.');
    }

    client.release();
  } catch (error) {
    console.error('Error during integration test:', error);
  } finally {
    await pool.end();
  }
}

main();
