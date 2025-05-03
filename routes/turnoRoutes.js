const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turnoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Proteger rutas con authMiddleware si hace falta
router.get('/', authMiddleware, turnoController.obtenerTurnos);
router.post('/', authMiddleware, turnoController.crearTurno);

module.exports = router;