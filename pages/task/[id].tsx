"use client"

import type React from "react"

import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import jwt_decode from "jwt-decode"
import { ArrowLeft, Calendar, Loader2, User, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react"

interface Task {
  id: number
  title: string
  description: string
  status: string
  assigned_to: number
  created_by: number
  created_at: string
}

interface DecodedToken {
  id: number
  role: string
  exp: number
}

interface TeamUser {
  id: number
  name: string
}

export default function TaskDetail() {
  const router = useRouter()
  const { id } = router.query
  const [task, setTask] = useState<Task | null>(null)
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/login")
          return
        }

        try {
          const decoded: DecodedToken = jwt_decode(token)

          // Check if token is expired
          const currentTime = Date.now() / 1000
          if (decoded.exp < currentTime) {
            localStorage.removeItem("token")
            router.push("/login")
            return
          }


          if (id) {
            await fetchTask(token, id)
            await fetchTeamUsers(token)
          }
        } catch (error) {
          console.error("Invalid token:", error)
          localStorage.removeItem("token")
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setError("Terjadi kesalahan saat memeriksa otentikasi")
        setIsLoading(false)
      }
    }

    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  const fetchTask = async (token: string, taskId: string | string[]) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTask(data)
        setDescription(data.description || "")
        setStatus(data.status)
        setError(null)
      } else if (res.status === 404) {
        setError("Task tidak ditemukan")
      } else if (res.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
      } else {
        setError("Gagal mengambil data task")
      }
    } catch (error) {
      console.error("Error fetching task:", error)
      setError("Terjadi kesalahan saat mengambil data task")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamUsers = async (token: string) => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTeamUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      if (!token || !task) {
        setError("Sesi telah berakhir. Silakan login kembali.")
        return
      }

      const res = await fetch("/api/tasks/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: task.id,
          description,
          status,
        }),
      })

      if (res.ok) {
        alert("Task berhasil diperbarui")
        router.push("/dashboard")
      } else if (res.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
      } else {
        const data = await res.json()
        setError(data.message || "Gagal memperbarui task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      setError("Terjadi kesalahan saat memperbarui task")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "done":
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
          </span>
        )
      case "on progress":
      case "in progress":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" /> Dalam Proses
          </span>
        )
      case "not started":
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" /> Belum Dimulai
          </span>
        )
      case "reject":
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getUserName = (userId: number) => {
    const user = teamUsers.find((user) => user.id === userId)
    return user ? user.name : `User #${userId}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-slate-600 mb-4" />
        <p className="text-slate-600 text-lg">Memuat detail task...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-slate-600">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Task Tidak Ditemukan</h2>
          <p className="text-slate-600 mb-6">Task yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Kembali ke Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-slate-800">{task.title}</h1>
              {getStatusBadge(task.status)}
            </div>
          </div>

          <div className="p-6 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Informasi Task</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="h-4 w-4 text-slate-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-slate-500">Ditugaskan kepada:</p>
                      <p className="text-sm font-medium text-slate-700">{getUserName(task.assigned_to)}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="h-4 w-4 text-slate-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-slate-500">Dibuat oleh:</p>
                      <p className="text-sm font-medium text-slate-700">{getUserName(task.created_by)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Waktu</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-slate-500">Dibuat pada:</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(task.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Deskripsi Task
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masukkan deskripsi task"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Not Started">Belum Dimulai</option>
                  <option value="On Progress">Dalam Proses</option>
                  <option value="Done">Selesai</option>
                  <option value="Reject">Ditolak</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memperbarui Task...
                    </>
                  ) : (
                    "Update Task"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

