# SETUP

## 1) Prerequisites
- Node.js 20+
- npm 10+
- Twilio account + voice-capable number
- OpenAI API key with Realtime access
- ngrok (or equivalent HTTPS + WSS tunnel)

## 2) Install
```bash
npm install
cp .env.example .env
```

## 3) Configure `.env`
Set:
- `PORT=8080`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_WEBHOOK_BASE_URL=https://<public-host>`
- `OPENAI_API_KEY`
- `OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview` (or your approved realtime model)

## 4) Run
```bash
npm run dev
```
Open `http://localhost:8080`.

## 5) Build check
```bash
npm run build
```
