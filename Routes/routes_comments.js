// require the express framework and other dependencies
const express = require("express");
const createError = require("http-errors");
const router = express.Router();

// require user model, validation schema, and JWT helper functions
const User = require("../models/user.model");
const { authSchema } = require("../helpers/validation_schema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");

// require Redis client
const redisClient = require("../helpers/init_redis");

// register a new user
router.post("/register", async (req, res, next) => {
  try {
    // validate the request body with the authSchema
    const result = await authSchema.validateAsync(req.body);

    // check if the user exists in the database
    const userExist = await User.findOne({ email: result.email });
    if (userExist)
      throw createError.Conflict(`${result.email} already registered`);

    // if the user doesn't exist, create a new user and sign in with access and refresh tokens
    const user = new User(result);
    const savedUser = await user.save();
    const accessToken = await signAccessToken(savedUser.id);
    const refreshToken = await signRefreshToken(savedUser.id);
    res.send({ accessToken, refreshToken });
  } catch (error) {
    // handle Joi validation errors
    if (error.isJoi === true) error.status = 422;
    next(error);
  }
});

// log a user in
router.post("/login", async (req, res, next) => {
  try {
    // validate the request body with the authSchema
    const result = await authSchema.validateAsync(req.body);

    // check if the user exists in the database
    const user = await User.findOne({ email: result.email });
    if (!user) throw createError.NotFound("User not Registered");

    // check if the password matches
    const isMatch = await user.isValidPassword(result.password);
    if (!isMatch) throw createError.Unauthorized("username/password invalid");

    // sign in with access and refresh tokens
    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    res.send({ accessToken, refreshToken });
    console.log("logged In!");
  } catch (error) {
    // handle Joi validation errors
    if (error.isJoi === true)
      return next(createError.BadRequest("Invalid username/Password!"));
    next(error);
  }
});

// refresh access token
router.post("/refresh_token", async (req, res, next) => {
  try {
    // retrieve the refresh token from the request body
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();

    // verify the refresh token and generate a new access token and refresh token
    const userId = await verifyRefreshToken(refreshToken);
    const accessToken = await signAccessToken(userId);
    const newRefreshToken = await signRefreshToken(userId);
    res.send({ accessToken, newRefreshToken });
  } catch (error) {
    next(error);
  }
});

// log a user out
router.delete("/logout", async (req, res, next) => {
  try {
    // retrieve the refresh token from the request body
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();

    // verify the refresh token and delete it from Redis
    const userId = await verifyRefreshToken(refreshToken);
    redisClient.then((client) => {
      client.del(userId).
  console.log(val);
        res.status(204);
      });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

