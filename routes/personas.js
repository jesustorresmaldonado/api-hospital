// routes/personas.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Mapeo de nombres de rol a IDs de rol para facilitar la lógica
const roleNameToId = {
  'Paciente': 1,
  'Medico': 2,
  'Administrador': 3
};

// Mapeo de IDs de rol a nombres de rol para las respuestas
const roleIdToName = {
  1: 'Paciente',
  2: 'Medico',
  3: 'Administrador'
};


// CREATE - Crear una nueva persona (general)
router.post('/', async (req, res) => {
  const { dni, nombre, apellido, email, telefono, id_rol } = req.body;

  if (!dni || !nombre || !apellido || id_rol === undefined || id_rol === null) {
    return res.status(400).json({ error: "Faltan datos requeridos (dni, nombre, apellido, id_rol)." });
  }

  const dniInt = parseInt(dni, 10);
  const idRolInt = parseInt(id_rol, 10);

  // Validación explícita del id_rol
  if (![1, 2, 3].includes(idRolInt)) {
    return res.status(400).json({ error: "ID de rol inválido. Debe ser 1 (Paciente), 2 (Medico) o 3 (Administrador)." });
  }

  try {
    await db.sql('BEGIN;');
    const query = `
      INSERT INTO Personas (dni, nombre, apellido, email, telefono, id_rol)
      VALUES (${dniInt}, '${nombre}', '${apellido}', '${email || ''}', '${telefono || ''}', ${idRolInt});
    `;
    console.log(`Backend: POST - Ejecutando consulta SQL: ${query}`); // Log de depuración
    await db.sql(query);
    await db.sql('COMMIT;');
    res.status(201).json({ message: "Persona creada exitosamente." });
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Backend ERROR al crear persona (POST):", err);
    if (err.message.includes("UNIQUE constraint failed: Personas.dni")) {
      return res.status(409).json({ error: "Ya existe una persona con ese DNI." });
    }
    if (err.message.includes("UNIQUE constraint failed: Personas.email")) {
        return res.status(409).json({ error: "Ya existe una persona con ese email." });
    }
    res.status(500).json({ error: err.message });
  }
});

// READ - Obtener todas las personas o filtrar por DNI o por nombre_rol
router.get('/', async (req, res) => {
  const { dni, rol } = req.query; // Permite buscar por DNI o filtrar por nombre de rol
  let query = `SELECT P.dni, P.nombre, P.apellido, P.email, P.telefono, P.id_rol FROM Personas P`; // No necesitamos JOIN con Roles aquí para el filtro
  let whereClauses = [];
  let rows;

  console.log(`Backend: Recibida solicitud GET /personas con dni=${dni || 'N/A'}, rol=${rol || 'N/A'}`); // Log de depuración

  try {
    if (dni) {
      const dniInt = parseInt(dni, 10);
      if (isNaN(dniInt)) {
        return res.status(400).json({ error: "DNI inválido." });
      }
      whereClauses.push(`P.dni = ${dniInt}`);
      console.log(`Backend: Añadiendo filtro por DNI: P.dni = ${dniInt}`); // Log de depuración
    }

    //  Ahora filtramos por id_rol usando el mapeo
    if (rol) {
      const idToFilter = roleNameToId[rol]; // Obtener el ID de rol a partir del nombre
      if (idToFilter === undefined) { // Si el nombre de rol no es válido en nuestro mapeo
        console.log(`Backend: Nombre de rol inválido recibido para filtro: ${rol}`); // Log de depuración
        return res.status(400).json({ error: "Nombre de rol inválido para filtro. Use 'Paciente', 'Medico' o 'Administrador'." });
      }
      whereClauses.push(`P.id_rol = ${idToFilter}`);
      console.log(`Backend: Añadiendo filtro por Rol (ID): P.id_rol = ${idToFilter} (nombre: ${rol})`); // Log de depuración
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(' AND ');
    }

    // Ordenar para una visualización consistente
    query += ` ORDER BY P.nombre ASC;`; 
    console.log(`Backend: Consulta SQL final para GET: ${query}`); // Log de depuración

    rows = await db.sql(query);
    console.log(`Backend: Consulta SQL ejecutada. Filas encontradas: ${rows.length}`); // Log de depuración

    // Mapear los resultados para incluir el nombre del rol en la respuesta
    const personasConNombresDeRol = rows.map(persona => ({
      ...persona,
      nombre_rol: roleIdToName[persona.id_rol] || 'Desconocido' // Añadir el nombre del rol
    }));
    console.log('Backend: Datos a enviar al frontend (ejemplo de las primeras 3):', personasConNombresDeRol.slice(0, 3)); // Log de depuración (ejemplo)


    // Si se buscó por DNI, se espera un solo resultado o ninguno
    if (dni) {
      if (personasConNombresDeRol.length === 0) {
        console.log('Backend: Persona no encontrada por DNI.'); // Log de depuración
        return res.status(404).json({ message: "Persona no encontrada." });
      }
      res.json(personasConNombresDeRol[0]); // Devuelve el primer (y único) resultado con nombre_rol
    } else {
      res.json(personasConNombresDeRol); // Devuelve un array de resultados con nombre_rol
    }

  } catch (err) {
    console.error('Backend ERROR al obtener personas:', err); // Log de depuración
    res.status(500).json({ error: 'No se pudieron obtener personas' });
  }
});

