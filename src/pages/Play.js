import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Play.css";
import PitchVisualizer from "../components/PitchVisualizer";
import { detectPitchFFT, frequencyToNote } from "../components/utils";
import DownloadMp3 from "../components/DownloadMp3";

const API_KEYS = [
  "0687e8e48bmsh519089e70666b40p124f0ajsnfc47fa8df8de",
  "4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
  "e0a4a7e079msh2d3bd6eecf1c74fp12ba85jsnaab86c305b67",
  "55e68a52fbmsh91bd7fe14f7572fp1ea3d3jsn906b3acc22ed",
];

const MAX_REQUESTS_PER_MONTH = 35;
const RESET_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const UPDATE_INTERVAL = 400; // Update every 100ms
const PITCH_SMOOTHING_FACTOR = 0.8; // Adjust this value for more or less smoothing

function Play() {
  const { videoId } = useParams();
  const [lyrics, setLyrics] = useState([]);
  const [currentSubtitles, setCurrentSubtitles] = useState([]);
  const [currentCaption, setCurrentCaption] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [micPitch, setMicPitch] = useState(null);
  const [mp3Pitch, setMp3Pitch] = useState(null);
  const [currentMicNote, setCurrentMicNote] = useState(null);
  const [currentMp3Note, setCurrentMp3Note] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mp3NoteRanges, setMp3NoteRanges] = useState([]);
  const [micNoteRanges, setMicNoteRanges] = useState([]);
  const [score, setScore] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");

  const audioRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const mp3AudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const mp3AnalyserRef = useRef(null);
  const micDataArrayRef = useRef(null);
  const mp3DataArrayRef = useRef(null);
  const timerRef = useRef(null);
  const iframeRef = useRef(null);
  const videoRef = useRef(null);

  const smoothingFactor = 0.98;
  const updateInterval = 1000; // milliseconds
  const maxFrequency = 1000; // Set max frequency limit for visualization

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

  const startPitchDetection = () => {
    startMicPitchDetection();
    startMp3PitchDetection();
  };

  const startMicPitchDetection = async () => {
    micAudioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    micAnalyserRef.current = micAudioContextRef.current.createAnalyser();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = micAudioContextRef.current.createMediaStreamSource(stream);
      source.connect(micAnalyserRef.current);
      micDataArrayRef.current = new Float32Array(
        micAnalyserRef.current.fftSize
      );
      detectMicPitch();
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const detectMicPitch = () => {
    const micAnalyser = micAnalyserRef.current;
    const micDataArray = micDataArrayRef.current;

    const updateMicPitch = () => {
      micAnalyser.getFloatTimeDomainData(micDataArray);
      const pitchValue = detectPitchFFT(
        micDataArray,
        micAudioContextRef.current.sampleRate
      );

      if (pitchValue !== -1 && pitchValue < maxFrequency) {
        const smoothedPitch =
          pitchValue * (1 - PITCH_SMOOTHING_FACTOR) +
          (micPitch || pitchValue) * PITCH_SMOOTHING_FACTOR;
        setMicPitch(smoothedPitch);
        const note = frequencyToNote(smoothedPitch);
        setCurrentMicNote(note);

        const elapsedTime = audioRef.current ? audioRef.current.currentTime : 0;
        setMicNoteRanges((prevData) => [
          ...prevData,
          {
            note,
            frequency: smoothedPitch.toFixed(2),
            time: elapsedTime.toFixed(2),
          },
        ]);
      }

      if (isAnalyzing) {
        setTimeout(updateMicPitch, UPDATE_INTERVAL);
      }
    };

    updateMicPitch();
  };

  const startMp3PitchDetection = () => {
    if (!audioRef.current) {
      console.error("Audio element not found");
      return;
    }

    mp3AudioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    mp3AnalyserRef.current = mp3AudioContextRef.current.createAnalyser();
    const source = mp3AudioContextRef.current.createMediaElementSource(
      audioRef.current
    );
    source.connect(mp3AnalyserRef.current);
    mp3AnalyserRef.current.connect(mp3AudioContextRef.current.destination);
    mp3AnalyserRef.current.fftSize = 2048;
    mp3DataArrayRef.current = new Float32Array(mp3AnalyserRef.current.fftSize);

    setIsAnalyzing(true);
    detectMp3Pitch();
  };

  const detectMp3Pitch = () => {
    if (!isAnalyzing) return;

    const mp3Analyser = mp3AnalyserRef.current;
    const mp3DataArray = mp3DataArrayRef.current;

    const updatePitch = () => {
      mp3Analyser.getFloatTimeDomainData(mp3DataArray);
      const pitchValue = detectPitchFFT(
        mp3DataArray,
        mp3AudioContextRef.current.sampleRate
      );

      if (pitchValue !== -1 && pitchValue < maxFrequency) {
        const smoothedPitch =
          pitchValue * (1 - PITCH_SMOOTHING_FACTOR) +
          (mp3Pitch || pitchValue) * PITCH_SMOOTHING_FACTOR;
        setMp3Pitch(smoothedPitch);
        const note = frequencyToNote(smoothedPitch);
        setCurrentMp3Note(note);

        setMp3NoteRanges((prevData) => [
          ...prevData,
          {
            note,
            frequency: smoothedPitch.toFixed(2),
            time: audioRef.current.currentTime.toFixed(2),
          },
        ]);
      }

      if (isAnalyzing) {
        setTimeout(updatePitch, UPDATE_INTERVAL);
      }
    };

    updatePitch();
  };

  const compareNotes = () => {
    const timeWindow = 0.4; // Time window in seconds to consider for matching
    const accuracyThreshold = 100; // ±5 Hz for a correct match
    const perfectMatchScore = 100; // Score for a perfect match
    const nearMatchScore = 50; // Score for a near match

    if (!isPlaying) {
      return; // Skip scoring if the MP3 is not playing
    }

    if (micNoteRanges.length > 0 && mp3NoteRanges.length > 0) {
      let totalScore = 0;

      micNoteRanges.forEach((micNote) => {
        const closestMp3Note = mp3NoteRanges.reduce((closest, mp3Note) => {
          const timeDiff = Math.abs(micNote.time - mp3Note.time);
          if (
            timeDiff <= timeWindow &&
            timeDiff < (closest ? closest.timeDiff : Infinity)
          ) {
            return { ...mp3Note, timeDiff };
          }
          return closest;
        }, null);

        if (closestMp3Note) {
          const frequencyDiff = Math.abs(
            micNote.frequency - closestMp3Note.frequency
          );

          if (frequencyDiff <= accuracyThreshold) {
            if (frequencyDiff === 0) {
              totalScore += perfectMatchScore; // Perfect Match
            } else {
              totalScore += nearMatchScore; // Near Match
            }
          }
        }
      });

      setScore((prevScore) => prevScore + totalScore);
    }
  };

  useEffect(() => {
    if (isAnalyzing) {
      compareNotes();
    }
  }, [micNoteRanges, mp3NoteRanges]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentTime(0);
    setVideoSrc(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&mute=1`
    );
    startPitchDetection();

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

    // Start or resume MP3 playback
    if (audioRef.current) {
      audioRef.current.play();
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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopPitchDetection();
    };
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          audioRef.current.src = URL.createObjectURL(file);
          audioRef.current.load();
          setIsAnalyzing(true);
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const stopPitchDetection = () => {
    if (micAudioContextRef.current) {
      micAudioContextRef.current.close();
      micAudioContextRef.current = null;
    }

    if (mp3AudioContextRef.current) {
      mp3AudioContextRef.current.close();
      mp3AudioContextRef.current = null;
    }

    setIsAnalyzing(false);
    setMicPitch(null);
    setMp3Pitch(null);
    setCurrentMicNote(null);
    setCurrentMp3Note(null);
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
            <p
              className="subtitle-text current-caption"
              style={{
                color: "white",
                fontSize: "24px",
                textAlign: "center",
                width: "100%",
                position: "absolute",
                bottom: "50px",
                left: "0",
                right: "0",
                margin: "auto",
                padding: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                borderRadius: "5px",
              }}
            >
              {currentSubtitle}
            </p>
          </div>
          <PitchVisualizer
            micNoteRanges={micNoteRanges}
            mp3NoteRanges={mp3NoteRanges}
          />
          <div className="time-display">{formatTime(currentTime)}</div>
          <button onClick={handleStop} className="stop-button">
            Stop Timer
          </button>
        </>
      )}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <h1>MP3 and Microphone Pitch Detection</h1>
        <input type="file" accept=".mp3" onChange={handleFileChange} />
        <audio ref={audioRef} controls></audio>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ width: "100%" }}>
            <h2>Pitch Detector</h2>
            <PitchVisualizer
              micNoteRanges={micNoteRanges}
              mp3NoteRanges={mp3NoteRanges}
            />
            <p style={{ fontSize: "24px" }}>
              Note: {micPitch ? currentMicNote : "No note detected"}
            </p>
          </div>

          <div style={{ width: "48%" }}>
            <p style={{ fontSize: "24px" }}>
              Note: {mp3Pitch ? currentMp3Note : "No note detected"}
            </p>
            <p style={{ fontSize: "24px" }}>Score: {score}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Play;
