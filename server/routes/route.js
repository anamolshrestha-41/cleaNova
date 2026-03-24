const express = require('express');
const { optimizeRoute } = require('../controllers/routeController');
const protect = require('../middlewares/auth');
const router = express.Router();

router.post('/optimize', protect, optimizeRoute);

module.exports = router;
