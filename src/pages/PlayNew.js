import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./PlayNew.css"; // Import the external CSS file
import DownloadMp3 from "../components/DownloadMp3";

const API_KEYS = [
  //"0687e8e48bmsh519089e70666b40p124f0ajsnfc47fa8df8de",
  //"4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
  //"e0a4a7e079msh2d3bd6eecf1c74fp12ba85jsnaab86c305b67",
  "55e68a52fbmsh91bd7fe14f7572fp1ea3d3jsn906b3acc22ed",
];

const MAX_REQUESTS_PER_MONTH = 35;
const RESET_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function PlayNew() {
  const { videoId } = useParams(); // Use the actual video ID from URL params
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);
  const timerRef = useRef(null);

  const getNextAvailableKey = () => {
    const now = Date.now();
    let keyData = JSON.parse(localStorage.getItem("apiKeyData")) || {};

    for (let key of API_KEYS) {
      if (!keyData[key]) {
        keyData[key] = { count: 0, lastReset: now };
      }

      if (now - keyData[key].lastReset > RESET_INTERVAL) {
        keyData[key] = { count: 0, lastReset: now };
      }

      if (keyData[key].count < MAX_REQUESTS_PER_MONTH) {
        keyData[key].count++;
        localStorage.setItem("apiKeyData", JSON.stringify(keyData));
        return key;
      }
    }

    throw new Error("All API keys have reached their monthly limit");
  };

  useEffect(() => {
    const fetchSubtitles = async () => {
      try {
        const apiKey = getNextAvailableKey();
        const url = `https://youtube-captions.p.rapidapi.com/transcript2?videoId=${videoId}`;
        const options = {
          method: "GET",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "youtube-captions.p.rapidapi.com",
          },
        };

        const response = await fetch(url, options);
        const result = await response.text();

        // Parse the result into an array of subtitle objects
        const parsedSubtitles = JSON.parse(result);
        setSubtitles(parsedSubtitles);
      } catch (error) {
        console.error("Error fetching subtitles:", error);
      }
    };

    if (videoId) {
      fetchSubtitles();
    }
  }, [videoId]);

  useEffect(() => {
    const updateSubtitle = () => {
      const currentTimeMs = currentTime * 1000; // Convert to milliseconds
      const currentSubtitle = subtitles.find(
        (subtitle) =>
          currentTimeMs >= subtitle.offset &&
          currentTimeMs < subtitle.offset + subtitle.duration
      );

      if (currentSubtitle) {
        setCurrentSubtitle(currentSubtitle.text);
      } else {
        setCurrentSubtitle("");
      }
    };

    updateSubtitle();
  }, [currentTime, subtitles]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handlePlayStop = () => {
    setIsPlaying((prev) => {
      const nextState = !prev;

      if (nextState) {
        // Start playback
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "playVideo" }),
            "*"
          );
        }

        // Start or resume the timer for subtitles
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCurrentTime((prevTime) => prevTime + 1);
        }, 1000);
      } else {
        // Stop playback
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo" }),
            "*"
          );
        }

        // Stop the timer for subtitles
        if (timerRef.current) clearInterval(timerRef.current);
      }

      return nextState;
    });
  };

  return (
    <div className="container">
      <div className="video-box">
        {videoId && (
          <iframe
            ref={iframeRef}
            width="1000"
            height="500"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=0&mute=1`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube Video Player"
          ></iframe>
        )}
        <div className="overlay">
          <DownloadMp3 videoId={videoId} />
          <button onClick={handlePlayStop} className="play-stop-button">
            {isPlaying ? "Stop" : "Play"}
          </button>
          <p className="subtitle">{currentSubtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default PlayNew;
