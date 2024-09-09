import React, { useEffect, useState } from "react";

const API_KEY = "aabaa1c91dmsheb69eb3a9fe781cp1b617ajsnd1b47220fa98";

function DownloadMp3({ videoId, onAudioLoaded }) {
  const [audioSrc, setAudioSrc] = useState(null);

  useEffect(() => {
    const handleDownload = async () => {
      if (videoId) {
        const url = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
        const options = {
          method: "GET",
          headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
          },
        };

        try {
          const response = await fetch(url, options);
          const result = await response.json();

          if (result.link) {
            setAudioSrc(result.link);
            onAudioLoaded(result.link);
          } else {
            console.error("Error fetching MP3 URL:", result);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    };

    handleDownload();
  }, [videoId, onAudioLoaded]);

  return audioSrc ? (
    <audio src={audioSrc} controls style={{ width: "100%" }} />
  ) : (
    <p>Loading audio...</p>
  );
}

export default DownloadMp3;
