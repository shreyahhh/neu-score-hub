# Supabase Setup Guide for Face-Name Match Game

## Error: 401 Unauthorized

If you're getting a 401 error when trying to fetch faces, it means Supabase authentication is failing. Here's how to fix it:

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

## Step 2: Create/Update `.env` File

Create a `.env` file in the **root of your frontend project** (same directory as `package.json`):

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:**
- Use the **anon/public key**, NOT the service_role key
- The service_role key should only be used in the backend
- The anon key is safe to use in frontend code

## Step 3: Configure Row Level Security (RLS)

The 401 error often happens because RLS is enabled on the `face_library` table. You have two options:

### Option A: Disable RLS (For Testing Only)

1. Go to Supabase Dashboard → **Table Editor**
2. Select the `face_library` table
3. Click **Settings** (gear icon)
4. Toggle **Enable Row Level Security** to OFF

⚠️ **Warning:** This makes the table publicly readable. Only do this for development/testing.

### Option B: Create RLS Policy (Recommended)

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Select the `face_library` table
3. Click **New Policy**
4. Choose **For full customization**
5. Name: `Allow public read access`
6. Policy definition:
   ```sql
   (true)
   ```
7. Allowed operation: `SELECT`
8. Click **Review** then **Save policy**

This allows anyone to read from the table (which is fine for a public game).

## Step 4: Verify Table Structure

Make sure your `face_library` table has these columns:
- `id` (UUID or text)
- `full_name` (text)
- `image_url` (text)

You can check this in **Table Editor** → `face_library` table.

## Step 5: Add Sample Data

Insert some test faces into the table:

```sql
INSERT INTO face_library (id, full_name, image_url) VALUES
  ('1', 'John Smith', 'https://i.pravatar.cc/150?img=1'),
  ('2', 'Sarah Johnson', 'https://i.pravatar.cc/150?img=2'),
  ('3', 'Michael Brown', 'https://i.pravatar.cc/150?img=3'),
  ('4', 'Emily Davis', 'https://i.pravatar.cc/150?img=4'),
  ('5', 'David Wilson', 'https://i.pravatar.cc/150?img=5'),
  ('6', 'Jessica Martinez', 'https://i.pravatar.cc/150?img=6'),
  ('7', 'Christopher Lee', 'https://i.pravatar.cc/150?img=7');
```

You can run this in **SQL Editor** in Supabase Dashboard.

## Step 6: Restart Dev Server

After updating `.env`:
1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev` or `yarn dev`
3. Vite will pick up the new environment variables

## Troubleshooting

### Still getting 401?
- ✅ Check that `.env` is in the project root (not in `src/`)
- ✅ Verify the anon key is correct (copy-paste from Supabase dashboard)
- ✅ Make sure there are no extra spaces in `.env` file
- ✅ Restart the dev server after changing `.env`

### Getting "permission denied"?
- ✅ Check RLS policies (see Step 3)
- ✅ Make sure the policy allows SELECT operation
- ✅ Verify the policy target is correct (should be `face_library` table)

### Table doesn't exist?
- ✅ Create the `face_library` table in Supabase
- ✅ Add the required columns: `id`, `full_name`, `image_url`
- ✅ Insert at least 7 rows of data

## Quick SQL to Set Up Everything

Run this in Supabase SQL Editor:

```sql
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS face_library (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  image_url TEXT NOT NULL
);

-- Disable RLS for testing (or create a policy instead)
ALTER TABLE face_library DISABLE ROW LEVEL SECURITY;

-- Insert sample data
INSERT INTO face_library (id, full_name, image_url) VALUES
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

## Need Help?

If you're still having issues:
1. Check the browser console for the full error message
2. Check Supabase Dashboard → **Logs** for server-side errors
3. Verify your `.env` file format is correct (no quotes needed around values)


