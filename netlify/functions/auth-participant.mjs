import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const excelPath = path.resolve(__dirname, 'BD participantes.xlsx');
    const wb = XLSX.readFile(excelPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let match = null;
    for (let i = 1; i < rows.length; i++) {
      const [id, rowName, rowCode] = rows[i];
      if (
        rowName &&
        rowCode &&
        String(rowName).trim().toLowerCase() === name.trim().toLowerCase() &&
        String(rowCode).trim() === code.trim()
      ) {
        match = { id: Number(id), name: String(rowName).trim() };
        break;
      }
    }

    if (match) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: true, user: { id: `u${match.id}`, name: match.name } }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: false,
        error: 'Nombre o código incorrecto. No estás registrado como participante.',
      }),
    };
  } catch (err) {
    console.error('Error in auth function:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ valid: false, error: 'Error interno del servidor.' }),
    };
  }
};
