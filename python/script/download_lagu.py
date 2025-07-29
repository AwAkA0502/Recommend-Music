import pandas as pd
import subprocess
import os

# Path ke metadata
csv_path = "track_metadata.csv"
output_folder = "dataset-lagu"

# Baca metadata
df = pd.read_csv(csv_path)

# Pastikan kolom 'spotify_url' ada
if 'spotify_url' not in df.columns:
    raise ValueError("Kolom 'spotify_url' tidak ditemukan di track_metadata.csv")

# Loop untuk setiap link
for index, row in df.dropna(subset=['spotify_url']).iterrows():
    link = row['spotify_url']
    title = row.get('title', '')
    artist = row.get('artist_name', '')
    filename = f"{artist} - {title}.mp3".replace("/", "_").strip()
    filepath = os.path.join(output_folder, filename)

    if os.path.exists(filepath):
        print(f"⏩ Lewati: {filename} sudah ada.")
        continue

    print(f"🎵 Downloading: {link}")
    try:
        subprocess.run(["spotdl", "download", link, "--output", output_folder], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Gagal download: {link} - {e}")