const express = require("express");
const { createPost, likedislikepost, deletePost, getPostOfFollowing, updateCaption, doCommentonPost, deleteComment } = require('../controllers/post');
const { isAuthenticated } = require("../middlewares/auth");
const { route } = require("./user");
const router = express.Router();


router.route('/post/upload').post(isAuthenticated, createPost);
router.route('/post/all').get(isAuthenticated, getPostOfFollowing);
router
    .route('/post/:id')
    .get(isAuthenticated, likedislikepost)
    .delete(isAuthenticated, deletePost)

router.route('/caption/:id').put(isAuthenticated, updateCaption);
router.route('/comment/:id').put(isAuthenticated, doCommentonPost).delete(isAuthenticated, deleteComment);

module.exports = router;