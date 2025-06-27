// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { loadInitialCsvData } = require('./utils/csvLoader'); // Importa la función de carga inicial

const app = express();
const PORT = process.env.PORT || 7050;
const db = require('./db'); // Cliente SQLite Cloud

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

//  **Verificación de conexión a la base de datos y carga inicial de CSV**
(async () => {
  try {
    const [row] = await db.sql('SELECT 1 AS ok;');
    if (row && row.ok === 1) {
      console.log('Conexión a SQLite Cloud verificada correctamente.');
    } else {
      console.warn(' Conexión establecida, pero la consulta de prueba devolvió:', row);
    }

    // ⭐ Carga inicial de datos CSV aquí, después de verificar la DB
    await loadInitialCsvData();

  } catch (err) {
    console.error(' No se pudo verificar la conexión a SQLite Cloud o cargar datos iniciales:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
})();


//           RUTAS MODULARIZADAS (SOLO Personas y Roles)


const personasRoutes = require('./routes/personas');
const rolesRoutes = require('./routes/roles');
// Se eliminan explícitamente las rutas para médicos y turnos
// const medicosRoutes = require('./routes/medicos');
// const turnosRoutes = require('./routes/turnos');

app.use('/api/personas', personasRoutes);
app.use('/api/roles', rolesRoutes);
// Se eliminan los app.use para médicos y turnos
// app.use('/api/medicos', medicosRoutes);
// app.use('/api/turnos', turnosRoutes);


//           FIN DE RUTAS MODULARIZADAS


app.get('/', (req, res) => {
  res.send('¡API del Hospital funcionando! Accede a /api/personas para gestión de personas o /api/roles para gestión de tipos.');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal en el servidor', error: err.message });
});