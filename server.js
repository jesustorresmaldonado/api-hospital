const express = require('express');
const authRoutes = require('./routes/authRoutes');
const turnoRoutes = require('./routes/turnoRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = 3000;

// Middleware para manejar CORS (si es necesario)
const cors = require('cors');
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡API del Hospital funcionando!');
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/usuarios', userRoutes);

// Middleware para manejar errores globalmente
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: 'Algo salió mal', error: err.message });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
