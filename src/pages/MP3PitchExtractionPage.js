import React, { useState, useRef, useEffect } from "react";

// Pitch detection algorithm using FFT
const detectPitchFFT = (dataArray, sampleRate) => {
  const fft = require("fft-js").fft;
  const fftUtil = require("fft-js").util;

  const phasors = fft(dataArray);
  const magnitudes = fftUtil.fftMag(phasors);
  const frequencies = fftUtil.fftFreq(phasors, sampleRate);

  // Find the peak frequency
  const maxMagnitude = Math.max(...magnitudes);
  const indexOfMax = magnitudes.indexOf(maxMagnitude);

  return frequencies[indexOfMax];
};

// Define pitch ranges up to 1000 Hz
const pitchRanges = [
  { label: "50 Hz", min: 50, max: 100 },
  { label: "100 Hz", min: 100, max: 200 },
  { label: "200 Hz", min: 200, max: 300 },
  { label: "300 Hz", min: 300, max: 400 },
  { label: "400 Hz", min: 400, max: 500 },
  { label: "500 Hz", min: 500, max: 600 },
  { label: "600 Hz", min: 600, max: 700 },
  { label: "700 Hz", min: 700, max: 800 },
  { label: "800 Hz", min: 800, max: 900 },
  { label: "900 Hz", min: 900, max: 1000 },
];

const MP3PitchExtractionPage = () => {
  const [pitch, setPitch] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentRange, setCurrentRange] = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]); // For averaging
  const [lastPitch, setLastPitch] = useState(null); // Added lastPitch state
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const smoothingFactor = 0.98; // Further increase smoothing factor
  const updateInterval = 200; // Increase interval to make pitch changes less frequent
  const historySize = 10; // Number of previous pitch values to average

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
        const pitchValue = detectPitchFFT(
          dataArray,
          audioContextRef.current.sampleRate
        );

        if (pitchValue !== -1) {
          // Smooth the pitch value
          setPitchHistory((prev) => {
            const newHistory = [...prev, pitchValue];
            if (newHistory.length > historySize) {
              newHistory.shift(); // Remove oldest value
            }
            const averagePitch =
              newHistory.reduce((sum, val) => sum + val, 0) / newHistory.length;
            const smoothedPitch = lastPitch
              ? lastPitch * smoothingFactor +
                averagePitch * (1 - smoothingFactor)
              : averagePitch;
            setLastPitch(smoothedPitch);

            // Determine which pitch range the smoothed pitch falls into
            const range = pitchRanges.find(
              (r) => smoothedPitch >= r.min && smoothedPitch <= r.max
            );
            setCurrentRange(range ? range.label : "Unknown");
            setPitch(smoothedPitch);
            return newHistory;
          });
        } else {
          setLastPitch(null); // Reset smoothing if no pitch detected
        }

        lastUpdateTime = currentTime; // Update last update time
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
      <h1>MP3 Pitch Detection</h1>
      <input type="file" accept=".mp3" onChange={handleFileChange} />
      <audio ref={audioRef} controls></audio>

      <div
        style={{
          marginTop: "20px",
          position: "relative",
          height: "200px",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        {pitchRanges.map((range, index) => {
          const rangeLabel = range.label;
          const isActive = currentRange === rangeLabel;
          const barHeight = isActive ? "100%" : "10%"; // Adjust bar height for active range
          return (
            <div
              key={index}
              style={{
                position: "relative",
                width: `${100 / pitchRanges.length}%`,
                height: barHeight,
                backgroundColor: isActive ? "lightblue" : "lightgrey",
                border: "1px solid black",
                boxSizing: "border-box",
                textAlign: "center",
                lineHeight: "200px",
                color: "black",
                fontSize: "14px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              {rangeLabel}
            </div>
          );
        })}
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
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
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
