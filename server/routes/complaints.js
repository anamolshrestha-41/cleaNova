const express = require('express');
const { createComplaint, getComplaints, updateStatus, upvoteComplaint, moderateComplaint, getFlagged } = require('../controllers/complaintController');
const protect = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const rateLimiter = require('../middlewares/rateLimiter');
const router = express.Router();

router.post('/',              rateLimiter, upload.single('image'), createComplaint);
router.get('/',               getComplaints);
router.get('/flagged',        protect, getFlagged);
router.patch('/:id',          protect, updateStatus);
router.post('/:id/upvote',    (req, res, next) => req.app.get('upvoteLimiter')(req, res, next), upvoteComplaint);
router.patch('/:id/moderate', protect, moderateComplaint);

module.exports = router;
