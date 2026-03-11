const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function testConnection() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const matches = envContent.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/);
    
    if (!matches) {
      console.error('DATABASE_URL not found in .env.local');
      process.exit(1);
    }

    const connectionString = matches[1];
    console.log('Testing connection to:', connectionString.split('@')[1]); // Hide password

    const pool = new Pool({
      connectionString,
      ssl: false
    });

    const client = await pool.connect();
    const res = await client.query('SELECT 1 as connected');
    console.log('Database connection successful:', res.rows[0]);
    await client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
