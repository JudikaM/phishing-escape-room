# Phishing Escape Room

Phishing Escape Room is an interactive browser-based security awareness game designed to train players in identifying modern social engineering and online scams across email, SMS, and chat channels.

Trapped inside a sealed server room during a late-night lockdown, players act as a security operations center (SOC) triage analyst, classifying incoming messages to unlock three successive blast doors before the timer or lives run out.

> **Educational Simulation Notice:** This project is an educational simulation. All brands, organizations, people, email addresses, phone numbers, domain names, and scam scenarios are entirely fictional and created solely for cybersecurity training purposes. Links displayed within scenarios are shown as plain text and are not clickable.

## Features

- **Three Progressive Security Doors:**
  - **Door 01:** Fake prize draws, parcel delivery with an APK, and OTP requests.
  - **Door 02:** Fake invoices, executive impersonation, account-lock warnings, and disguised links.
  - **Door 03:** Compromised coworker accounts, fake job offers, marketplace scams, and legitimate messages that look suspicious.
- **Realistic Channel Interfaces:** Custom cyber terminal views tailored for Email (headers, subject, sender), SMS, and Instant Messaging.
- **SOC Intelligence Debrief:** End-screen threat intelligence review detailing category-by-category accuracy, false alarms, and interactive wrong-answer inspections with highlighted quotes and security habit tips.
- **Built for Everyday Users:** Covers common personal-life and workplace threats: package delivery, banking alerts, marketplace sales, cloud invoices, and job hunting.
- **Zero External Dependencies:** Built with vanilla HTML5, CSS3, and JavaScript with strict Content Security Policy enforcement and local SVG assets.

## How to Run Locally

Because the game loads scenario intelligence from `scenarios.json`, it must be served over a local HTTP server rather than opened as a local `file://` URL.

Run the local server bound to localhost:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open your browser and navigate to:

```
http://127.0.0.1:8000
```

## How to Play

- **Keyboard Controls:**
  - `P` — Classify message as **Phishing**
  - `S` — Classify message as **Safe** (Legitimate)
  - `H` — Request a **Hint** (highlights a red flag or shows a safe signal; 1 per door)
  - `Enter` — Confirm / Continue to next message or screen
  - `Esc` — Pause / Resume triage or return to title screen
  - `↑` / `↓` — Navigate title screen menu items
- **Scoring & Lives:**
  - Each door starts with 120 seconds and 3 lives.
  - Correct answers award +100 points.
  - Clearing a door adds remaining seconds as a time bonus to the total run score.
  - Running out of time or lives triggers a door lockdown restart.

## Tech Stack

- Vanilla HTML5 & CSS3
- Modern JavaScript (ES6+, zero frameworks or dependencies)
