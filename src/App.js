// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Choose from "./pages/Choose";
import Play from "./pages/Play";
import PlayVoice from "./pages/PlayVoice";
import PitchDetectionPage from "./pages/PitchDetectionPage";
import MP3PitchDetectionPage from "./pages/MP3PitchDetectionPage";
import MP3PitchExtractionPage from "./pages/MP3PitchExtractionPage";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/choose" element={<Choose />} />
          <Route path="/play/:videoId" element={<Play />} />
          <Route path="/playvoice/:videoId" element={<PlayVoice />} />
          <Route path="/pitchDetectionPage" element={<PitchDetectionPage />} />
          <Route
            path="/pitch-extraction"
            element={<MP3PitchExtractionPage />}
          />
          <Route
            path="/mp3PitchDetectionPage"
            element={<MP3PitchDetectionPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
