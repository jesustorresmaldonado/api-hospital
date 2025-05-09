// controllers/uploadController.js
const parseCsv = require('../services/parseCSV');

async function uploadCsv(req, res) {
  // Verificamos que se haya subido un archivo en el campo "file"
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
  }

  try {
    // Procesa el archivo CSV ubicado en req.file.path
    const csvData = await parseCsv(req.file.path);
    res.status(200).json({
      message: 'Archivo CSV subido y procesado con éxito',
      data: csvData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el archivo CSV.' });
  }
}

module.exports = { uploadCsv };