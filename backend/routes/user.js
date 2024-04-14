const express = require('express');
const {register, login, followUser, logout, updatePassword, UpdateProfile, deleteUser, myProfile, getUserProfile, forgotPassword, resetPassword} = require("../controllers/user");
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);  
router.route('/follow/:id').get(isAuthenticated, followUser);
router.route('/update/password').put(isAuthenticated, updatePassword);
router.route('/update/profile').put(isAuthenticated, UpdateProfile);
router.route('/delete').delete(isAuthenticated, deleteUser);
router.route('/me').get(isAuthenticated, myProfile);
router.route('/:id').get(isAuthenticated, getUserProfile);
router.route('/password/forgot').post(forgotPassword );
router.route('/password/reset/:token').put(resetPassword);
module.exports = router;