import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const API_KEYS = [
  "4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
  "e0a4a7e079msh2d3bd6eecf1c74fp12ba85jsnaab86c305b67",
  "55e68a52fbmsh91bd7fe14f7572fp1ea3d3jsn906b3acc22ed",
];

const MAX_REQUESTS_PER_MONTH = 35;
const RESET_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const PlayVoice = () => {
  const { videoId } = useParams();
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
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

  const handlePlay = () => {
    setIsPlaying(true);
    setVideoSrc(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&mute=1`
    );

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentTime((prevTime) => prevTime + 1);
    }, 1000);

    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "playVideo" }),
        "*"
      );
    }
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);

    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo" }),
        "*"
      );
    }
  };

  return (
    <div className="video-container">
      {!isPlaying && (
        <button onClick={handlePlay} className="play-button">
          Play Video
        </button>
      )}
      {isPlaying && videoSrc && (
        <>
          <iframe
            id="youtube-iframe"
            ref={iframeRef}
            width="100%"
            height="500"
            src={videoSrc}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube Video Player"
          ></iframe>
          <div className="subtitle-overlay">
            <p className="subtitle-text">{currentSubtitle}</p>
          </div>
          <div className="time-display">
            {new Date(currentTime * 1000).toISOString().substr(14, 5)}
          </div>
          <button onClick={handleStop} className="stop-button">
            Stop Video
          </button>
        </>
      )}
    </div>
  );
};

export default PlayVoice;
