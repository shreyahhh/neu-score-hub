# Fix: Permission Denied for face_library Table

## Problem
Even with RLS disabled, you're getting: `permission denied for table face_library`

## Root Causes & Solutions

### 1. Wrong API Key (Most Common)

**Problem:** You're using the `service_role` key instead of the `anon` key.

**Solution:**
1. Go to Supabase Dashboard → **Settings** → **API**
2. Find **Project API keys** section
3. Copy the **`anon`** or **`public`** key (NOT service_role)
4. Update your `.env`:
   ```env
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
   ```
5. **Restart your dev server**

**How to identify:**
- `anon` key: Safe for frontend, starts with `eyJ...`
- `service_role` key: **NEVER use in frontend**, bypasses RLS, has full access

### 2. Schema Permissions Issue

**Problem:** The `anon` role doesn't have USAGE permission on the `public` schema.

**Solution:** Run this SQL in Supabase SQL Editor:

```sql
-- Grant USAGE on public schema to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT on face_library table to anon role
GRANT SELECT ON TABLE public.face_library TO anon;
GRANT SELECT ON TABLE public.face_library TO authenticated;

-- If table doesn't exist, create it first:
CREATE TABLE IF NOT EXISTS public.face_library (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  image_url TEXT NOT NULL
);

-- Disable RLS
ALTER TABLE public.face_library DISABLE ROW LEVEL SECURITY;
```

### 3. Table Name Case Sensitivity

**Problem:** PostgreSQL is case-sensitive. Table name might be `Face_Library` or `FACE_LIBRARY`.

**Solution:**
1. Check exact table name in Supabase Table Editor
2. Use lowercase: `face_library` (recommended)
3. Or use quotes if needed: `"Face_Library"`

### 4. Table in Wrong Schema

**Problem:** Table might be in a different schema (not `public`).

**Solution:**
1. Check in Table Editor what schema the table is in
2. If not in `public`, either:
   - Move it to `public` schema, OR
   - Update the code to use the correct schema

### 5. Complete Setup SQL

Run this complete setup in Supabase SQL Editor:

```sql
-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.face_library (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  image_url TEXT NOT NULL
);

-- Step 2: Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Step 3: Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.face_library TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.face_library TO authenticated;
GRANT ALL ON TABLE public.face_library TO service_role;

-- Step 4: Disable RLS
ALTER TABLE public.face_library DISABLE ROW LEVEL SECURITY;

-- Step 5: Insert sample data
INSERT INTO public.face_library (id, full_name, image_url) VALUES
  ('1', 'John Smith', 'https://i.pravatar.cc/150?img=1'),
  ('2', 'Sarah Johnson', 'https://i.pravatar.cc/150?img=2'),
  ('3', 'Michael Brown', 'https://i.pravatar.cc/150?img=3'),
  ('4', 'Emily Davis', 'https://i.pravatar.cc/150?img=4'),
  ('5', 'David Wilson', 'https://i.pravatar.cc/150?img=5'),
  ('6', 'Jessica Martinez', 'https://i.pravatar.cc/150?img=6'),
  ('7', 'Christopher Lee', 'https://i.pravatar.cc/150?img=7'),
  ('8', 'Amanda Taylor', 'https://i.pravatar.cc/150?img=8'),
  ('9', 'James Anderson', 'https://i.pravatar.cc/150?img=9'),
  ('10', 'Lisa Thomas', 'https://i.pravatar.cc/150?img=10'),
  ('11', 'Robert Jackson', 'https://i.pravatar.cc/150?img=11'),
  ('12', 'Michelle White', 'https://i.pravatar.cc/150?img=12')
ON CONFLICT (id) DO NOTHING;
```

### 6. Verify Your Setup

After running the SQL above, verify:

1. **Check table exists:**
   ```sql
   SELECT * FROM public.face_library LIMIT 1;
   ```

2. **Check permissions:**
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'face_library';
   ```
   Should show `anon` with `SELECT` privilege.

3. **Check RLS status:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'face_library';
   ```
   `rowsecurity` should be `f` (false).

### 7. Still Not Working?

Check your `.env` file format:

```env
# ✅ CORRECT (no quotes, no spaces)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ WRONG (quotes will break it)
VITE_SUPABASE_URL="https://xxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ❌ WRONG (spaces break it)
VITE_SUPABASE_URL = https://xxxxx.supabase.co
```

**After fixing `.env`:**
1. Stop dev server (Ctrl+C)
2. Start again: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R)

### 8. Debug in Browser Console

Open browser console and check:
- Do you see "Supabase Config" log? (shows if env vars are loaded)
- What's the exact error code? (PGRST301, 42501, etc.)
- Check Network tab → see the actual request to Supabase

The code now logs detailed error information to help diagnose the issue.


