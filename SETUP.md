# SETUP

## 1) Prerequisites
- Node.js 20+
- npm 10+
- Docker (optional)

## 2) Install
```bash
npm install
cp .env.example .env
```

## 3) Run (simulation default)
```bash
npm run dev
# open http://localhost:8080
```

## 4) Docker option
```bash
docker compose up
```

## 5) Switch to live mode (later)
- Set `SIMULATION_MODE=false`
- Populate all Twilio/OpenAI env vars in `.env`
