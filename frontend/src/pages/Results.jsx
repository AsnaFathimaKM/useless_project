import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Results() {
  const navigate = useNavigate();

  const [result, setResult] = useState(null);

  useEffect(() => {
    const savedResult = localStorage.getItem("toothCheckResult");

    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (error) {
        console.error("Could not read saved result:", error);
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>
          No results yet.{" "}
          <button
            onClick={() => navigate("/scan")}
            className="underline"
          >
            Go scan
          </button>
        </p>
      </div>
    );
  }

  const {
    shade,
    whiteness_score,
    yellowing,
    staining,
    confidence,
  } = result;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">

      <h2 className="text-xl text-gray-500">
        Your Tooth Shade
      </h2>

      <div className="text-5xl font-bold">
        {shade}
      </div>

      <div className="text-lg">
        Whiteness Score: {whiteness_score}/100
      </div>

      <div>
        Yellowing: {yellowing}
      </div>

      <div>
        Staining: {staining}
      </div>

      <div className="text-sm text-gray-400">
        Confidence: {(confidence * 100).toFixed(0)}%
      </div>

      <button
        onClick={() => navigate("/scan")}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        Scan Again
      </button>

    </div>
  );
}