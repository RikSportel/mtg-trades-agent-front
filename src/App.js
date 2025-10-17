import React, { useState } from "react";
import { useSpeech } from "./useSpeech";
//import { useAgent } from "./gptAgent";
import ReactMarkdown from "react-markdown";

function App() {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  //const { messages, sendMessage } = useAgent();
  const [messages, setMessages] = useState([]);

  const startListening = useSpeech({
    onResult: async (text) => {
      setTranscript(text);
      setInterimTranscript("");
      setLoading(true);
      // THIS IS WHERE I AM USING SPEECH TO TEXT; UPDATE LATER.
      // const result = await sendMessage(text);
      setLoading(false);
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
    setLoading(true);
    setResponse(""); // Clear previous response
    console.log("Messages before fetch:", messages);
    let trimmedMessages = messages;
    if (
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      Array.isArray(messages[messages.length - 1].content) &&
      messages[messages.length - 1].content.length > 0
    ) {
      trimmedMessages = messages.slice(0, -1);
      setMessages(trimmedMessages);
    }

    //console.log("Starting streaming fetch for:", manualInput);
    const response = await fetch("http://localhost:8080/api/stream", {
      method: "POST",
      body: JSON.stringify({ message: manualInput, messages: trimmedMessages }),
      headers: { "Content-Type": "application/json" }
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let buffer = "";
    let partialLine = "";
    let streamedItems = [];

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunk = decoder.decode(value, { stream: !done });
      buffer += chunk;
      
      const lines = (partialLine + buffer).split(/\r?\n/);
      partialLine = lines.pop() || "";
      buffer = "";

      try {
        //console.log("Buffer is now:", buffer);
        //setResponse(buffer);
        // If the backend streams newline-delimited JSON objects:
        //const lines = chunk.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          try {
            if (line.startsWith("data:")) {
              const jsonStr = line.slice(5).trim();
              const obj = JSON.parse(jsonStr);
              streamedItems.push(obj);
              setResponse(obj.step);
            }
          } catch {
            console.log("Failed to parse line:", line);
          }
        }
      } catch (err) {
        console.log("Error parsing chunk:", err);
      }
    }

    const finalItem = streamedItems.length > 0 ? streamedItems[streamedItems.length - 1] : null;
    if (finalItem) {
      setResponse(JSON.stringify(finalItem, null, 2));
      setMessages(finalItem);
    } else {
      setResponse(buffer);
    }
    setLoading(false);

    //Optional: Speak the result
    //const synth = window.speechSynthesis;
    //const utter = new SpeechSynthesisUtterance(result || "Done");
    //synth.speak(utter);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', padding: 24, fontFamily: "Arial", width: '100vw', boxSizing: 'border-box' }}>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(128,128,128,0.4)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{
            background: "#fff",
            padding: "32px 48px",
            borderRadius: 12,
            boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
            fontSize: "1.5em",
            color: "#444"
          }}>
      <ReactMarkdown>
        {response && response.length > 0 ? response : "Loading..."}
      </ReactMarkdown>
          </div>
        </div>
      )}
      <div style={{ width: '50%', marginRight: 24 }}>
        <h2>Rik Sportel's MTG tracker AI Agent</h2>
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
          <h4>Agent Response</h4>
          <div style={{ fontSize: '1.2em', minHeight: 40 }}>
            {(() => {
              const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
              if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
                // If lastMsg.content is an array of objects (table), render table
                if (
                  Array.isArray(lastMsg.content) &&
                  lastMsg.content.length > 0 &&
                  lastMsg.content.every(obj => typeof obj === 'object' && obj !== null && !obj.text)
                ) {
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', marginBottom: 16 }}>
                      <tbody>
                        {lastMsg.content.map((obj, idx) => (
                          <React.Fragment key={idx}>
                            <tr>
                              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{idx + 1}</td>
                              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{obj.set_name}</td>
                              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{obj.collector_number}</td>
                              <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                <input type="checkbox" checked={!!obj.foil} disabled />
                              </td>
                              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{obj.prices?.eur_foil ?? ''}</td>
                              <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                <input type="checkbox" checked={!!obj.nonfoil} disabled />
                              </td>
                              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{obj.prices?.eur ?? ''}</td>
                              <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                {obj.legalities?.commander === "not_legal" && (
                                  <span style={{ color: 'red', fontWeight: 'bold' }}>B</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={8} style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                {obj.image_uris?.small && (
                                  <img src={obj.image_uris.normal} alt="card" style={{ maxHeight: 300 }} />
                                )}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  );
                }
                // If lastMsg.content is a string, render markdown
                if (typeof lastMsg.content === 'string') {
                  return <ReactMarkdown>{lastMsg.content}</ReactMarkdown>;
                }
                // If lastMsg.content is an array of objects with a 'text' property, render markdown for each
                if (
                  Array.isArray(lastMsg.content) &&
                  lastMsg.content.length > 0 &&
                  lastMsg.content.every(obj => typeof obj === 'object' && obj !== null && typeof obj.text === 'string')
                ) {
                  return lastMsg.content.map((obj, idx) => (
                    <ReactMarkdown key={idx}>{obj.text}</ReactMarkdown>
                  ));
                }
              }
              return <em>No agent response yet.</em>;
            })()}
          </div>
        </div>
        <div style={{ margin: '24px 0' }}>
          <h4>Tool Calls</h4>
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
                  if (msg.type === 'function_call') {
                    // Find the result message with matching call_id
                    const resultMsg = messages.find(
                      m => m.type === 'function_call_output' && m.call_id === msg.call_id
                    );
                    //console.log("Tool call:", msg, "Result:", resultMsg);
                    rows.push(
                      <tr key={i}>
                      <td style={{ border: '1px solid #ccc', padding: '6px' }}>{msg.name}</td>
                      <td style={{ border: '1px solid #ccc', padding: '6px' }}>{msg.arguments}</td>
                      <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                        {resultMsg ? (
                        typeof resultMsg.result === 'object'
                          ? JSON.stringify(resultMsg.output)
                          : resultMsg.output
                        ) : <em>Pending...</em>}
                      </td>
                      </tr>
                    );
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
        <h4>Conversation</h4>
        <ul>
          {messages.map((msg, idx) => (
            <li key={idx} style={{ marginBottom: 8, fontSize: '0.95em', wordBreak: 'break-word' }}>
              <pre style={{ background: '#f0f0f0', padding: 8, borderRadius: 4, overflowX: "hidden" }}>
                {JSON.stringify(msg, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default App;
