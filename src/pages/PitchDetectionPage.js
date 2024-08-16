import React, { useState, useEffect } from "react";

const PitchDetectionPage = () => {
  const [pitch, setPitch] = useState(null);
  const [isListening, setIsListening] = useState(false);
  let audioContext = null;
  let analyser = null;
  let pitchDetector = null;

  useEffect(() => {
    if (isListening) {
      startPitchDetection();
    }
    // Cleanup on unmount
    return () => {
      stopPitchDetection();
    };
  }, [isListening]);

  const startPitchDetection = async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      detectPitch();
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const detectPitch = () => {
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const updatePitch = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const pitchValue = autoCorrelate(dataArray, audioContext.sampleRate);
      setPitch(pitchValue);

      if (isListening) {
        requestAnimationFrame(updatePitch);
      }
    };

    updatePitch();
  };

  const stopPitchDetection = () => {
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  };

  const startListening = () => {
    setIsListening(true);
  };

  // Autocorrelation algorithm to estimate pitch
  const autoCorrelate = (buffer, sampleRate) => {
    // Implementation of pitch detection algorithm (autocorrelation)
    // Returns the pitch frequency in Hz or -1 if pitch can't be determined
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
    if (rms < 0.01) return -1; // Not enough signal

    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;
      correlations[offset] = correlation; // Store it, for the tweaking we need to do below.
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

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>SingStar Clone</h1>
      <button
        onClick={startListening}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        Start Singing
      </button>
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

export default PitchDetectionPage;
