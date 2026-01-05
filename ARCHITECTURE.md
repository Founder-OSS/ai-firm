# Architecture

## System Design

┌─────────────────┐
│ Next.js Frontend│
│ (Port 3000) │
└────────┬────────┘
│ HTTP/REST
▼
┌─────────────────┐
│ Rust Backend │
│ (API Server) │
└─────────────────┘

## Backend (Rust)

- Lightweight API server
- Handles AI agent logic
- Minimal memory footprint design

## Frontend (Next.js)

- Server-side rendering
- Interactive agent interface
- Optimized bundle size

## Deployment Target

Chromebook (Crostini), 4GB RAM constraint
