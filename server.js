import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "tracks.json");

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Helper functions for reading and writing data safely
async function readTracks() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      // If file doesn't exist, create it with empty array
      await writeTracks([]);
      return [];
    }
    console.error("Error reading tracks file:", err);
    return [];
  }
}

async function writeTracks(tracks) {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(tracks, null, 2), "utf-8");
}

// Routes

// 1. Health check & API Overview
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "HexTorq Revenue & Cost Tracker API is running",
    endpoints: {
      "GET /tracks": "Get all track records",
      "GET /tracks/:id": "Get a specific track by ID",
      "POST /tracks": "Create a new track record",
      "PUT /tracks/:id": "Update an existing track record",
      "DELETE /tracks/:id": "Delete a track record and return updated list",
      "GET /summary": "Get aggregate credit, debit, and net balance summary",
    },
  });
});

// 2. GET all tracks
app.get("/tracks", async (req, res) => {
  try {
    const tracks = await readTracks();
    const { search, type } = req.query;

    let filtered = [...tracks];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.remarks && t.remarks.toLowerCase().includes(q)) ||
          (t.type && t.type.toLowerCase().includes(q)),
      );
    }

    if (type) {
      filtered = filtered.filter(
        (t) => t.type && t.type.toLowerCase() === type.toLowerCase(),
      );
    }

    res.status(200).json(filtered);
  } catch (error) {
    console.error("Failed to fetch tracks:", error);
    res.status(500).json({ error: "Failed to retrieve tracks." });
  }
});

// 3. GET financial summary (totals)
app.get("/summary", async (req, res) => {
  try {
    const tracks = await readTracks();
    const creditTotal = tracks
      .filter((t) => t.type && t.type.toLowerCase() === "credit")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const debitTotal = tracks
      .filter((t) => t.type && t.type.toLowerCase() === "debit")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netAmount = creditTotal - debitTotal;

    res.status(200).json({
      creditTotal,
      debitTotal,
      netAmount,
      totalCount: tracks.length,
    });
  } catch (error) {
    console.error("Failed to calculate summary:", error);
    res.status(500).json({ error: "Failed to calculate summary." });
  }
});

// 4. GET a single track by ID
app.get("/tracks/:id", async (req, res) => {
  try {
    const tracks = await readTracks();
    const track = tracks.find((t) => String(t.id) === String(req.params.id));

    if (!track) {
      return res.status(404).json({ error: "Track record not found." });
    }

    res.status(200).json(track);
  } catch (error) {
    console.error("Failed to fetch track:", error);
    res.status(500).json({ error: "Failed to retrieve track." });
  }
});

// 5. POST a new track
app.post("/tracks", async (req, res) => {
  try {
    const { date, description, amount, type, remarks } = req.body;

    if (!date || !description || amount === undefined || !type) {
      return res.status(400).json({
        error: "date, description, amount, and type are required fields.",
      });
    }

    const tracks = await readTracks();
    const newId =
      tracks.length > 0 ? Math.max(...tracks.map((t) => Number(t.id) || 0)) + 1 : 1;

    const newTrack = {
      id: newId,
      date: String(date).trim(),
      description: String(description).trim(),
      amount: Number(amount) || 0,
      type: String(type).trim(),
      remarks: remarks ? String(remarks).trim() : "",
    };

    tracks.push(newTrack);
    await writeTracks(tracks);

    res.status(201).json(newTrack);
  } catch (error) {
    console.error("Failed to create track:", error);
    res.status(500).json({ error: "Failed to create track." });
  }
});

// 6. PUT update an existing track
app.put("/tracks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, type, remarks } = req.body;

    const tracks = await readTracks();
    const index = tracks.findIndex((t) => String(t.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ error: "Track record not found." });
    }

    const existing = tracks[index];
    const updatedTrack = {
      ...existing,
      date: date !== undefined ? String(date).trim() : existing.date,
      description:
        description !== undefined
          ? String(description).trim()
          : existing.description,
      amount: amount !== undefined ? Number(amount) : existing.amount,
      type: type !== undefined ? String(type).trim() : existing.type,
      remarks:
        remarks !== undefined ? String(remarks).trim() : existing.remarks,
    };

    tracks[index] = updatedTrack;
    await writeTracks(tracks);

    res.status(200).json(updatedTrack);
  } catch (error) {
    console.error("Failed to update track:", error);
    res.status(500).json({ error: "Failed to update track." });
  }
});

// 7. DELETE a track
// Note: Frontend App.jsx calls setadata(res.data) & setfilterdata(res.data)
// expecting the updated array of tracks back!
app.delete("/tracks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tracks = await readTracks();
    const initialLength = tracks.length;

    const updatedTracks = tracks.filter((t) => String(t.id) !== String(id));

    if (updatedTracks.length === initialLength) {
      return res.status(404).json({ error: "Track record not found." });
    }

    await writeTracks(updatedTracks);

    // Returning the updated list of tracks directly for frontend compatibility
    res.status(200).json(updatedTracks);
  } catch (error) {
    console.error("Failed to delete track:", error);
    res.status(500).json({ error: "Failed to delete track." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/tracks`);
});
