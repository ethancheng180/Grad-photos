const app = require('../server.js');
module.exports = app;

// Disable Vercel's default body parser so multer can read the multipart/form-data stream
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
