# 🌿 Invisible Garden Praxy

<div align="center">

**A Secure AI-Powered Medical Consultation Platform**

_Combining blockchain verification, zero-knowledge proofs, and AI to create digital medical clones_

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

</div>

---

## 📖 Overview

**Invisible Garden Praxy** (PraxY) is an innovative platform that replicates the expertise and clinical judgment of senior medical professionals through secure digital assistants. Using AI training combined with encrypted verification and zero-knowledge identity (zkID) technology, PraxY ensures that only verified medical professionals can interact with the system while maintaining complete privacy and security.

### ✨ Key Features

- 🤖 **AI-Powered Medical Clones** - Digital replicas trained on validated protocols and expert knowledge
- 🔐 **Zero-Knowledge Proofs** - Semaphore-based identity verification without exposing personal data
- 🌐 **Web3 Integration** - Blockchain-based certificate management and proof verification
- 💬 **Encrypted Communications** - End-to-end encrypted chat interface
- 🏥 **Clinical Decision Support** - Real-time guidance aligned with institutional protocols
- 📱 **Accessible Interface** - Modern, responsive UI with dark mode support

---

## 🏗️ Architecture

This project is a **full-stack application** consisting of two main components:

### 🎨 Frontend

A modern Web3 application built with Next.js 14, featuring:

- TypeScript for type safety
- Material UI for beautiful components
- Framer Motion for smooth animations
- RainbowKit & wagmi for Web3 connectivity
- Semaphore integration for zero-knowledge proofs

**📚 [View Frontend Documentation →](README_FRONTEND.md)**

### ⚙️ Backend API

A robust Python API powered by FastAPI, featuring:

- Docker containerization
- PostgreSQL database with SQLAlchemy ORM
- Together AI integration for LLM capabilities
- Conversation storage and retrieval
- Fine-tuning capabilities for medical knowledge

**📚 [View API Documentation →](README_API.md)**

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (for backend services)
- **Node.js 18+** & **npm/pnpm** (for frontend)
- **Git**

### 🐳 Start Backend Services

```bash
# From project root
docker-compose -f docker-compose.yml up
```

The API will be available at: **http://localhost:8080**

### 💻 Start Frontend Development Server

```bash
# Navigate to frontend directory
cd src

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:3000**

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### Frontend 🎨

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Material UI (MUI)
- **Animations**: Framer Motion
- **Web3**: wagmi, viem, RainbowKit, Web3Modal
- **ZK Proofs**: @semaphore-protocol/identity

</td>
<td width="50%" valign="top">

### Backend ⚙️

- **API Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **AI/ML**: Together AI, Transformers
- **Container**: Docker
- **Language**: Python 3.11+

</td>
</tr>
</table>

---

## 📂 Project Structure

```
invisible_garden_praxy/
├── 🎨 src/                        # Frontend application
│   ├── app/                       # Next.js pages (App Router)
│   │   ├── chat/                  # Chat interface
│   │   ├── verify/                # Verification pages
│   │   └── api/                   # API routes
│   ├── components/                # React components
│   │   ├── SemaphoreIdentity.tsx  # ZK identity management
│   │   ├── ProofVerification.tsx  # Proof verification UI
│   │   └── CertificateRegistration.tsx
│   ├── lib/                       # Utilities & config
│   ├── hooks/                     # Custom React hooks
│   └── contracts/                 # Smart contracts
│
├── ⚙️ services/                   # Backend services
│   ├── gateway/                   # API gateway
│   │   ├── app.py                 # FastAPI application
│   │   ├── controller.py          # Request handlers
│   │   ├── rag.py                 # RAG implementation
│   │   ├── db/                    # Database models
│   │   └── training/              # ML training scripts
│   └── indexer/                   # Data indexing service
│
├── 📄 README.md                   # This file
├── 📄 README_FRONTEND.md          # Frontend documentation
├── 📄 README_API.md               # API documentation
├── 📄 CHAT_INTEGRATION.md         # Chat integration guide
├── 📄 prax_y_whitepaper_v_2.md   # Project whitepaper
└── 🐳 docker-compose.yml          # Docker services
```

---

## 🔑 Key Components

### 🛡️ Semaphore Identity System

Implements zero-knowledge proofs for anonymous yet verified user authentication:

- Identity creation and management
- Group membership verification
- Nullifier tracking to prevent double-signaling
- Certificate-based proof generation

### 💬 AI Chat Interface

Secure, encrypted chat with AI medical clones:

- Multiple fine-tuned models (conversational, tokenized, default)
- Conversation history persistence
- User-specific chat retrieval
- Real-time feedback collection

### 🔐 Certificate Registry

Blockchain-based certificate management:

- Professional credential verification
- Merkle tree-based group management
- Cryptographic proof verification
- Audit trail for all verifications

---

## 📝 API Endpoints

### Main Gateway Endpoints

```bash
# Submit feedback/question to AI
POST /feedback
{
  "user_id": "string",
  "question": "string",
  "model": "t_tuned | c_tuned | default"
}

# Retrieve user chat history
GET /get_chat_by_user/{user_id}/{model_code}

# API documentation
GET /docs
```

### Frontend API Routes

```bash
# Sync certificates from registry
POST /api/sync-certificates

# Verify zero-knowledge proof
POST /api/verify-proof
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/praxy

# AI Services
TOGETHER_API_KEY=your_api_key_here

# Web3 (Optional)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

---

## 📚 Additional Documentation

- 📖 **[Whitepaper](prax_y_whitepaper_v_2.md)** - Detailed explanation of the PraxY vision and architecture
- 💬 **[Chat Integration Guide](CHAT_INTEGRATION.md)** - How to integrate and use the chat system
- 🎨 **[Frontend README](README_FRONTEND.md)** - Complete frontend setup and features
- ⚙️ **[API README](README_API.md)** - Backend API documentation and endpoints
- ⚙️ **[REDIS Guide](VERCEL_KV_SETUP.md)** - How to integrate the in-memory storage solution both locally and on Vercel

---

## 🌟 Features in Detail

### Zero-Knowledge Identity Verification

Users can prove they are verified medical professionals without revealing their identity:

1. Register with a professional certificate
2. Generate a Semaphore identity
3. Join verified groups
4. Prove membership without revealing which member you are

### AI Medical Clones

Digital replicas of senior medical professionals:

- Trained on institutional protocols and validated medical knowledge
- Multiple model variants for different use cases
- Continuous learning from feedback
- Encrypted conversation history

### Secure Communication

All interactions are encrypted and verified:

- End-to-end encryption for chat messages
- Zero-knowledge proofs for authentication
- Nullifier tracking to prevent abuse
- Audit logs for compliance

---

<div align="center">

[Frontend Docs](README_FRONTEND.md) • [API Docs](README_API.md) • [Whitepaper](prax_y_whitepaper_v_2.md)

</div>
