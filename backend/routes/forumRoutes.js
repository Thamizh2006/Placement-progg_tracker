import express from 'express';
import { createForumPost, getForumPosts } from '../controllers/forumController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getForumPosts);
router.post('/', createForumPost);

export default router;
