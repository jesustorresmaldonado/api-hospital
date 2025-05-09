const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const generarToken = require('../utils/generarToken');

// Registro
const registrarUsuario = async (req, res) => {
    try {
        const { email, contraseña, nombre, dni } = req.body;

        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'Ya existe un usuario con ese correo. Inicia sesión o contacta al hospital.' });
        }

        const contraseñaHash = await bcrypt.hash(contraseña, 10);
        const nuevoUsuario = new Usuario({ email, contraseña: contraseñaHash, nombre, dni });

        await nuevoUsuario.save();

        const token = generarToken(nuevoUsuario._id);
        res.status(201).json({ mensaje: 'Usuario registrado con éxito', token });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el registro', error: error.message });
    }
};

// Iniciar sesión
const loginUsuario = async (req, res) => {
    try {
        const { email, contraseña } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Correo no encontrado' });
        }

        const match = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!match) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        const token = generarToken(usuario._id);
        res.status(200).json({ mensaje: 'Inicio de sesión exitoso', token });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el inicio de sesión', error: error.message });
    }
};

module.exports = { registrarUsuario, loginUsuario };
