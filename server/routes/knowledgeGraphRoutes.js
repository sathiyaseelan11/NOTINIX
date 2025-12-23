const express = require('express');
const router = express.Router();
const {
    getKnowledgeGraph,
    getNodeConnections,
    generateSemanticLinks,
    getTopicClusters,
} = require('../controllers/knowledgeGraphController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getKnowledgeGraph);
router.get('/node/:noteId', protect, getNodeConnections);
router.post('/semantic-links', protect, generateSemanticLinks);
router.get('/clusters', protect, getTopicClusters);

module.exports = router;
