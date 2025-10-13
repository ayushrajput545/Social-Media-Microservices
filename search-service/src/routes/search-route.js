const express = require('express');
const { searchPost } = require('../controllers/search-controller');
const auth = require('../middlewares/auth')
const router = express.Router();

router.get('/search-post', auth , searchPost)

module.exports =router;