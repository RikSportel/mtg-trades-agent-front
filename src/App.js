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

        {/* 1. Render last agent message at the top */}
        <div style={{ margin: '24px 0', padding: '12px', background: '#f6f6f6', borderRadius: 8 }}>
          <h2>Agent Response</h2>
          <div style={{ fontSize: '1.2em', minHeight: 40 }}>
            {(() => {
              const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
              if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
                return lastMsg.content;
              }
              return <em>No agent response yet.</em>;
            })()}
          </div>
        </div>

        {/* 2. Table for tool calls and results */}
        <div style={{ margin: '24px 0' }}>
          <h2>Tool Calls</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Tool Name</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Arguments</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Find all assistant messages with tool_calls
                const rows = [];
                (Array.isArray(messages) ? messages : []).forEach((msg, i) => {
                  if (msg.role === 'assistant' && Array.isArray(msg.tool_calls)) {
                    msg.tool_calls.forEach((call, idx) => {
                      // Find matching tool response by id
                      const toolMsg = (Array.isArray(messages) ? messages : []).find(
                        m => m.role === 'tool' && m.tool_call_id === call.id
                      );
                      let result = '';
                      if (toolMsg && toolMsg.content) {
                        try {
                          result = JSON.stringify(JSON.parse(toolMsg.content), null, 2);
                        } catch {
                          result = toolMsg.content;
                        }
                      }
                      rows.push(
                        <tr key={i + '-' + idx}>
                          <td style={{ border: '1px solid #ccc', padding: '6px' }}>{call.function.name}</td>
                          <td style={{ border: '1px solid #ccc', padding: '6px' }}>{call.function.arguments}</td>
                          <td style={{ border: '1px solid #ccc', padding: '6px' }}><pre style={{ margin: 0 }}>{result}</pre></td>
                        </tr>
                      );
                    });
                  }
                });
                return rows.length > 0 ? rows : (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '12px' }}><em>No tool calls yet.</em></td></tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* Conversation history (optional, can be removed for clarity) */}
        <h3>Conversation</h3>
        <ul>
          {(Array.isArray(messages) ? messages : []).map((msg, i) => (
            <li key={i}>
              <strong>{msg.role}:</strong>{" "}
              {typeof msg.content === "string"
                ? msg.content
                : Array.isArray(msg.content)
                  ? msg.content.map((item, idx) => (
                      <span key={idx}>{JSON.stringify(item)} </span>
                    ))
                  : JSON.stringify(msg.content)}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default App;
