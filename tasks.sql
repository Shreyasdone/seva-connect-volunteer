CREATE TABLE tasks (
  task_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  volunteer_email TEXT, -- Stores email for reference, even if volunteer_id is NULL
  task_description TEXT NOT NULL,
  task_status TEXT NOT NULL CHECK (task_status IN ('unassigned', 'to do', 'doing', 'done')) DEFAULT 'unassigned',
  task_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);