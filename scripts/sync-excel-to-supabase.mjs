import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EXCEL_PATH = path.resolve(__dirname, '..', 'BD participantes.xlsx');

async function sync() {
  console.log('📖 Leyendo Excel...');
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const participants = [];
  for (let i = 1; i < rows.length; i++) {
    const [id, name, code] = rows[i];
    if (name && code) {
      participants.push({ id: Number(id), name: String(name).trim(), code: String(code).trim() });
    }
  }

  console.log(`📊 ${participants.length} participantes encontrados en Excel.`);

  for (const p of participants) {
    const { error } = await supabase.from('participants').upsert(
      { id: p.id, name: p.name, code: p.code },
      { onConflict: 'id' }
    );
    if (error) {
      console.error(`❌ Error con ${p.name}:`, error.message);
    } else {
      console.log(`✅ ${p.name} (${p.code}) sincronizado.`);
    }
  }

  console.log('🎉 Sincronización completada.');
}

sync().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
