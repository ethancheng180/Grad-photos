const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5050;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'studio2026';
const CONTENT_FILE = path.join(__dirname, 'content.json');
const IMAGES_DIR = path.join(__dirname, 'images');

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
