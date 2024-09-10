const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

//https://rapidapi.com/ytjar/api/youtube-mp36

// Replace with your RapidAPI key
const API_KEY = "98062a1219msh782603d97383d24p1803cejsn97d53aec1e62";
//98062a1219msh782603d97383d24p1803cejsn97d53aec1e62
//e0a4a7e079msh2d3bd6eecf1c74fp12ba85jsnaab86c305b67

app.get("/download-mp3", async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  // Construct the URL with the videoId parameter
  const url = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
    },
  };

  try {
    console.log("Sending request to RapidAPI with URL:", url);
    const response = await axios.get(url, options);
    console.log("Received response from RapidAPI:", response.data);
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