// UPDATE/CREATE (UPSERT) - Actualizar o "dar de alta la primera vez" una persona por DNI
router.put('/:dni', async (req, res) => {
  const { dni } = req.params;
  const { nombre, apellido, email, telefono, id_rol } = req.body;

  const dniInt = parseInt(dni, 10);
  if (isNaN(dniInt)) {
    return res.status(400).json({ error: "DNI inválido." });
  }

  // Se necesitan todos los campos para crear/reemplazar una entidad
  if (!nombre || !apellido || id_rol === undefined || id_rol === null) {
      return res.status(400).json({ error: "Faltan datos requeridos (nombre, apellido, id_rol) para el PUT (alta o actualización)." });
  }
  const idRolInt = parseInt(id_rol, 10);
  // Validación explícita del id_rol
  if (![1, 2, 3].includes(idRolInt)) {
    return res.status(400).json({ error: "ID de rol inválido. Debe ser 1 (Paciente), 2 (Medico) o 3 (Administrador)." });
  }

  try {
    await db.sql('BEGIN;');
    const query = `
      INSERT OR REPLACE INTO Personas (dni, nombre, apellido, email, telefono, id_rol)
      VALUES (${dniInt}, '${nombre}', '${apellido}', '${email || ''}', '${telefono || ''}', ${idRolInt});
    `;
    console.log(`Backend: PUT - Ejecutando consulta SQL: ${query}`); // Log de depuración
    await db.sql(query);
    await db.sql('COMMIT;');
    res.json({ message: "Persona dada de alta/actualizada exitosamente." });
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Backend ERROR al dar de alta/actualizar persona (PUT):", err); // Log de depuración
    if (err.message.includes("UNIQUE constraint failed: Personas.email")) {
        return res.status(409).json({ error: "El email proporcionado ya está en uso." });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar una persona por DNI
router.delete('/:dni', async (req, res) => {
  const { dni } = req.params;
  const dniInt = parseInt(dni, 10);

  if (isNaN(dniInt)) {
    return res.status(400).json({ error: "DNI inválido." });
  }

  try {
    await db.sql('BEGIN;');
    
    // Primero, verifica si la persona existe
    const checkQuery = `SELECT dni FROM Personas WHERE dni = ${dniInt};`;
    console.log(`Backend: DELETE - Verificando existencia de DNI: ${checkQuery}`); // Log de depuración
    const existingPerson = await db.sql(checkQuery);

    if (existingPerson.length === 0) {
      console.log(`Backend: DELETE - Persona con DNI ${dniInt} no encontrada para eliminar.`); // Log de depuración
      await db.sql('ROLLBACK;'); // Asegurar que no quede transacción abierta
      return res.status(404).json({ message: "Persona no encontrada para eliminar." });
    }

    // Si la persona existe, procede a eliminar
    const deleteQuery = `
      DELETE FROM Personas
      WHERE dni = ${dniInt};
    `;
    console.log(`Backend: DELETE - Ejecutando consulta SQL: ${deleteQuery}`); // Log de depuración
    await db.sql(deleteQuery); // No necesitamos el resultado directo aquí

    await db.sql('COMMIT;'); // Confirma la eliminación
    console.log(`Backend: DELETE - Persona con DNI ${dniInt} eliminada exitosamente.`); // Log de depuración

    // Si llegamos hasta aquí y no hubo errores, la eliminación fue exitosa
    res.json({ message: "Persona eliminada exitosamente." });

  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Backend ERROR al eliminar persona:", err); // Log de depuración
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;