// PitchDetails.js
import React from "react";
import PitchVisualizer from "./PitchVisualizer";

const PitchDetails = ({
  micPitch,
  currentMicNote,
  mp3Pitch,
  currentMp3Note,
  mp3NoteRanges,
  score,
}) => {
  return (
    <div>
      <h2>Microphone Pitch</h2>
      <PitchVisualizer
        currentNote={currentMicNote}
        noteColors={{ active: "lightblue", inactive: "lightgrey" }}
        noteNames={["La", "Si", "Do", "Re", "Mi", "Fa", "Sol"]}
      />
      <div style={{ marginTop: "20px", textAlign: "left" }}>
        <h2>Pitch Curve</h2>
        {mp3NoteRanges.length > 0 ? (
          mp3NoteRanges.map((data, index) => (
            <p key={index}>
              Time: {data.time}s - Note: {data.note} - Frequency:{" "}
              {data.frequency}Hz
            </p>
          ))
        ) : (
          <p>No pitch curve extracted yet.</p>
        )}
      </div>
      <p style={{ fontSize: "24px" }}>
        Note: {micPitch ? currentMicNote : "No note detected"}
      </p>

      <h2>MP3 Pitch</h2>
      <PitchVisualizer
        currentNote={currentMp3Note}
        noteColors={{ active: "lightgreen", inactive: "lightgrey" }}
        noteNames={["La", "Si", "Do", "Re", "Mi", "Fa", "Sol"]}
      />
      <p style={{ fontSize: "24px" }}>
        Note: {mp3Pitch ? currentMp3Note : "No note detected"}
      </p>
      <p style={{ fontSize: "14px", marginTop: "10px" }}>
        Saved MP3 Note Ranges:{" "}
        {mp3NoteRanges.map((range, index) => (
          <span key={index}>
            [Time: {range.time}s, Note: {range.note}, Frequency:{" "}
            {range.frequency}Hz]
            {index < mp3NoteRanges.length - 1 && ", "}
          </span>
        ))}
      </p>

      <p style={{ fontSize: "24px", marginTop: "20px" }}>Score: {score}</p>
    </div>
  );
};

export default PitchDetails;
