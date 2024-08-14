// Home.js
import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const handlePlayClick = () => {
    navigate("/choose");
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Karaoke Game</h1>
      <p>Your ultimate singing experience!</p>
      <button onClick={handlePlayClick}>Play</button>
    </div>
  );
}

export default Home;
