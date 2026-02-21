# Database Initialization Instructions

These SQL statements need to be run in the **SQL Editor** of your new Supabase project.

```sql
-- 1. Create the Users/Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  picture_url TEXT,
  catchphrase TEXT,
  bike_type TEXT,
  bike_nickname TEXT,
  estimated_ftp INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create the Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  minutes INTEGER NOT NULL,
  average_wattage INTEGER NOT NULL,
  kwh DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Turn on Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies

-- Profiles: Anyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

-- Profiles: Users can only update their own profile
CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Profiles: Users insert their profile on signup
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Sessions: Anyone can view all sessions (for the leaderboard/dashboard)
CREATE POLICY "Sessions are viewable by everyone."
  ON sessions FOR SELECT
  USING ( true );

-- Sessions: Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions."
  ON sessions FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Sessions: Users can update their own sessions
CREATE POLICY "Users can update their own sessions."
  ON sessions FOR UPDATE
  USING ( auth.uid() = user_id );

-- Sessions: Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions."
  ON sessions FOR DELETE
  USING ( auth.uid() = user_id );
```
