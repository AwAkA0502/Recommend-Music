"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function LandingPage() {
    const [user, setUser] = useState<any>(null);
    const [dropdown, setDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cek login tanpa redirect
    useEffect(() => {
        fetch("http://localhost:5050/api/auth/me", {
            credentials: "include",
        })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data && data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            });
    }, []);

    console.log("State user sekarang:", user);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdown(false);
            }
        }
        if (dropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdown]);

    const handleLogout = async () => {
        await fetch("http://localhost:5050/api/auth/logout", {
            method: "GET",
            credentials: "include",
        });
        setUser(null);
        window.location.href = "/";
        setTimeout(() => window.location.reload(), 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-white to-green-50 text-gray-800">
            <header className="py-6 px-8 flex justify-between items-center shadow bg-white sticky top-0 z-10">
                <a href="/" className="text-2xl font-bold text-green-600">🎧 AwAkATune</a>
                <nav className="space-x-4">
                    <a href="#features" className="text-gray-700 hover:text-green-600 font-medium">Fitur</a>
                    <a href="/recommend-music" className="text-gray-700 hover:text-green-600 font-medium">Coba Sekarang</a>
                    <a href="/about" className="text-gray-700 hover:text-green-600 font-medium">About</a>
                    {user ? (
                        <div className="relative inline-block" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdown((prev) => !prev)}
                                className="ml-4 px-5 py-2 rounded-full bg-green-100 text-green-700 font-semibold shadow hover:bg-green-200 transition"
                            >
                                Hiii, {user.username || (user.email ? user.email.split('@')[0] : "User")}
                                <span className="ml-2">▼</span>
                            </button>
                            {dropdown && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-20">
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-b"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <a
                            href="/login"
                            className="ml-4 px-5 py-2 rounded-full bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
                        >
                            Login
                        </a>
                    )}
                </nav>
            </header>

            <main className="w-full px-6 pt-[160px] flex justify-center">
                <div className="w-full max-w-5xl flex justify-between items-end gap-20">
                    <div className="flex justify-center">
                        <img
                            src="/images/hero_illust.png"
                            alt="Contoh"
                            className="max-w-[1220px] w-full h-auto"
                        />
                    </div>
                    <div className="flex flex-col justify-center w-full text-center md:text-left pb-20">
                        <h2 className="text-4xl font-bold mb-6 text-green-700">Temukan Lagu yang Cocok Dengan Hatimu</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Masukkan curhatanmu, dan sistem kami akan merekomendasikan lagu yang sesuai dengan suasana hati dan ceritamu.
                        </p>
                        <a
                            href="/recommend-music"
                            className="inline-block bg-green-600 w-fit text-white px-6 py-3 rounded-full shadow hover:bg-green-700 transition"
                        >
                            🎵 Mulai Sekarang
                        </a>
                    </div>
                </div>
            </main>

            <section id="features" className="bg-black py-20 px-6">
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-green-600">Analisis Emosi</h3>
                        <p className="text-gray-600">Menggunakan AI untuk memahami perasaan dari tulisanmu secara mendalam.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-green-600">Rekomendasi Personal</h3>
                        <p className="text-gray-600">Setiap lagu direkomendasikan berdasarkan konteks dan mood spesifikmu.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-green-600">Integrasi Spotify</h3>
                        <p className="text-gray-600">Langsung dengarkan lagu favoritmu melalui Spotify embed player.</p>
                    </div>
                </div>
            </section>

            <footer className="bg-black text-center text-gray-500 text-sm py-6">
                &copy; {new Date().getFullYear()} AwAkATune. All rights reserved.
            </footer>
        </div>
    )
}