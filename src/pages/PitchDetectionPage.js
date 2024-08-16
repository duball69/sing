import React, { useState, useRef, useEffect } from "react";

// Define pitch ranges for visualization
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

const PitchDetectionPage = () => {
  const [pitch, setPitch] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [currentRange, setCurrentRange] = useState(null);
  const [lastPitch, setLastPitch] = useState(null); // For smoothing
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const smoothingFactor = 0.98; // Smoothing factor for pitch values
  const updateInterval = 200; // Interval to update pitch detection (ms)
  const minPitchThreshold = 50; // Minimum pitch threshold in Hz to ignore noise
  const maxPitchThreshold = 2000; // Maximum pitch threshold in Hz

  useEffect(() => {
    if (isListening) {
      startPitchDetection();
    }
    return () => {
      stopPitchDetection();
    };
  }, [isListening]);

  const startPitchDetection = async () => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);
      detectPitch();
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const detectPitch = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const updatePitch = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const pitchValue = autoCorrelate(
        dataArray,
        audioContextRef.current.sampleRate
      );

      if (pitchValue > minPitchThreshold && pitchValue < maxPitchThreshold) {
        const smoothedPitch = lastPitch
          ? lastPitch * smoothingFactor + pitchValue * (1 - smoothingFactor)
          : pitchValue;

        setLastPitch(smoothedPitch);

        const range = pitchRanges.find(
          (r) => smoothedPitch >= r.min && smoothedPitch <= r.max
        );
        setCurrentRange(range ? range.label : "Unknown");
        setPitch(smoothedPitch);
      } else {
        setLastPitch(null); // Reset smoothing if no valid pitch detected
        setPitch(null);
      }

      setTimeout(() => {
        if (isListening) {
          requestAnimationFrame(updatePitch);
        }
      }, updateInterval);
    };

    updatePitch();
  };

  const stopPitchDetection = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startListening = () => {
    setIsListening(true);
  };

  // Improved auto-correlation algorithm with windowing
  const autoCorrelate = (buffer, sampleRate) => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    const windowedBuffer = applyHammingWindow(buffer);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    let correlations = new Array(MAX_SAMPLES);

    // Calculate root mean square of the signal
    for (let i = 0; i < SIZE; i++) {
      let val = windowedBuffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Not enough signal

    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(windowedBuffer[i] - windowedBuffer[i + offset]);
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

  // Apply Hamming window to the signal
  const applyHammingWindow = (buffer) => {
    const SIZE = buffer.length;
    const window = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
      window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (SIZE - 1));
    }
    return buffer.map((value, index) => value * window[index]);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>SingStar Clone</h1>
      <button
        onClick={startListening}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        Start Singing
      </button>
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
        {pitch !== null && pitch !== -1 && (
          <div
            style={{
              position: "absolute",
              left: `${
                (pitchRanges.findIndex((r) => r.label === currentRange) /
                  pitchRanges.length) *
                100
              }%`,
              height: "100%",
              width: "2px",
              backgroundColor: "red",
              transform: "translateX(-50%)",
            }}
          ></div>
        )}
      </div>
      <p>Detected Pitch: {pitch !== null ? `${pitch.toFixed(2)} Hz` : "N/A"}</p>
    </div>
  );
};

export default PitchDetectionPage;
