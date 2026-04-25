const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { registerRules, loginRules, validate } = require('../middleware/validation.middleware');

// Public
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);

// Protected
router.get('/me',              protect, getMe);
router.put('/profile',         protect, updateProfile);
router.put('/password',        protect, changePassword);

module.exports = router;
