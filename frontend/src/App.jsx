import axios from "axios";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import styled, { keyframes } from "styled-components";

const API = "http://127.0.0.1:8000";

function App() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const chatRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, loading]);

  const askQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) return;

    const newMessages = [
      ...messages,
      { role: "user", content: trimmedQuestion }
    ];

    setMessages(newMessages);
    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.get(`${API}/ask`, {
        params:{ question: trimmedQuestion }
      });

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: res?.data?.answer || "No answer received from server."
        }
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "⚠ Error connecting to AI server."
        }
      ]);
      console.error("ASK ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(`${API}/upload`, formData);

      if (res.data.message === "This document is already uploaded") {
        alert("This pdf is already uploaded");
      } else {
        alert("✅ File uploaded successfully!");
      }
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      alert("❌ Upload failed.");
    } finally {
      e.target.value = "";
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch (error) {
      console.error("COPY ERROR:", error);
      alert("Copy failed.");
    }
  };

  const downloadText = (text) => {
    try {
      const element = document.createElement("a");
      const fileBlob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(fileBlob);

      element.href = url;
      element.download = "ai-answer.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DOWNLOAD ERROR:", error);
      alert("Download failed.");
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Wrapper $dark={darkMode}>
      <div className="container">
        <nav className="navbar">
          <div className="nav-left">
            <span className="logo"></span>
            <span className="title">Smart Education Tutor</span>
          </div>

          <div className="nav-center">
            <span className="status">Edu. AI</span>
          </div>

          <div className="nav-right">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="application/pdf"
              onChange={handleFileChange}
            />

            <button className="upload-btn" onClick={handleUploadClick}>
              Upload
            </button>

            <button className="clear-btn" onClick={clearChat}>
              Clear
            </button>

            <button
              className="mode-btn"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "☀" : "🌙"}
            </button>
          </div>
        </nav>

        <div className="messages-area" ref={chatRef}>
          {messages.length === 0 && (
            <div className="welcome-box">
              <h2>Welcome to Smart Education Tutor</h2>
              <p>Upload your PDF and ask questions from your study material.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={msg.role === "user" ? "message user" : "message ai"}
            >
              <div className="message-bubble">
                <div className="message-content">
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>

              {msg.role === "assistant" && (
                <div className="msg-actions">
                  <button onClick={() => copyText(msg.content)}>Copy</button>
                  <button onClick={() => downloadText(msg.content)}>
                    Download
                  </button>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message ai">
              <div className="message-bubble">
                <div className="message-content typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sender-area">
          <div className="input-place">
            <input
              placeholder="Ask anything about your document..."
              className="send-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  askQuestion();
                }
              }}
            />

            <button
              className="send"
              onClick={askQuestion}
              disabled={loading}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

/* ---------- keyframes ---------- */
const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const blink = keyframes`
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1);   opacity: 1;   }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,179,237,0); }
  50%       { box-shadow: 0 0 18px 4px rgba(99,179,237,0.18); }
`;

/* ---------- styled component ---------- */
const Wrapper = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');

  /* ── tokens ── */
  --radius-sm:  8px;
  --radius-md:  14px;
  --radius-lg:  22px;
  --radius-xl:  32px;

  ${({ $dark }) => $dark ? `
    --bg-page:        #0b0c12;
    --bg-container:   #11121a;
    --bg-nav:         #11121acc;
    --bg-user-msg:    #1a3a6e;
    --bg-ai-msg:      #1c1e2e;
    --bg-input:       #1c1e2e;
    --bg-btn-primary: #2a6df5;
    --bg-btn-clear:   #22233a;
    --bg-mode-btn:    #22233a;
    --border-nav:     rgba(255,255,255,0.07);
    --border-input:   rgba(255,255,255,0.09);
    --border-msg-user: rgba(96,165,250,0.45);
    --border-msg-ai:   rgba(167,139,250,0.2);
    --text-primary:   #f0f2ff;
    --text-secondary: #8b91b8;
    --text-accent:    #7dd3fc;
    --text-user-msg:  #ffffff;
    --text-ai-msg:    #e2e6f8;
    --text-title:     #ffffff;
    --accent-1:       #3b82f6;
    --accent-2:       #8b5cf6;
    --accent-glow:    rgba(59,130,246,0.3);
    --user-glow:      rgba(96,165,250,0.25);
    --ai-glow:        rgba(167,139,250,0.15);
    --scrollbar-thumb: rgba(255,255,255,0.1);
    --welcome-icon-bg: rgba(59,130,246,0.15);
    --action-btn-bg:  rgba(255,255,255,0.07);
    --action-btn-hover: rgba(255,255,255,0.14);
    --user-label-color: #93c5fd;
    --ai-label-color:   #c4b5fd;
  ` : `
    --bg-page:        #eef0f7;
    --bg-container:   #ffffff;
    --bg-nav:         #ffffffee;
    --bg-user-msg:    #2563eb;
    --bg-ai-msg:      #f5f3ff;
    --bg-input:       #f0f1f8;
    --bg-btn-primary: #2563eb;
    --bg-btn-clear:   #e4e6f3;
    --bg-mode-btn:    #e4e6f3;
    --border-nav:     rgba(0,0,0,0.08);
    --border-input:   rgba(0,0,0,0.09);
    --border-msg-user: rgba(37,99,235,0.0);
    --border-msg-ai:   rgba(109,40,217,0.18);
    --text-primary:   #12142a;
    --text-secondary: #5b6280;
    --text-accent:    #2563eb;
    --text-user-msg:  #ffffff;
    --text-ai-msg:    #1a1c35;
    --text-title:     #0d0f22;
    --accent-1:       #2563eb;
    --accent-2:       #7c3aed;
    --accent-glow:    rgba(37,99,235,0.2);
    --user-glow:      rgba(37,99,235,0.22);
    --ai-glow:        rgba(109,40,217,0.12);
    --scrollbar-thumb: rgba(0,0,0,0.13);
    --welcome-icon-bg: rgba(37,99,235,0.09);
    --action-btn-bg:  rgba(0,0,0,0.05);
    --action-btn-hover: rgba(0,0,0,0.1);
    --user-label-color: #bfdbfe;
    --ai-label-color:   #6d28d9;
  `}

  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-page);
  font-family: 'DM Sans', sans-serif;
  transition: background 0.3s ease;

  /* ── scrollbar ── */
  * { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) transparent; }
  *::-webkit-scrollbar { width: 5px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 10px; }

  /* ══════════ CONTAINER ══════════ */
  .container {
    width: 100%;
    height: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    background: var(--bg-container);
    position: relative;
    overflow: hidden;
    transition: background 0.3s ease;
  }

  /* subtle grid texture */
  .container::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* ══════════ NAVBAR ══════════ */
  .navbar {
    height: 66px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-nav);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-nav);
    transition: background 0.3s ease;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    font-size: 22px;
    line-height: 1;
    filter: drop-shadow(0 0 6px var(--accent-glow));
  }

  .title {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--text-title);
    background: linear-gradient(120deg, var(--accent-1), var(--accent-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .nav-center {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-secondary);
    background: linear-gradient(90deg, var(--accent-1), var(--accent-2), var(--accent-1));
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${shimmer} 4s linear infinite;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ── nav buttons shared ── */
  .upload-btn,
  .clear-btn,
  .mode-btn {
    padding: 7px 16px;
    border: 1px solid var(--border-input);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    outline: none;
  }

  .upload-btn {
    background: var(--bg-btn-primary);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 12px var(--accent-glow);
  }
  .upload-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px var(--accent-glow);
    filter: brightness(1.1);
  }
  .upload-btn:active { transform: translateY(0); }

  .clear-btn {
    background: var(--bg-btn-clear);
    color: var(--text-secondary);
  }
  .clear-btn:hover {
    color: var(--text-primary);
    border-color: var(--accent-1);
    transform: translateY(-1px);
  }

  .mode-btn {
    background: var(--bg-mode-btn);
    color: var(--text-secondary);
    padding: 7px 12px;
    font-size: 15px;
  }
  .mode-btn:hover {
    color: var(--text-primary);
    transform: rotate(15deg) scale(1.1);
  }

  /* ══════════ MESSAGES AREA ══════════ */
  .messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 32px 28px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* ── welcome ── */
  .welcome-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin: auto;
    padding: 48px 32px;
    animation: ${fadeSlideIn} 0.6s ease both;
  }

  .welcome-box::before {
    content: '🎓';
    font-size: 48px;
    display: block;
    margin-bottom: 20px;
    padding: 20px;
    background: var(--welcome-icon-bg);
    border-radius: 50%;
    line-height: 1;
    filter: drop-shadow(0 0 16px var(--accent-glow));
  }

  .welcome-box h2 {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--text-title);
    margin: 0 0 12px;
    letter-spacing: -0.5px;
  }

  .welcome-box p {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.6;
    max-width: 360px;
    margin: 0;
  }

  /* ── messages ── */
  /* ── message row wrapper ── */
  .message {
    max-width: 74%;
    padding: 0;
    margin-bottom: 18px;
    animation: ${fadeSlideIn} 0.35s ease both;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  /* ── sender label ── */
  .message.user { align-items: flex-end; margin-left: auto; }
  .message.ai   { align-items: flex-start; }

  .message.user::before  { content: 'You';       color: var(--user-label-color); font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 5px; padding-right: 4px; }
  .message.ai::before    { content: '✦  Edu AI'; color: var(--ai-label-color);   font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 5px; padding-left: 4px; }

  /* ── bubble ── */
  .message-bubble {
    padding: 14px 18px;
    border-radius: var(--radius-md);
    line-height: 1.7;
    word-wrap: break-word;
    position: relative;
  }

  .message.user .message-bubble {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    color: #ffffff;
    border-radius: var(--radius-md) var(--radius-md) 4px var(--radius-md);
    border: 1px solid var(--border-msg-user);
    box-shadow: 0 6px 28px var(--user-glow), 0 2px 8px rgba(0,0,0,0.2);
  }

  .message.ai .message-bubble {
    background: var(--bg-ai-msg);
    color: var(--text-ai-msg);
    border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 4px;
    border: 1px solid var(--border-msg-ai);
    box-shadow: 0 4px 20px var(--ai-glow), 0 1px 4px rgba(0,0,0,0.1);
  }

  /* left accent stripe on AI bubble */
  .message.ai .message-bubble::before {
    content: '';
    position: absolute;
    left: 0; top: 14%; bottom: 14%;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, var(--accent-1), var(--accent-2));
    opacity: 0.7;
  }

  /* message-content now sits inside .message-bubble */
  .message-content { width: 100%; }

  .message-content p { margin: 0 0 8px 0; }
  .message-content p:last-child { margin-bottom: 0; }

  .message-content ul,
  .message-content ol {
    padding-left: 20px;
    margin: 8px 0;
  }

  .message-content li { margin-bottom: 4px; }

  .message-content code {
    background: rgba(99,179,237,0.12);
    color: var(--text-accent);
    padding: 2px 7px;
    border-radius: 5px;
    font-size: 13px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    border: 1px solid rgba(99,179,237,0.2);
  }

  .message-content pre {
    background: rgba(0,0,0,0.25);
    border-radius: var(--radius-sm);
    padding: 14px;
    overflow-x: auto;
    border: 1px solid var(--border-msg);
  }

  .message-content pre code {
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
  }

  /* ── action buttons ── */
  .msg-actions {
    margin-top: 7px;
    display: flex;
    gap: 8px;
    padding-left: 6px;
  }

  .msg-actions button {
    padding: 5px 12px;
    font-size: 11px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    letter-spacing: 0.3px;
    border: 1px solid var(--border-input);
    border-radius: 20px;
    cursor: pointer;
    background: var(--action-btn-bg);
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }

  .msg-actions button:hover {
    background: var(--action-btn-hover);
    color: var(--text-primary);
    border-color: var(--accent-1);
    transform: translateY(-1px);
  }

  /* ── typing indicator ── */
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 0;
  }

  .typing-indicator span {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-accent);
    animation: ${blink} 1.4s infinite ease-in-out both;
  }

  .typing-indicator span:nth-child(1) { animation-delay: 0s; }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

  /* ══════════ SENDER AREA ══════════ */
  .sender-area {
    padding: 18px 24px 22px;
    border-top: 1px solid var(--border-nav);
    background: var(--bg-nav);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    position: relative;
    z-index: 1;
  }

  .input-place {
    display: flex;
    align-items: center;
    background: var(--bg-input);
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-input);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    gap: 10px;
  }

  .input-place:focus-within {
    border-color: var(--accent-1);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .send-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    line-height: 1.5;
  }

  .send-input::placeholder {
    color: var(--text-secondary);
    font-size: 14px;
  }

  .send {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: #fff;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
    border: none;
    border-radius: 10px;
    flex-shrink: 0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 10px var(--accent-glow);
  }

  .send:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 4px 16px var(--accent-glow);
  }

  .send:active:not(:disabled) { transform: scale(0.96); }

  .send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ══════════ RESPONSIVE ══════════ */
  @media (max-width: 768px) {
    .navbar {
      padding: 0 14px;
      gap: 8px;
      flex-wrap: wrap;
      height: auto;
      min-height: 62px;
    }

    .nav-center { display: none; }

    .title { font-size: 15px; }

    .nav-right { gap: 6px; flex-wrap: wrap; }

    .message {
      max-width: 92%;
    }

    .message.ai::before,
    .message.user::before { display: none; }

    .messages-area { padding: 20px 20px; }
  }
`;

export default App;