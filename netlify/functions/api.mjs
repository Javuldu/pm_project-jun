import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

      return { statusCode: 200, body: JSON.stringify({ matches, userPredictions, championPredictions, officialChampion }) };
    }

    // POST /api/predictions
    if (path === 'predictions' && method === 'POST') {
      const { userId, predictions } = body;
      if (!userId || !predictions) {
        return { statusCode: 400, body: JSON.stringify({ error: 'userId y predictions requeridos.' }) };
      }

      const { error: delError } = await supabase.from('prediction_data').delete().eq('user_id', userId);
      if (delError) throw delError;

      if (predictions.length > 0) {
        const rows = predictions.map(p => ({
          user_id: userId,
          match_id: p.matchId,
          score_a: p.scoreA ?? null,
          score_b: p.scoreB ?? null,
        }));
        const { error: insError } = await supabase.from('prediction_data').insert(rows);
        if (insError) throw insError;
      }

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // POST /api/champion
    if (path === 'champion' && method === 'POST') {
      const { userId, championTeamId } = body;
      if (!userId || !championTeamId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'userId y championTeamId requeridos.' }) };
      }

      const { error } = await supabase.from('champion_data').upsert(
        { user_id: userId, champion_team_id: championTeamId },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
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
          is_locked: m.isLocked ?? false,
        }, { onConflict: 'id' });
        if (error) throw error;
      }

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

    return { statusCode: 404, body: JSON.stringify({ error: 'Ruta no encontrada.' }) };
  } catch (err) {
    console.error('API function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno.' }) };
  }
};
