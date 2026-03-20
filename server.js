require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 5050;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'studio2026';
const CONTENT_FILE = path.join(__dirname, 'content.json');
const IMAGES_DIR = path.join(__dirname, 'images');

// --- Supabase & Email Setup ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Optional: Email transport via Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function sendAdminNotification(leadDetails) {
  if (!resend || !process.env.ADMIN_EMAIL) return;
  
  try {
    await resend.emails.send({
      from: 'Grad Photos System <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL,
      subject: `New Lead: ${leadDetails.name} - ${leadDetails.shoot_type}`,
      text: `You have a new inquiry!\n\nName: ${leadDetails.name}\nEmail: ${leadDetails.email}\nPhone: ${leadDetails.phone || 'N/A'}\nType: ${leadDetails.shoot_type}\nDate: ${leadDetails.event_date || 'N/A'}\nBudget: ${leadDetails.budget || 'N/A'}\nMessage:\n${leadDetails.message}\n`
    });
  } catch (err) {
    console.error('Failed to send Resend email:', err);
  }
}

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));

// Serve static files (public site)
app.use(express.static(__dirname, {
  index: 'index.html',
  extensions: ['html']
}));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// --- Image Upload ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `portfolio-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// --- Auth Middleware ---
function requireAuth(req, res, next) {
  const auth = req.headers['x-admin-password'];
  if (auth === ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// --- API Routes ---

// GET content (public — needed by the frontend)
app.get('/api/content', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read content' });
  }
});

// PUT content (protected)
app.put('/api/content', requireAuth, (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// POST image upload (protected)
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imagePath = `images/${req.file.filename}`;
  res.json({ success: true, path: imagePath });
});

// DELETE image (protected)
app.delete('/api/image', requireAuth, (req, res) => {
  const { path: imgPath } = req.body;
  if (!imgPath || !imgPath.startsWith('images/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  const fullPath = path.join(__dirname, imgPath);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// --- Lead Management Routes (Supabase) ---

// POST new inquiry (Public)
app.post('/api/inquire', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const leadData = req.body; // name, email, phone, shoot_type, budget, event_date, message, source
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select();

    if (error) throw error;
    
    // Send email notification in the background
    sendAdminNotification(leadData);

    res.json({ success: true, lead: data[0] });
  } catch (err) {
    console.error('Lead insert error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

// GET all leads (Protected)
app.get('/api/leads', requireAuth, async (req, res) => {
  if (!supabase) return res.json([]); // Return empty array if not configured to prevent UI crashes
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Fetch leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// PUT update lead (Protected)
app.put('/api/leads/:id', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const { id } = req.params;
    const updates = req.body; // status, notes
    
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, lead: data[0] });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// POST manual Calendly booking (Protected)
app.post('/api/leads/manual', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const leadData = req.body;
    leadData.booking_type = 'calendly_manual';
    leadData.status = 'booked';
    
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select();

    if (error) throw error;
    res.json({ success: true, lead: data[0] });
  } catch (err) {
    console.error('Manual booking error:', err);
    res.status(500).json({ error: 'Failed to add manual booking' });
  }
});

// Auth check
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\n  ✦ Graduation Photos CMS`);
  console.log(`  ├── Site:  http://localhost:${PORT}`);
  console.log(`  ├── Admin: http://localhost:${PORT}/admin`);
  console.log(`  └── Pass:  ${ADMIN_PASSWORD}\n`);
});
