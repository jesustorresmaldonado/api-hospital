// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { uploadCsv } = require('../controllers/uploadController');

// Se espera un único archivo en el campo "file"
router.post('/upload-csv', upload.single('file'), uploadCsv);

module.exports = router;