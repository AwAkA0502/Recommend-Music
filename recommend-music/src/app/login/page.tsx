"use client";
import React, { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/";
      } else {
        setError(data.message || "Login gagal");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-100 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-green-700 text-center">Login</h1>

        {/* Google Login */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-full border border-gray-300 shadow-sm text-gray-700 font-semibold hover:bg-gray-100 transition"
        >
          <img src="/images/google_icon.png" alt="Google" className="w-5 h-5" />
          Login dengan Google
        </a>

        <div className="relative text-center">
          <span className="bg-white px-2 text-gray-400 z-10 relative">atau</span>
          <div className="absolute left-0 top-1/2 w-full border-t border-gray-200 -z-0" style={{ transform: 'translateY(-50%)' }} />
        </div>

        {/* Manual Login */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:border-green-500 outline-none"
            autoComplete="username"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:border-green-500 outline-none"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white rounded-full py-2 font-semibold shadow hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
          {error && <div className="text-red-600 text-center text-sm">{error}</div>}
        </form>

        <div className="text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="text-green-600 font-bold hover:underline"
          >
            Register
          </a>
        </div>
      </div>
    </main>
  );
}