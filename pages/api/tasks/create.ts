import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const user = getUserFromToken(token);
  if (!user || user.role === 'team') return res.status(403).json({ message: 'Access forbidden' });

  const { title, description, assigned_to } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO tasks (title, description, status, created_by, assigned_to) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, 'Not Started', user.id, assigned_to]
    );
    const task = result.rows[0];

    await db.query(
      'INSERT INTO task_logs (task_id, action, description, changed_by) VALUES ($1, $2, $3, $4)',
      [task.id, 'create', 'Task created', user.id]
    );

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
}
