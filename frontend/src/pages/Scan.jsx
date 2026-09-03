import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Scan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [name, setName] = useState("");

  const [message, setMessage] = useState(
    "Align your teeth with the cat's mouth"
  );

  useEffect(() => {
    async function startCamera() {
      try {
        const currentStream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

        streamRef.current = currentStream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            currentStream;
        }
      } catch (error) {
        console.error(
          "Camera error:",
          error
        );

        setMessage(
          "Camera access failed. Please allow camera permission."
        );
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  async function captureAndAnalyze() {
    if (!videoRef.current) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage(
        "Please enter your name first."
      );
      return;
    }

    setScanning(true);

    setMessage(
      "Analyzing your teeth..."
    );

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setMessage(
        "Camera is not ready yet. Please wait a moment and try again."
      );

      setScanning(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData =
      canvas.toDataURL(
        "image/jpeg",
        0.9
      );

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            image: imageData,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Backend result:",
        data
      );

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.message ||
            "Backend returned an error."
        );

        setScanning(false);
        return;
      }

      if (data.error) {
        setMessage(
          data.messages?.join(" ") ||
            "Could not analyze your teeth."
        );

        setScanning(false);
        return;
      }

      /*
       * Create a unique ID for this scan.
       */
      const scanId = Date.now();

      /*
       * Save the current result.
       */
      const resultWithName = {
        ...data,
        name: trimmedName,
        id: scanId,
      };

      localStorage.setItem(
        "toothCheckResult",
        JSON.stringify(
          resultWithName
        )
      );

      /*
       * Load existing leaderboard.
       */
      let existingLeaderboard = [];

      try {
        existingLeaderboard =
          JSON.parse(
            localStorage.getItem(
              "palluPremierLeague"
            ) || "[]"
          );

        if (
          !Array.isArray(
            existingLeaderboard
          )
        ) {
          existingLeaderboard = [];
        }
      } catch (error) {
        console.error(
          "Could not read leaderboard:",
          error
        );

        existingLeaderboard = [];
      }

      /*
       * Create leaderboard entry.
       */
      const newEntry = {
        name: trimmedName,
        score:
          Number(
            data.whiteness_score
          ) || 0,
        id: scanId,
      };

      /*
       * Add the new player.
       */
      const updatedLeaderboard = [
        ...existingLeaderboard,
        newEntry,
      ];

      /*
       * Highest score first.
       */
      updatedLeaderboard.sort(
        (a, b) =>
          Number(b.score) -
          Number(a.score)
      );

      /*
       * Save leaderboard.
       */
      localStorage.setItem(
        "palluPremierLeague",
        JSON.stringify(
          updatedLeaderboard
        )
      );

      /*
       * Stop the camera.
       */
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current = null;
      }

      /*
       * Go to results page.
       */
      navigate("/results");
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setMessage(
        "Could not connect to the ToothCheck backend."
      );

      setScanning(false);
    }
  }

  return (
    <div className="scan-page">

      <h1>
        Position your teeth in the frame
      </h1>

      <p className="scan-subtitle">
        Align your teeth with the cat's mouth
      </p>

      <div className="cat-camera">

        <img
          src="/cat-mouth-guide.jpeg"
          alt="ToothCheck cat guide"
          className="cat-image"
        />

        <div className="mouth-camera">

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />

        </div>

        <div className="camera-label">

          <span className="camera-dot"></span>

          Camera

        </div>

      </div>

      <div className="scan-instruction">

        <div className="tooth-circle">
          <span>♡</span>
        </div>

        <span>
          Make sure your teeth are clearly
          visible and well-lit.
        </span>

      </div>

      <div className="name-input-container">

        <label htmlFor="player-name">
          Enter your name
        </label>

        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Your name"
          maxLength={30}
          disabled={scanning}
        />

      </div>

      <button
        className="capture-button"
        onClick={captureAndAnalyze}
        disabled={scanning}
      >

        <span className="capture-camera-icon">
          ▣
        </span>

        {scanning
          ? "Analyzing..."
          : "Capture"}

      </button>

      <div className="scan-status">
        {message}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: "none",
        }}
      />

    </div>
  );
}