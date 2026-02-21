import express from "express";
import { MongoClient } from "mongodb";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT || 3001);
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "askew";

const client = new MongoClient(mongoUri);
let usersCollection;

function normalizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function initMongo() {
  await client.connect();
  const db = client.db(dbName);
  usersCollection = db.collection("users");
  await usersCollection.createIndex({ email: 1 }, { unique: true });
}

app.get("/health", (_req, res) => {
  res.json({
    service: "users-service",
    status: usersCollection ? "ok" : "starting",
  });
});

app.get("/users", async (_req, res) => {
  const users = await usersCollection.find().sort({ _id: -1 }).limit(100).toArray();
  res.json(users.map(normalizeUser));
});

app.post("/users", async (req, res) => {
  const { name, email } = req.body ?? {};

  if (!name || !email) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }

  const now = new Date();

  try {
    const result = await usersCollection.insertOne({
      name,
      email,
      createdAt: now,
      updatedAt: now,
    });

    const user = await usersCollection.findOne({ _id: result.insertedId });
    res.status(201).json(normalizeUser(user));
  } catch (error) {
    if (error && error.code === 11000) {
      res.status(409).json({ error: "email already exists" });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "failed to create user" });
  }
});

async function start() {
  try {
    await initMongo();
    app.listen(port, () => {
      console.log(`users-service listening on port ${port}`);
    });
  } catch (error) {
    console.error("users-service startup failure", error);
    process.exit(1);
  }
}

start();
