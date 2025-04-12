import { useState } from 'react';
import axios from 'axios';
import './App.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("Loaded API Key:", GEMINI_API_KEY); // for debugging

function App() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Function to handle API request to Gemini
  const askGemini = async () => {
    if (!question.trim()) return;

    setLoading(true);

    // Create a new message object for the user's question
    const newUserMessage = { role: 'user', content: question };
    
    // Create conversation history to send to API
    // Limit to last 6 interactions (6 pairs of user and model messages)
    const historyToSend = [...chatHistory.slice(-12)];
    
    // Legal system prompt to constrain responses
    const legalSystemPrompt = "You are LegalBot, a specialized legal information assistant. Only answer questions related to legal matters, laws, regulations, legal processes, and legal concepts. If the question is not related to legal topics, politely explain that you can only provide legal information. Remember that you are providing legal information, not legal advice. Always remind users to consult with a licensed attorney for specific legal advice.";

    try {
      // Format conversation for Gemini API
      const contents = [
        {
          role: "user",
          parts: [{ text: legalSystemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "I understand. I am LegalBot, a specialized legal information assistant. I will only answer questions related to legal matters and will clarify that I'm providing information, not advice." }]
        }
      ];

      // Add conversation history
      historyToSend.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });

      // Add current question
      contents.push({
        role: "user",
        parts: [{ text: question }]
      });

      const result = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: contents
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      // Extract the response
      const answer = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
      const botResponse = answer || 'No response from Gemini.';
      
      // Update chat history with both user question and bot response
      setChatHistory(prev => [
        ...prev,
        newUserMessage,
        { role: 'model', content: botResponse }
      ]);
      
      // Reset question input
      setQuestion('');
    } catch (err) {
      console.error("Gemini API Error:", err);
    
      // Show detailed error in console
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Status:", err.response.status);
        console.error("Headers:", err.response.headers);
      } else if (err.request) {
        console.error("Request error:", err.request);
      } else {
        console.error("Message:", err.message);
      }
      
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev,
        newUserMessage,
        { role: 'model', content: "❌ Error talking to Gemini API. Please try again later." }
      ]);
    }
    
    setLoading(false);
  };

  return (
    <div className="app">
      <h1>⚖️ LegalBot</h1>

      <div className="chat-box">
        {chatHistory.length === 0 ? (
          <div className="welcome">
            <p>Welcome to LegalBot! Ask me any legal question.</p>
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div key={index} className={`bubble ${message.role === 'user' ? 'user' : 'bot'}`}>
              {message.content}
            </div>
          ))
        )}
        
        {loading && (
          <div className="bubble bot loading">
            <span>Thinking...</span>
          </div>
        )}
      </div>

      <textarea
        rows="4"
        placeholder="Ask a legal question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askGemini();
          }
        }}
      />

      <button onClick={askGemini} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask LegalBot'}
      </button>

      <p className="disclaimer">
        ⚠️ This is not legal information, not legal advice. Always consult a licensed attorney.
      </p>
    </div>
  );
}

export default App;