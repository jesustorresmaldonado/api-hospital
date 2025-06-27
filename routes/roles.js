// routes/roles.js
const express = require('express');
const router = express.Router();
const db = require('../db'); 

// CREATE - Crear un nuevo rol
router.post('/', async (req, res) => {
  const { nombre_rol } = req.body;

  if (!nombre_rol) {
    return res.status(400).json({ error: "El nombre del rol es requerido." });
  }

  try {
    await db.sql('BEGIN;');
    const query = `
      INSERT INTO Roles (nombre_rol)
      VALUES ('${nombre_rol}');
    `;
    await db.sql(query);
    await db.sql('COMMIT;');
    res.status(201).json({ message: "Rol creado exitosamente." });
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Error al crear rol:", err);
    if (err.message.includes("UNIQUE constraint failed: Roles.nombre_rol")) {
      return res.status(409).json({ error: "Ya existe un rol con ese nombre." });
    }
    res.status(500).json({ error: err.message });
  }
});

// READ - Obtener todos los roles
router.get('/', async (req, res) => {
  try {
    const rows = await db.sql(`SELECT id_rol, nombre_rol FROM Roles;`);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener roles:', err);
    res.status(500).json({ error: 'No se pudieron obtener roles' });
  }
});

// UPDATE - Actualizar nombre de un rol por ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nuevo_nombre_rol } = req.body;

  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) {
    return res.status(400).json({ error: "ID de rol inválido." });
  }

  if (!nuevo_nombre_rol) {
    return res.status(400).json({ error: "El nuevo nombre del rol es requerido." });
  }

  try {
    await db.sql('BEGIN;');
    const query = `
      UPDATE Roles
      SET nombre_rol = '${nuevo_nombre_rol}'
      WHERE id_rol = ${idInt};
    `;
    await db.sql(query);
    await db.sql('COMMIT;');
    res.json({ message: "Rol actualizado exitosamente." });
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Error al actualizar rol:", err);
    if (err.message.includes("UNIQUE constraint failed: Roles.nombre_rol")) {
        return res.status(409).json({ error: "El nombre de rol proporcionado ya existe." });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar un rol por ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) {
    return res.status(400).json({ error: "ID de rol inválido." });
  }

  try {
    await db.sql('BEGIN;');
    // IMPORTANTE: Si hay personas asociadas a este rol, la eliminación fallará
    // debido a la restricción de clave foránea. Esto es un comportamiento deseable
    // para mantener la integridad de los datos.
    const query = `
      DELETE FROM Roles
      WHERE id_rol = ${idInt};
    `;
    const result = await db.sql(query);
    await db.sql('COMMIT;');

    if (result.rowsAffected && result.rowsAffected > 0) {
        res.json({ message: "Rol eliminado exitosamente." });
    } else {
        res.status(404).json({ message: "Rol no encontrado para eliminar." });
    }
  } catch (err) {
    await db.sql('ROLLBACK;');
    console.error("Error al eliminar rol:", err);
    if (err.message.includes("FOREIGN KEY constraint failed")) {
        return res.status(409).json({ error: "No se puede eliminar el rol porque hay personas asociadas a él. Elimine las personas primero." });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // Exporta el router para que index.js pueda usarlo