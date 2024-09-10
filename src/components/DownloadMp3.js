import React, { useEffect, useState, useRef } from "react";
import "./DownloadMp3.css";

//const API_KEY = "55e68a52fbmsh91bd7fe14f7572fp1ea3d3jsn906b3acc22ed";
const API_KEY = "98062a1219msh782603d97383d24p1803cejsn97d53aec1e62";

function DownloadMp3({ videoId, isPlaying, togglePlay, onMp3Ready }) {
  const [audioSrc, setAudioSrc] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleDownload = async () => {
      if (videoId) {
        // Update the URL to point to your local server
        const url = `http://localhost:5000/download-mp3?videoId=${videoId}`; // Adjust the URL if deployed
        const options = {
          method: "GET",
        };

        try {
          const response = await fetch(url, options);
          const result = await response.json();

          if (result.link) {
            setAudioSrc(result.link);
            if (onMp3Ready) onMp3Ready(result.link); // Notify parent with MP3 URL
          } else {
            console.error("Error fetching MP3 URL:", result);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    };

    handleDownload();
  }, [videoId]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return audioSrc ? (
    <div className="audio-player">
      <button className="play-button" onClick={togglePlay}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <audio ref={audioRef} src={audioSrc} onEnded={() => togglePlay(false)} />
    </div>
  ) : (
    <p>Loading audio...</p>
  );
}

export default DownloadMp3;
