import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Método no permitido.' }),
    };
  }

  try {
    const excelPath = path.resolve(__dirname, 'BD participantes.xlsx');
    const wb = XLSX.readFile(excelPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const participants = [];
    for (let i = 1; i < rows.length; i++) {
      const [id, name, code] = rows[i];
      if (name && code) {
        participants.push({ id: Number(id), name: String(name).trim(), code: String(code).trim() });
      }
    }

    let synced = 0;
    let errors = [];

    for (const p of participants) {
      const { error } = await supabase.from('participants').upsert(
        { id: p.id, name: p.name, code: p.code },
        { onConflict: 'id' }
      );
      if (error) {
        errors.push({ name: p.name, error: error.message });
      } else {
        synced++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        synced,
        errors: errors.length > 0 ? errors : undefined,
        message: `${synced} participantes sincronizados correctamente.`,
      }),
    };
  } catch (err) {
    console.error('Sync function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Error al sincronizar: ' + err.message }),
    };
  }
};
