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

function apiUrl(req) {
  return req.protocol + '://' + req.get('host');
}

// ─── Auth ───
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

// ─── Load all data for a user ───
app.get('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [matchesRes, predictionsRes, championRes, configRes] = await Promise.all([
      supabase.from('match_data').select('*').order('id'),
      supabase.from('prediction_data').select('*').eq('user_id', userId),
      supabase.from('champion_data').select('*'),
      supabase.from('app_config').select('*'),
    ]);

    if (matchesRes.error) throw matchesRes.error;
    if (predictionsRes.error) throw predictionsRes.error;
    if (championRes.error) throw championRes.error;
    if (configRes.error) throw configRes.error;

    const matches = matchesRes.data.map(m => ({
      id: m.id,
      teamA: m.team_a_id,
      teamB: m.team_b_id,
      date: m.date,
      stage: m.stage,
      isFinished: m.is_finished,
      realScoreA: m.real_score_a,
      realScoreB: m.real_score_b,
      isLocked: m.is_locked,
    }));

    const userPredictions = predictionsRes.data.map(p => ({
      matchId: p.match_id,
      scoreA: p.score_a,
      scoreB: p.score_b,
    }));

    const championPredictions = {};
    championRes.data.forEach(c => {
      championPredictions[c.user_id] = c.champion_team_id;
    });

    const officialChampion = (configRes.data.find(c => c.key === 'official_champion') || {}).value || '';

    const avatarUrls = {};
    configRes.data.forEach(c => {
      if (c.key.startsWith('avatar_')) {
        avatarUrls[c.key.replace('avatar_', '')] = c.value;
      }
    });

    res.json({ matches, userPredictions, championPredictions, officialChampion, avatarUrls });
  } catch (err) {
    console.error('Load data error:', err);
    res.status(500).json({ error: 'Error al cargar datos.' });
  }
});

// ─── Load all data (all participants + all predictions) ───
app.get('/api/all-data', async (req, res) => {
  try {
    const [matchesRes, participantsRes, predictionsRes, championRes, configRes] = await Promise.all([
      supabase.from('match_data').select('*').order('id'),
      supabase.from('participants').select('id, name').order('id'),
      supabase.from('prediction_data').select('*'),
      supabase.from('champion_data').select('*'),
      supabase.from('app_config').select('*'),
    ]);

    if (matchesRes.error) throw matchesRes.error;
    if (participantsRes.error) throw participantsRes.error;
    if (predictionsRes.error) throw predictionsRes.error;
    if (championRes.error) throw championRes.error;
    if (configRes.error) throw configRes.error;

    const matches = matchesRes.data.map(m => ({
      id: m.id,
      teamA: m.team_a_id,
      teamB: m.team_b_id,
      date: m.date,
      stage: m.stage,
      isFinished: m.is_finished,
      realScoreA: m.real_score_a,
      realScoreB: m.real_score_b,
      isLocked: m.is_locked,
    }));

    const participants = participantsRes.data.map(p => ({
      id: `u${p.id}`,
      name: p.name,
    }));

    const allPredictions = {};
    predictionsRes.data.forEach(p => {
      if (!allPredictions[p.user_id]) allPredictions[p.user_id] = [];
      allPredictions[p.user_id].push({
        matchId: p.match_id,
        scoreA: p.score_a,
        scoreB: p.score_b,
      });
    });

    const championPredictions = {};
    championRes.data.forEach(c => {
      championPredictions[c.user_id] = c.champion_team_id;
    });

    const officialChampion = (configRes.data.find(c => c.key === 'official_champion') || {}).value || '';

    const avatarUrls = {};
    configRes.data.forEach(c => {
      if (c.key.startsWith('avatar_')) {
        avatarUrls[c.key.replace('avatar_', '')] = c.value;
      }
    });

    res.json({ matches, participants, allPredictions, championPredictions, officialChampion, avatarUrls });
  } catch (err) {
    console.error('Load all data error:', err);
    res.status(500).json({ error: 'Error al cargar datos.' });
  }
});

