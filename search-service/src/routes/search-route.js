const express = require('express');
const { searchPost } = require('../controllers/search-controller');
const auth = require('../middlewares/auth')
const router = express.Router();

router.post('/search-post', auth , searchPost)

module.exports =router;