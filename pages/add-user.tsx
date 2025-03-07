"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import jwt_decode from "jwt-decode"
import { Loader2, UserPlus, ArrowLeft } from "lucide-react"

interface DecodedToken {
  id: number
  role: string
  exp: number
}

export default function AddUser() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [allowedRoles, setAllowedRoles] = useState<string[]>([])
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthChecking(true)

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

          // Check if user is admin
          if (decoded.role !== "admin") {
            // Not an admin, redirect to dashboard
            router.push("/dashboard")
            return
          }

          // User is admin, set allowed roles
          setAllowedRoles(["lead", "team"])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      })

      if (res.ok) {
        alert("User berhasil dibuat")
        router.push("/dashboard")
      } else {
        const data = await res.json()
        alert(data.message || "Gagal menambah user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Terjadi kesalahan saat membuat user")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600 mb-2" />
        <p className="text-slate-600">Memeriksa izin akses...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-slate-600">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Kembali ke Dashboard
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center">
              <UserPlus className="h-5 w-5 text-slate-500 mr-2" />
              <h1 className="text-xl font-semibold text-slate-800">Tambah User Baru</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">Isi formulir di bawah untuk menambahkan user baru ke sistem</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                placeholder="Masukkan nama lengkap"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-slate-500 mt-1">Password harus minimal 8 karakter</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Pilih Role</option>
                {allowedRoles.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r === "lead" ? "Team Lead" : r === "team" ? "Team Member" : r}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Sebagai admin, Anda dapat menambahkan Team Lead atau Team Member
              </p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat User...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tambah User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          <p>Pastikan data yang dimasukkan sudah benar sebelum menambahkan user baru</p>
        </div>
      </div>
    </div>
  )
}

