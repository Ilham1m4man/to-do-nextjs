import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = result.rows[0];
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
}
