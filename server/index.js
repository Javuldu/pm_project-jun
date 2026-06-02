import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EXCEL_PATH = path.resolve(__dirname, '..', 'BD participantes.xlsx');

// ─── Auth: validate participant against Supabase ───
app.post('/api/auth/participant', async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ valid: false, error: 'Nombre y código requeridos.' });
  }

  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id, name')
      .eq('code', code.trim())
      .maybeSingle();

    if (error) throw error;

    if (!data || data.name.toLowerCase() !== name.trim().toLowerCase()) {
      return res.json({ valid: false, error: 'Nombre o código incorrecto. No estás registrado como participante.' });
    }

    res.json({ valid: true, user: { id: `u${data.id}`, name: data.name } });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ valid: false, error: 'Error interno del servidor.' });
  }
});

// ─── Sync: read Excel and upsert into Supabase ───
app.post('/api/sync-participants', async (req, res) => {
  try {
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

    res.json({
      success: true,
      synced,
      errors: errors.length > 0 ? errors : undefined,
      message: `${synced} participantes sincronizados correctamente.`,
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ success: false, error: 'Error al sincronizar: ' + err.message });
  }
});

// ─── Existing routes ───
app.post('/api/forecasts', async (req, res) => {
  const { user_id, match_id, prediction } = req.body;
  const { data, error } = await supabase.from('forecasts').insert({
    user_id,
    match_id,
    prediction,
    points: 0,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

app.get('/api/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
