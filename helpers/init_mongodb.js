const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME })
  .then(() => console.log("Mongoose Connected"))
  .catch((err) => console.log(err.message));

mongoose.connection.on("connected", () =>
  console.log("Mongoose conneccted to the DB")
);

mongoose.connection.on("error", () => console.log(err.message));

mongoose.connection.on("disconnected", () =>
  console.log("Monogoose connection Disconnected")
);

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});