// ─── Save predictions (first save locks them) ───
app.post('/api/predictions', async (req, res) => {
  const { userId, predictions } = req.body;
  if (!userId || !predictions) {
    return res.status(400).json({ error: 'userId y predictions requeridos.' });
  }

  try {
    const rows = predictions
      .filter(p => p.matchId && p.scoreA !== undefined && p.scoreA !== '' && p.scoreB !== undefined && p.scoreB !== '')
      .map(p => ({
        user_id: userId,
        match_id: p.matchId,
        score_a: p.scoreA ?? null,
        score_b: p.scoreB ?? null,
      }));

    const { data, error } = await supabase
      .from('prediction_data')
      .insert(rows, { onConflict: 'user_id,match_id', ignoreDuplicates: true })
      .select('match_id');

    if (error) throw error;

    const savedIds = (data || []).map(d => d.match_id);
    const attemptedIds = rows.map(r => r.match_id);
    const lockedIds = attemptedIds.filter(id => !savedIds.includes(id));

    res.json({ success: true, saved: savedIds, locked: lockedIds });
  } catch (err) {
    console.error('Save predictions error:', err);
    res.status(500).json({ error: 'Error al guardar pronósticos.' });
  }
});

// ─── Save champion prediction (first save locks it) ───
app.post('/api/champion', async (req, res) => {
  const { userId, championTeamId } = req.body;
  if (!userId || !championTeamId) {
    return res.status(400).json({ error: 'userId y championTeamId requeridos.' });
  }

  try {
    const { data: existing } = await supabase
      .from('champion_data')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, locked: true });
    }

    const { error } = await supabase
      .from('champion_data')
      .insert({ user_id: userId, champion_team_id: championTeamId });

    if (error) throw error;
    res.json({ success: true, locked: false });
  } catch (err) {
    console.error('Save champion error:', err);
    res.status(500).json({ error: 'Error al guardar campeón.' });
  }
});

// ─── Save matches (admin) ───
app.post('/api/matches', async (req, res) => {
  const { matches } = req.body;
  if (!matches) {
    return res.status(400).json({ error: 'matches requerido.' });
  }

  try {
    for (const m of matches) {
      const { error } = await supabase
        .from('match_data')
        .upsert({
          id: m.id,
          team_a_id: m.teamA?.id || m.teamA,
          team_b_id: m.teamB?.id || m.teamB,
          date: m.date,
          stage: m.stage,
          is_finished: m.isFinished,
          real_score_a: m.realScoreA ?? null,
          real_score_b: m.realScoreB ?? null,
          is_locked: m.isLocked ?? false,
        }, { onConflict: 'id' });

      if (error) throw error;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save matches error:', err);
    res.status(500).json({ error: 'Error al guardar partidos.' });
  }
});

// ─── Delete match (admin) ───
app.delete('/api/matches/:matchId', async (req, res) => {
  const { matchId } = req.params;

  try {
    const { error: delPreds } = await supabase
      .from('prediction_data')
      .delete()
      .eq('match_id', matchId);

    if (delPreds) throw delPreds;

    const { error: delMatch } = await supabase
      .from('match_data')
      .delete()
      .eq('id', matchId);

    if (delMatch) throw delMatch;

    res.json({ success: true });
  } catch (err) {
    console.error('Delete match error:', err);
    res.status(500).json({ error: 'Error al borrar partido.' });
  }
});

// ─── Set official champion (admin) ───
app.post('/api/official-champion', async (req, res) => {
  const { championId } = req.body;

  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'official_champion', value: championId || '' }, { onConflict: 'key' });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Save official champion error:', err);
    res.status(500).json({ error: 'Error al guardar campeón oficial.' });
  }
});

// ─── Save avatar ───
app.post('/api/avatar', async (req, res) => {
  const { userId, avatarUrl } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId requerido.' });
  }

  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: `avatar_${userId}`, value: avatarUrl || '' }, { onConflict: 'key' });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Save avatar error:', err);
    res.status(500).json({ error: 'Error al guardar avatar.' });
  }
});

// ─── Sync Excel → Supabase ───
app.post('/api/sync-participants', async (req, res) => {
  try {
    let wb;
    if (req.body.fileData) {
      const buf = Buffer.from(req.body.fileData, 'base64');
      wb = XLSX.read(buf, { type: 'buffer' });
    } else {
      wb = XLSX.readFile(EXCEL_PATH);
    }

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

app.get('/api/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
