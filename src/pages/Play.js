import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Play.css"; // Import the CSS file

const API_KEYS = [
  "55e68a52fbmsh91bd7fe14f7572fp1ea3d3jsn906b3acc22ed",
  "4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
];

const MAX_REQUESTS_PER_DAY = 90;

function Play() {
  const { videoId } = useParams();
  const [lyrics, setLyrics] = useState([]);
  const [currentSubtitles, setCurrentSubtitles] = useState([]);
  const [currentCaption, setCurrentCaption] = useState(""); // State for the current top caption
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null); // State for video source
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0); // Track current API key index
  const [requestCount, setRequestCount] = useState(0); // Track request count
  const timerRef = useRef(null);
  const iframeRef = useRef(null); // Ref for the iframe

  // Fetch captions
  useEffect(() => {
    const fetchCaptions = async () => {
      try {
        const response = await fetch(
          `https://subtitles-for-youtube.p.rapidapi.com/subtitles/${videoId}?type=None&translated=None`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key": API_KEYS[currentKeyIndex],
              "x-rapidapi-host": "subtitles-for-youtube.p.rapidapi.com",
            },
          }
        );

        if (response.status === 429) {
          setCurrentKeyIndex((prevIndex) => (prevIndex + 1) % API_KEYS.length);
          return; // Retry fetching captions with new key
        }

        const data = await response.json();
        console.log(data);

        const parsedLyrics = data.map((item) => ({
          start: item.start,
          end: item.end,
          text: item.text,
        }));

        setLyrics(parsedLyrics);
        setRequestCount((prevCount) => prevCount + 1);

        if (requestCount >= MAX_REQUESTS_PER_DAY) {
          setCurrentKeyIndex((prevIndex) => (prevIndex + 1) % API_KEYS.length);
          setRequestCount(0);
        }
      } catch (error) {
        console.error("Error fetching captions:", error);
      }
    };

    fetchCaptions();
  }, [videoId, currentKeyIndex, requestCount]);

  // Start video and timer
  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentTime(0); // Reset the timer to zero

    setVideoSrc(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
    );

    // Start or reset the timer
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

  // Stop timer and video
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

  // Handle click to play/pause video
  const handleClickVideo = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isPlaying ? "pauseVideo" : "playVideo",
        }),
        "*"
      );
    }
  };

  // Update subtitles and current caption based on current time
  useEffect(() => {
    const updateSubtitles = () => {
      const currentIndex = lyrics.findIndex(
        (line) => currentTime >= line.start && currentTime <= line.end
      );
      const nextIndex = currentIndex + 1;

      const newSubtitles = [];
      if (currentIndex !== -1) {
        newSubtitles.push(lyrics[currentIndex]);
        setCurrentCaption(lyrics[currentIndex].text);
      }
      if (nextIndex < lyrics.length) {
        newSubtitles.push(lyrics[nextIndex]);
      }

      setCurrentSubtitles(newSubtitles);
    };

    updateSubtitles();
  }, [currentTime, lyrics]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
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
            style={{ cursor: "pointer" }}
            onClick={handleClickVideo}
          ></iframe>
          <div className="subtitle-overlay">
            {currentSubtitles.map((line, index) => (
              <p
                key={index}
                className={`subtitle-text ${
                  line.text === currentCaption ? "current-caption" : ""
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
          <div className="time-display">{formatTime(currentTime)}</div>
          <button onClick={handleStop} className="stop-button">
            Stop Timer
          </button>
        </>
      )}
    </div>
  );
}

export default Play;
