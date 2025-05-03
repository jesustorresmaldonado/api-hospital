const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const generarToken = require('../utils/generarToken');

exports.crearUsuario = async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El usuario ya existe. Iniciá sesión o contactá al hospital.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password: hashedPassword,
    });

    await nuevoUsuario.save();

    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({ mensaje: 'Usuario registrado con éxito', token });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};
