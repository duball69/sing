// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Choose from "./pages/Choose";
import Play from "./pages/Play";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/choose" element={<Choose />} />
          <Route path="/play/:videoId" element={<Play />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
