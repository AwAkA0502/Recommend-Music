"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function About() {
    const [user, setUser] = useState<any>(null);
    const [dropdown, setDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const handleLogout = () => {
        fetch("http://localhost:5050/api/auth/logout", { method: "POST", credentials: "include" })
            .then(() => router.replace("/login"));
    };

    useEffect(() => {
        fetch("http://localhost:5050/api/auth/me", { credentials: "include" })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.user) {
                    setUser(data.user);
                }
            });
    }, []);

    return (
        <>
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
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-8">
                <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-10 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-200 rounded-full opacity-30 transform translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-green-300 rounded-full opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>

                    <h1 className="text-4xl font-extrabold text-green-700 mb-6 relative z-10 text-center">
                        Tentang <span className="text-green-500">AwAkATune</span>
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6 relative z-10 text-center max-w-3xl mx-auto">
                        AwAkATune adalah platform rekomendasi musik berbasis AI yang hadir untuk menemukan lagu-lagu yang selaras dengan suasana hati atau curhatan Anda.
                        Dengan memanfaatkan analisis mendalam terhadap lirik, konteks, mood, dan referensi curhatan, kami memberikan rekomendasi musik yang lebih personal dan bermakna.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mt-10 relative z-10">
                        <div className="bg-green-50 rounded-xl p-6 shadow hover:shadow-lg transition">
                            <h2 className="text-xl font-semibold text-green-700 mb-2">Teknologi</h2>
                            <p className="text-gray-600 text-base leading-relaxed">
                                Platform ini memanfaatkan API Spotify untuk data lagu, Genius API untuk lirik, serta model NLP canggih untuk memahami emosi di balik lirik lagu.
                                Hasilnya adalah rekomendasi lagu yang bukan hanya akurat secara musikal, tetapi juga emosional.
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-6 shadow hover:shadow-lg transition">
                            <h2 className="text-xl font-semibold text-green-700 mb-2">Tujuan</h2>
                            <p className="text-gray-600 text-base leading-relaxed">
                                AwAkATune hadir untuk membantu Anda menemukan lagu yang sesuai dengan suasana hati.
                                Dengan algoritma AI, kami memastikan pengalaman mendengarkan musik Anda menjadi lebih menyentuh dan relevan.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 text-center relative z-10">
                        <p className="text-gray-600 text-base max-w-3xl mx-auto">
                            Dibangun dengan teknologi modern seperti <span className="font-semibold text-green-600">Next.js</span> dan <span className="font-semibold text-green-600">Tailwind CSS</span>,
                            AwAkATune menawarkan antarmuka yang cepat, responsif, dan nyaman digunakan.
                        </p>
                    </div>
                    <div className="mt-12 w-full relative z-10">
                        <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Pembuat</h2>
                        <div className="flex w-full justify-center items-center gap-5">
                            <div className="w-fit">
                                <img
                                    src="/images/foto AwAkA.png"
                                    alt="Foto Pembuat"
                                    className="w-[200px] h-[200px] rounded-3xl shadow-md mx-auto md:mx-0"
                                />
                            </div>
                            <div className="text-center md:text-left w-fit">
                                <p className="text-lg font-semibold text-gray-700">Rizky Febrian Hidayat</p>
                                <p className="text-gray-600">Full Stack Developer</p>
                                <p className="text-gray-600">Email: rizkyfebrian.hidayat@gmail.com</p>
                                <p className="text-gray-600">GitHub: https://github.com/AwAkA0502</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}