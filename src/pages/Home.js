// Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const handlePlayClick = () => {
    navigate("/choose");
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>SingFi Game</h1>
      <h3>A sing-to-earn karaoke experience!</h3>
      <button onClick={handlePlayClick}>Play</button>
    </div>
  );
}

export default Home;
