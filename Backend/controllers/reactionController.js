const Reaction = require("../models/reactionSchema");

// React to Post
exports.reactToPost = async (req, res) => {
    try {
        const { type } = req.body;
        const existingReaction = await Reaction.findOne({ user: req.user.userId, post: req.params.postId });

        if (existingReaction) {
            existingReaction.type = type;
            await existingReaction.save();
            return res.json(existingReaction);
        }

        const reaction = new Reaction({ user: req.user.userId, post: req.params.postId, type });
        await reaction.save();
        res.status(201).json(reaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Remove Reaction
exports.removeReaction = async (req, res) => {
    try {
        await Reaction.findOneAndDelete({ user: req.user.userId, post: req.params.postId });
        res.json({ message: "Reaction removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};