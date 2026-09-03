import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Scan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const navigate = useNavigate();

  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState(
    "Align your teeth with the cat's mouth"
  );

  useEffect(() => {
    let currentStream = null;

    async function startCamera() {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        setStream(currentStream);

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (error) {
        console.error("Camera error:", error);

        setMessage(
          "Camera access failed. Please allow camera permission."
        );
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function captureAndAnalyze() {
    if (!videoRef.current) return;

    setScanning(true);
    setMessage("Analyzing your teeth...");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    /*
      IMPORTANT:
      Send the complete camera frame to FastAPI.

      We only visually crop the camera on the frontend.
      MediaPipe still receives the complete face.
    */
    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            image: imageData,
          }),
        }
      );

      const data = await response.json();

      console.log("Backend result:", data);

      if (data.error) {
        setMessage(
          data.messages?.join(" ") ||
            "Could not analyze your teeth."
        );

        setScanning(false);
        return;
      }

      localStorage.setItem(
        "toothCheckResult",
        JSON.stringify(data)
      );

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      navigate("/results");

    } catch (error) {
      console.error("Analysis error:", error);

      setMessage(
        "Could not connect to the ToothCheck backend."
      );

      setScanning(false);
    }
  }

  return (
    <div className="scan-page">

      {/* TITLE */}

      <h1>
        Position your teeth in the frame
      </h1>

      <p className="scan-subtitle">
        Align your teeth with the cat's mouth
      </p>


      {/* ================================================= */}
      {/* CAT IMAGE + LIVE CAMERA                         */}
      {/* ================================================= */}

      <div className="cat-camera">

        {/* CAT IMAGE */}

        <img
          src="/cat-mouth-guide.jpeg"
          alt="ToothCheck cat guide"
          className="cat-image"
        />


        {/* ================================================= */}
        {/* LIVE CAMERA                                      */}
        {/* ================================================= */}

        <div className="mouth-camera">

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />

        </div>


        {/* CAMERA LABEL */}

        <div className="camera-label">

          <span className="camera-dot"></span>

          Camera

        </div>

      </div>


      {/* ================================================= */}
      {/* INSTRUCTION                                      */}
      {/* ================================================= */}

      <div className="scan-instruction">

        <div className="tooth-circle">
          <span>♡</span>
        </div>

        <span>
          Make sure your teeth are clearly visible and well-lit.
        </span>

      </div>


      {/* ================================================= */}
      {/* CAPTURE BUTTON                                   */}
      {/* ================================================= */}

      <button
        className="capture-button"
        onClick={captureAndAnalyze}
        disabled={scanning}
      >

        <span className="capture-camera-icon">
          ▣
        </span>

        {scanning ? "Analyzing..." : "Capture"}

      </button>


      {/* STATUS */}

      <div className="scan-status">
        {message}
      </div>


      {/* HIDDEN CANVAS */}

      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
      />

    </div>
  );
}