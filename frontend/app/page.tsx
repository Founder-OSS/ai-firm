"use client";
import { useState, useRef, useEffect } from "react";
interface Message { role: "user" | "agent"; text: string; ts: string; }
interface LogEntry { ts: string; status: "ok" | "err"; ms: number; }
async function sendToAgent(history: Message[], addLog: (l: LogEntry) => void): Promise<string> {
  const start = Date.now();
  try {
    const messages = history.map(m => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text }));
    const res = await fetch("http://localhost:8080/api/agent/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }) });
    const data = await res.json();
    addLog({ ts: new Date().toLocaleTimeString(), status: "ok", ms: Date.now() - start });
    return data.reply;
  } catch {
    addLog({ ts: new Date().toLocaleTimeString(), status: "err", ms: Date.now() - start });
    return "Backend offline. Run: cd ~/ai-firm/backend && cargo run";
  }
}
const TOOLS = ["web_search", "code_exec", "file_read", "memory_store"];
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking"|"online"|"offline">("checking");
  const [panel, setPanel] = useState<"AGENT"|"MEMORY"|"TOOLS"|"LOGS">("AGENT");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const addLog = (l: LogEntry) => setLogs(p => [l, ...p].slice(0, 50));
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
    const reply = await sendToAgent(updated, addLog);
    setMessages(m=>[...m,{ role:"agent", text:reply, ts:new Date().toLocaleTimeString() }]);
    setLoading(false);
  };
  const userMsgs = messages.filter(m=>m.role==="user").length;
  const agentMsgs = messages.filter(m=>m.role==="agent").length;
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",color:"#e8e0d0",fontFamily:"monospace",display:"flex",flexDirection:"column"}}>
      <header style={{borderBottom:"1px solid #1e1e1e",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{color:"#c0622f",fontWeight:700,letterSpacing:2}}>AI-FIRM // The Way to Rust</span>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:status==="online"?"#4ade80":status==="offline"?"#ef4444":"#f59e0b",display:"inline-block"}}/>
          <span style={{color:"#444"}}>{status==="online"?"RUST ONLINE":status==="offline"?"RUST OFFLINE":"CONNECTING..."}</span>
        </div>
      </header>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <aside style={{width:160,borderRight:"1px solid #1a1a1a",padding:"20px 0",display:"flex",flexDirection:"column",gap:2}}>
          {(["AGENT","MEMORY","TOOLS","LOGS"] as const).map(item=>(
            <div key={item} onClick={()=>setPanel(item)} style={{padding:"8px 16px",fontSize:11,letterSpacing:2,cursor:"pointer",color:panel===item?"#c0622f":"#333",borderLeft:panel===item?"2px solid #c0622f":"2px solid transparent",background:panel===item?"#110800":"transparent"}}>
              {item}
            </div>
          ))}
          <div style={{marginTop:"auto",padding:"0 16px",fontSize:10,color:"#1e1e1e",lineHeight:2}}>
            <div>msgs: {messages.length}</div>
            <div>logs: {logs.length}</div>
          </div>
        </aside>
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {panel==="AGENT" && <>
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
          </>}
          {panel==="MEMORY" && (
            <div style={{padding:"28px",display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontSize:11,letterSpacing:2,color:"#c0622f"}}>MEMORY // CONTEXT WINDOW</div>
              <div style={{display:"flex",gap:24,fontSize:12,color:"#555"}}>
                <div><span style={{color:"#e8c090"}}>{messages.length}</span> total messages</div>
                <div><span style={{color:"#e8c090"}}>{userMsgs}</span> from you</div>
                <div><span style={{color:"#e8c090"}}>{agentMsgs}</span> from agent</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
                {messages.map((msg,i)=>(
                  <div key={i} style={{padding:"8px 12px",background:"#0f0f0f",border:"1px solid #1a1a1a",fontSize:11,color:msg.role==="user"?"#e8c090":"#555",display:"flex",gap:12}}>
                    <span style={{color:"#2a2a2a",minWidth:20}}>{i}</span>
                    <span style={{color:msg.role==="user"?"#c0622f":"#333",minWidth:50}}>{msg.role==="user"?"USER":"AGENT"}</span>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{msg.text.slice(0,80)}{msg.text.length>80?"...":""}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>{ setMessages([]); setTimeout(()=>setMessages([{role:"agent",text:"Memory cleared. New session started.",ts:new Date().toLocaleTimeString()}]),10); }} style={{marginTop:8,background:"transparent",border:"1px solid #2a2a2a",color:"#555",padding:"8px 16px",fontSize:11,letterSpacing:2,cursor:"pointer",fontFamily:"monospace",width:"fit-content"}}>CLEAR MEMORY</button>
            </div>
          )}
          {panel==="TOOLS" && (
            <div style={{padding:"28px",display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontSize:11,letterSpacing:2,color:"#c0622f"}}>TOOLS // AVAILABLE</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {TOOLS.map(tool=>(
                  <div key={tool} style={{padding:"12px 16px",background:"#0f0f0f",border:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:"#9a9288",letterSpacing:1}}>{tool}</span>
                    <span style={{fontSize:10,color:"#2a2a2a",border:"1px solid #1e1e1e",padding:"2px 8px"}}>INACTIVE</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:"#2a2a2a",marginTop:8}}>Tool execution coming in next build.</div>
            </div>
          )}
          {panel==="LOGS" && (
            <div style={{padding:"28px",display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:11,letterSpacing:2,color:"#c0622f"}}>LOGS // REQUEST HISTORY</div>
              {logs.length===0 && <div style={{fontSize:11,color:"#2a2a2a"}}>No requests yet. Send a message to the agent.</div>}
              {logs.map((log,i)=>(
                <div key={i} style={{padding:"8px 12px",background:"#0f0f0f",border:`1px solid ${log.status==="ok"?"#1a2a1a":"#2a1a1a"}`,display:"flex",gap:16,fontSize:11}}>
                  <span style={{color:"#333"}}>{log.ts}</span>
                  <span style={{color:log.status==="ok"?"#4ade80":"#ef4444"}}>{log.status==="ok"?"200 OK":"ERR"}</span>
                  <span style={{color:"#555"}}>{log.ms}ms</span>
                  <span style={{color:"#2a2a2a"}}>POST /api/agent/chat</span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
