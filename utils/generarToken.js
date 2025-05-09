const jwt = require('jsonwebtoken');

// Leer la clave secreta desde una variable de entorno
const generarToken = (id) => {
  // Asegurarse de que la clave secreta esté configurada
  const secretKey = process.env.JWT_SECRET || 'secreto_hospital';

  return jwt.sign({ id }, secretKey, { expiresIn: '7d' });
};

module.exports = generarToken;
