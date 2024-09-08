import React, { useEffect } from "react";

function DownloadMp3({ videoId, audioRef, onAudioLoaded }) {
  useEffect(() => {
    if (videoId) {
      const handleDownload = async () => {
        const url = `https://youtube-mp3-downloader2.p.rapidapi.com/ytmp3/ytmp3/custom/?url=https://www.youtube.com/watch?v=${videoId}&quality=320`;
        const options = {
          method: "GET",
          headers: {
            "x-rapidapi-key":
              "55e68a52fbmsh91bd7fe14f7572fp1ea3d3jsn906b3acc22ed",
            //"4a2885a20cmshc882f79ada16c13p17bbc2jsncb4912134c39",
            "x-rapidapi-host": "youtube-mp3-downloader2.p.rapidapi.com",
          },
        };

        try {
          const response = await fetch(url, options);
          const result = await response.json(); // Parse as JSON

          if (result.dlink) {
            // Set the dlink as the audio source
            audioRef.current.src = result.dlink; // Set the dlink as the mp3Url
            audioRef.current.load(); // Load the new audio source
            onAudioLoaded(); // Call the function to start pitch detection
          } else {
            console.error("Error fetching MP3 URL:", result);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };

      handleDownload();
    }
  }, [videoId, audioRef, onAudioLoaded]);

  return (
    <div>
      <audio ref={audioRef} controls>
        <source src="" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

export default DownloadMp3;
