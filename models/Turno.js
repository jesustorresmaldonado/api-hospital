const mongoose = requiere('mongoose');
 const turnoSchema = new mongoose.schema({
    usuarioId: {type: mongoose.schema.types.objectId, ref: 'Usuario', requiered: true },
    especialidad: { type: String, required: true },
  fecha: { type: Date, required: true },
  horario: { type: String, required: true }
 });

 module.exports = mongoose.model('Turno', turnoSchema);