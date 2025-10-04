const express = require('express');
const { createPost } = require('../controllers/post-controller');
const auth = require('../middleware/auth');
const router = express.Router();


router.use(auth) // or write auth with post route too
router.post('/create-post' , createPost);


module.exports = router