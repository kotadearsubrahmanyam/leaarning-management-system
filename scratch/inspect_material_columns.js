const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("--- COLUMNS IN MATERIAL TABLE ---");
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'Material'
        `);
        res.rows.forEach(col => {
            console.log(`Column: ${col.column_name}, Type: ${col.data_type}, Nullable: ${col.is_nullable}, Default: ${col.column_default}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
