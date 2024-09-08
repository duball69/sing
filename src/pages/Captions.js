import React, { useEffect, useState } from "react";

function Captions({ videoId = "2u6uXuT9pm4&ab" }) {
  // Set default videoId
  const [subtitles, setSubtitles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCaptions = async (videoId) => {
    try {
      const response = await fetch("/get-captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch captions");
      }

      const blob = await response.blob();
      const text = await blob.text();

      // Parse SRT format
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      const parsedSubtitles = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\d+$/)) {
          i++; // Skip index line
          const subtitleText = lines[++i];
          parsedSubtitles.push({ text: subtitleText });
        }
      }

      setSubtitles(parsedSubtitles);
    } catch (error) {
      console.error("Error fetching captions:", error);
      setError("Failed to load subtitles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchCaptions(videoId);
    }
  }, [videoId]);

  return (
    <div className="captions-container">
      {loading && <p className="captions-text">Loading subtitles...</p>}
      {error && <p className="captions-error">{error}</p>}
      {subtitles.length > 0 && !loading
        ? subtitles.map((line, index) => (
            <p key={index} className="captions-text">
              {line.text}
            </p>
          ))
        : null}
    </div>
  );
}

export default Captions;
