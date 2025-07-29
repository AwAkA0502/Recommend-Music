import lyricsgenius
import pandas as pd
import time

# Ganti dengan token milikmu dari https://genius.com/api-clients
genius = lyricsgenius.Genius("ymDZliqsNpsG5hZze0H2NeOrVwicWMgchnvc02qoKF_Hx6goziWCK6U7B2ugG_cp")
genius.skip_non_songs = True
genius.excluded_terms = ["(Remix)", "(Live)"]

# Load CSV
df = pd.read_csv("track_metadata.csv")  # Harus punya kolom 'title' dan 'artist'

# Ambil lirik
def get_lyrics(title, artist):
    try:
        song = genius.search_song(title, artist)
        time.sleep(1)  # Hindari rate limit
        return song.lyrics if song else None
    except Exception as e:
        print(f"Gagal ambil lirik: {title} - {artist}: {e}")
        return None

df["lyrics"] = df.apply(lambda row: get_lyrics(row["title"], row["artist"]), axis=1)
df.to_csv("lagu_dengan_lirik.csv", index=False)