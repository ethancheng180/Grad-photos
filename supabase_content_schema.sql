-- 1. Create a table to hold the website content JSON
CREATE TABLE site_content (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Note: We are only interacting with this table from a trusted Node.js backend using the Anon Key.
ALTER TABLE site_content DISABLE ROW LEVEL SECURITY;

-- 2. Insert the INITIAL default content
INSERT INTO site_content (id, data) VALUES (
  'main_content',
  '{
    "branding": {
      "siteName": "GradPhotos Studio",
      "bookingLink": "#"
    },
    "hero": {
      "eyebrow": "CAPTURING YOUR MILESTONE",
      "headline": "Premium Graduation Photography",
      "subText": "Stand out with editorial-style graduation portraits.",
      "schools": "UCLA | USC | LMU | PEPPERDINE"
    },
    "portfolio": [],
    "differentiator": {
      "title": "Not Your Average Grad Photos",
      "p1": "We blend high-fashion aesthetics with authentic moments.",
      "p2": "We believe your graduation photos should look like a magazine cover."
    },
    "pricing": {
      "note": "A 50% non-refundable retainer is required to book.",
      "tiers": [
        {
          "name": "The Essential Solo",
          "price": "$295",
          "per": "/person",
          "features": ["1 Hour Session", "1 Location", "1 Outfit changes", "25 Retouched Photos", "Online Gallery"],
          "buttonText": "Book Now",
          "featured": false
        },
        {
          "name": "The Premium Solo",
          "price": "$450",
          "per": "/person",
          "features": ["2 Hour Session", "2 Locations", "3 Outfit changes", "50+ Retouched Photos", "Champagne Pop"],
          "buttonText": "Book Premium",
          "featured": true
        },
        {
          "name": "The Group Shoot",
          "price": "$150",
          "per": "/person",
          "features": ["2 Hour Session", "Up to 5 Friends", "Group & Solo Shots", "100+ Retouched Photos", "Polaroid Souvenirs"],
          "buttonText": "Inquire for Group",
          "featured": false
        }
      ],
      "addons": [
        { "name": "Extra Location", "detail": "$75" },
        { "name": "Champagne Bottle", "detail": "$25" },
        { "name": "Rush Editing (48hrs)", "detail": "$100" }
      ]
    },
    "process": [
      { "number": "01", "title": "Book Your Spot", "desc": "Secure your date and time online." },
      { "number": "02", "title": "The Shoot", "desc": "We''ll guide you through posing." },
      { "number": "03", "title": "Gallery Delivery", "desc": "Receive your edited photos within 2 weeks." }
    ],
    "cta": {
      "eyebrow": "READY TO SHOOT?",
      "headline": "Let''s Create Something Iconic.",
      "igLink": "https://instagram.com",
      "emailLink": "mailto:hello@example.com"
    }
  }'::jsonb
);
