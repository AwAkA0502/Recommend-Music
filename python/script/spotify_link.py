import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import lyricsgenius
import csv
import os
import time
import re
from dotenv import load_dotenv
load_dotenv()

# === Fungsi untuk membersihkan judul lagu ===
def clean_title(title):
    # Hapus teks tambahan
    title = re.sub(r"\(.*?\)", "", title)
    title = re.sub(r"-\s*Remastered.*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"-\s*Live.*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"feat\..*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"ft\..*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"version.*", "", title, flags=re.IGNORECASE)
    return title.strip()

# === Konfigurasi ===
CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
PLAYLIST_URL = "https://open.spotify.com/playlist/63EUil5p15TDzYkO2JQLRP?si=d2229a61a998445c"
CSV_FILE = "Dataset_lagu_Indonesia.csv"
LINKS_FILE = "links.txt"
FIELDNAMES = ["title", "artist", "spotify_id", "spotify_url", "lyrics"]

# === Inisialisasi Spotipy ===
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET))

# === Inisialisasi Genius ===
GENIUS_TOKEN = os.getenv('GENIUS_TOKEN')
genius = lyricsgenius.Genius(GENIUS_TOKEN, skip_non_songs=True, excluded_terms=["(Remix)", "(Live)"])

# === Inisialisasi set untuk deteksi duplikat berdasarkan title dan artist ===
existing_keys = set()

# === Selalu tulis ulang file CSV ===
file_exists = False
# Hapus file lama jika ada
if os.path.exists(CSV_FILE):
    os.remove(CSV_FILE)
if os.path.exists(LINKS_FILE):
    os.remove(LINKS_FILE)
# Buat file CSV baru dengan header
with open(CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES)
    writer.writeheader()
# Buat file links.txt kosong
open(LINKS_FILE, 'w', encoding='utf-8').close()

# === Dictionary untuk perbaikan judul ===
TITLE_FIX = {
    "Jendela Kelas 1": "Jendela Kelas I",
    "Jendela Kelas 2": "Jendela Kelas II",
    "Jendela Kelas 3": "Jendela Kelas III"
}

def bersihkan_lirik(lirik):
    if not lirik:
        return ""
    # Hilangkan tanda kurung dan isinya
    lirik = re.sub(r"\[.*?\]", "", lirik)
    # Hilangkan multiple spasi dan baris baru
    lirik = re.sub(r"\s+", " ", lirik)
    return lirik.strip()

# === Fungsi untuk ambil lirik dari Genius ===
def get_lyrics(title, artist):
    title_clean = clean_title(title)
    if title_clean in TITLE_FIX:
        title_clean = TITLE_FIX[title_clean]
    try:
        song = genius.search_song(title_clean, artist)
        if not song:
            # Fallback: coba judul sebelum tanda "-"
            if "-" in title_clean:
                short_title = title_clean.split("-")[0].strip()
                print(f"🔄 Fallback search with short title: {short_title}")
                song = genius.search_song(short_title, artist)
                if not song:
                    with open("failed_lyrics.log", "a", encoding="utf-8") as log:
                        log.write(f"Fallback short title gagal: {short_title} - {artist}\n")
            if not song:
                print(f"🔄 Fallback search by title only: {title_clean}")
                song = genius.search_song(title_clean)
                if not song:
                    with open("failed_lyrics.log", "a", encoding="utf-8") as log:
                        log.write(f"Fallback search by title only gagal: {title_clean}\n")
        if song and song.lyrics:
            return song.lyrics.replace('\n', ' ').strip()
        else:
            with open("failed_lyrics.log", "a", encoding="utf-8") as log:
                log.write(f"Gagal: {title} - {artist}\n")
            return ""
    except Exception as e:
        print(f"⚠️ Gagal ambil lirik untuk '{title}' oleh '{artist}': {e}")
        with open("failed_lyrics.log", "a", encoding="utf-8") as log:
            log.write(f"Error: {title} - {artist}: {e}\n")
        return ""

# === Fungsi untuk tulis metadata ke CSV dan links.txt ===
def write_track(track, writer, link_f):
    title = track['name']
    artist = track['artists'][0]['name']
    track_id = track['id']
    url = track['external_urls']['spotify']
    clean_t = clean_title(title).lower()
    clean_a = re.sub(r"\(.*?\)", "", artist).strip().lower()
    key = f"{clean_t}_{clean_a}"

    if key in existing_keys:
        print(f"➡️ Lagu sudah ada di CSV, dilewati: {title} - {artist}")
        return

    print(f"➕ Lagu baru ditemukan: {title} - {artist}, mengambil lirik...")
    lyrics = bersihkan_lirik(get_lyrics(title, artist))
    # Delay to respect Genius API rate limits
    time.sleep(1)

    writer.writerow({
        "title": title,
        "artist": artist,
        "spotify_id": track_id,
        "spotify_url": url,
        "lyrics": lyrics
    })
    link_f.write(f"{url}\n")
    existing_keys.add(key)

# === Fungsi untuk mengambil semua lagu dalam playlist dengan pagination ===
def get_all_playlist_tracks(sp, playlist_id):
    all_tracks = []
    offset = 0
    limit = 100
    while True:
        results = sp.playlist_tracks(playlist_id, offset=offset, limit=limit)
        items = results.get('items', [])
        all_tracks.extend(items)
        if not results.get('next'):
            break
        offset += limit
    return all_tracks

# === Proses ambil dan simpan data ===
with open(CSV_FILE, 'a', newline='', encoding='utf-8') as csvfile, open(LINKS_FILE, 'a', encoding='utf-8') as linkfile:
    writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES)
    # Header sudah ditulis sebelumnya

    # Dari playlist tunggal
    playlist_id = PLAYLIST_URL.split("/")[-1].split("?")[0]
    try:
        all_items = get_all_playlist_tracks(sp, playlist_id)
        for item in all_items:
            track = item.get('track')
            if track:
                write_track(track, writer, linkfile)
    except Exception as e:
        print(f"❌ Gagal ambil dari playlist {PLAYLIST_URL}: {e}")

print("✅ Selesai: Metadata, link, dan lirik lagu berhasil disimpan.")