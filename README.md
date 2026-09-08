# Secure GenAI Content Transformation Platform
## SIH 2026 — Problem Statement 26154 MVP

A secure, enterprise-grade content transformation platform built for **SIH 2026 Problem Statement 26154**.

> **Core Philosophy:** One trusted source → understand once → generate multiple controlled outputs → validate → human review/edit → approve → export → SHA-256 integrity proof → Hyperledger Fabric provenance anchor.

---

## 1. Executive Summary & Core Workflow

This platform is NOT a generic chatbot. It provides a source-grounded transformation engine that ingests operational documents (PDF, DOCX, TXT), runs security scanning (PII detection/redaction & prompt-injection defense), constructs a single **Canonical Context**, and generates controlled multi-channel communication deliverables:

- **Executive Summary** (Leadership brief)
- **Operational Advisory** (Technical mitigation guide)
- **LinkedIn Post** (Professional public post with matching visual graphic)
- **X/Twitter Thread** (Numbered concise thread)
- **Visual Infographic** (Server-side generated Pollinations graphic card)
- **Presentation Outline** (5-slide deck structure)

---

## 2. Demo PDF Quick-Start System

The platform includes a dedicated **Try Demo Sources** section featuring 4 sample PDF documents bundled directly for SIH demonstrations:

1. **Standard Cybersecurity Assessment Report** (`01_normal_cybersecurity_assessment.pdf`) — Baseline operational audit.
2. **PII Security Incident Audit** (`02_pii_security_incident_test.pdf`) — Presidio PII detection and automated redaction test.
3. **Prompt Injection Attack Challenge** (`03_prompt_injection_security_test.pdf`) — Adversarial prompt injection defense test.
4. **Fact Accuracy & Technical Detail Brief** (`04_fact_accuracy_test.pdf`) — Canonical context fact fidelity test.

Selecting any demo source automatically ingests it through the real server-side security scan, text extraction, PII scan, prompt injection check, and canonical transformation pipeline without manual upload friction.

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Enterprise Light Theme)
- **UI Primitives:** Radix UI / shadcn/ui
- **Icons:** Lucide Icons

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **Validation:** Pydantic & Pydantic-Settings
- **Text AI Model:** Groq API (`qwen/qwen3.6-27b`)
- **Image AI Model:** Pollinations API (`qwen-image`)
- **Document Engines:** PyMuPDF (`pymupdf`), `python-docx`, plain text
- **Security Engines:** Presidio Analyzer & Anonymizer, Prompt Injection Heuristics
- **Orchestration:** LangGraph workflow state machine (Max 3 attempt retry limit)
- **Integrity & Blockchain:** SHA-256 hashing, Hyperledger Fabric provenance anchor service (`integrity-channel` / `Org1MSP`), append-only audit logger

---

## 4. Key Security Controls & Limits

1. **Authentication Lock:** Maximum 5 consecutive failed login attempts before locking account for 5 minutes.
2. **AI Generation Retries Limit:** LangGraph pipeline limits automatic validation retries to maximum 3 attempts (Initial + 2 retries) to prevent infinite loops.
3. **PII Protection:** Server-side Presidio detection for emails, phones, SSNs, Aadhaar, IPs, and credit cards with 1-click redaction. Zero raw PII is ever sent to image generation providers.
4. **Prompt Injection Defense:** Untrusted source document instructions are isolated and scanned for systemic override patterns.
5. **SHA-256 & Hyperledger Fabric Provenance:** Every generated deliverable and raw source file is hashed with SHA-256 and anchored to Hyperledger Fabric channel transactions.
6. **Server-Side Key Protection:** API keys remain strictly server-side and are never returned to client/frontend payloads.

---

## 5. Setup & Running Instructions

### Backend (FastAPI)
```bash
# Navigate to root workspace directory
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Next.js)
```bash
# Navigate to frontend directory
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Testing

Run integration & security unit tests from the workspace root:

```bash
cmd.exe /c "set PYTHONPATH=. && .\.venv\Scripts\python.exe backend/tests/test_all.py"
cmd.exe /c "set PYTHONPATH=. && .\.venv\Scripts\python.exe backend/tests/test_linkedin_image.py"
```

Frontend production build check:
```bash
cd frontend
npm run build
```
