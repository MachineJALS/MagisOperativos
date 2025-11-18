// client/src/components/Media/AudioVideoLocalPlayer.js
import { useState } from "react";

export default function LocalMediaPlayer() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [currentSrc, setCurrentSrc] = useState(null);
  const [currentType, setCurrentType] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    const supported = files.filter((file) => {
      const ext = file.name.toLowerCase();
      return (
        ext.endsWith(".mp4") ||
        ext.endsWith(".webm") ||
        ext.endsWith(".mp3") ||
        ext.endsWith(".wav") ||
        ext.endsWith(".ogg")
      );
    });

    setMediaFiles(supported);
  };

  const handlePlay = (file) => {
    const url = URL.createObjectURL(file);
    setCurrentSrc(url);

    const ext = file.name.toLowerCase();
    if (ext.endsWith(".mp4") || ext.endsWith(".webm")) setCurrentType("video");
    else setCurrentType("audio");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-white flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Reproductor Local</h1>

      <input
        type="file"
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFileSelect}
        className="text-white"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mt-4">
        {mediaFiles.map((file, idx) => (
          <button
            key={idx}
            onClick={() => handlePlay(file)}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-xl shadow-md transition text-left"
          >
            {file.name}
          </button>
        ))}
      </div>

      {currentSrc && (
        <div className="w-full max-w-3xl mt-6">
          {currentType === "video" ? (
            <video src={currentSrc} controls className="w-full rounded-xl shadow-lg" />
          ) : (
            <audio src={currentSrc} controls className="w-full" />
          )}
        </div>
      )}
    </div>
  );
}
