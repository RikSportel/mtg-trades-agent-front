import React, { useState } from "react";
import { useSpeech } from "./useSpeech";
import { useAgent } from "./gptAgent";

function App() {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false);
  const [manualInput, setManualInput] = useState("");
 
  // Use the new agent hook
  const { messages, sendMessage } = useAgent();

  const startListening = useSpeech({
    onResult: async (text) => {
      setTranscript(text);
      setInterimTranscript("");
      const result = await sendMessage(text);
      setResponse(result);
      // Optional: Speak the result
      //const synth = window.speechSynthesis;
      //const utter = new SpeechSynthesisUtterance(result || "Done");
      //synth.speak(utter);
    },
    onInterimResult: (text) => {
      setInterimTranscript(text);
    },
    onStart: () => setListening(true),
    onEnd: () => setListening(false)
  });

  // Handler for manual text input
  const handleManualSend = async () => {
    setTranscript(manualInput);
    setInterimTranscript("");
    const result = await sendMessage(manualInput);
    setResponse(result);
    // Optional: Speak the result
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(result || "Done");
    synth.speak(utter);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', padding: 24, fontFamily: "Arial", width: '100vw', boxSizing: 'border-box' }}>
      <div style={{ width: '50%', marginRight: 24 }}>
        <h1>AI Voice Agent</h1>
        <button
          onClick={startListening}
          disabled={listening}
          style={{ background: listening ? '#ccc' : '', color: listening ? '#666' : '', cursor: listening ? 'not-allowed' : 'pointer' }}
        >
          {listening ? 'Listening...' : 'Start Talking'}
        </button>
        <div style={{ margin: "16px 0" }}>
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="Type your command here"
            style={{ width: "300px", marginRight: "8px" }}
          />
          <button onClick={handleManualSend}>Send</button>
        </div>
        <p><strong>Live:</strong> {interimTranscript}</p>
        <p><strong>You said:</strong> {transcript}</p>
        <pre>{response}</pre>
        {/* Show card image if response is a JSON string with image_url and status success */}
        {(() => {
          try {
            const obj = JSON.parse(response);
            if (obj && obj.image_url && obj.status === "success") {
              return (
                <div style={{ margin: "16px 0" }}>
                  <img src={obj.image_url} alt="Card" style={{ maxWidth: "300px", border: "1px solid #ccc" }} />
                  <div>
                    <strong>Set:</strong> {obj.set_code}<br />
                    <strong>Collector #:</strong> {obj.collector_number}
                  </div>
                </div>
              );
            }
          } catch (e) {}
          return null;
        })()}
        <h3>Conversation</h3>
        <ul>
          {(Array.isArray(messages) ? messages : []).map((msg, i) => (
            <li key={i}><strong>{msg.role}:</strong> {msg.content}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default App;
