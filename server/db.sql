-- Bookings
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  session_type TEXT, -- call/chat/video
  timezone TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  status TEXT DEFAULT 'confirmed', -- or cancelled/rescheduled
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unavailable slots (admin block-out)
CREATE TABLE blocked_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);
