const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Ruta para obtener usuarios (protegida por autenticación)
router.get('/', authMiddleware, userController.obtenerUsuarios);

// Ruta para crear un nuevo usuario (protegida por autenticación)
router.post('/', authMiddleware, userController.crearUsuario);



module.exports = router;
