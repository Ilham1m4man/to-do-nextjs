import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import jwt_decode from 'jwt-decode';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to: number;
  created_by: number;
  created_at: string;
}

interface DecodedToken {
  id: number;
  role: string;
  exp: number;
}

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<Task | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;
    const decoded: DecodedToken = jwt_decode(token);
    setUserRole(decoded.role);
    fetchTask(token, id);
  }, [id]);

  const fetchTask = async (token: string, taskId: string | string[]) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setDescription(data.description);
        setStatus(data.status);
      } else {
        alert('Gagal mengambil data task');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !task) return;
    const res = await fetch('/api/tasks/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: task.id,
        description,
        status,
      }),
    });
    if (res.ok) {
      alert('Task berhasil diperbarui');
      router.push('/dashboard');
    } else {
      alert('Gagal memperbarui task');
    }
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl mb-4">Detail Task</h1>
      <div className="bg-white p-4 rounded shadow-md">
        <h2 className="text-2xl">{task.title}</h2>
        <p>Dibuat oleh: {task.created_by} ({userRole})</p>
        <p>Dituju ke: {task.assigned_to}</p>
        <p>Status saat ini: {task.status}</p>
        <form onSubmit={handleUpdate} className="mt-4">
          <div className="mb-4">
            <label className="block mb-2">Deskripsi</label>
            <textarea
              className="border p-2 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Status</label>
            <select
              className="border p-2 w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Not Started">Not Started</option>
              <option value="On Progress">On Progress</option>
              <option value="Done">Done</option>
              <option value="Reject">Reject</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 w-full">
            Update Task
          </button>
        </form>
      </div>
    </div>
  );
}
