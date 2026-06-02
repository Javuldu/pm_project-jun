import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = path.resolve(__dirname, '..', 'BD participantes.xlsx');

function readParticipants() {
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
  return participants;
}

app.post('/api/auth/participant', (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ valid: false, error: 'Nombre y código requeridos.' });
  }

  try {
    const participants = readParticipants();
    const match = participants.find(
      p => p.name.toLowerCase() === name.trim().toLowerCase() && p.code === code.trim()
    );

    if (match) {
      res.json({ valid: true, user: { id: `u${match.id}`, name: match.name } });
    } else {
      res.json({ valid: false, error: 'Nombre o código incorrecto. No estás registrado como participante.' });
    }
  } catch (err) {
    console.error('Error reading Excel:', err);
    res.status(500).json({ valid: false, error: 'Error interno del servidor.' });
  }
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
