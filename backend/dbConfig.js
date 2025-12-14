const { Pool } = require('pg');

// Postgres Connection Config
// Ensure process.env.DATABASE_URL is set in your .env or environment
// Example: postgres://user:password@localhost:5432/linus_pos_db
const config = {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/linus_pos_db',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(config);

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};
