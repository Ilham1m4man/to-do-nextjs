"use client"

import type React from "react"

import { useState, useEffect } from "react"
import jwt_decode from "jwt-decode"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Loader2,
  LogOut,
  XCircle,
  X,
} from "lucide-react"

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
  name?: string // Optional name field that might be in the token
}

interface TeamUser {
  id: number
  name: string
  role: string
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const router = useRouter()

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

          const currentTime = Date.now() / 1000
          if (decoded.exp < currentTime) {
            localStorage.removeItem("token")
            router.push("/login")
            return
          }

          setUserRole(decoded.role)
          setUserId(decoded.id)
          // If name is in the token, use it
          if (decoded.name) {
            setUserName(decoded.name)
          }
          setIsAuthChecking(false)
        } catch (error) {
          console.error("Invalid token:", error)
          localStorage.removeItem("token")
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthChecking(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isAuthChecking && userRole) {
      fetchTeamUsers()
      fetchTasks()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthChecking, userRole])

  // Effect to set user name if it wasn't in the token
  useEffect(() => {
    if (userId && teamUsers.length > 0 && !userName) {
      const currentUser = teamUsers.find((user) => user.id === userId)
      if (currentUser) {
        setUserName(currentUser.name)
      }
    }
  }, [userId, teamUsers, userName])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const decoded: DecodedToken = jwt_decode(token)
        if (decoded.role !== "team") {
          setTasks(data)
        } else {
          const filtered = data.filter((task: Task) => decoded.id === task.assigned_to)
          setTasks(filtered)
        }
      } else if (res.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const decoded: DecodedToken = jwt_decode(token)
        if(decoded.role !== "team") {
          setTeamUsers(data)
        } else {
          const filteredData = data.filter((item: TeamUser) => item.role != "admin" && item.role != "lead")
          setTeamUsers(filteredData)
        }
      } else {
        setTeamUsers([])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setTeamUsers([])
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignedTo) {
      alert("Silahkan pilih user terlebih dahulu")
      return
    }

    setIsSubmitting(true)
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          assigned_to: Number.parseInt(assignedTo, 10),
        }),
      })

      if (res.ok) {
        setTitle("")
        setDescription("")
        setAssignedTo("")
        fetchTasks()
        setShowCreateTaskModal(false) // Close modal after successful creation
      } else {
        alert("Gagal membuat task")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      alert("Gagal membuat task")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    setStatusUpdating(taskId)
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`/api/tasks/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      })

      if (res.ok) {
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
      } else {
        alert("Gagal mengubah status task")
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      alert("Gagal mengubah status task")
    } finally {
      setStatusUpdating(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "done":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
          </span>
        )
      case "on progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" /> Dalam Proses
          </span>
        )
      case "not started":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" /> Belum Dimulai
          </span>
        )
      case "reject":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
    }).format(date)
  }

  const getAssignedUserName = (userId: number) => {
    const user = teamUsers.find((user) => user.id === userId)
    return user ? user.name : `User #${userId}`
  }

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Admin
          </span>
        )
      case "lead":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Team Lead
          </span>
        )
      case "team":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Team Member
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        )
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-slate-600 mb-4" />
        <p className="text-slate-600 text-lg">Memverifikasi akses...</p>
      </div>
    )
  }

  return (
    <div className="text-slate-600 min-h-screen bg-slate-50">
      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Buat Task Baru</h2>
                <p className="text-sm text-slate-500">Tambahkan tugas baru untuk anggota tim Anda</p>
              </div>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="text-slate-400 hover:text-slate-500 focus:outline-none transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                    Judul Task
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Masukkan judul task"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                    Deskripsi Task
                  </label>
                  <textarea
                    id="description"
                    placeholder="Masukkan deskripsi task"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="assigned" className="block text-sm font-medium text-slate-700">
                    Ditugaskan Kepada
                  </label>
                  {teamUsers.length > 0 ? (
                    <select
                      id="assigned"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      required
                      className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white transition-colors duration-200"
                    >
                      <option value="">Pilih anggota tim</option>
                      {teamUsers.map((user) => (
                        <option key={user.id} value={user.id.toString()}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 border rounded-md bg-slate-50 text-slate-500 text-sm">
                      Tidak ada user. Silahkan buat user terlebih dahulu.
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    disabled={teamUsers.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membuat Task...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Task
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <div className="flex items-center mt-2 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
              <div className="flex-shrink-0 mr-3 bg-slate-100 p-2 rounded-full">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Selamat datang,</p>
                <div className="flex items-center">
                  <span className="font-medium text-slate-800 mr-2">{userName}</span>
                  {getRoleBadge(userRole)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            {userRole === "admin" && (
              <Link
                href="/add-user"
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
              >
                <User className="mr-2 h-4 w-4" /> Tambah User
              </Link>
            )}
            {(userRole === "admin" || userRole === "lead") && (
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
              >
                <Plus className="mr-2 h-4 w-4" /> Buat Task Baru
              </button>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </button>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Total Task</h3>
            <p className="text-2xl font-bold text-slate-800">{tasks.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Belum Dimulai</h3>
            <p className="text-2xl font-bold text-slate-800">
              {
                tasks.filter(
                  (task) => task.status.toLowerCase() === "not started",
                ).length
              }
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Dalam Proses</h3>
            <p className="text-2xl font-bold text-slate-800">
              {
                tasks.filter(
                  (task) => task.status.toLowerCase() === "on progress",
                ).length
              }
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Selesai</h3>
            <p className="text-2xl font-bold text-slate-800">
              {
                tasks.filter(
                  (task) => task.status.toLowerCase() === "done",
                ).length
              }
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Daftar Task</h2>
          </div>

          <div className="h-px bg-slate-200 my-4"></div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-600">Memuat task...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-500 text-center">Tidak ada task yang tersedia</p>
                {(userRole === "admin" || userRole === "lead") && (
                  <button
                    className="mt-4 inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    onClick={() => setShowCreateTaskModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Buat Task Baru
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-slate-800 truncate">{task.title}</h3>
                      {getStatusBadge(task.status)}
                    </div>
                  </div>

                  <div className="p-4 flex-grow">
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {task.description || "Tidak ada deskripsi"}
                    </p>

                    <div className="flex flex-col space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        <span>Ditugaskan kepada: {getAssignedUserName(task.assigned_to)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        <span>Dibuat pada: {formatDate(task.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 space-y-3">
                    <div className="w-full">
                      <label htmlFor={`status-${task.id}`} className="block text-xs font-medium text-slate-700 mb-1">
                        Ubah Status
                      </label>
                      <div className="relative">
                        <select
                          id={`status-${task.id}`}
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                          disabled={statusUpdating === task.id}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="Not Started">Belum Dimulai</option>
                          <option value="On Progress">Dalam Proses</option>
                          <option value="Done">Selesai</option>
                          <option value="Reject">Ditolak</option>
                        </select>
                        {statusUpdating === task.id && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/task/${task.id}`}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                      Lihat Detail & Update
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

