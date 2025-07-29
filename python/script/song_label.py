import os
import re
import openai
import json
import pandas as pd
from pymongo import MongoClient
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

# --- Konfigurasi ---
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client = MongoClient("mongodb://localhost:27017")
db = client["rekomendasi_lagu"]
collection = db["lagu"]

# --- Fungsi Pembersih dan Pemroses Lirik ---
def bersihkan_lirik(lirik):
    if not isinstance(lirik, str) or not lirik.strip():
        return ""
    return re.sub(r"\[.*?\]", "", lirik)

def potong_lirik(lirik, max_kata=300):
    kata = lirik.split()
    return " ".join(kata[:max_kata])

# --- Analisis GPT ---
def label_mood_konteks(lirik):
    prompt = f"""
Song lyrics:
\"\"\"{lirik}\"\"\"

Your task:
1. Analyze the song lyrics and describe the main emotional context in Bahasa Indonesia, with no more than 2 concise sentences that directly capture the feelings and story without extra phrases.
2. Based on that context, determine one or more moods of the song. Possible moods: [happy, sad, romantic, melancholic, energetic, calm, angry, nostalgic, lonely, hopeful]. If more than one mood fits, list them separated by commas. The mood(s) must be in English.
3. Output should have the context and reference input in Bahasa Indonesia and mood in English.
4. From the context (not lyrics), create a user's personal story (maximum 2 short sentences) in Bahasa Indonesia.
   - Do NOT copy or rewrite any lyrics.
   - Base it entirely on the emotional context and mood of the song.
   - Use simple, human-like and natural language, as if someone is expressing their feelings or situation.
Ensure that the Reference_Input is derived from the context and mood above, not from lyrics, and it must sound coherent with the given context.

Output format:
Konteks: ...
Mood: ...
Reference_Input: ...
"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=150
        )
        return response.choices[0].message.content
    except Exception as e:
        print("GPT Error:", e)
        return None

# --- Proses CSV dan Simpan ke MongoDB ---
def proses_dan_simpan(csv_path):
    df = pd.read_csv(csv_path)
    # Load JSON lama jika ada
    json_path = os.path.join(os.path.dirname(__file__), "../recommend-music/Dataset_Lagu_Indonesia_Labeled.json")
    existing_lagu = []
    existing_keys = set()
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            try:
                existing_lagu = json.load(f)
                for lagu in existing_lagu:
                    existing_keys.add((lagu["title"], lagu["artist"]))
            except Exception as e:
                print(f"⚠️ Gagal membaca JSON lama: {e}")

    # Proses semua lagu
    # (tidak ada pembatasan jumlah lagu)
    semua_lagu = existing_lagu
    total = len(df)
    for idx, row in enumerate(df.itertuples(index=False), 1):
        print(f"Memproses lagu ke-{idx} dari {total}: {row.title} - {row.artist}")
        if (row.title, row.artist) in existing_keys:
            print("  ➡️  Lagu sudah ada di JSON, dilewati.")
            continue
        raw_lyrics = bersihkan_lirik(row.lyrics if hasattr(row, "lyrics") else "")
        potongan = potong_lirik(raw_lyrics)
        if not potongan.strip():
            print("  ⚠️  Lirik kosong atau tidak valid, dilewati.")
            continue
        label = label_mood_konteks(potongan)
        if label:
            print("==> Label mentah dari GPT:")
            print(label)

        mood, konteks, reference_input = "", "", ""
        if label:
            for line in label.splitlines():
                if line.lower().startswith("mood:"):
                    mood = line.split(":", 1)[1].strip()
                elif line.lower().startswith("konteks:"):
                    konteks = line.split(":", 1)[1].strip()
                elif line.lower().startswith("reference_input:"):
                    reference_input = line.split(":", 1)[1].strip()

        print(f"  → Mood: {mood} | Konteks: {konteks}")

        if mood and konteks:
            print(f"  → Mood: {mood} | Konteks: {konteks}")
            lagu_data = {
                "title": row.title,
                "artist": row.artist,
                "spotify_id": row.spotify_id if hasattr(row, "spotify_id") else None,
                "lyrics": raw_lyrics,
                "mood": mood,
                "konteks": konteks,
                "reference_input": reference_input,
            }

            semua_lagu.append(lagu_data)
            collection.update_one(
                {"title": lagu_data["title"], "artist": lagu_data["artist"]},
                {"$set": lagu_data},
                upsert=True
            )
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(semua_lagu, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    csv_path = os.path.join(os.path.dirname(__file__), "Dataset_lagu_Indonesia.csv")
    proses_dan_simpan(csv_path)