# Face Tracking Application

This is a Next.js app for face tracking and video recording. It uses face-api.js for real-time face detection, MediaRecorder API for video recording, and Tailwind CSS for a responsive UI. Videos are saved to localStorage and can be viewed in the app.

## Getting Started

1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features
- Real-time face tracking (face-api.js)
- Video recording with face marker (MediaRecorder API)
- Save and view videos (localStorage)
- Responsive design (Tailwind CSS)

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- face-api.js
- MediaRecorder API
- localStorage

## Usage
1. Allow camera access when prompted.
2. Start recording; a face marker will appear and be visible in the recorded video.
3. Stop recording to save the video locally.
4. View saved videos in the app.
