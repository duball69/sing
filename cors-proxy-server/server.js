const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const port = 5000;

app.use(cors());

app.get("/fetch-mp3", async (req, res) => {
  try {
    const { url } = req.query;
    const response = await axios.get(
      `https://youtube-mp3-downloader2.p.rapidapi.com/ytmp3/ytmp3/custom/`,
      {
        params: {
          url: url,
          quality: "320",
        },
        headers: {
          "x-rapidapi-key":
            "e0a4a7e079msh2d3bd6eecf1c74fp12ba85jsnaab86c305b67",
          "x-rapidapi-host": "youtube-mp3-downloader2.p.rapidapi.com",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching MP3:", error);
    res.status(500).send("Error fetching MP3");
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
