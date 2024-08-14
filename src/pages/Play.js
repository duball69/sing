import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Play.css"; // Import the CSS file

function Play() {
  const { videoId } = useParams();
  const [lyrics, setLyrics] = useState([]);
  const [currentSubtitles, setCurrentSubtitles] = useState([]);
  const [currentCaption, setCurrentCaption] = useState(""); // State for the current top caption
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null); // State for video source
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Fetch captions
  useEffect(() => {
    const fetchCaptions = async () => {
      try {
        const response = await fetch(
          `https://subtitles-for-youtube.p.rapidapi.com/subtitles/${videoId}?type=None&translated=None`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key":
                "4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
              "x-rapidapi-host": "subtitles-for-youtube.p.rapidapi.com",
            },
          }
        );

        const data = await response.json();
        console.log(data);

        const parsedLyrics = data.map((item) => ({
          start: item.start,
          end: item.end,
          text: item.text,
        }));

        setLyrics(parsedLyrics);
      } catch (error) {
        console.error("Error fetching captions:", error);
      }
    };

    fetchCaptions();
  }, [videoId]);

  // Start video and timer with a delay
  const handlePlay = () => {
    setIsPlaying(true);
    setVideoSrc(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
    );

    // Start timer after 1.5 seconds
    timeoutRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        setCurrentTime((prevTime) => prevTime + 1);
      }, 1000);
    }, 1500);
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
        setCurrentCaption(lyrics[currentIndex].text); // Update the current caption
      }
      if (nextIndex < lyrics.length) {
        newSubtitles.push(lyrics[nextIndex]);
      }

      setCurrentSubtitles(newSubtitles);
    };

    updateSubtitles();
  }, [currentTime, lyrics]);

  // Cleanup interval and timeout on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
        <iframe
          width="100%"
          height="500"
          src={videoSrc}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="YouTube Video Player"
          style={{ opacity: 0.3, backgroundColor: "black" }}
        ></iframe>
      )}
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
    </div>
  );
}

export default Play;
