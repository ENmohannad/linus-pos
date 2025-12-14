require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const run = async () => {
    // 1. Connect to default 'postgres' db to create the new db
    const defaultClient = new Client({
        connectionString: process.env.DATABASE_URL.replace('linus_pos_db', 'postgres')
    });

    try {
        await defaultClient.connect();
        console.log('Connected to default postgres database...');

        // Check if database exists
        const res = await defaultClient.query("SELECT 1 FROM pg_database WHERE datname = 'linus_pos_db'");
        if (res.rowCount === 0) {
            console.log('Database linus_pos_db does not exist. Creating...');
            await defaultClient.query('CREATE DATABASE linus_pos_db');
            console.log('Database created successfully.');
        } else {
            console.log('Database linus_pos_db already exists.');
        }
        await defaultClient.end();

        // 2. Connect to the new database and run schema
        const targetClient = new Client({
            connectionString: process.env.DATABASE_URL
        });
        await targetClient.connect();
        console.log('Connected to linus_pos_db...');

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
