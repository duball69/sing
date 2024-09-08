const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

async function fetchSubtitles(videoUrl) {
  try {
    // Step 1: Submit the video URL to DownSub
    const response = await axios.post(
      "https://downsub.com/",
      new URLSearchParams({
        url: videoUrl,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Step 2: Parse the response to find the download link
    const $ = cheerio.load(response.data);
    const downloadLink = $(".download-btn").attr("href");

    if (!downloadLink) {
      throw new Error("Download link not found");
    }

    // Step 3: Download the subtitle file
    const subtitleResponse = await axios.get(downloadLink);
    return subtitleResponse.data;
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    throw error;
  }
}

app.post("/api/subtitles", async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL is required" });
    }
    const subtitles = await fetchSubtitles(videoUrl);
    res.json({ subtitles });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch subtitles", message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
