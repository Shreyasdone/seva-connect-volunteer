-- Create a table to store chat messages
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,                -- references your events table (if you have one)
  volunteer_id INTEGER,                     -- optional, for volunteers from the auth table
  volunteer_non_auth_id INTEGER,            -- optional, for volunteers from the non-auth table
  volunteer_name TEXT NOT NULL,             -- duplicate volunteer name for display
  volunteer_email TEXT NOT NULL,            -- duplicate volunteer email for display
  message TEXT NOT NULL,                    -- the chat message content
  created_at TIMESTAMPTZ DEFAULT NOW()      -- timestamp for when the message was posted
);

-- Optionally, add a foreign key if you have an events table
ALTER TABLE chat_messages
  ADD CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id);


CREATE OR REPLACE FUNCTION post_chat_message(
  p_event_id INTEGER,
  p_volunteer_id INTEGER,          -- pass NULL if not applicable
  p_volunteer_non_auth_id INTEGER, -- pass NULL if not applicable
  p_volunteer_name TEXT,
  p_volunteer_email TEXT,
  p_message TEXT
)
RETURNS chat_messages AS $$
DECLARE
  new_message chat_messages;
BEGIN
  INSERT INTO chat_messages (
    event_id,
    volunteer_id,
    volunteer_non_auth_id,
    volunteer_name,
    volunteer_email,
    message
  )
  VALUES (
    p_event_id,
    p_volunteer_id,
    p_volunteer_non_auth_id,
    p_volunteer_name,
    p_volunteer_email,
    p_message
  )
  RETURNING * INTO new_message;
  
  RETURN new_message;
END;
$$ LANGUAGE plpgsql;
