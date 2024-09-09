// Video.js
import React, { useRef, useEffect } from "react";

function Video({ videoId, isPlaying }) {
  const iframeRef = useRef(null);

  // Generate the video source URL
  const videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=${
    isPlaying ? 1 : 0
  }&controls=1&mute=1`;

  // Log to verify props are received correctly
  useEffect(() => {
    console.log("Video ID:", videoId, "Is Playing:", isPlaying);
  }, [videoId, isPlaying]);

  // Handler to play/pause the video on click
  const handleClickVideo = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isPlaying ? "pauseVideo" : "playVideo",
        }),
        "*"
      );
    }
  };

  return (
    <iframe
      id="youtube-iframe"
      ref={iframeRef}
      width="100%"
      height="500"
      src={videoSrc}
      frameBorder="0"
      allow="autoplay; encrypted-media"
      allowFullScreen
      title="YouTube Video Player"
      style={{ cursor: "pointer", backgroundColor: "black" }}
      onClick={handleClickVideo}
    ></iframe>
  );
}

export default Video;
