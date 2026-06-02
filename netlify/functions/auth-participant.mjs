import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ valid: false, error: 'Método no permitido.' }),
    };
  }

  try {
    const { name, code } = JSON.parse(event.body || '{}');

    if (!name || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ valid: false, error: 'Nombre y código requeridos.' }),
      };
    }

    const { data, error } = await supabase
      .from('participants')
      .select('id, name')
      .eq('code', code.trim())
      .maybeSingle();

    if (error) throw error;

    if (!data || data.name.toLowerCase() !== name.trim().toLowerCase()) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: false,
          error: 'Nombre o código incorrecto. No estás registrado como participante.',
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true, user: { id: `u${data.id}`, name: data.name } }),
    };
  } catch (err) {
    console.error('Auth function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ valid: false, error: 'Error interno del servidor.' }),
    };
  }
};
