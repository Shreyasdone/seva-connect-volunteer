CREATE TABLE skills (
  skill_id SERIAL PRIMARY KEY,
  skill TEXT NOT NULL UNIQUE,
  skill_icon TEXT -- URL or Unicode for the skill icon
);

CREATE TABLE task_skills (
  task_id INT REFERENCES tasks(task_id) ON DELETE CASCADE,
  skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, skill_id) -- Ensures a task cannot have duplicate skills
);

CREATE TABLE volunteer_skills (
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
  PRIMARY KEY (volunteer_id, skill_id) -- Ensures no duplicate skills per volunteer
);
