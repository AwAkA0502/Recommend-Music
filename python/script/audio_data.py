import pandas as pd
import os
from openai import OpenAI
import time
from essentia.standard import MonoLoader, MusicExtractor
import numpy as np


metadata_path = os.path.join(os.path.dirname(__file__), 'track_metadata.csv')
df = pd.read_csv(metadata_path)

# Siapkan dataframe baru untuk deskripsi
desc_data = []

def generate_description(title, artist):
    prompt = f"Deskripsikan secara singkat suasana dan makna dari lagu berjudul '{title}' oleh '{artist}'."
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=100
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Gagal deskripsi '{title}': {e}")
        return ""

def extract_audio_features_by_index(index):
    try:
        audio_files = sorted([
            f for f in os.listdir("/Users/awaka/Documents/AwAkA-Project/PI Spotify/python/dataset-lagu")
            if f.lower().endswith(".mp3")
        ])
        audio_path = os.path.join("/Users/awaka/Documents/AwAkA-Project/PI Spotify/python/dataset-lagu", audio_files[index])
        extractor = MusicExtractor(lowlevelStats=['mean'], rhythmStats=['mean'])
        features = extractor(audio_path)

        return {
            'valence': float(features['tonal.key_strength']),
            'energy': float(features['lowlevel.average_loudness']),
            'danceability': float(features['rhythm.danceability']),
            'tempo': float(features['rhythm.bpm']),
            'acousticness': float(features['tonal.hpcp_entropy']),
            'spectral_complexity': float(features['lowlevel.spectral_complexity']),
            'inharmonicity': float(features['lowlevel.inharmonicity'])
        }
    except Exception as e:
        print(f"❌ Gagal ekstrak fitur audio di index {index}: {e}")
        return None

def combine_emotion_label(ai_label, audio_feat):
    if not audio_feat:
        return ai_label
    valence = audio_feat['valence']
    energy = audio_feat['energy']
    # Aturan sederhana
    audio_label = "calm"
    if valence > 0.5 and energy > -20:
        audio_label = "happy"
    elif valence < 0.3 and energy < -30:
        audio_label = "sad"
    elif energy > -10:
        audio_label = "angry"

    if ai_label == audio_label:
        return ai_label
    if ai_label == "sad" and audio_label == "happy":
        return "neutral"
    return ai_label

# Loop lagu dan deskripsikan
for idx, row in df.head(5).iterrows():
    audio_files = sorted([
        f for f in os.listdir("/Users/awaka/Documents/AwAkA-Project/PI Spotify/python/dataset-lagu")
        if f.lower().endswith(".mp3")
    ])
    title = row['title']
    artist = row['artist']
    print(f"📝 Mendeskripsikan: {title} - {artist}")
    desc = generate_description(title, artist)

    # Prompt tambahan untuk emotion
    emotion_prompt = f"Apa satu kata yang menggambarkan emosi utama dari lagu '{title}' oleh '{artist}'? Jawab hanya dengan satu kata seperti: happy, sad, angry, calm, atau neutral."
    try:
        emotion_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": emotion_prompt}],
            temperature=0.5,
            max_tokens=10
        )
        emotion = emotion_response.choices[0].message.content.strip().lower()
    except Exception as e:
        print(f"❌ Gagal label emotion '{title}': {e}")
        emotion = ""

    # Validasi label emosi agar hanya salah satu dari 5 yang disetujui
    allowed_emotions = ["happy", "sad", "angry", "calm", "neutral"]
    if emotion not in allowed_emotions:
        print(f"⚠️ Label tidak valid '{emotion}', diset ke 'neutral'")
        emotion = "neutral"

    audio_feat = extract_audio_features_by_index(idx)
    final_emotion = combine_emotion_label(emotion, audio_feat)

    desc_data.append({
        'no': idx + 1,
        'track_id': row['spotify_id'],
        'title': title,
        'artist': artist,
        'description': desc,
        'emotion': final_emotion,
        'tempo': audio_feat['tempo'] if audio_feat else None,
        'energy': audio_feat['energy'] if audio_feat else None,
        'valence': audio_feat['valence'] if audio_feat else None,
        'danceability': audio_feat['danceability'] if audio_feat else None,
        'acousticness': audio_feat['acousticness'] if audio_feat else None,
        'spectral_complexity': audio_feat['spectral_complexity'] if audio_feat else None,
        'inharmonicity': audio_feat['inharmonicity'] if audio_feat else None
    })
    time.sleep(1.5)  # hindari rate limit

# Simpan ke CSV baru
desc_df = pd.DataFrame(desc_data)
desc_df.to_csv(os.path.join(os.path.dirname(__file__), 'final_track.csv'), index=False)
print("✅ Deskripsi lagu disimpan di final_track.csv")