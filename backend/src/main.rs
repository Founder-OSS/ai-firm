use axum::{Router, routing::{get, post}, Json, http::{HeaderValue, Method}};
use serde::{Deserialize, Serialize};
use tower_http::cors::{CorsLayer, Any};
#[derive(Serialize)]
struct HealthResponse { status: &'static str }
#[derive(Deserialize, Serialize, Clone)]
struct ChatMessage { role: String, content: String }
#[derive(Deserialize)]
struct ChatRequest { messages: Vec<ChatMessage> }
#[derive(Serialize)]
struct ChatResponse { reply: String }
#[derive(Deserialize)]
struct OllamaMessage { content: String }
#[derive(Deserialize)]
struct OllamaResponse { message: OllamaMessage }
async fn health() -> Json<HealthResponse> { Json(HealthResponse { status: "online" }) }
async fn chat(Json(payload): Json<ChatRequest>) -> Json<ChatResponse> {
    let client = reqwest::Client::new();
    let mut messages = vec![ChatMessage { role: "system".into(), content: "You are the ai-firm agent. You are concise, technical, and helpful.".into() }];
    messages.extend(payload.messages);
    let body = serde_json::json!({ "model": "qwen3:8b", "messages": messages, "stream": false });
    match client.post("http://localhost:11434/api/chat").json(&body).send().await {
        Ok(res) => match res.json::<OllamaResponse>().await {
            Ok(data) => Json(ChatResponse { reply: data.message.content }),
            Err(_) => Json(ChatResponse { reply: "Failed to parse Ollama response.".into() }),
        },
        Err(_) => Json(ChatResponse { reply: "Could not reach Ollama. Is it running?".into() }),
    }
}
#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);
    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/agent/chat", post(chat))
        .layer(cors);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("ai-firm backend running on http://localhost:8080");
    axum::serve(listener, app).await.unwrap();
}
