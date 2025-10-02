const express = require('express')
const { registerUser, login, refreshTokenUser, logOut  } = require('../controller/identity-controller')
const router = express.Router()

router.post('/register' , registerUser)
router.post('/login' , login)
router.post('/refresh-token', refreshTokenUser)
router.post('/logout', logOut)

module.exports = router