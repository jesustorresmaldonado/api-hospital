require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7050;
const db = require('./db'); 

app.use(express.json());
app.use(cors()); 
app.use(express.static(path.join(__dirname, 'public')));


(async () => {
  try {
    const [row] = await db.sql('SELECT 1 AS ok;');
    if (row.ok === 1) {
      console.log('✅ Conexión a SQLite Cloud verificada correctamente.');
    } else {
      console.warn('⚠️ Conexión establecida, pero la consulta de prueba devolvió:', row);
    }
  } catch (err) {
    console.error('❌ No se pudo verificar la conexión a SQLite Cloud:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
})();


app.get('/api/users', async (req, res) => {
  try {
    const rows = await db.sql(`SELECT dni, nombre, email FROM Personas;`);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'No se pudieron obtener usuarios' });
  }
});


app.get('/api/patients', async (req, res) => {
  try {
    const rows = await db.sql(`SELECT c.id_cuenta,  p.nombre, p.email FROM
Personas p JOIN Cuentas c ON c.dni=p.dni;`);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener pacientes:', err);
    res.status(500).json({ error: 'No se pudieron obtener pacientes' });
  }
});


app.get('/api/doctors', async (req, res) => {
  try {
    const rows = await db.sql(`SELECT 
    m.legajo, 
    p.nombre,
    p.apellido,
    e.nombre_especialidad, 
    p.telefono
FROM 
    Medicos m
JOIN Personas p ON p.dni = m.dni
JOIN Especialidades e ON e.id_especialidad = m.id_especialidad;`);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener médicos:', err);
    res.status(500).json({ error: 'No se pudieron obtener médicos' });
  }
});



app.put('/api/doctors/update', async (req, res) => {
  const { legajo, nuevoTel } = req.body;
  if (!legajo || !nuevoTel) {
    return res.status(400).json({ error: "Faltan datos requeridos (legajo o nuevoTel)." });
  }

  const legajoInt = parseInt(legajo, 10);
  if (isNaN(legajoInt)) {
    return res.status(400).json({ error: "Legajo inválido." });
  }

  try {
    await db.sql('BEGIN;');

    const result = await db.sql(`
      UPDATE Personas
      SET telefono = '${nuevoTel}'
      WHERE dni = (SELECT dni FROM Medicos WHERE legajo = ${legajoInt});
    `);

    await db.sql('COMMIT;');
    res.json({ message: "Médico actualizado exitosamente." });
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Error al actualizar médico:", err);
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/doctors/:legajo', async (req, res) => {
  const { legajo } = req.params;
  const legajoInt = parseInt(legajo, 10);

  
  if (isNaN(legajoInt)) {
    return res.status(400).json({ error: 'Legajo inválido.' });
  }

  try {
    
    await db.sql('BEGIN;');

    
    const result = await db.sql(`
      DELETE FROM Medicos
      WHERE legajo = ${legajoInt};
    `);

    await db.sql('COMMIT;');
    res.json({ message: 'Médico eliminado exitosamente.' });
  } catch (err) {
    
    await db.sql('ROLLBACK;');
    console.error('Error al eliminar médico:', err);
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/patient-credentials', async (req, res) => {
  const { dni, password } = req.body;

  if (!dni || !password) {
    return res.status(400).json({ error: "Faltan datos (dni y/o password)" });
  }

  try {
    const dniInt = parseInt(dni, 10);
    
    const query = `INSERT INTO Cuentas (contrasenia, dni) VALUES ('${password}', ${dniInt});`;
  await db.sql(query);
    res.json({ message: "Credenciales guardadas exitosamente en la tabla Cuentas." });
  } catch (err) {
    console.error("Error al insertar las credenciales:", err);
    
    res.status(500).json({ error: err.message });
    
  }
});


app.post('/api/medicos', async (req, res) => {
  const {
    dni,
    id_especialidad,
    dias_atencion,
    estado,
    matricula,
    hora_inicio,
    hora_fin
  } = req.body;

 
  if (
    !dni ||
    !id_especialidad ||
    !dias_atencion ||
    !estado ||
    !matricula ||
    !hora_inicio ||
    !hora_fin
  ) {
    return res.status(400).json({ error: "Faltan datos requeridos." });
  }

  try {
    
    const dniInt = parseInt(dni, 10);
    const idEspecialidadInt = parseInt(id_especialidad, 10);
    const matriculaInt = parseInt(matricula, 10);

   
    const query = `INSERT INTO Medicos (dni, id_especialidad, dias_atencion, estado, matricula, hora_inicio, hora_fin)
VALUES (${dniInt}, ${idEspecialidadInt}, '${dias_atencion}', '${estado}', ${matriculaInt}, '${hora_inicio}', '${hora_fin}');`;
    
    await db.sql(query);
    res.json({ message: "Médico dado de alta exitosamente." });
  } catch (err) {
    console.error("Error al insertar médico:", err);
    res.status(500).json({ error: err.message });
  }
});


app.put('/api/patients/update', async (req, res) => {
  const { id, nuevoNombre, nuevoEmail } = req.body;

  if (!id || !nuevoNombre || !nuevoEmail) {
    return res.status(400).json({ error: "Faltan datos requeridos para la actualización." });
  }

  const idInt = parseInt(id, 10); 

  try {
    await db.sql('BEGIN;');

    
    const updateEmailQuery = `
      UPDATE Personas
      SET email = '${nuevoEmail}'
      WHERE dni = (SELECT dni FROM Cuentas WHERE id_cuenta = ${idInt});
    `;
    await db.sql(updateEmailQuery);

    
    const updateNombreQuery = `
      UPDATE Personas
      SET nombre = '${nuevoNombre}'
      WHERE dni = (SELECT dni FROM Cuentas WHERE id_cuenta = ${idInt});
    `;
    await db.sql(updateNombreQuery);

    await db.sql('COMMIT;');

    res.json({ message: "Paciente actualizado exitosamente." });
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Error al actualizar paciente:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  const { id } = req.params;
  
  
  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) {
    return res.status(400).json({ error: "ID inválido." });
  }
  
  try {
    await db.sql('BEGIN;');
    
    
    const deleteQuery = `
      DELETE FROM Cuentas
      WHERE id_cuenta = ${idInt};
    `;
    await db.sql(deleteQuery);
    
    await db.sql('COMMIT;');
    
    res.json({ message: "Paciente eliminado exitosamente." });
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Error al eliminar paciente:", err);
    res.status(500).json({ error: err.message });
  }
});