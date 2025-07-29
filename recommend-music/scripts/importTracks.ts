// scripts/importTracks.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../../python/track_descriptions.csv');
  const tracks: any[] = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      console.log('Row dibaca:', row);
      console.log('Kolom tersedia:', Object.keys(row));
      try {
        const track: any = {
          track_id: row.track_id?.trim() || '',
          description: row.description?.trim() || '',
          track_name: row.title?.trim() || '',
          artist_name: row.artist?.trim() || '',
          emotion: row.emotion?.trim().toLowerCase() || null,
        };

        tracks.push(track);
      } catch (error) {
        console.error('❌ Error parsing row:', row, error);
      }
    })
    .on('end', async () => {
      try {
        await prisma.track.deleteMany();
        console.log('🧹 Semua data lama di tabel Track telah dihapus.');
        for (const track of tracks) {
          if (track.track_name === '' || track.artist_name === '') {
            console.warn('⚠️ Melewati track karena data tidak lengkap:', track);
            continue;
          }
          console.log('🛠️ Menyimpan track ke DB:', track);
          try {
            await prisma.track.create({ data: track });
          } catch (err) {
            console.error('❌ Error saat menyimpan track:', track, err);
          }
        }
        console.log('✅ Data berhasil dimasukkan ke tabel Track');
      } catch (error) {
        console.error('❌ Gagal menyimpan ke database:', error);
      } finally {
        await prisma.$disconnect();
      }
    });
}

main();