const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadDocument, importNotionNote } = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.post('/file', protect, upload.single('file'), uploadDocument);
router.post('/notion', protect, importNotionNote);

module.exports = router;
