// src/controllers/comment.controller.js
const { supabase } = require('../config/supabase');

// Get all comments for a task
exports.getTaskComments = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        const { data: comments, error } = await supabase
            .from('task_comments')
            .select(`
                comment_id,
                task_id,
                comment_text,
                created_at,
                updated_at,
                user:profiles(user_id, username, email, role)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({ comments: comments || [] });
    } catch (error) {
        next(error);
    }
};

// Create a comment
exports.createComment = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { comment_text } = req.body;
        const userId = req.user.user_id;

        if (!comment_text || comment_text.trim() === '') {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const { data: comment, error } = await supabase
            .from('task_comments')
            .insert({
                task_id: taskId,
                user_id: userId,
                comment_text: comment_text.trim()
            })
            .select(`
                comment_id,
                task_id,
                comment_text,
                created_at,
                updated_at,
                user:profiles(user_id, username, email, role)
            `)
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Comment created successfully',
            comment
        });
    } catch (error) {
        next(error);
    }
};

// Update a comment
exports.updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { comment_text } = req.body;
        const userId = req.user.user_id;

        if (!comment_text || comment_text.trim() === '') {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        // Check if comment exists and user owns it
        const { data: existingComment, error: fetchError } = await supabase
            .from('task_comments')
            .select('user_id')
            .eq('comment_id', commentId)
            .single();

        if (fetchError || !existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (existingComment.user_id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'You can only edit your own comments' });
        }

        const { data: comment, error } = await supabase
            .from('task_comments')
            .update({
                comment_text: comment_text.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('comment_id', commentId)
            .select(`
                comment_id,
                task_id,
                comment_text,
                created_at,
                updated_at,
                user:profiles(user_id, username, email, role)
            `)
            .single();

        if (error) throw error;

        res.json({
            message: 'Comment updated successfully',
            comment
        });
    } catch (error) {
        next(error);
    }
};

// Delete a comment
exports.deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.user_id;

        // Check if comment exists and user owns it
        const { data: existingComment, error: fetchError } = await supabase
            .from('task_comments')
            .select('user_id')
            .eq('comment_id', commentId)
            .single();

        if (fetchError || !existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (existingComment.user_id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        const { error } = await supabase
            .from('task_comments')
            .delete()
            .eq('comment_id', commentId);

        if (error) throw error;

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        next(error);
    }
};
