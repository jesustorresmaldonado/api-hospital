const express = require('express');
const router = express.Router();
const { register } = require('../controllers/registerUserController');

// Ruta PUT para registrar un usuario
router.put('/register', register);

module.exports = router;
