import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  if (user.role !== 'admin' && user.role !== 'lead') {
    return res.status(403).json({ message: 'Access forbidden' });
  }

  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (user.role === 'admin') {
    if (role !== 'lead' && role !== 'team') {
      return res.status(400).json({ message: 'Admin hanya dapat menambahkan user dengan role lead atau team' });
    }
  } else if (user.role === 'lead') {
    if (role !== 'team') {
      return res.status(400).json({ message: 'Lead hanya dapat menambahkan user dengan role team' });
    }
  }

  try {
    const exist = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exist.rows.length > 0) {
      return res.status(400).json({ message: 'User dengan email ini sudah ada' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
