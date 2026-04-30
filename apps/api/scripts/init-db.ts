/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// scripts/seed-from-json-fast.ts
import { db } from '../src/infrastructure/database/db.client';
import { matchesTable } from '../src/infrastructure/database/schema';
import * as fs from 'fs';
import * as path from 'path';

async function seedFromJsonFast() {
  console.log('🔄 JSON verileri aktarılıyor (hızlı mod)...');

  const jsonPath = path.join(process.cwd(), 'data', 'matches.json');

  if (!fs.existsSync(jsonPath)) {
    console.log('⚠️ matches.json bulunamadı');
    process.exit(1);
  }

  try {
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const matches = JSON.parse(jsonData);

    console.log(`📂 ${matches.length} maç JSON'dan okundu`);

    // Verileri temizle
    await db.delete(matchesTable);

    // Tüm verileri tek seferde hazırla
    const cleanedMatches = matches.map((match: any) => ({
      id: match.id,
      time: match.time,
      date: match.date,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      odds: match.odds,
      confidence: match.confidence || null,
      betType: match.betType || null,
      betOdd: match.betOdd ?? null,
      isLive: match.isLive ?? false,
      league: match.league || null,
      flag: match.flag || null,
      score: match.score || null,
      minute: match.minute ?? null,
      stats: match.stats || null,
    }));

    // Batch insert (100'er 100'er)
    const batchSize = 100;
    for (let i = 0; i < cleanedMatches.length; i += batchSize) {
      const batch = cleanedMatches.slice(i, i + batchSize);
      await db.insert(matchesTable).values(batch);
      console.log(
        `✅ ${Math.min(i + batchSize, cleanedMatches.length)}/${cleanedMatches.length} maç eklendi`,
      );
    }

    console.log(`🎉 Aktarım tamamlandı! ${cleanedMatches.length} maç eklendi.`);

    // JSON'u yedekle
    const backupPath = path.join(process.cwd(), 'data', 'matches.json.backup');
    fs.copyFileSync(jsonPath, backupPath);
    console.log(`📦 JSON yedeklendi: ${backupPath}`);
  } catch (error) {
    console.error('❌ Aktarım hatası:', error);
  }

  process.exit(0);
}

void seedFromJsonFast();
