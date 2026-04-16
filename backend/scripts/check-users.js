require('dotenv').config();
const { Pool } = require('pg');

// Supabase Cloud pool
const cloudPool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

// Docker Local pool
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'scholarsgo',
  user: 'postgres',
  password: 'scholarsgo_password',
});

async function checkUsers() {
  try {
    console.log('\n=== SUPABASE CLOUD: users table ===');
    const cloudUsers = await cloudPool.query('SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC');
    cloudUsers.rows.forEach(row => console.log(JSON.stringify(row)));

    console.log('\n=== DOCKER LOCAL: users table ===');
    const localUsers = await localPool.query('SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC');
    localUsers.rows.forEach(row => console.log(JSON.stringify(row)));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await cloudPool.end();
    await localPool.end();
  }
}

checkUsers();
