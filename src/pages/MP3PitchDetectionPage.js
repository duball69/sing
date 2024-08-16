import React, { useState, useEffect, useRef } from "react";
import song from "../sounds/Adele - Rolling in the Deep (Official Music Video).mp3";

const MP3PitchDetectionPage = () => {
  const [pitch, setPitch] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);

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
      sourceRef.current = audioContextRef.current.createMediaElementSource(
        audioRef.current
      );
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);
    }
    detectPitch();
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
      setPitch(pitchValue);

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

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>MP3 Pitch Detection</h1>
      <audio ref={audioRef} controls src={song} crossOrigin="anonymous"></audio>

      <button
        onClick={() => setIsAnalyzing(true)}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        Start Analyzing
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

export default MP3PitchDetectionPage;
