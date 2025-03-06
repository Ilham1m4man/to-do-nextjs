"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import jwt_decode from "jwt-decode"
import { Loader2 } from "lucide-react"

interface DecodedToken {
  id: number
  role: string
  exp: number
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          try {
            const decoded: DecodedToken = jwt_decode(token)

            const currentTime = Date.now() / 1000
            if (decoded.exp > currentTime) {
              router.push("/dashboard")
              return
            } else {
              localStorage.removeItem("token")
            }
          } catch (error) {
            console.error("Invalid token:", error)
            localStorage.removeItem("token")
          }
        }

        setIsAuthChecking(false)
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthChecking(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem("token", data.token)
        router.push("/dashboard")
      } else {
        alert(data.message || "Login gagal")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Terjadi kesalahan saat login")
      setIsLoading(false)
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600 mb-2" />
        <p className="text-slate-600">Memeriksa status login...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-xl font-semibold text-slate-800">Login</h1>
            <p className="mt-1 text-sm text-slate-500">Masukkan email dan password untuk mengakses dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5 text-slate-700">
              <label htmlFor="email" className="block text-sm font-medium ">
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

            <div className="space-y-1.5 text-slate-700">
              <label htmlFor="password" className="block text-sm font-medium ">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Masukkan password"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

