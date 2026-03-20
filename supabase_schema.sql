-- Create the leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  shoot_type TEXT NOT NULL,
  source TEXT,
  message TEXT,
  budget TEXT,
  event_date DATE,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'booked', 'completed', 'archived')),
  booking_type TEXT DEFAULT 'inquiry' CHECK (booking_type IN ('inquiry', 'calendly_manual')),
  notes TEXT
);

-- Note: We are only interacting with this table from a trusted Node.js backend using the Anon Key.
-- If Row Level Security (RLS) is enabled by default, we need to allow access.
-- Since the Node server acts as a service layer right now, we can disable RLS or set policy.
-- Easiest for this architecture is disabling RLS since it's only accessed via the protected server routes.
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
