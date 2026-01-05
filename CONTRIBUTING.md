# Contributing to ai-firm

## Project Context

**Goal**: AI agent platform on minimal hardware (4GB Chromebook)  
**Stack**: Rust backend + Next.js frontend  
**Philosophy**: The Way to Rust - demonstrate production AI on constrained systems

## Development Setup

See README.md for installation steps.

## Code Standards

- Backend: Follow Rust idioms, document all public APIs
- Frontend: TypeScript preferred, component-based architecture
- Commits: Use conventional commits (feat:, fix:, docs:)

## Architecture Notes

- Backend runs lightweight Rust services
- Frontend is server-side rendered Next.js
- Design for <4GB RAM total footprint
