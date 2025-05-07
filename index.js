// index.js
const express = require('express');
const app = express();

// Importar rutas
const uploadRoutes = require('./routes/uploadRoutes');
const registerRoutes = require('./routes/registerRoutes'); // <--- NUEVA LÍNEA

// Middlewares globales para parsear JSON y datos de formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Montamos las rutas bajo el prefijo /api
app.use('/api', uploadRoutes);
app.use('/api', registerRoutes); // <--- NUEVA LÍNEA

// Endpoint GET en la ruta raíz para confirmar que el servidor está activo
app.get('/', (req, res) => {
  res.send('Servidor activo y corriendo');
});

app.listen(7050, () => {
  console.log('Servidor corriendo en http://localhost:7050');
});
