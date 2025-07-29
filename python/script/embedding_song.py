import json
import numpy as np
from sentence_transformers import SentenceTransformer
model_name = "LazarusNLP/all-indo-e5-small-v4"
model = SentenceTransformer(model_name)

# Path ke file
input_path = '/Users/awaka/Documents/AwAkA-Project/PI Spotify/recommend-music/Dataset_Lagu_Indonesia_Labeled.json'
output_path = '/Users/awaka/Documents/AwAkA-Project/PI Spotify/recommend-music/Dataset_Lagu_Indonesia_with_embedding_LazarusNLP-all-indo-e5-small-v4.json'

# Load data lagu
with open(input_path, 'r', encoding='utf-8') as f:
    lagu_data = json.load(f)

# Proses setiap lagu
for lagu in lagu_data:
    # Skip jika embedding sudah ada
    if 'embedding_lyrics' in lagu and 'embedding_context' in lagu and 'embedding_reference' in lagu:
        print(f"➡️ Skip embedding: {lagu.get('title')} - {lagu.get('artist')}")
        continue
    teks = f"{lagu.get('lyrics', '')}. {lagu.get('mood', '')}. {lagu.get('konteks', '')}"
    embedding_lyrics = model.encode(lagu.get("lyrics", ""), normalize_embeddings=True)
    embedding_context = model.encode(f"{lagu.get('mood', '')}. {lagu.get('konteks', '')}", normalize_embeddings=True)
    embedding_reference = model.encode(lagu.get("reference_input", ""), normalize_embeddings=True)
    lagu['embedding_lyrics'] = embedding_lyrics.tolist()
    lagu['embedding_context'] = embedding_context.tolist()
    lagu['embedding_reference'] = embedding_reference.tolist()
    lagu['model_name'] = model_name
    print(f"Berhasil embedding lagu: {lagu.get('title')} - {lagu.get('artist')}")
    print(f"→ Embedding lyrics: {lagu['embedding_lyrics'][:5]}...")
    print(f"→ Embedding context: {lagu['embedding_context'][:5]}...")
    print(f"→ Embedding reference: {lagu['embedding_reference'][:5]}...")

# Simpan kembali
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(lagu_data, f, ensure_ascii=False, indent=2)

print("Embedding selesai dan disimpan di:", output_path)