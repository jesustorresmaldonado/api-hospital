const { checkIfUserExists, registerUser } = require('../services/registerUser');
const path = require('path');

// Ruta para registrar un usuario
async function register(req, res) {
  const { dni, contraseña } = req.body;
  const filePath = path.join(__dirname, '..', 'uploads', 'Cuentas.csv');  // Ruta al archivo CSV

  // Verificamos si el DNI ya está registrado
  try {
    const userExists = await checkIfUserExists(dni, filePath);

    if (userExists) {
      return res.status(400).json({ error: 'DNI ya registrado. Registro rechazado.' });
    }

    // Si el DNI no está registrado, lo agregamos
    const message = await registerUser(dni, contraseña, filePath);
    res.status(200).json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Hubo un error al procesar la solicitud.' });
  }
}

module.exports = { register };
