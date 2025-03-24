-- Create volunteers table
CREATE TABLE volunteers (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  mobile_number TEXT,
  age INTEGER,
  organization TEXT,
  work_types TEXT[] DEFAULT '{}',
  preferred_location TEXT,
  availability_start_date TIMESTAMP WITH TIME ZONE,
  availability_end_date TIMESTAMP WITH TIME ZONE,
  time_preference TEXT,
  days_available TEXT[] DEFAULT '{}',
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a secure RLS policy
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view and update only their own profile
CREATE POLICY "Users can view their own profile" 
  ON volunteers FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON volunteers FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON volunteers FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_volunteers_updated_at
BEFORE UPDATE ON volunteers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();