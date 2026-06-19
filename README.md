# SJ Corporation — Complete Website + Backend

## Project Structure

```
sjcorp-final/
├── server.js          ← Node.js backend (serves everything + API)
├── package.json       ← Dependencies
├── .env.example       ← Copy to .env and fill your details
├── .gitignore
│
├── index.html         ← Homepage with contact form
├── products.html      ← Full product catalogue with filters
├── product.html       ← Individual product page
├── cart.html          ← Cart + Checkout (connected to backend)
├── admin.html         ← Admin dashboard (orders + enquiries)
│
├── images/            ← Put your product photos here
│   └── (add your photos here)
│
└── data/              ← Auto-created when server starts
    ├── orders.json    ← All orders saved here
    └── contacts.json  ← All enquiries saved here
```

---

## How to Run (3 Steps)

### Step 1 — Install Node.js
Download from https://nodejs.org → choose LTS version → install it.

### Step 2 — Set up your email credentials
```bash
# In the sjcorp-final folder, copy the example file:
cp .env.example .env        # Mac/Linux
copy .env.example .env      # Windows
```

Open `.env` in Notepad and fill in:
```
PORT=3000
GMAIL_USER=jayendra.jsingh@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
NOTIFY_EMAIL=jayendra.jsingh@gmail.com
ADMIN_PASSWORD=your_strong_password
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Turn on 2-Step Verification
3. Search "App passwords" → Generate → copy the 16-character code
4. Paste into GMAIL_APP_PASSWORD in .env

### Step 3 — Install and start
```bash
cd sjcorp-final
npm install
npm start
```

Open your browser: **http://localhost:3000**

---

## Pages

| URL | Page |
|-----|------|
| http://localhost:3000 | Homepage |
| http://localhost:3000/products.html | All products |
| http://localhost:3000/product.html?id=tape-48x65-clear | Product detail |
| http://localhost:3000/cart.html | Shopping cart |
| http://localhost:3000/admin.html | Admin dashboard |

---

## Admin Dashboard
- Go to http://localhost:3000/admin.html
- Enter the password from your .env file (ADMIN_PASSWORD)
- See all orders and enquiries in real time
- Call or WhatsApp customers directly from the dashboard
- Update order status: New → Confirmed → Shipped → Delivered
- Auto-refreshes every 60 seconds

---

## Adding Your Product Photos

1. Take clear photos of your products (white background)
2. Compress them at https://squoosh.app (save as .jpg, under 200KB each)
3. Put the files inside the `images/` folder
4. Open `products.html`, `product.html` and `index.html` in a text editor
5. Find each product's `img:''` field and add the path:

```js
// Before:
img: ''

// After:
img: 'images/tape-clear.jpg'
```

---

## Deploy Online Free (Railway)

1. Create account at https://railway.app
2. Install Railway CLI or connect your GitHub repo
3. Add all your .env values in Railway → Variables tab
4. Deploy → Railway gives you a live URL like https://sjcorp.up.railway.app

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/order | Place a new order |
| POST | /api/contact | Send an enquiry |
| GET | /api/admin/orders?pass=XXX | View all orders |
| GET | /api/admin/contacts?pass=XXX | View all enquiries |
| PATCH | /api/admin/orders/:id?pass=XXX | Update order status |
| DELETE | /api/admin/orders/:id?pass=XXX | Delete an order |
| GET | /api/health | Check server status |

