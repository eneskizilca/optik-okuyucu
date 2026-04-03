/**
 * Excel İşlemcisi
 * 
 * Hoca tarafından yüklenen .xlsx dosyasını okur,
 * "ÖĞRENCİ NO" sütununu eşleştirerek "NOT" sütununa puan yazar
 * ve güncellenmiş dosyayı base64 olarak döndürür.
 */
import * as XLSX from 'xlsx';
import { ScanResult } from './types';

// Sütun başlıkları için esnek eşleştirme
const STUDENT_NO_ALIASES = ['ÖĞRENCİ NO', 'ÖĞRENCI NO', 'OGRENCİ NO', 'OGRENCI NO', 'ÖĞRENCI NUMARASI', 'NUMARA', 'NO', 'ÖĞR. NO'];
const SCORE_COL_ALIASES = ['NOT', 'NOTLAR', 'PUAN', 'SKOR', 'GRADE'];

function normalizeHeader(h: string): string {
  return h
    .toUpperCase()
    .trim()
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
}

function findColIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  const normalizedAliases = aliases.map(normalizeHeader);
  for (const alias of normalizedAliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

export interface ProcessResult {
  matched: number;    // Not yazılan öğrenci sayısı
  notFound: string[]; // Taramada var ama Excel'de bulunamayan öğrenci numaraları
  outputBase64: string;
}

export async function processExcel(
  excelBase64: string,
  results: ScanResult[]
): Promise<ProcessResult> {
  // Excel dosyasını oku
  const wb = XLSX.read(excelBase64, { type: 'base64' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Sheet'i 2D array'e çevir (başlıklar dahil)
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rows.length < 2) {
    throw new Error('Excel dosyası en az bir başlık satırı ve bir veri satırı içermelidir.');
  }

  const headers: string[] = rows[0].map((h: any) => String(h));

  // Sütun indekslerini bul
  const studentNoColIdx = findColIndex(headers, STUDENT_NO_ALIASES);
  if (studentNoColIdx === -1) {
    throw new Error(
      `"ÖĞRENCİ NO" sütunu bulunamadı.\n\nBulunan başlıklar: ${headers.join(', ')}\n\nLütfen Excel başlığını kontrol edin.`
    );
  }

  let scoreColIdx = findColIndex(headers, SCORE_COL_ALIASES);
  if (scoreColIdx === -1) {
    // "NOT" sütunu yoksa en sona ekle
    scoreColIdx = headers.length;
    headers.push('NOT');
    // Başlık hücresini yaz
    const colLetter = XLSX.utils.encode_col(scoreColIdx);
    ws[`${colLetter}1`] = { v: 'NOT', t: 's' };
  }

  // ScanResult listesini Öğrenci No → Score map'ine çevir
  const scoreMap = new Map<string, number>();
  results.forEach(r => {
    const no = String(r.studentNo || '').trim();
    if (no) scoreMap.set(no, r.score);
  });

  let matched = 0;
  const notFound: string[] = [];

  // Veri satırlarını işle (1. satır başlık, 2. satırdan itibaren veri)
  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const rawNo = String(row[studentNoColIdx] ?? '').trim();
    if (!rawNo) continue;

    if (scoreMap.has(rawNo)) {
      const score = scoreMap.get(rawNo)!;
      const colLetter = XLSX.utils.encode_col(scoreColIdx);
      const cellAddr = `${colLetter}${rowIdx + 1}`; // rowIdx 0-indexed, hücre 1-indexed
      ws[cellAddr] = { v: score, t: 'n' }; // t: 'n' → numeric
      matched++;
    }
  }

  // Taramada var ama Excel'de bulunamayan öğrencileri bul
  scoreMap.forEach((_, no) => {
    const foundInExcel = rows.slice(1).some(
      row => String(row[studentNoColIdx] ?? '').trim() === no
    );
    if (!foundInExcel) notFound.push(no);
  });

  // Kritik: worksheet aralığını (ref) güncellemek gerek, yoksa yeni hücreler göz ardı edilir.
  // Yeni skor sütunu veya son satırı kapsayacak şekilde ref'i genişlet.
  const existingRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  existingRange.e.c = Math.max(existingRange.e.c, scoreColIdx);
  existingRange.e.r = Math.max(existingRange.e.r, rows.length - 1);
  ws['!ref'] = XLSX.utils.encode_range(existingRange);

  // Güncellenen workbook'u base64 olarak encode et
  const outputBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  return { matched, notFound, outputBase64 };
}
