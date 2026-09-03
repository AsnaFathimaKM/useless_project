import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GOOD_SONGS = [
  "/songs/good/good1.mpeg",
  "/songs/good/good2.mpeg",
  "/songs/good/good3.mpeg",
];

const BAD_SONGS = [
  "/songs/bad/bad1.mpeg",
  "/songs/bad/bad2.mpeg",
  "/songs/bad/bad3.mpeg",
];

export default function Results() {
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const savedResult = localStorage.getItem("toothCheckResult");

    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (error) {
        console.error("Could not read saved result:", error);
      }
    }

    const savedLeaderboard =
      localStorage.getItem("palluPremierLeague");

    if (savedLeaderboard) {
      try {
        const parsed = JSON.parse(savedLeaderboard);

        parsed.sort((a, b) => b.score - a.score);

        setLeaderboard(parsed);
      } catch (error) {
        console.error("Could not read leaderboard:", error);
      }
    }
  }, []);

  // Play a random song based on the score
  useEffect(() => {
    if (!result) {
      return;
    }

    const score = Number(result.whiteness_score) || 0;

    const songList =
      score >= 60 ? GOOD_SONGS : BAD_SONGS;

    if (songList.length === 0) {
      return;
    }

    // Pick a random song
    const randomIndex = Math.floor(
      Math.random() * songList.length
    );

    const selectedSong = songList[randomIndex];

    console.log("Selected song:", selectedSong);

    const audio = new Audio(selectedSong);

    audio.volume = 1.0;

    audio.play().catch((error) => {
      console.log(
        "Browser blocked automatic audio playback:",
        error
      );
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [result]);

  if (!result) {
    return (
      <div className="results-page">
        <p>No results yet.</p>

        <button
          className="scan-again-button"
          onClick={() => navigate("/scan")}
        >
          Go Scan
        </button>
      </div>
    );
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      Number(result.whiteness_score) || 0
    )
  );

  const needleAngle = -90 + score * 1.8;

  return (
    <div className="results-page">
      <div className="results-container">

        <div className="veluppu-meter">
          <h1>Veluppu-o-Meter</h1>

          <div className="gauge">
            <svg
              viewBox="0 0 220 135"
              className="gauge-svg"
            >
              <defs>
                <linearGradient
                  id="gaugeGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor="#ef4444"
                  />

                  <stop
                    offset="50%"
                    stopColor="#facc15"
                  />

                  <stop
                    offset="100%"
                    stopColor="#22c55e"
                  />
                </linearGradient>
              </defs>

              <path
                d="M 20 110 A 90 90 0 0 1 200 110"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="18"
                strokeLinecap="round"
              />

              <line
                className="gauge-tick"
                x1="20"
                y1="110"
                x2="27"
                y2="110"
              />

              <line
                className="gauge-tick"
                x1="65"
                y1="45"
                x2="69"
                y2="52"
              />

              <line
                className="gauge-tick"
                x1="110"
                y1="20"
                x2="110"
                y2="29"
              />

              <line
                className="gauge-tick"
                x1="155"
                y1="45"
                x2="151"
                y2="52"
              />

              <line
                className="gauge-tick"
                x1="200"
                y1="110"
                x2="193"
                y2="110"
              />

              <g
                className="gauge-needle"
                transform={`rotate(${needleAngle} 110 110)`}
              >
                <line
                  x1="110"
                  y1="110"
                  x2="110"
                  y2="38"
                  stroke="#171717"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <circle
                  cx="110"
                  cy="110"
                  r="7"
                  fill="#171717"
                />
              </g>

              <text
                x="110"
                y="101"
                textAnchor="middle"
                className="gauge-score"
              >
                {score}
              </text>

              <text
                x="110"
                y="120"
                textAnchor="middle"
                className="gauge-out-of"
              >
                / 100
              </text>
            </svg>

            <div className="gauge-label gauge-label-0">
              0
            </div>

            <div className="gauge-label gauge-label-25">
              25
            </div>

            <div className="gauge-label gauge-label-50">
              50
            </div>

            <div className="gauge-label gauge-label-75">
              75
            </div>

            <div className="gauge-label gauge-label-100">
              100
            </div>
          </div>
        </div>

        <div className="pallu-league">
          <h2>Pallu Premier League</h2>

          <div className="leaderboard">
            {leaderboard.map((player, index) => {
              const isCurrentPlayer =
                player.id === result.id;

              return (
                <div
                  className={`leaderboard-row ${
                    isCurrentPlayer
                      ? "current-player"
                      : ""
                  }`}
                  key={player.id}
                >
                  <div className="leaderboard-rank">
                    {index + 1}
                  </div>

                  <div className="leaderboard-name">
                    {player.name}
                  </div>

                  <div className="leaderboard-score">
                    {player.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className="scan-again-button"
          onClick={() => navigate("/scan")}
        >
          Scan Again
        </button>

      </div>
    </div>
  );
}