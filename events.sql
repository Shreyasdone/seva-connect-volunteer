CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  thumbnail_image TEXT, -- stores the image URL
  event_category TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  registration_deadline TIMESTAMP,
  status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
