-- 1. Add `is_public` boolean to profiles table
ALTER TABLE profiles ADD COLUMN is_public BOOLEAN DEFAULT true NOT NULL;

-- 2. Create the `groups` table
CREATE TABLE groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create the `group_members` junction table
CREATE TABLE group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

-- 4. Set up Row Level Security (RLS) for Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Groups: Anyone can view groups (needed to validate invite codes and show lists)
CREATE POLICY "Groups are viewable by everyone."
    ON groups FOR SELECT
    USING ( true );

-- Groups: Authenticated users can create groups
CREATE POLICY "Users can create groups."
    ON groups FOR INSERT
    WITH CHECK ( auth.uid() = owner_id );

-- Groups: Group owner can update their group
CREATE POLICY "Owners can update their groups."
    ON groups FOR UPDATE
    USING ( auth.uid() = owner_id );

-- Groups: Group owner can delete their group
CREATE POLICY "Owners can delete their groups."
    ON groups FOR DELETE
    USING ( auth.uid() = owner_id );

-- 5. Set up Row Level Security (RLS) for Group Members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Group Members: Anyone can view who is in a group (needed for fetching leaderboards)
CREATE POLICY "Group memberships are viewable by everyone."
    ON group_members FOR SELECT
    USING ( true );

-- Group Members: Users can join groups (insert themselves)
CREATE POLICY "Users can join groups."
    ON group_members FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

-- Group Members: Users can leave groups (delete themselves)
CREATE POLICY "Users can leave groups."
    ON group_members FOR DELETE
    USING ( auth.uid() = user_id );
