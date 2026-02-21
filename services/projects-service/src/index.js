import express from "express";
import { MongoClient } from "mongodb";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT || 3002);
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "askew";

const client = new MongoClient(mongoUri);
let projectsCollection;

function normalizeProject(project) {
  return {
    id: project._id.toString(),
    name: project.name,
    ownerEmail: project.ownerEmail ?? null,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

async function initMongo() {
  await client.connect();
  const db = client.db(dbName);
  projectsCollection = db.collection("projects");
}

app.get("/health", (_req, res) => {
  res.json({
    service: "projects-service",
    status: projectsCollection ? "ok" : "starting",
  });
});

app.get("/projects", async (_req, res) => {
  const projects = await projectsCollection.find().sort({ _id: -1 }).limit(100).toArray();
  res.json(projects.map(normalizeProject));
});

app.post("/projects", async (req, res) => {
  const { name, ownerEmail } = req.body ?? {};

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const now = new Date();

  try {
    const result = await projectsCollection.insertOne({
      name,
      ownerEmail: ownerEmail ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const project = await projectsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(normalizeProject(project));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create project" });
  }
});

async function start() {
  try {
    await initMongo();
    app.listen(port, () => {
      console.log(`projects-service listening on port ${port}`);
    });
  } catch (error) {
    console.error("projects-service startup failure", error);
    process.exit(1);
  }
}

start();
