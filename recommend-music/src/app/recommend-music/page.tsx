'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [description, setDescription] = useState('')
  const [age, setAge] = useState('')
  const [profession, setProfession] = useState('')
  const [mood, setMood] = useState('')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [user, setUser] = useState<any>(null);
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    fetch("http://localhost:5050/api/auth/logout", { method: "POST", credentials: "include" })
      .then(() => router.replace("/login"));
  };

  useEffect(() => {
    fetch("http://localhost:5050/api/auth/me", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data || !data.user) {
          router.replace("/login");
        } else {
          setUser(data.user);
        }
        setChecking(false);
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Checking login...</span>
      </div>
    );
  }

  const analyze = async () => {
    setLoading(true)
    const res = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, age, profession }),
    })
    const data = await res.json()
    console.log('API response:', data) // Debug log
    if (!data || !data.recommendations) {
      console.warn('No recommendations found in API response')
    }
    setRecommendations((data.recommendations || []).slice(0, 3))
    setMood('')
    setLoading(false)
  }

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
      <main className={`p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen flex flex-col ${recommendations.length > 0 ? 'md:flex-row gap-8' : 'items-center justify-center'}`}>
        
        <div className={`${recommendations.length > 0 ? 'md:w-1/2' : 'w-full max-w-md'}`}>
          <h1 className="text-3xl font-bold mb-6 text-green-800">🎵 Rekomendasi Lagu Berdasarkan Curhatanmu</h1>
          <textarea
            className="w-full border border-gray-300 p-3 rounded mb-4 focus:outline-none focus:ring-green-300 focus:border-green-300"
            rows={6}
            placeholder="Ceritakan keluh kesahmu..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded shadow transition"
          >
            {loading ? 'Menganalisis...' : '🎧 Temukan Lagu Cocok'}
          </button>
        </div>

        <div className="md:w-1/2">
          {recommendations.length > 0 && (
            <div className="text-lg bg-white p-4 rounded shadow-md space-y-6">
              <p className="mb-2 text-gray-700">🎶 Lagu-lagu yang cocok:</p>
              <ul className="space-y-6">
                {recommendations.map((track, index) => (
                  <li key={index} className="p-3 bg-gray-100 rounded shadow hover:shadow-lg transition">
                    <p className="font-semibold text-green-700">{track.title} - {track.artist}</p>
                    {track.scores && (
                      <p className="text-sm text-gray-600 mt-1">
                        Model Score &rarr; Lyrics: {track.scores.lyrics}%, Context: {track.scores.context}%, Reference: {track.scores.reference}%, Mood: {track.scores.mood}%<br />
                        NLP Score: {track.scores.gpt_rerank_score}%<br />
                        Final Score: {track.scores.final}%
                      </p>
                    )}
                    <iframe
                      src={`https://open.spotify.com/embed/track/${track.spotify_id}`}
                      width="100%"
                      height="80"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="mt-2 rounded"
                    ></iframe>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  )
}