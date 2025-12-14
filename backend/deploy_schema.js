const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const run = async () => {
    // 1. Connect directly to the provided DB URL (Remote)
    const targetClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Render
    });

    try {
        console.log('Connecting to remote database...');
        await targetClient.connect();
        console.log('Connected successfully!');

        const schemaPath = path.join(__dirname, '../sql/schema_postgres.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema migration...');
        await targetClient.query(schemaSql);
        console.log('Schema setup completed successfully! Tables created.');

        await targetClient.end();

    } catch (err) {
        console.error('Error during setup:', err);
    }
};

run();
