// ════════════════════════════════════════════════════════════════
//  SJ Corporation — Unified Server
//  Serves ALL frontend HTML files AND handles all API requests
//  Run: node server.js  →  open http://localhost:3000
// ════════════════════════════════════════════════════════════════

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Serve ALL frontend files from THIS folder ────────────────────
// index.html, products.html, product.html, cart.html, admin.html,
// and anything in the images/ folder — all served automatically
app.use(express.static(path.join(__dirname)));

// ── JSON File Database ───────────────────────────────────────────
const DATA_DIR      = path.join(__dirname, 'data');
const ORDERS_FILE   = path.join(DATA_DIR, 'orders.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

if (!fs.existsSync(DATA_DIR))      fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE))   fs.writeFileSync(ORDERS_FILE,   '[]');
if (!fs.existsSync(CONTACTS_FILE)) fs.writeFileSync(CONTACTS_FILE, '[]');

const readDB  = f => { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return []; } };
const writeDB = (f,d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

// ── Email ────────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendMail(subject, html, plainText) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('  [EMAIL] Skipped — no credentials in .env');
    return;
  }
  try {
    await mailer.sendMail({
      from: `"SJ Corporation" <${process.env.GMAIL_USER}>`,
      to:   process.env.NOTIFY_EMAIL || process.env.GMAIL_USER,
      subject,
      html,
      text: plainText
    });
    console.log(`  [EMAIL] Sent: ${subject}`);
  } catch(e) {
    console.error(`  [EMAIL ERROR] ${e.message}`);
  }
}

const inr = n => '₹' + Number(n).toLocaleString('en-IN');

