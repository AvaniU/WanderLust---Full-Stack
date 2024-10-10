const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../util/wrapAsync");
const passport = require("passport");
const {saveRedirectUrl} = require("../middlewares.js");
const userController = require("../controllers/users.js");
const user = require("../models/user.js");

router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

router.route("/signin")
.get(userController.renderSigninForm)
.post( saveRedirectUrl, passport.authenticate('local', { failureRedirect: '/signin', failureFlash : true }), userController.signin);
 
router.get("/logout" , userController.logout);

module.exports = router;
