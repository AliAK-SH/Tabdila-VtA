const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Run a quick query immediately to test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    console.error('Please check if your database password and name are correct in .env');
  } else {
    console.log('✅ Connected to PostgreSQL database successfully!');
  }
});

module.exports = pool;
