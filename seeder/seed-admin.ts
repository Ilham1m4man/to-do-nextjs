import db from '../lib/db';
import * as bcrypt from 'bcryptjs';

async function seedAdmin() {
  const result = await db.query('SELECT COUNT(*) FROM users');
  const count = parseInt(result.rows[0].count, 10);

  if (count === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Administrator', 'admin@example.com', hashedPassword, 'admin']
    );
    console.log('Admin user berhasil dibuat.');
  } else {
    console.log('Tabel users sudah berisi data.');
  }
}

seedAdmin().then(() => process.exit());
