from fastapi import FastAPI, Request
from sentence_transformers import SentenceTransformer, util
import json
import os
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://awakatune.com", "https://www.awakatune.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
model = SentenceTransformer('LazarusNLP/all-indo-e5-small-v4')
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# BASE_DIR sekarang menunjuk ke folder root project (/var/www/Recommend-Music)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
file_path_model = os.path.join(BASE_DIR, "recommend-music", "Dataset_Lagu_Indonesia_with_embedding_LazarusNLP-all-indo-e5-small-v4.json")

try:
    with open(file_path_model, 'r', encoding='utf-8') as f:
        semua_lagu = json.load(f)
except FileNotFoundError:
    raise RuntimeError(f"Dataset file not found at {file_path_model}. Pastikan file JSON tersedia di lokasi yang benar.")

async def get_mood_label(user_text: str) -> list:
    prompt = f"""
You are an expert emotion classifier for song recommendations. Your task is to classify the mood of the following sentence:
\"{user_text}\"

Only choose from this fixed list of moods (in English):
[happy, sad, romantic, melancholic, energetic, calm, angry, nostalgic, lonely, hopeful].

Guidelines:
- "nostalgic" is for reminiscing or looking back at the past.
- "happy" for happiness or positive excitement.
- "calm" for calmness or peaceful situations.
- "energetic" for motivation or encouragement.
- "melancholic" for sadness mixed with nostalgia or reflection.
- "angry" for anger or frustration.
- "romantic" for romance and love.
- "lonely" for feelings of isolation.
- "hopeful" for optimism or looking forward to better things.

Respond strictly with a valid Python list of strings from the above moods, like ["melancholic", "happy"]. 
Do not add any mood outside this list. 
If no mood matches, respond with [].
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Kamu adalah asisten yang membantu mengklasifikasikan mood dari teks."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
        )
        label_text = response.choices[0].message.content
        return json.loads(label_text)
    except Exception as e:
        print(f"Error GPT mood labeling: {e}")
        return []

async def get_gpt_rerank_score(user_text: str, lagu_context: str) -> float:
    prompt = f"""
User's feeling: {user_text}

Song context: {lagu_context}

Rate how well the song context matches the user's feeling on a scale of 0 to 1.
Respond with a single number between 0 and 1.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that scores relevance between user feelings and song context."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=5
        )
        score_text = response.choices[0].message.content.strip()
        return float(score_text)
    except Exception as e:
        print(f"Error GPT rerank scoring: {e}")
        return 0.0

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    user_text = data.get("description", "")

    print(f"Deskripsi dari user: {user_text}")

    user_text_full = user_text.strip()
    user_embedding = model.encode(user_text_full, normalize_embeddings=True)

    hasil_model = []
    user_mood_keywords = await get_mood_label(user_text_full)
    ALLOWED_MOODS = ["happy", "sad", "romantic", "melancholic", "energetic", "calm", "angry", "nostalgic", "lonely", "hopeful"]
    user_mood_keywords = [mood for mood in user_mood_keywords if mood in ALLOWED_MOODS]
    print(f"Mood yang terdeteksi dari input user: {', '.join(user_mood_keywords) if user_mood_keywords else 'Tidak terdeteksi'}")
    if not user_mood_keywords:
        user_mood_keywords = []
    for lagu in semua_lagu:
        sim_lyrics = util.cos_sim(user_embedding, lagu['embedding_lyrics'])[0][0].item()
        sim_context = util.cos_sim(user_embedding, lagu['embedding_context'])[0][0].item()
        sim_reference = util.cos_sim(user_embedding, lagu['embedding_reference'])[0][0].item()

        lagu_moods = set(map(str.strip, lagu.get('mood', '').lower().split(',')))
        mood_score = sum(1 for mood in user_mood_keywords if mood in lagu_moods) / len(user_mood_keywords) if user_mood_keywords else 0

        final_score = (0.1 * sim_lyrics) + (0.50 * sim_context) + (0.20 * sim_reference) + (0.20 * mood_score)
        hasil_model.append((final_score, lagu))

    hasil_model.sort(reverse=True, key=lambda x: x[0])

    # Ambil top 10 dan lakukan GPT rerank
    top_n = hasil_model[:10]
    reranked = []
    for score, lagu in top_n:
        gpt_score = await get_gpt_rerank_score(user_text_full, lagu.get('konteks', ''))
        combined_score = (0.3 * score) + (0.7 * gpt_score)
        print(f"GPT Rerank - {lagu['title']} oleh {lagu['artist']}: Original: {score:.4f}, GPT: {gpt_score:.4f}, Combined: {combined_score:.4f}")
        reranked.append((combined_score, gpt_score, lagu))
    reranked.sort(reverse=True, key=lambda x: x[0])

    print("Hasil rekomendasi lagu:")
    print(user_text_full)
    for score, gpt_score, r in reranked[:3]:
        sim_lyrics = util.cos_sim(user_embedding, r['embedding_lyrics'])[0][0].item()
        sim_context = util.cos_sim(user_embedding, r['embedding_context'])[0][0].item()
        sim_reference = util.cos_sim(user_embedding, r['embedding_reference'])[0][0].item()
        mood_score = sum(1 for mood in user_mood_keywords if mood in r.get('mood', '').lower().split(',')) / len(user_mood_keywords) if user_mood_keywords else 0
        print(f"- {r['title']} oleh {r['artist']} (Final: {score:.4f}, lyrics: {sim_lyrics:.4f}, context: {sim_context:.4f}, reference: {sim_reference:.4f}, mood: {mood_score:.4f})")

    recommendations = []
    for score, gpt_score, r in reranked[:3]:
        sim_lyrics = util.cos_sim(user_embedding, r['embedding_lyrics'])[0][0].item()
        sim_context = util.cos_sim(user_embedding, r['embedding_context'])[0][0].item()
        sim_reference = util.cos_sim(user_embedding, r['embedding_reference'])[0][0].item()
        mood_score = sum(1 for mood in user_mood_keywords if mood in r.get('mood', '').lower().split(',')) / len(user_mood_keywords) if user_mood_keywords else 0

        recommendations.append({
            "title": r["title"],
            "artist": r["artist"],
            "spotify_id": r.get("spotify_id", ""),
            "mood": r.get("mood", ""),
            "konteks": r.get("konteks", ""),
            "reference_input": r.get("reference_input", ""),
            "scores": {
                "final": round(score * 100, 2),
                "lyrics": round(sim_lyrics * 100, 2),
                "context": round(sim_context * 100, 2),
                "reference": round(sim_reference * 100, 2),
                "mood": round(mood_score * 100, 2),
                "gpt_rerank_score": round(gpt_score * 100, 2)  # Menyimpan score GPT rerank yang asli
            }
        })
    return {
        "recommendations": recommendations
    }