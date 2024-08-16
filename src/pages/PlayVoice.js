import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Play.css";

function Play() {
  const { videoId } = useParams();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
  const [pitch, setPitch] = useState(null); // State to store detected pitch
  const timerRef = useRef(null);
  const iframeRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaElementSourceRef = useRef(null);
  const analyserRef = useRef(null);
  const pitchDetectionRef = useRef(null);

  // Function to detect pitch using auto-correlation
  const autoCorrelate = (buffer, sampleRate) => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    let correlations = new Array(MAX_SAMPLES);

    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) return -1; // Too much noise, no pitch detected.

    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;
      correlations[offset] = correlation;

      if (correlation > 0.9 && correlation > lastCorrelation) {
        foundGoodCorrelation = true;
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      } else if (foundGoodCorrelation) {
        const shift =
          (correlations[bestOffset + 1] - correlations[bestOffset - 1]) /
          correlations[bestOffset];
        return sampleRate / (bestOffset + 8 * shift);
      }
      lastCorrelation = correlation;
    }
    if (bestCorrelation > 0.01) {
      return sampleRate / bestOffset;
    }
    return -1;
  };

  // Function to detect pitch
  const detectPitch = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    const pitchValue = autoCorrelate(
      dataArray,
      audioContextRef.current.sampleRate
    );
    if (pitchValue !== -1) {
      setPitch(pitchValue.toFixed(2)); // Update pitch state
    } else {
      setPitch("No pitch detected");
    }
  };

  // Start video and timer
  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentTime(0);

    setVideoSrc(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
    );

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentTime((prevTime) => prevTime + 1);
    }, 1000);

    if (iframeRef.current) {
      const iframeDoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow.document;
      const videoElement = iframeDoc.querySelector("video");
      if (videoElement) {
        setupAudioContext(videoElement);
      }
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

  // Setup Web Audio API
  const setupAudioContext = (videoElement) => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    mediaElementSourceRef.current =
      audioContextRef.current.createMediaElementSource(videoElement);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    mediaElementSourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    pitchDetectionRef.current = setInterval(detectPitch, 100); // Check pitch every 100ms
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (pitchDetectionRef.current) {
        clearInterval(pitchDetectionRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
          <div className="time-display">{formatTime(currentTime)}</div>
          <div className="pitch-display">
            Pitch: {pitch ? `${pitch} Hz` : "Detecting..."}
          </div>
          <button onClick={handleStop} className="stop-button">
            Stop Timer
          </button>
        </>
      )}
    </div>
  );
}

export default Play;
