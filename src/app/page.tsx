
"use client";
import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const VIDEO_WIDTH = 650;
const VIDEO_HEIGHT = 500;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [videos, setVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [faceFound, setFaceFound] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  // Load videos from localStorage on mount
  useEffect(() => {
    const savedVideos = localStorage.getItem("face-videos");
    if (savedVideos) setVideos(JSON.parse(savedVideos));
  }, []);

  // Camera and model setup
  useEffect(() => {
    async function setupCameraAndModel() {
      setLoading(true);
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelError(null);
        if (videoRef.current && cameraOn) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        } else if (videoRef.current && !cameraOn) {
          if (videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
        }
      } catch (err) {
        setModelError("Failed to load face-api.js model or camera.");
      } finally {
        setLoading(false);
      }
    }
    setupCameraAndModel();
  }, [cameraOn]);

  // Face tracking and drawing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function trackFace() {
      if (!videoRef.current || !canvasRef.current || loading || modelError) return;
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      ctx?.drawImage(videoRef.current, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      try {
        const result = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions());
        if (result) {
          setFaceFound(true);
          const { x, y, width, height } = result.box;
          ctx!.strokeStyle = "#00ff00";
          ctx!.lineWidth = 3;
          ctx!.strokeRect(x, y, width, height);
        } else {
          setFaceFound(false);
        }
      } catch {
        setFaceFound(false);
      }
    }
    interval = setInterval(trackFace, 100);
    return () => clearInterval(interval);
  }, [loading, modelError]);

  // Start recording from canvas
  const handleStart = () => {
    if (!canvasRef.current) return;
    const stream = canvasRef.current.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    let chunks: Blob[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const updatedVideos = [url, ...videos];
      setVideos(updatedVideos);
      localStorage.setItem("face-videos", JSON.stringify(updatedVideos));
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  // Stop recording
  const handleStop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col items-center p-0">
      {/* Header Bar */}
      <header className="w-full bg-blue-600 text-white py-4 shadow flex justify-center items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {/* Removed any Next.js or Vercel SVG logo from header */}
          Face Tracking & Video Recorder
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center w-full max-w-lg px-4">
        <div className="mb-4 text-center text-gray-700">
          <p>Allow camera access. Click <span className="font-semibold text-blue-600">Start Recording</span> to record video with face tracking marker.</p>
          {modelError && (
            <div className="mt-2 text-red-600 font-semibold">{modelError}</div>
          )}
        </div>
        <div className="relative w-full flex flex-col items-center" style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}>
          <video
            ref={videoRef}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT, objectFit: "cover" }}
            className="rounded-lg shadow-lg border border-gray-300 bg-black block"
            autoPlay
            muted
          />
          <canvas
            ref={canvasRef}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            style={{ position: "absolute", top: 0, left: 0, width: VIDEO_WIDTH, height: VIDEO_HEIGHT, pointerEvents: "none" }}
            className="rounded-lg"
          />
            {!faceFound && !loading && !modelError && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded shadow text-xs font-semibold">
                No face detected
              </div>
            )}
          </div>
        <div className="flex gap-4 mt-6">
          <button
            className={`px-5 py-2 rounded-lg shadow flex items-center gap-2 transition ${cameraOn ? "bg-gray-300 text-gray-700 hover:bg-gray-400" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            onClick={() => setCameraOn((prev) => !prev)}
            disabled={loading}
          >
            {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
          </button>
          {!recording ? (
            <button
              className="bg-green-500 text-white px-5 py-2 rounded-lg shadow hover:bg-green-600 flex items-center gap-2 transition"
              onClick={handleStart}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><circle cx="12" cy="12" r="10" fill="#22c55e" /><rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" /></svg>
              Start Recording
            </button>
          ) : (
            <button
              className="bg-red-500 text-white px-5 py-2 rounded-lg shadow hover:bg-red-600 flex items-center gap-2 transition"
              onClick={handleStop}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><circle cx="12" cy="12" r="10" fill="#ef4444" /><rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" /></svg>
              Stop Recording
            </button>
          )}
        </div>

        {/* Saved Videos */}
        <section className="mt-10 w-full">
          <h2 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><rect x="4" y="6" width="16" height="12" rx="2" fill="#3b82f6" /><rect x="9" y="10" width="6" height="4" rx="1" fill="#fff" /></svg>
            Saved Videos
          </h2>
          {videos.length === 0 ? (
            <div className="text-gray-500 text-center py-6 bg-white rounded-lg shadow">
              No videos saved yet.
            </div>
            ) : (
              <ul className="space-y-6">
                {videos.map((url, idx) => (
                  <li key={idx} className="bg-white rounded-lg shadow p-3 flex flex-col items-center">
                    <video src={url} controls className="w-full rounded-lg border border-gray-200" />
                    <span className="text-xs text-gray-400 mt-2">Video {videos.length - idx}</span>
                    <button
                      className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition"
                      onClick={() => {
                        const updated = videos.filter((v, i) => i !== idx);
                        setVideos(updated);
                        localStorage.setItem("face-videos", JSON.stringify(updated));
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </section>
      </main>

      {/* Footer */}
    </div>
  );
}
