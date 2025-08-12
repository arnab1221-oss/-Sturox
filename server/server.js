require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Twilio = require('twilio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// serve frontend static files if desired
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

const uploadDir = path.join(__dirname, 'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random()*1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Configure nodemailer transporter (use environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Twilio client
const twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID || '', process.env.TWILIO_AUTH_TOKEN || '');
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || ''; // e.g. 'whatsapp:+1415XXXXXXX'
const OWNER_NUMBERS = (process.env.OWNER_WHATSAPP_NUMBERS || '').split(',').map(s=>s.trim()).filter(Boolean); // e.g. 'whatsapp:+918972548589,whatsapp:+91...' expected

app.post('/upload', upload.array('files', 20), async (req, res) => {
  try{
    const { name, roll } = req.body;
    const files = req.files || [];
    // send email with attachments to owner email
    const ownerEmail = process.env.OWNER_EMAIL;
    const attachments = files.map(f=>({filename:f.originalname, path:f.path}));
    const mail = {
      from: process.env.SMTP_USER,
      to: ownerEmail,
      subject: `New upload from ${name || 'unknown'}`,
      text: `Name: ${name}\nRoll: ${roll || ''}\nFiles: ${files.map(f=>f.originalname).join(', ')}`,
      attachments
    };
    await transporter.sendMail(mail);
    // send WhatsApp notifications via Twilio to owner numbers
    const waMessage = `New upload from ${name || 'unknown'}${roll?(' (ID:'+roll+')'):''}. Files: ${files.map(f=>f.originalname).join(', ')}`;
    for(const n of OWNER_NUMBERS){
      try{
        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: n,
          body: waMessage
        });
      }catch(e){ console.error('twilio error', e); }
    }
    res.json({ok:true, uploaded: files.map(f=>f.originalname)});
  }catch(err){
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

app.post('/submit-order', async (req, res) => {
  try{
    const data = req.body;
    const orderId = 'ORD' + Date.now();
    const ownerEmail = process.env.OWNER_EMAIL;
    const ownerNumbers = OWNER_NUMBERS;
    // send order email
    const mail = {
      from: process.env.SMTP_USER,
      to: ownerEmail,
      subject: `New order ${orderId} from ${data.name || 'unknown'}`,
      text: `Order ID: ${orderId}\nName: ${data.name}\nRoll: ${data.roll || ''}\nB/W: ${data.bw}\nColor: ${data.col}\nTotal: Rs.${data.total}\nFiles: ${(data.files||[]).join(', ')}\nAddress: ${JSON.stringify(data.address||{})}`
    };
    await transporter.sendMail(mail);
    // send whatsapp via twilio
    const waMessage = `New order ${orderId} from ${data.name || 'unknown'}. B/W:${data.bw} Color:${data.col} Total:Rs.${data.total}. Files:${(data.files||[]).join(', ')}`;
    for(const n of ownerNumbers){
      try{
        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: n,
          body: waMessage
        });
      }catch(e){ console.error('twilio error', e); }
    }
    res.json({ok:true, orderId, order: {...data, id:orderId}});
  }catch(err){
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));
