const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 8000;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);

const FILE = path.join(__dirname, "data", "tracks.json");
let tracks = JSON.parse(fs.readFileSync(FILE, "utf-8"));

// Display all
app.get("/tracks", (req, res) => {
  return res.json(tracks);
});

// Delete
app.delete("/tracks/:id", (req, res) => {
  const id = Number(req.params.id);
  tracks = tracks.filter((t) => t.id !== id);

  fs.writeFile(FILE, JSON.stringify(tracks), (err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to delete the data" });
    }
    return res.json(tracks);
  });
});

// Add
app.post("/tracks", (req, res) => {
  const { date, description, amount, type, remarks } = req.body;

  if (!date || !description || !amount || !type || !remarks) {
    return res.status(400).json({ message: "All fields required" });
  }

  const id = Date.now();
  tracks.push({ id, date, description, amount, type, remarks });

  fs.writeFile(FILE, JSON.stringify(tracks), (err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to save the data" });
    }
    return res.json({ message: "Data Added successfully" });
  });
});

// Edit
app.patch("/tracks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { date, description, amount, type, remarks } = req.body;

  if (!date || !description || !amount || !type || !remarks) {
    return res.status(400).json({ message: "All fields required" });
  }

  const index = tracks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Data not found" });
  }

  tracks[index] = { id, date, description, amount, type, remarks };

  fs.writeFile(FILE, JSON.stringify(tracks), (err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to update the data" });
    }
    return res.json({ message: "Data updated successfully" });
  });
});

app.listen(port, () => {
  console.log(`App is running in port ${port}`);
});