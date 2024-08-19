import React, { useState, useEffect, useRef } from "react";
import PitchVisualizer from "../components/PitchVisualizer";
import { detectPitchFFT, frequencyToNote } from "../components/utils";

const PlayMode = () => {
  const [micPitch, setMicPitch] = useState(null);
  const [mp3Pitch, setMp3Pitch] = useState(null);
  const [currentMicNote, setCurrentMicNote] = useState(null);
  const [currentMp3Note, setCurrentMp3Note] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mp3NoteRanges, setMp3NoteRanges] = useState([]);
  const [micNoteRanges, setMicNoteRanges] = useState([]);
  const [score, setScore] = useState(0);

  const audioRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const mp3AudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const mp3AnalyserRef = useRef(null);
  const micDataArrayRef = useRef(null);
  const mp3DataArrayRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mp3StartTime, setMp3StartTime] = useState(null);
  const videoRef = useRef(null); // Reference for the video element

  const smoothingFactor = 0.98;
  const updateInterval = 1000; // milliseconds
  const maxFrequency = 2000; // Set max frequency limit for visualization

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

        if (pitchValue !== -1 && pitchValue < maxFrequency) {
          const smoothedPitch =
            pitchValue * smoothingFactor +
            (micPitch || pitchValue) * (1 - smoothingFactor);
          setMicPitch(smoothedPitch);
          const note = frequencyToNote(smoothedPitch);
          setCurrentMicNote(note);

          // Use accurate time based on audio playback
          const elapsedTime = audioRef.current
            ? audioRef.current.currentTime
            : 0;
          setMicNoteRanges((prevData) => [
            ...prevData,
            {
              note,
              frequency: smoothedPitch.toFixed(2),
              time: elapsedTime.toFixed(2), // Use accurate time in seconds
            },
          ]);
          lastUpdateTime = currentTime;
        }
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
    mp3AnalyserRef.current.fftSize = 2048;
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

        if (pitchValue !== -1 && pitchValue < maxFrequency) {
          const smoothedPitch =
            pitchValue * smoothingFactor +
            (mp3Pitch || pitchValue) * (1 - smoothingFactor);
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
          lastUpdateTime = currentTime;
        }
      }

      if (isAnalyzing) {
        requestAnimationFrame(updateMp3Pitch);
      }
    };

    updateMp3Pitch();
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

      // Iterate over microphone notes
      micNoteRanges.forEach((micNote) => {
        // Find the closest MP3 note within the time window
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
          // Calculate frequency difference
          const frequencyDiff = Math.abs(
            micNote.frequency - closestMp3Note.frequency
          );

          // Update score based on frequency difference
          if (frequencyDiff <= accuracyThreshold) {
            if (frequencyDiff === 0) {
              totalScore += perfectMatchScore; // Perfect Match
            } else {
              totalScore += nearMatchScore; // Near Match
            }
          }
        }
      });

      // Update the score state with the calculated total score
      setScore((prevScore) => prevScore + totalScore);
    }
  };

  useEffect(() => {
    if (isAnalyzing) {
      compareNotes();
    }
  }, [micNoteRanges, mp3NoteRanges]);

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

  const handlePlay = () => {
    setIsPlaying(true);
    setMp3StartTime(audioRef.current.currentTime);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  // Use this for the "ended" event if you want to stop scoring when the MP3 stops
  const handleEnded = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("play", handlePlay);
      audioRef.current.addEventListener("pause", handlePause);
      audioRef.current.addEventListener("ended", handleEnded);

      return () => {
        audioRef.current.removeEventListener("play", handlePlay);
        audioRef.current.removeEventListener("pause", handlePause);
        audioRef.current.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("play", handlePlay);
      return () => {
        audioRef.current.removeEventListener("play", handlePlay);
      };
    }
  }, []);

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

      {/* Video element for background playback */}
      <video
        ref={videoRef}
        src="path/to/your/video.mp4"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
        muted
        autoPlay
        loop
      />

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
          />{" "}
          {/* Pass both ranges */}
          <p style={{ fontSize: "24px" }}>
            Note: {micPitch ? currentMicNote : "No note detected"}
          </p>
        </div>

        <div style={{ width: "48%" }}>
          {/* Pass both ranges */}
          <p style={{ fontSize: "24px" }}>
            Note: {mp3Pitch ? currentMp3Note : "No note detected"}
          </p>
          <p style={{ fontSize: "24px" }}>Score: {score}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayMode;
