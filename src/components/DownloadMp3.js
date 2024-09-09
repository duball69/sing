import React, { useEffect, useState } from "react";

//https://rapidapi.com/ytjar/api/youtube-mp36/

const API_KEY = "55e68a52fbmsh91bd7fe14f7572fp1ea3d3jsn906b3acc22ed";

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
