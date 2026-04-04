import ForumPost from '../models/forumPostModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const ALLOWED_CREATOR_ROLES = ['faculty', 'hod', 'placement', 'superadmin'];

export const getForumPosts = async (_req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate('createdBy', 'email department role')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createForumPost = async (req, res) => {
  try {
    if (!ALLOWED_CREATOR_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Students cannot post in the placement forum',
      });
    }

    const { title, message, category, company, eventDate, venue } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const post = await ForumPost.create({
      title,
      message,
      category: category || 'announcement',
      company: company || null,
      eventDate: eventDate || null,
      venue: venue || null,
      createdBy: req.user._id,
      creatorRole: req.user.role,
    });

    const populatedPost = await ForumPost.findById(post._id).populate(
      'createdBy',
      'email department role'
    );

    res.status(201).json({
      message: 'Forum post created successfully',
      post: populatedPost,
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'create-forum-post',
      entityType: 'forum-post',
      entityId: post._id.toString(),
      description: `${req.user.email} posted a ${post.category} update`,
      metadata: { title: post.title, company: post.company },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
