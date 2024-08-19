// FileUploader.js
import React from "react";

const FileUploader = ({ onFileChange }) => {
  return (
    <div>
      <input type="file" accept=".mp3" onChange={onFileChange} />
    </div>
  );
};

export default FileUploader;
