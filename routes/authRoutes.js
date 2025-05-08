const express = require('express');
const Routes = express.Router();
const { registrarUsuario, loginUsuario } = require('../controllers/authController');

// Registro de usuario
Routes.put('/registro', registrarUsuario);

// Login
Routes.post('/login', loginUsuario);

module.exports = Routes;
