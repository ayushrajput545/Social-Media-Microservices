const express = require('express');
const { createPost, getAllPosts, getPost, deletePost } = require('../controllers/post-controller');
const auth = require('../middleware/auth');
const router = express.Router();


router.use(auth) // or write auth with post route too
router.post('/create-post' , createPost);
router.get('/getall-posts' , getAllPosts);
router.get('/:id' , getPost);
router.delete('/:id', deletePost)


module.exports = router