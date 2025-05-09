// middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Con __dirname, construimos la ruta absoluta hacia la carpeta "uploads"
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Guarda con el nombre original, como 'Cuentas.csv'
  }
});

// Filtro para aceptar solo archivos con extensión .csv
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos .csv'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite: 5 MB
  fileFilter
});

module.exports = upload;