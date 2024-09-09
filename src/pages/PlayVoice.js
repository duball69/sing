import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./PlayVoice.css";
import PitchVisualizer from "../components/PitchVisualizer";
import { detectPitchFFT, frequencyToNote } from "../components/utils";

function PlayVoice() {
  const { videoId } = useParams();
  const [audioSrc, setAudioSrc] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchAudioSrc = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/download-mp3?videoId=${videoId}`
        );
        if (response.data && response.data.dlink) {
          setAudioSrc(response.data.dlink);
        } else if (response.data && response.data.link) {
          setAudioSrc(response.data.link);
        } else {
          console.error("Unexpected response structure:", response.data);
        }
      } catch (error) {
        console.error("Error fetching audio source:", error);
      }
    };

    if (videoId) {
      fetchAudioSrc();
    }
  }, [videoId]);

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
    }
  }, [audioSrc]);

  const handlePlay = () => {
    audioRef.current.play();
  };

  const handleStop = () => {
    audioRef.current.pause();
  };

  return (
    <div className="play-voice-container">
      <h1>Sing Along</h1>
      <div className="video-container">
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="YouTube video player"
        ></iframe>
      </div>
      <audio
        ref={audioRef}
        controls
        style={{ width: "100%", marginTop: "20px" }}
      />
      <div className="controls">
        <button onClick={handlePlay} disabled={!audioSrc}>
          Play
        </button>
        <button onClick={handleStop} disabled={!audioRef.current?.paused}>
          Stop
        </button>
      </div>
      <PitchVisualizer micNoteRanges={[]} mp3NoteRanges={[]} />
    </div>
  );
}

export default PlayVoice;
