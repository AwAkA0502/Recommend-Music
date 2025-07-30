"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Gunakan environment variable NEXT_PUBLIC_API_BASE_URL yang sudah di-define di .env.local
      const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/login";
      } else {
        setError(data.message || "Registrasi gagal");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-100 via-white to-green-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border">
        <h2 className="text-2xl font-bold text-green-600 mb-2 text-center">Daftar AwAkATune</h2>
        <p className="text-gray-500 mb-6 text-center">Buat akun untuk mulai rekomendasi musik sesuai suasana hati kamu</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            type="text"
            required
            placeholder="Username"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-200"
            value={form.username}
            onChange={handleChange}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-200"
            value={form.email}
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-200"
            value={form.password}
            onChange={handleChange}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-full bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
          {error && <p className="text-center text-red-600 text-sm">{error}</p>}
        </form>
        <div className="text-center mt-4 text-gray-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-green-600 hover:underline font-semibold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}