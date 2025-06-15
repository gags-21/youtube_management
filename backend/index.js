// server.js
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
require("dotenv").config();
const dbLogger = require("./utils/db_logger");

const app = express();
app.use(cors());
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Step 1: Redirect user to Google login
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "consent", // force refresh_token
  });
  res.redirect(url);
});

// Step 2: Google redirects back here
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n✅ ACCESS TOKEN:", tokens.access_token);
    console.log("🔁 REFRESH TOKEN:", tokens.refresh_token);
    dbLogger.info("Tokens received", { tokens });
    res.send("✅ Tokens received — check your terminal and save them to .env.");
  } catch (error) {
    console.error("❌ Error getting tokens:", error);
    dbLogger.error("Error getting tokens", { error });
    res.status(500).send("Error retrieving access token.");
  }
});

// API to fetch video details
app.get("/api/youtube/video/:id", async (req, res) => {
  const videoId = req.params.id;

  try {
    oauth2Client.setCredentials({
      access_token: process.env.ACCESS_TOKEN,
      refresh_token: process.env.REFRESH_TOKEN,
    });
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await youtube.videos.list({
      part: "snippet,statistics,contentDetails,status",
      id: videoId,
    });

    if (response.data.items.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    dbLogger.info("Video details fetched", { videoId });
    res.json(response.data.items[0]);
  } catch (err) {
    console.error("YouTube API error:", err.message);
    dbLogger.error("YouTube API error", { error: err.message });
    res.status(500).json({ error: "Failed to fetch video details" });
  }
});

// PUT /api/youtube/video/:id
app.put("/api/youtube/video/:id", async (req, res) => {
  const videoId = req.params.id;
  const { title, description } = req.body;

  try {
    oauth2Client.setCredentials({
      access_token: process.env.ACCESS_TOKEN,
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Fetch current video snippet first (required)
    const current = await youtube.videos.list({
      part: "snippet",
      id: videoId,
    });

    const snippet = current.data.items[0].snippet;

    // Update snippet with new data
    const updatedSnippet = {
      ...snippet,
      title: title || snippet.title,
      description: description || snippet.description,
    };

    const response = await youtube.videos.update({
      part: "snippet",
      requestBody: {
        id: videoId,
        snippet: updatedSnippet,
      },
    });

    dbLogger.info("Video updated successfully", { videoId });
    res.json({ message: "Video updated successfully", data: response.data });
  } catch (err) {
    console.error("Error updating video:", err.message);
    dbLogger.error("Error updating video", { error: err.message });
    res.status(500).json({ error: "Failed to update video" });
  }
});

// get comments
app.get("/api/youtube/comments/:videoId", async (req, res) => {
  const videoId = req.params.videoId;

  try {
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await youtube.commentThreads.list({
      part: "snippet",
      videoId: videoId,
      maxResults: 20,
      order: "relevance",
    });

    dbLogger.info("Comments fetched successfully", { videoId });
    res.json(response.data.items);
  } catch (err) {
    console.error("Failed to fetch comments:", err.message);
    dbLogger.error("Failed to fetch comments", { error: err.message });
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/youtube/video/:id/comment
app.post("/api/youtube/video/:id/comment", async (req, res) => {
  const videoId = req.params.id;
  const { text } = req.body;

  try {
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const response = await youtube.commentThreads.insert({
      part: "snippet",
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      },
    });

    dbLogger.info("Comment added successfully", { videoId });
    res.json({ message: "Comment added", comment: response.data });
  } catch (err) {
    console.error("Error adding comment:", err.message);
    dbLogger.error("Error adding comment", { error: err.message });
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// POST /api/youtube/comment/:id/reply
app.post("/api/youtube/comment/:id/reply", async (req, res) => {
  const commentId = req.params.id;
  const { text } = req.body;

  try {
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const response = await youtube.comments.insert({
      part: "snippet",
      requestBody: {
        snippet: {
          parentId: commentId,
          textOriginal: text,
        },
      },
    });

    dbLogger.info("Reply posted successfully", { commentId });
    res.json({ message: "Reply posted", reply: response.data });
  } catch (err) {
    console.error("Error replying to comment:", err.message);
    dbLogger.error("Error replying to comment", { error: err.message });
    res.status(500).json({ error: "Failed to reply" });
  }
});

// DELETE /api/youtube/comment/:id
app.delete("/api/youtube/comment/:id", async (req, res) => {
  const commentId = req.params.id;

  try {
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    await youtube.comments.delete({ id: commentId });

    dbLogger.info("Comment deleted successfully", { commentId });
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err.message);
    dbLogger.error("Error deleting comment", { error: err.message });
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🌐 Visit http://localhost:${PORT}/auth/google to log in`);
});
