const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

const API_KEY = "0687e8e48bmsh519089e70666b40p124f0ajsnfc47fa8df8de";
// const API_KEY = "aabaa1c91dmsheb69eb3a9fe781cp1b617ajsnd1b47220fa98";

app.get("/download-mp3", async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  const options = {
    method: "GET",
    url: "https://youtube-mp3-downloader2.p.rapidapi.com/ytmp3/ytmp3/custom/",
    params: {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      quality: "320",
    },
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "youtube-mp3-downloader2.p.rapidapi.com",
      useQueryString: true, // Add this header if required by the API
    },
  };

  try {
    console.log(
      "Sending request to RapidAPI with options:",
      JSON.stringify(options)
    );
    const response = await axios.request(options);
    console.log(
      "Received response from RapidAPI:",
      JSON.stringify(response.data)
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error details:", error);
    if (error.response) {
      console.error("Error response from RapidAPI:", error.response.data);
      res
        .status(error.response.status)
        .json({ error: "Error from RapidAPI", details: error.response.data });
    } else if (error.request) {
      console.error("No response received from RapidAPI:", error.request);
      res.status(500).json({ error: "No response from RapidAPI" });
    } else {
      console.error("Error message:", error.message);
      res
        .status(500)
        .json({ error: "Internal server error", message: error.message });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
