CREATE TABLE events (
id SERIAL PRIMARY KEY,
title TEXT NOT NULL,
location TEXT NOT NULL,
location_type TEXT NOT NULL CHECK (location_type IN ('virtual', 'physical')),
description TEXT,
thumbnail_image TEXT, -- stores the image URL
event_category TEXT NOT NULL CHECK (event_category IN ('Education', 'Blog', 'Culture', 'Rehabilitation', 'Environment', 'Audio Recording', 'Field Work', 'Sports')),
start_date TIMESTAMP NOT NULL,
end_date TIMESTAMP NOT NULL,
registration_deadline TIMESTAMP,
max_volunteers INT DEFAULT 25,
email_sent BOOLEAN DEFAULT FALSE;
status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteer_event (
  id SERIAL PRIMARY KEY,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not registered', 'registered')) DEFAULT 'not invited',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMPALTER TABLE volunteer_event 
  feedback TEXT,
  feedback_submitted_at TIMESTAMP;
  star_rating INT CHECK (star_rating BETWEEN 1 AND 5);
  
);

