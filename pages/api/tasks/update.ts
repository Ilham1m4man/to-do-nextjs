import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const { id, title, description, status } = req.body;

  try {
    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: 'Task not found' });

    let updatedTask;
    if (user.role !== 'team') {
      const updateRes = await db.query(
        'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), updated_at = NOW() WHERE id = $4 RETURNING *',
        [title, description, status, id]
      );
      updatedTask = updateRes.rows[0];
    } else if (user.role === 'team') {
      const updateRes = await db.query(
        'UPDATE tasks SET description = COALESCE($1, description), status = COALESCE($2, status), updated_at = NOW() WHERE id = $3 RETURNING *',
        [description, status, id]
      );
      updatedTask = updateRes.rows[0];
    } else {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    await db.query(
      'INSERT INTO task_logs (task_id, action, description, changed_by) VALUES ($1, $2, $3, $4)',
      [id, 'update', 'Task updated', user.id]
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
}