// ════════════════════════════════════════════════════════════════
//  API — Place Order
//  POST /api/order
//  Body: { name, phone, email, address, city, pincode, items[], total }
// ════════════════════════════════════════════════════════════════
app.post('/api/order', async (req, res) => {
  try {
    const { name, phone, email='', address, city='', pincode='', items, total } = req.body;

    if (!name || !phone || !address || !Array.isArray(items) || !items.length)
      return res.status(400).json({ success:false, message:'Name, phone, address and items are required' });

    const subtotal = items.reduce((s,i) => s + i.price * i.qty, 0);
    const order = {
      id:        uuidv4(),
      orderId:   'SJO-' + Date.now().toString().slice(-6),
      status:    'New',
      createdAt: new Date().toISOString(),
      customer:  { name, phone, email, address, city, pincode },
      items,
      subtotal,
      discount:  Math.round(subtotal * 0.05),
      shipping:  subtotal >= 500 ? 0 : 50,
      total
    };

    const orders = readDB(ORDERS_FILE);
    orders.unshift(order);
    writeDB(ORDERS_FILE, orders);

    // Beautiful HTML email
    const rows = items.map(i => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #253545;color:#c8d8ea">${i.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #253545;text-align:center;color:#c8d8ea">${i.qty}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #253545;text-align:right;color:#c8d8ea">${inr(i.price)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #253545;text-align:right;font-weight:700;color:#fff">${inr(i.price*i.qty)}</td>
      </tr>`).join('');

    const emailHtml = `
<div style="font-family:Arial,sans-serif;background:#0f1923;padding:32px;max-width:620px;margin:0 auto;border-radius:16px">
  <div style="background:linear-gradient(135deg,#ff6b2b,#ff8c55);border-radius:12px;padding:22px 26px;margin-bottom:24px">
    <h1 style="margin:0;color:#fff;font-size:1.35rem">🛒 New Order — ${order.orderId}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:.85rem">${new Date(order.createdAt).toLocaleString('en-IN')}</p>
  </div>
  <div style="background:#162130;border-radius:12px;padding:20px 24px;margin-bottom:16px">
    <p style="margin:0 0 12px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4d6a87">Customer Details</p>
    <p style="margin:5px 0;color:#e2eaf5"><strong>Name:</strong> ${name}</p>
    <p style="margin:5px 0;color:#e2eaf5"><strong>Phone:</strong> <a href="tel:${phone}" style="color:#ff6b2b;text-decoration:none">${phone}</a></p>
    ${email ? `<p style="margin:5px 0;color:#e2eaf5"><strong>Email:</strong> ${email}</p>` : ''}
    <p style="margin:5px 0;color:#e2eaf5"><strong>Address:</strong> ${address}${city ? ', '+city : ''}${pincode ? ' – '+pincode : ''}</p>
  </div>
  <div style="background:#162130;border-radius:12px;overflow:hidden;margin-bottom:16px">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#1e2f42">
          <th style="padding:10px 14px;text-align:left;font-size:.72rem;color:#8ba3c0;text-transform:uppercase">Product</th>
          <th style="padding:10px 14px;text-align:center;font-size:.72rem;color:#8ba3c0;text-transform:uppercase">Qty</th>
          <th style="padding:10px 14px;text-align:right;font-size:.72rem;color:#8ba3c0;text-transform:uppercase">Rate</th>
          <th style="padding:10px 14px;text-align:right;font-size:.72rem;color:#8ba3c0;text-transform:uppercase">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="padding:12px 14px;background:#1a2a3a;display:flex;justify-content:space-between">
      <span style="color:#8ba3c0;font-size:.88rem">Discount (5%)</span>
      <span style="color:#22c55e;font-weight:700">−${inr(order.discount)}</span>
    </div>
    <div style="padding:12px 14px;background:#1a2a3a;display:flex;justify-content:space-between;border-top:1px solid #253545">
      <span style="color:#8ba3c0;font-size:.88rem">Shipping</span>
      <span style="color:${order.shipping===0?'#22c55e':'#e2eaf5'};font-weight:700">${order.shipping===0?'FREE':inr(order.shipping)}</span>
    </div>
    <div style="padding:16px;background:#ff6b2b;display:flex;justify-content:space-between;align-items:center">
      <strong style="font-size:1rem;color:#fff">ORDER TOTAL</strong>
      <strong style="font-size:1.6rem;color:#fff">${inr(order.total)}</strong>
    </div>
  </div>
  <p style="text-align:center;color:#4d6a87;font-size:.78rem;margin:0">SJ Corporation · +91 9638988803 · jayendra.jsingh@gmail.com</p>
</div>`;

    await sendMail(
      `🛒 New Order ${order.orderId} — ${inr(order.total)} from ${name}`,
      emailHtml,
      `New Order: ${order.orderId} | Customer: ${name} | Phone: ${phone} | Total: ${inr(order.total)}`
    );

    console.log(`  [ORDER] ${order.orderId} — ${name} — ${inr(order.total)}`);
    res.json({ success:true, orderId: order.orderId });

  } catch(err) {
    console.error('  [ORDER ERROR]', err.message);
    res.status(500).json({ success:false, message:'Server error. Please use WhatsApp to place order.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  API — Contact / Enquiry
//  POST /api/contact
//  Body: { name, phone, email, company, message }
// ════════════════════════════════════════════════════════════════
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, email='', company='', message } = req.body;

    if (!name || !phone || !message)
      return res.status(400).json({ success:false, message:'Name, phone and message are required' });

    const enquiry = {
      id:        uuidv4(),
      createdAt: new Date().toISOString(),
      status:    'New',
      name, phone, email, company, message
    };

    const contacts = readDB(CONTACTS_FILE);
    contacts.unshift(enquiry);
    writeDB(CONTACTS_FILE, contacts);

    const emailHtml = `
<div style="font-family:Arial,sans-serif;background:#0f1923;padding:32px;max-width:620px;margin:0 auto;border-radius:16px">
  <div style="background:linear-gradient(135deg,#ff6b2b,#ff8c55);border-radius:12px;padding:22px 26px;margin-bottom:24px">
    <h1 style="margin:0;color:#fff;font-size:1.35rem">📩 New Enquiry from ${name}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:.85rem">${new Date(enquiry.createdAt).toLocaleString('en-IN')}</p>
  </div>
  <div style="background:#162130;border-radius:12px;padding:20px 24px;margin-bottom:16px">
    <p style="margin:6px 0;color:#e2eaf5"><strong>Name:</strong> ${name}</p>
    <p style="margin:6px 0;color:#e2eaf5"><strong>Phone:</strong> <a href="tel:${phone}" style="color:#ff6b2b;text-decoration:none">${phone}</a></p>
    ${email   ? `<p style="margin:6px 0;color:#e2eaf5"><strong>Email:</strong> ${email}</p>` : ''}
    ${company ? `<p style="margin:6px 0;color:#e2eaf5"><strong>Company:</strong> ${company}</p>` : ''}
    <div style="background:#1e2f42;border-radius:8px;padding:16px;margin-top:14px">
      <p style="margin:0;color:#c8d8ea;font-size:.9rem;line-height:1.65">${message}</p>
    </div>
  </div>
  <p style="text-align:center;color:#4d6a87;font-size:.78rem;margin:0">SJ Corporation · +91 9638988803</p>
</div>`;

    await sendMail(
      `📩 Enquiry from ${name} — ${phone}`,
      emailHtml,
      `Enquiry from: ${name} | Phone: ${phone} | Message: ${message}`
    );

    console.log(`  [CONTACT] ${name} — ${phone}`);
    res.json({ success:true });

  } catch(err) {
    console.error('  [CONTACT ERROR]', err.message);
    res.status(500).json({ success:false, message:'Server error. Please contact us via WhatsApp.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  ADMIN API — Password protected
// ════════════════════════════════════════════════════════════════
function auth(req, res, next) {
  const pw = req.query.pass || req.headers['x-admin-pass'];
  if (pw !== (process.env.ADMIN_PASSWORD || 'sjcorp2026'))
    return res.status(401).json({ success:false, message:'Unauthorized' });
  next();
}

app.get('/api/admin/orders',    auth, (req,res) => res.json({ success:true, orders:   readDB(ORDERS_FILE)   }));
app.get('/api/admin/contacts',  auth, (req,res) => res.json({ success:true, contacts: readDB(CONTACTS_FILE) }));

app.patch('/api/admin/orders/:id', auth, (req,res) => {
  const list = readDB(ORDERS_FILE);
  const i = list.findIndex(o => o.id === req.params.id);
  if (i===-1) return res.status(404).json({ success:false, message:'Not found' });
  list[i].status = req.body.status || list[i].status;
  writeDB(ORDERS_FILE, list);
  res.json({ success:true });
});

app.delete('/api/admin/orders/:id', auth, (req,res) => {
  writeDB(ORDERS_FILE, readDB(ORDERS_FILE).filter(o => o.id !== req.params.id));
  res.json({ success:true });
});

app.patch('/api/admin/contacts/:id', auth, (req,res) => {
  const list = readDB(CONTACTS_FILE);
  const i = list.findIndex(c => c.id === req.params.id);
  if (i===-1) return res.status(404).json({ success:false, message:'Not found' });
  list[i].status = req.body.status || list[i].status;
  writeDB(CONTACTS_FILE, list);
  res.json({ success:true });
});

app.get('/api/health', (req,res) =>
  res.json({ success:true, status:'running', uptime: Math.floor(process.uptime())+'s' })
);

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═════════════════════════════════════════════════╗');
  console.log('  ║      SJ Corporation — Server Started  ✓         ║');
  console.log('  ╠═════════════════════════════════════════════════╣');
  console.log(`  ║  Website  →  http://localhost:${PORT}              ║`);
  console.log(`  ║  Admin    →  http://localhost:${PORT}/admin.html   ║`);
  console.log(`  ║  Health   →  http://localhost:${PORT}/api/health   ║`);
  console.log('  ╚═════════════════════════════════════════════════╝');
  console.log('');
  if (!process.env.GMAIL_USER) {
    console.log('  ⚠  No Gmail credentials found in .env');
    console.log('  ⚠  Orders will be saved but emails will NOT be sent\n');
  } else {
    console.log(`  ✉  Emails → ${process.env.NOTIFY_EMAIL || process.env.GMAIL_USER}\n`);
  }
});
