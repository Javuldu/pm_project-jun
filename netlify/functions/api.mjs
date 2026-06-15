import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAllRows(table, select = '*', opts = {}) {
  const pageSize = 1000;
  let all = [];
  let from = 0;
  let to = pageSize - 1;
  try {
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(select, opts)
        .range(from, to);
      if (error) return { data: null, error };
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
      to += pageSize;
    }
    return { data: all, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

function getId(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export const handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/api/', '').replace('/api/', '');
  const method = event.httpMethod;

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // GET /api/data/:userId
    if (path.startsWith('data/') && method === 'GET') {
      const userId = getId(path);

      const [matchesRes, predictionsRes, championRes, configRes] = await Promise.all([
        supabase.from('match_data').select('*').order('date', { ascending: false }),
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
        realPenaltiesWinner: m.real_penalties_winner,
        isLocked: m.is_locked,
      }));

      const userPredictions = predictionsRes.data.map(p => ({
        matchId: p.match_id,
        scoreA: p.score_a,
        scoreB: p.score_b,
        penaltiesWinner: p.penalties_winner,
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

      return { statusCode: 200, body: JSON.stringify({ matches, userPredictions, championPredictions, officialChampion, avatarUrls }) };
    }

    // GET /api/all-data
    if (path === 'all-data' && method === 'GET') {
      const [matchesRes, participantsRes, predictionsRes, championRes, configRes] = await Promise.all([
        supabase.from('match_data').select('*').order('date', { ascending: false }),
        supabase.from('participants').select('id, name').order('id'),
        getAllRows('prediction_data'),
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
        realPenaltiesWinner: m.real_penalties_winner,
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
          penaltiesWinner: p.penalties_winner,
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

      return { statusCode: 200, body: JSON.stringify({ matches, participants, allPredictions, championPredictions, officialChampion, avatarUrls }) };
    }

    // POST /api/predictions
    if (path === 'predictions' && method === 'POST') {
      const { userId, predictions } = body;
      if (!userId || !predictions) {
        return { statusCode: 400, body: JSON.stringify({ error: 'userId y predictions requeridos.' }) };
      }

      const rows = predictions
        .filter(p => p.matchId && p.scoreA !== undefined && p.scoreA !== '' && p.scoreB !== undefined && p.scoreB !== '')
        .map(p => ({
          user_id: userId,
          match_id: p.matchId,
          score_a: p.scoreA ?? null,
          score_b: p.scoreB ?? null,
          penalties_winner: p.penaltiesWinner || null,
        }));

      const { data, error } = await supabase
        .from('prediction_data')
        .upsert(rows, { onConflict: 'user_id,match_id', ignoreDuplicates: true })
        .select('match_id');

      if (error) throw error;

      const savedIds = (data || []).map(d => d.match_id);
      const attemptedIds = rows.map(r => r.match_id);
      const lockedIds = attemptedIds.filter(id => !savedIds.includes(id));

      return { statusCode: 200, body: JSON.stringify({ success: true, saved: savedIds, locked: lockedIds }) };
    }

    // POST /api/admin/predictions (overwrite any user's predictions)
    if (path === 'admin/predictions' && method === 'POST') {
      const { userId, predictions } = body;
      if (!userId || !predictions) {
        return { statusCode: 400, body: JSON.stringify({ error: 'userId y predictions requeridos.' }) };
      }

      const rows = predictions
        .filter(p => p.matchId && p.scoreA !== undefined && p.scoreA !== '' && p.scoreB !== undefined && p.scoreB !== '')
        .map(p => ({
          user_id: userId,
          match_id: p.matchId,
          score_a: p.scoreA ?? null,
          score_b: p.scoreB ?? null,
          penalties_winner: p.penaltiesWinner || null,
        }));

      for (const row of rows) {
        await supabase
          .from('prediction_data')
          .delete()
          .eq('user_id', row.user_id)
          .eq('match_id', row.match_id);
      }

      if (rows.length > 0) {
        const { error } = await supabase.from('prediction_data').insert(rows);
        if (error) throw error;
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, saved: rows.map(r => r.match_id) }) };
    }

    // POST /api/champion (first save locks it)
    if (path === 'champion' && method === 'POST') {
      const { userId, championTeamId } = body;
      if (!userId || !championTeamId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'userId y championTeamId requeridos.' }) };
      }

      const { data: existing } = await supabase
        .from('champion_data')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return { statusCode: 200, body: JSON.stringify({ success: true, locked: true }) };
      }

      const { error } = await supabase
        .from('champion_data')
        .insert({ user_id: userId, champion_team_id: championTeamId });

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true, locked: false }) };
    }

    // POST /api/admin/champion (overwrite any user's champion)
    if (path === 'admin/champion' && method === 'POST') {
      const { userId, championTeamId } = body;
      if (!userId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'userId requerido.' }) };
      }

      await supabase.from('champion_data').delete().eq('user_id', userId);

      if (championTeamId) {
        const { error } = await supabase.from('champion_data').insert({
          user_id: userId,
          champion_team_id: championTeamId,
        });
        if (error) throw error;
      }

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // POST /api/matches
    if (path === 'matches' && method === 'POST') {
      const { matches } = body;
      if (!matches) {
        return { statusCode: 400, body: JSON.stringify({ error: 'matches requerido.' }) };
      }

      for (const m of matches) {
        const { error } = await supabase.from('match_data').upsert({
          id: m.id,
          team_a_id: m.teamA?.id || m.teamA,
          team_b_id: m.teamB?.id || m.teamB,
          date: m.date,
          stage: m.stage,
          is_finished: m.isFinished,
          real_score_a: m.realScoreA ?? null,
          real_score_b: m.realScoreB ?? null,
          real_penalties_winner: m.realPenaltiesWinner || null,
          is_locked: m.isLocked ?? false,
        }, { onConflict: 'id' });
        if (error) throw error;
      }

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // DELETE /api/matches/:matchId
    if (path.startsWith('matches/') && method === 'DELETE') {
      const matchId = getId(path);

      const { error: delPreds } = await supabase.from('prediction_data').delete().eq('match_id', matchId);
      if (delPreds) throw delPreds;

      const { error: delMatch } = await supabase.from('match_data').delete().eq('id', matchId);
      if (delMatch) throw delMatch;

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // POST /api/official-champion
    if (path === 'official-champion' && method === 'POST') {
      const { championId } = body;
      const { error } = await supabase.from('app_config').upsert(
        { key: 'official_champion', value: championId || '' },
        { onConflict: 'key' }
      );
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // POST /api/avatar
    if (path === 'avatar' && method === 'POST') {
      const { userId, avatarUrl } = body;
      if (!userId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'userId requerido.' }) };
      }

      const { error } = await supabase.from('app_config').upsert(
        { key: `avatar_${userId}`, value: avatarUrl || '' },
        { onConflict: 'key' }
      );
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // POST /api/reset
    if (path === 'reset' && method === 'POST') {
      await Promise.all([
        supabase.from('prediction_data').delete().neq('match_id', '_'),
        supabase.from('champion_data').delete().neq('user_id', '_'),
        supabase.from('match_data').update({
          is_finished: false,
          real_score_a: null,
          real_score_b: null,
          is_locked: false,
        }).neq('id', '_'),
      ]);

      await supabase.from('app_config').delete().eq('key', 'official_champion');

      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Datos reiniciados correctamente.' }) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Ruta no encontrada.' }) };
  } catch (err) {
    console.error('API function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno.' }) };
  }
};
