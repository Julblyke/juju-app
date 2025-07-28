import { useState, useRef, useEffect } from "react";
import "./App.css";
import juju from "./juju.png";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [polling, setPolling] = useState(false);
  const thinkingTranslations = [
    "Thinking ...", "Pondering ...", "Reasoning ...", "Thinking about lunch ...",
    "Did I lock my car?...", "Contemplating...", "Sorry I'm still new at this...",
    "I have performance anxiety just give me a minute..", "The weather today ...right??...",
    "Thinking about lunch again...", "Any hot takes in the room?", "I think Chipotle is overrated",
    "And now I'm thinking about lunch again..", "I'm almost there I promise", "It's hard being a robot out here"
  ];
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const thinkingInterval = useRef(null);
  const [typewriterText, setTypewriterText] = useState("");
  const typewriterTimeout = useRef(null);
  const pollingInterval = useRef(null);

  // Hook: Thinking animation
  useEffect(() => {
    if (loading || polling) {
      setThinkingIndex(0);
      thinkingInterval.current = setInterval(() => {
        setThinkingIndex((prev) => (prev + 1) % thinkingTranslations.length);
      }, 1500);
    } else {
      clearInterval(thinkingInterval.current);
    }
    return () => clearInterval(thinkingInterval.current);
  }, [loading, polling]);
  console.log("Typewriter will use result:", JSON.stringify(result));


  // Hook: Typewriter effect
 useEffect(() => {
  if (!loading && !polling && result) {
    let i = 0;
    let display = "";
    setTypewriterText(""); // Clear UI

    function type() {
      if (i < result.length) {
        display += result.charAt(i); // Build up the string locally
        setTypewriterText(display);  // Set state with the full string so far
        i++;
        typewriterTimeout.current = setTimeout(type, 15);
      }
    }
    typewriterTimeout.current = setTimeout(type, 10);
    return () => clearTimeout(typewriterTimeout.current);
  } else if (loading || polling) {
    setTypewriterText("");
  }
}, [result, loading, polling]);






  // Poll job status using jobId
  const pollJobStatus = (jobId) => {
    setPolling(true);
    pollingInterval.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`https://a440vqctkb.execute-api.us-east-1.amazonaws.com/juju-stage/job-status/${jobId}`);
        const data = await statusRes.json();
        console.log("Job status data:", data);

        if (data.status === "complete") {
          clearInterval(pollingInterval.current);
          setResult(data.result || "No result found.");
          setPolling(false);
          setLoading(false);
        } else if (data.status === "error") {
          clearInterval(pollingInterval.current);
          setResult(data.error || "Error processing job.");
          setPolling(false);
          setLoading(false);
        }
        // else: still pending/processing, keep polling
      } catch (err) {
        clearInterval(pollingInterval.current);
        setResult("Error checking job status.");
        setPolling(false);
        setLoading(false);
      }
    }, 2500); // Poll every 2.5 seconds
  };

  // Function to handle ask button click
  const handleAsk = async () => {
    if (input.trim() === "") {
      setInputError(true);
      setTimeout(() => setInputError(false), 500);
      return;
    }
    setResult("");
    setLoading(true);
    setPolling(false);
  console.log("Sending to /start-job:", {
    inputText: input,
  });

    try {
      // 1. Start job
      const response = await fetch("https://a440vqctkb.execute-api.us-east-1.amazonaws.com/juju-stage/start-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText: input,
        }),
      });
      const data = await response.json();
      if (data.jobId) {
        pollJobStatus(data.jobId);
      } else {
        setResult("Could not start job.");
        setLoading(false);
      }
    } catch (error) {
      setResult("Error starting job.");
      setLoading(false);
    }
    setInput("");
  };

  return (
  <div className="main-container">
    {/* No header here if it's in your background image */}
    <div className="bubble-content-wrapper">
      <pre className={`result-content${loading || polling ? ' loading-content' : ''}`}>
        {(loading || polling) ? (
          <span className="thinking-wrapper">
            <span className="spinner" />
            <span className="thinking-text">{thinkingTranslations[thinkingIndex]}</span>
          </span>
        ) : (
          (typeof typewriterText === "string"
  ? typewriterText.split('\n\n').map((para, idx) => <p key={idx}>{para}</p>)
  : "")

        )}
    
    </div>
    <div className={`input-wrapper${inputError ? " input-error" : ""}`}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading && !polling) {
            handleAsk();
          }
        }}
        placeholder="Ask me something..."
        className="ask-input"
        disabled={loading || polling}
      />
      <button onClick={handleAsk} disabled={loading || polling || input.trim() === ""} className="ask-button">
        Ask
      </button>
    </div>
  </div>
);

}

export default App;
