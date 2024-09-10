import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Choose.css";

function Choose() {
  const { videoId } = useParams(); // Get videoId from URL
  const [artist, setArtist] = useState("");
  const [music, setMusic] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch video details using the videoId
    const fetchVideoDetails = async () => {
      try {
        const response = await fetch(
          `https://youtube-v31.p.rapidapi.com/videos?id=${videoId}&part=snippet`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key":
                "4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
              "x-rapidapi-host": "youtube-v31.p.rapidapi.com",
            },
          }
        );

        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const videoDetails = data.items[0].snippet;
          setArtist(videoDetails.channelTitle); // Set artist to channel title
          setMusic(videoDetails.title); // Set music to video title
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

  const handlePlayNewClick = () => {
    navigate("/playmode");
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Construct the query using artist and music title
    const query = `${artist} - ${music}`;

    // Make the API request to YouTube
    try {
      const response = await fetch(
        `https://youtube-v31.p.rapidapi.com/search?q=${encodeURIComponent(
          query
        )}&part=snippet,id&regionCode=US&maxResults=50&order=relevance`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key":
              "4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
            "x-rapidapi-host": "youtube-v31.p.rapidapi.com",
          },
        }
      );

      const data = await response.json();
      console.log(data);

      if (data.items && data.items.length > 0) {
        // Navigate to the Play page with the first video ID
        const videoId = data.items[0].id.videoId;
        navigate(`/play/${videoId}`);
      } else {
        alert("No videos found!");
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      alert("Error fetching videos");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Choose a Song</h1>
      <h3>Pick the song you want to sing</h3>
      <form onSubmit={handleSearch}>
        <div>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist"
            required
          />
        </div>
        <div>
          <input
            type="text"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            placeholder="Music Title"
            required
          />
        </div>
        <button type="submit">Search</button>
        <button onClick={handlePlayNewClick}>Play</button>
      </form>
    </div>
  );
}

export default Choose;
