const jwt = require("jsonwebtoken");
const creatError = require("http-errors");
const { options } = require("joi");
const redisClient = require("./init_redis");

module.exports = {
  //Signing Access Token
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};

      const secret = process.env.ACCESS_TOKEN_SECRET;

      const options = {
        expiresIn: "1h",
        issuer: "myweb.com",
        audience: userId,
      };
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) reject(err);

        resolve(token);
      });
    });
  },

  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) return next(creatError.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ")[1];
    jwt.sign(bearerToken, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      return err.name === "JsonWebTokenError"
        ? next(creatError.Unauthorized())
        : next(creatError.Unauthorized(err.message));
      req.payload = payload;
      next();
    });
  },

  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};

      const secret = process.env.REFRESH_TOKEN_SECRET;

      const options = {
        expiresIn: "1y",
        issuer: "myweb.com",
        audience: userId,
      };
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) reject(err);

        redisClient.then((client) => {
          // this also works, if we don't want to use await
          client.set(userId, token).then(() => {
            resolve(token);
            console.log("resolved token");
            // can do something here
          });
          client.EXPIRE(userId, 365 * 24 * 60 * 60);
        });
      });
    });
  },

  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(creatError.Unauthorized());
          const userId = payload.aud;
          redisClient.then(async (client) => {
            await client.GET(userId).then((result) => {
              console.log(result);
              if (refreshToken == result) {
                resolve(userId);
                console.log("Verified user");
              }
              reject(creatError.Unauthorized());
            });
          });
        }
      );
    });
  },
};
