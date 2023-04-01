require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
require("./helpers/init_mongodb");

const app = express();
const { verifyAccessToken } = require("./helpers/jwt_helper");
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoute = require("./Routes/auth.route");
const redisClient = require("./helpers/init_redis");

app.get("/", verifyAccessToken, async (req, res, next) => {
  console.log(req.payload);
  res.send("Working!");
});

app.use("/auth", authRoute);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log("listening to port 3001!"));
