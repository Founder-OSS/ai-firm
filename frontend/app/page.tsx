"use client";
import { useState, useRef, useEffect } from "react";
interface Message { role: "user" | "agent"; text: string; ts: string; }
async function sendToAgent(history: Message[]): Promise<string> {
  try {
    const messages = history.map(m => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text }));
    const res = await fetch("http://localhost:8080/api/agent/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }) });
    const data = await res.json();
    return data.reply;
  } catch { return "Backend offline. Run: cd ~/ai-firm/backend && cargo run"; }
}
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking"|"online"|"offline">("checking");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages([{ role: "agent", text: "ai-firm agent online. The Way to Rust begins here.", ts: new Date().toLocaleTimeString() }]);
    fetch("http://localhost:8080/api/health").then(r=>r.json()).then(()=>setStatus("online")).catch(()=>setStatus("offline"));
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = async () => {
    if (!input.trim() || loading) return;
    const u: Message = { role: "user", text: input, ts: new Date().toLocaleTimeString() };
    const updated = [...messages, u];
    setMessages(updated); setInput(""); setLoading(true);
    const reply = await sendToAgent(updated);
    setMessages(m=>[...m,{ role:"agent", text:reply, ts:new Date().toLocaleTimeString() }]);
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",color:"#e8e0d0",fontFamily:"monospace",display:"flex",flexDirection:"column"}}>
      <header style={{borderBottom:"1px solid #1e1e1e",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{color:"#c0622f",fontWeight:700,letterSpacing:2}}>AI-FIRM // The Way to Rust</span>
        <span style={{fontSize:11,color:"#444"}}>{status==="online"?"RUST ONLINE":status==="offline"?"RUST OFFLINE":"CONNECTING..."}</span>
      </header>
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px",display:"flex",flexDirection:"column",gap:16}}>
          {messages.map((msg,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:3}}>
              <div style={{fontSize:10,color:"#333"}}>{msg.role==="user"?"YOU":"AGENT"} {msg.ts}</div>
              <div style={{maxWidth:"70%",padding:"10px 14px",background:msg.role==="user"?"#140a04":"#0f0f0f",border:`1px solid ${msg.role==="user"?"#3a1505":"#1c1c1c"}`,fontSize:13,lineHeight:1.7,color:msg.role==="user"?"#e8c090":"#9a9288",whiteSpace:"pre-wrap"}}>{msg.text}</div>
            </div>
          ))}
          {loading&&<div style={{padding:"10px 14px",background:"#0f0f0f",border:"1px solid #1c1c1c",color:"#c0622f",fontSize:13,width:"fit-content"}}>▋</div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{borderTop:"1px solid #1a1a1a",padding:"14px 28px",display:"flex",gap:10,alignItems:"center"}}>
          <span style={{color:"#c0622f"}}>❯</span>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="message the agent..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e8e0d0",fontFamily:"monospace",fontSize:13}}/>
          <button onClick={send} disabled={loading} style={{background:loading?"#111":"#c0622f",border:"none",color:loading?"#333":"#fff",padding:"7px 18px",fontSize:11,letterSpacing:2,cursor:"pointer",fontFamily:"monospace"}}>SEND</button>
        </div>
      </main>
    </div>
  );
}
