import React, { useState, useRef, useEffect } from "react";
import { fft, util as fftUtil } from "fft-js";

// Pitch detection algorithm using FFT
const detectPitchFFT = (dataArray, sampleRate) => {
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
  const [micPitch, setMicPitch] = useState(null);
  const [mp3Pitch, setMp3Pitch] = useState(null);
  const [currentMicRange, setCurrentMicRange] = useState(null);
  const [currentMp3Range, setCurrentMp3Range] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const mp3AudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const mp3AnalyserRef = useRef(null);
  const micDataArrayRef = useRef(null);
  const mp3DataArrayRef = useRef(null);
  const smoothingFactor = 0.98;
  const updateInterval = 200;

  useEffect(() => {
    if (isAnalyzing) {
      startPitchDetection();
    }
    return () => {
      stopPitchDetection();
    };
  }, [isAnalyzing]);

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
    let lastUpdateTime = Date.now();

    const updateMicPitch = () => {
      const currentTime = Date.now();
      if (currentTime - lastUpdateTime >= updateInterval) {
        micAnalyser.getFloatTimeDomainData(micDataArray);
        const pitchValue = detectPitchFFT(
          micDataArray,
          micAudioContextRef.current.sampleRate
        );

        if (pitchValue !== -1) {
          const smoothedPitch =
            pitchValue * smoothingFactor +
            (micPitch || pitchValue) * (1 - smoothingFactor);
          setMicPitch(smoothedPitch);

          // Determine which pitch range the smoothed pitch falls into
          const range = pitchRanges.find(
            (r) => smoothedPitch >= r.min && smoothedPitch <= r.max
          );
          setCurrentMicRange(range ? range.label : "Unknown");
        }

        lastUpdateTime = currentTime;
      }

      if (isAnalyzing) {
        requestAnimationFrame(updateMicPitch);
      }
    };

    updateMicPitch();
  };

  const startMp3PitchDetection = () => {
    mp3AudioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    mp3AnalyserRef.current = mp3AudioContextRef.current.createAnalyser();
    const source = mp3AudioContextRef.current.createMediaElementSource(
      audioRef.current
    );
    source.connect(mp3AnalyserRef.current);
    mp3AnalyserRef.current.connect(mp3AudioContextRef.current.destination);
    mp3DataArrayRef.current = new Float32Array(mp3AnalyserRef.current.fftSize);
    detectMp3Pitch();
  };

  const detectMp3Pitch = () => {
    const mp3Analyser = mp3AnalyserRef.current;
    const mp3DataArray = mp3DataArrayRef.current;
    let lastUpdateTime = Date.now();

    const updateMp3Pitch = () => {
      const currentTime = Date.now();
      if (currentTime - lastUpdateTime >= updateInterval) {
        mp3Analyser.getFloatTimeDomainData(mp3DataArray);
        const pitchValue = detectPitchFFT(
          mp3DataArray,
          mp3AudioContextRef.current.sampleRate
        );

        if (pitchValue !== -1) {
          const smoothedPitch =
            pitchValue * smoothingFactor +
            (mp3Pitch || pitchValue) * (1 - smoothingFactor);
          setMp3Pitch(smoothedPitch);

          // Determine which pitch range the smoothed pitch falls into
          const range = pitchRanges.find(
            (r) => smoothedPitch >= r.min && smoothedPitch <= r.max
          );
          setCurrentMp3Range(range ? range.label : "Unknown");
        }

        lastUpdateTime = currentTime;
      }

      if (isAnalyzing) {
        requestAnimationFrame(updateMp3Pitch);
      }
    };

    updateMp3Pitch();
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
        <div style={{ width: "48%" }}>
          <h2>Microphone Pitch</h2>
          <div
            style={{
              position: "relative",
              height: "200px",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {pitchRanges.map((range, index) => {
              const isActive = currentMicRange === range.label;
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
                  {range.label}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "24px", marginTop: "20px" }}>
            Current Pitch:{" "}
            {micPitch ? micPitch.toFixed(2) : "No pitch detected"} Hz
          </p>
        </div>

        <div style={{ width: "48%" }}>
          <h2>MP3 Pitch</h2>
          <div
            style={{
              position: "relative",
              height: "200px",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {pitchRanges.map((range, index) => {
              const isActive = currentMp3Range === range.label;
              const barHeight = isActive ? "100%" : "10%"; // Adjust bar height for active range
              return (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    width: `${100 / pitchRanges.length}%`,
                    height: barHeight,
                    backgroundColor: isActive ? "lightgreen" : "lightgrey",
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
                  {range.label}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "24px", marginTop: "20px" }}>
            Current Pitch:{" "}
            {mp3Pitch ? mp3Pitch.toFixed(2) : "No pitch detected"} Hz
          </p>
        </div>
      </div>
    </div>
  );
};

export default MP3PitchExtractionPage;
