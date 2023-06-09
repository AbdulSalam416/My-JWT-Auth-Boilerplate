const redis = require("redis");

async function createRedisClient() {
  const client = redis.createClient();

  client.on("connect", () => console.log("Connected to REDIS!"));
  client.on("error", (err) => console.log("Error connecting to REDIS: ", err));
  client.on("ready", () => console.log("client is ready use"));
  client.on("end", () => console.log("client disconnected from redis"));
  process.on("SIGINT", () => client.quit());
  await client.connect();
  return client;
}

module.exports = createRedisClient();
