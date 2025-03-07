import { Pool } from 'pg';

const pool = new Pool({
    user: 'postgres',
    password: 'postgres',
    host: 'db',
    port: 5432,
    database: 'todo_db',
});

const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
};

export default db;
