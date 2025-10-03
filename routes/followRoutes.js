import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { followUser, unfollowUser,unfolloFollower } from '../controllers/followController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

/**
 * @route   POST /api/users/:userId/follow
 * @desc    Follow or unfollow a user
 * @access  Private
 */
router.post('/:userId/follow', followUser);

/**
 * @route   GET /api/users/:userId/is-following
 * @desc    Check if current user is following another user
 * @access  Private
 */
router.post('/:userId/unfollow', unfolloFollower);
router.post('/:userId/unfollow', unfollowUser);

export default router;
