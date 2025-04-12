import { useState } from 'react';
import axios from 'axios';
import './App.css';

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // ⚠️ Use for testing/dev only

function App() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askGemini = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const result = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              role: "user",
              parts: [{ text: question }]
            }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const answer = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
      setResponse(answer || "No response from Gemini.");
    } catch (err) {
      console.error(err);
      setResponse("Error talking to Gemini API.");
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <h1>⚖️ LegalBot</h1>
      <textarea
        rows="4"
        placeholder="Ask a legal question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button onClick={askGemini} disabled={loading}>
        {loading ? "Thinking..." : "Ask LegalBot"}
      </button>
      <div className="response">
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
      <p className="disclaimer">
        ⚠️ This is not legal advice. Always consult a licensed attorney.
      </p>
    </div>
  );
}

export default App;
