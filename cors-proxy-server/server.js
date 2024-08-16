const express = require("express");
const axios = require("axios");
const cors = require("cors"); // Import the cors package

const app = express();
const port = 5000;

// Use CORS middleware
app.use(cors());

app.get("/fetch-mp3", async (req, res) => {
  try {
    const videoId = req.query.id;
    const response = await axios.get(
      `https://youtube-mp3-download1.p.rapidapi.com/dl?id=${videoId}`,
      {
        headers: {
          "x-rapidapi-key":
            "e0a4a7e079msh2d3bd6eecf1c74fp12ba85jsnaab86c305b67",
          "x-rapidapi-host": "youtube-mp3-download1.p.rapidapi.com",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching MP3" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
