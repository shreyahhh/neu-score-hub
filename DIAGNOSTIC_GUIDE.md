# Supabase Permission Issue - Diagnostic Guide

## Quick Checks (No Database Changes Needed)

### 1. Check Your Backend `.env` File

**Location**: `D:\Neurazor\neurazor-backend-main\.env`

**Required Variables**:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # SERVICE ROLE KEY
```

**⚠️ CRITICAL**: The `SUPABASE_KEY` must be the **SERVICE ROLE KEY**, not the anon key!

**How to find it**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Look for **service_role** key (it's the secret one, starts with `eyJ...`)
5. Copy that key to your `.env` file

### 2. Check if Tables Exist

**In Supabase Dashboard**:
1. Go to **Table Editor**
2. Check if these tables exist:
   - `scoring_versions`
   - `test_sessions`
   - `action_receipts`
   - `text_receipts`

**If tables don't exist**: You'll need to create them (but you said you don't want to change DB unless necessary).

### 3. Check RLS Status

**In Supabase Dashboard**:
1. Go to **Table Editor** → `scoring_versions`
2. Click on the table
3. Check if **RLS (Row Level Security)** is enabled
4. If enabled, check if there are any policies

**If RLS is enabled with no policies**: That's your problem! The service role key should bypass RLS, but if it's not configured correctly, it won't work.

### 4. Test Your Backend Configuration

**Create a test file**: `test-supabase.js` in your backend root:

```javascript
require('dotenv').config();
const supabase = require('./src/config/supabase');

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set ✓' : 'Missing ✗');
  console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? `Set (${process.env.SUPABASE_KEY.substring(0, 20)}...)` : 'Missing ✗');
  
  try {
    const { data, error } = await supabase
      .from('scoring_versions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
    } else {
      console.log('✅ Connection successful!');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testConnection();
```

**Run it**: `node test-supabase.js`

### 5. Check Your Supabase Client Configuration

**File**: `src/config/supabase.js` in your backend

**Should look like**:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Should be service_role key

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
```

## Most Likely Issue

**99% chance**: You're using the **anon key** instead of the **service_role key**.

**Solution**: 
1. Get your service_role key from Supabase Dashboard
2. Update your `.env` file
3. Restart your backend server

## If Tables Don't Exist

If the tables don't exist, you have two options:

1. **Create them manually** in Supabase Dashboard (Table Editor → New Table)
2. **Run the SQL setup script** (but you said you don't want to change DB)

## If RLS is the Problem

If RLS is enabled and blocking access:

**Option 1** (Recommended): Use service_role key (bypasses RLS automatically)

**Option 2**: Disable RLS temporarily for testing:
```sql
ALTER TABLE scoring_versions DISABLE ROW LEVEL SECURITY;
```
(But you said no DB changes, so stick with Option 1)

