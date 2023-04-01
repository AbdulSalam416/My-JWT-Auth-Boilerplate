const express = require("express");
const createError = require("http-errors");
const router = express.Router();
const User = require("../models/user.model");
const { authSchema } = require("../helpers/validation_schema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");

const redisClient = require("../helpers/init_redis");

//Registering a user

router.post("/register", async (req, res, next) => {
  try {
    // Validating the request body with the authSchema
    const result = await authSchema.validateAsync(req.body);

    //Checking if the user exist in the database

    const userExist = await User.findOne({ email: result.email });
    if (userExist)
      throw createError.Conflict(`${result.email} already registered`);

    //If the user doesn't exist we will create user and sign him/her in with the signAccess Token function

    const user = new User(result);
    const savedUser = await user.save();
    const accessToken = await signAccessToken(savedUser.id);
    const refreshToken = await signRefreshToken(savedUser.id);
    res.send({ accessToken, refreshToken });
  } catch (error) {
    if (error.isJoi === true) error.status = 422;
    next(error);
  }
});

//Logging User In
router.post("/login", async (req, res, next) => {
  try {
    const result = await authSchema.validateAsync(req.body);
    const user = await User.findOne({ email: result.email });
    if (!user) throw createError.NotFound("User not Registered");
    const isMatch = await user.isValidPassword(result.password);
    if (!isMatch) throw createError.Unauthorized("username/password invalid");
    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    res.send({ accessToken, refreshToken });
    console.log("logged In!");
  } catch (error) {
    if (error.isJoi === true)
      return next(createError.BadRequest("Invalid username/Password!"));
    next(error);
  }
});

// Refresh Token Route
router.post("/refresh_token", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);

    const accessToken = await signAccessToken(userId);
    const newRefreshToken = await signRefreshToken(userId);
    res.send({ accessToken, newRefreshToken });
  } catch (error) {
    next(error);
  }
});

/// Logging User Out
router.delete("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    redisClient.then((client) => {
      client.del(userId).then((val) => {
        console.log(val);
        res.status(204);
      });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
