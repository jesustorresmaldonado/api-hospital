const Turno = require('../models/Turno');

// Crear un nuevo turno
const crearTurno = async (req, res) => {
  try {
    const { usuarioId, especialidad, fecha, horario } = req.body;

    // Validar campos
    if (!usuarioId || !especialidad || !fecha || !horario) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    // Verificar si el usuario tiene 4 turnos en el mismo día
    const turnosUsuario = await Turno.find({ usuarioId, fecha });

    if (turnosUsuario.length >= 4) {
      return res.status(400).json({ mensaje: 'Ya tienes 4 turnos registrados para este día' });
    }

    // Verificar si ya hay un turno con el mismo horario para el mismo usuario
    const conflicto = await Turno.findOne({ usuarioId, fecha, horario });
    if (conflicto) {
      return res.status(400).json({ mensaje: 'Ya tienes un turno para ese horario en este día' });
    }

    // Crear el nuevo turno
    const nuevoTurno = new Turno({ usuarioId, especialidad, fecha, horario });
    await nuevoTurno.save();

    res.status(201).json({ mensaje: 'Turno creado con éxito', turno: nuevoTurno });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear turno', error: error.message });
  }
};

module.exports = {
  crearTurno,
};
