# Campus Print — Full package (Frontend + Backend)

## Overview
This project provides a frontend for students to upload files and place print orders, and a Node.js/Express backend that:
- Accepts file uploads and emails them to the owner (using nodemailer)
- Sends WhatsApp notifications to owner numbers via Twilio
- Accepts order submissions and emails + notifies owner

**Important:** This demo saves uploaded files into `server/uploads` and uses Twilio to send WhatsApp messages. You must provide your SMTP and Twilio credentials in a `.env` file.

## Setup (local)
1. Install Node.js (v16+ recommended).
2. Copy `.env.example` to `.env` and fill in your SMTP and Twilio credentials.
3. In the `server` folder run:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000` in your browser. The frontend is served from the `frontend` folder.

## Twilio WhatsApp setup notes
- You need a Twilio account with WhatsApp enabled. Follow Twilio docs to register a WhatsApp sender and get `TWILIO_WHATSAPP_FROM` like `whatsapp:+1415...`.
- Add recipient numbers (owner) in `OWNER_WHATSAPP_NUMBERS` as `whatsapp:+91...` with country codes.

## SMTP (nodemailer) notes
- For Gmail, you may need to create an App Password and use it as `SMTP_PASS` if using 2FA.
- Alternatively use any SMTP provider and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` accordingly.

## File uploads
- Uploaded files are stored in `server/uploads`. Make sure this folder is writable.
- Email attachments are sent from `SMTP_USER` to `OWNER_EMAIL`.

## Security & production
- This demo is minimal. For production, secure endpoints, validate uploads, add authentication, and consider storing files in secure cloud storage (S3, GCS).
- Protect `.env` and do not commit secrets to source control.

## Troubleshooting
- If Twilio messages fail, check Twilio console for detailed error messages.
- If email fails, confirm SMTP credentials and ports.

