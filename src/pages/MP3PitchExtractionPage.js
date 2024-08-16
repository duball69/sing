import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

// Pitch detection algorithm (auto-correlation)
const autoCorrelate = (buffer, sampleRate) => {
  let SIZE = buffer.length;
  let MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  let correlations = new Array(MAX_SAMPLES);

  for (let i = 0; i < SIZE; i++) {
    let val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

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
      let shift =
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

// Define expanded pitch ranges
const pitchRanges = [
  { label: "250 Hz", min: 250, max: 400 },
  { label: "400 Hz", min: 400, max: 600 },
  { label: "600 Hz", min: 600, max: 800 },
  { label: "800 Hz", min: 800, max: 1000 },
  { label: "1000 Hz", min: 1000, max: 1500 },
  { label: "1500 Hz", min: 1500, max: 2000 },
  { label: "2000 Hz", min: 2000, max: 2500 },
  { label: "2500 Hz", min: 2500, max: 3000 },
  { label: "3000 Hz", min: 3000, max: 3500 },
  { label: "3500 Hz", min: 3500, max: 4000 },
  { label: "4000 Hz", min: 4000, max: 4500 },
  { label: "4500 Hz", min: 4500, max: 5000 },
  { label: "5000 Hz", min: 5000, max: 5500 },
  { label: "5500 Hz", min: 5500, max: 6000 },
  { label: "6000 Hz", min: 6000, max: 7000 }, // Extend beyond range to handle high frequencies
];

const MP3PitchExtractionPage = () => {
  const [youtubeLink, setYoutubeLink] = useState("");
  const [mp3Url, setMp3Url] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentRange, setCurrentRange] = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]);
  const [lastPitch, setLastPitch] = useState(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const smoothingFactor = 0.98;
  const updateInterval = 200;
  const historySize = 10;

  useEffect(() => {
    if (isAnalyzing) {
      startPitchDetection();
    }
    return () => {
      stopPitchDetection();
    };
  }, [isAnalyzing]);

  const startPitchDetection = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaElementSource(
        audioRef.current
      );
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);
    }
    detectPitch();
  };

  const detectPitch = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    let lastUpdateTime = Date.now();

    const updatePitch = () => {
      const currentTime = Date.now();
      if (currentTime - lastUpdateTime >= updateInterval) {
        analyser.getFloatTimeDomainData(dataArray);
        const pitchValue = autoCorrelate(
          dataArray,
          audioContextRef.current.sampleRate
        );

        if (pitchValue !== -1) {
          setPitchHistory((prev) => {
            const newHistory = [...prev, pitchValue];
            if (newHistory.length > historySize) {
              newHistory.shift();
            }
            const averagePitch =
              newHistory.reduce((sum, val) => sum + val, 0) / newHistory.length;
            const smoothedPitch = lastPitch
              ? lastPitch * smoothingFactor +
                averagePitch * (1 - smoothingFactor)
              : averagePitch;
            setLastPitch(smoothedPitch);

            const range = pitchRanges.find(
              (r) => smoothedPitch >= r.min && smoothedPitch <= r.max
            );
            setCurrentRange(range ? range.label : "Unknown");
            setPitch(smoothedPitch);
            return newHistory;
          });
        } else {
          setLastPitch(null);
        }

        lastUpdateTime = currentTime;
      }

      if (isAnalyzing) {
        requestAnimationFrame(updatePitch);
      }
    };

    updatePitch();
  };

  const stopPitchDetection = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleFetchMp3 = async () => {
    try {
      const response = await axios.get(
        "https://cors-anywhere.herokuapp.com/https://youtube-mp3-downloader2.p.rapidapi.com/ytmp3/ytmp3/custom/",
        {
          params: {
            url: youtubeLink,
            quality: "320",
          },
          headers: {
            "x-rapidapi-key":
              "e0a4a7e079msh2d3bd6eecf1c74fp12ba85jsnaab86c305b67",
            "x-rapidapi-host": "youtube-mp3-downloader2.p.rapidapi.com",
          },
        }
      );
      // Extract the MP3 URL from the response
      const mp3Url = response.data.dlink;

      if (mp3Url) {
        setMp3Url(mp3Url);
        setIsAnalyzing(true);
      } else {
        console.error("Failed to retrieve MP3 URL from the API response.");
      }
    } catch (error) {
      console.error("Error fetching MP3:", error);
    }
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

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>YouTube MP3 Pitch Detection</h1>
      <input
        type="text"
        value={youtubeLink}
        onChange={(e) => setYoutubeLink(e.target.value)}
        placeholder="Enter YouTube URL"
        style={{ padding: "10px", fontSize: "16px", marginBottom: "20px" }}
      />
      <button
        onClick={handleFetchMp3}
        style={{ padding: "10px 20px", fontSize: "16px", marginTop: "20px" }}
      >
        Fetch and Analyze
      </button>
      {mp3Url && (
        <>
          <audio ref={audioRef} src={mp3Url} controls></audio>
          <button
            onClick={() => setIsAnalyzing(true)}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginTop: "20px",
            }}
          >
            Start Analyzing
          </button>
        </>
      )}
      <div
        style={{
          marginTop: "20px",
          position: "relative",
          height: "200px",
          width: "100%",
        }}
      >
        {pitchRanges.map((range, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${(index / pitchRanges.length) * 100}%`,
              width: `${100 / pitchRanges.length}%`,
              bottom: "0",
              height: "100%",
              backgroundColor:
                currentRange === range.label ? "lightblue" : "lightgrey",
              border: "1px solid black",
              boxSizing: "border-box",
              textAlign: "center",
              lineHeight: "200px",
              color: "black",
              fontSize: "14px",
            }}
          >
            {range.label}
          </div>
        ))}
        {pitch !== null && (
          <div
            style={{
              position: "absolute",
              left: `${
                (pitchRanges.findIndex((r) => r.label === currentRange) /
                  pitchRanges.length) *
                100
              }%`,
              width: `${100 / pitchRanges.length}%`,
              height: "100%",
              backgroundColor: "rgba(255, 0, 0, 0.5)",
              border: "1px solid red",
              boxSizing: "border-box",
              textAlign: "center",
              lineHeight: "200px",
              color: "white",
              fontSize: "16px",
            }}
          >
            {currentRange}
          </div>
        )}
      </div>
      {pitch && pitch !== -1 ? (
        <p style={{ fontSize: "24px", marginTop: "20px" }}>
          Current Pitch: {pitch.toFixed(2)} Hz
        </p>
      ) : (
        pitch === -1 && (
          <p style={{ fontSize: "24px", marginTop: "20px" }}>
            No pitch detected
          </p>
        )
      )}
    </div>
  );
};

export default MP3PitchExtractionPage;
