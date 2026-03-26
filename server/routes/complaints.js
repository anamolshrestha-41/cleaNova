const express = require('express');
const { createComplaint, getComplaints, updateStatus, getWardComplaints, upvoteComplaint, moderateComplaint, getFlagged } = require('../controllers/complaintController');
const { protect, adminOnly, wardProtect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const rateLimiter = require('../middlewares/rateLimiter');
const router = express.Router();

router.post('/',              rateLimiter, upload.single('image'), createComplaint);
router.get('/',               getComplaints);
router.get('/flagged',        adminOnly, getFlagged);
router.get('/ward',           wardProtect, getWardComplaints);
router.patch('/:id',          wardProtect, updateStatus);
router.post('/:id/upvote',    (req, res, next) => req.app.get('upvoteLimiter')(req, res, next), upvoteComplaint);
router.patch('/:id/moderate', adminOnly, moderateComplaint);

module.exports = router;
