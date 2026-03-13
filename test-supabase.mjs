import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  console.log(`URL: ${supabaseUrl}`);

  // Fetch accounts
  const { data, error, status } = await supabase.from('accounts').select('id').limit(1);

  if (error) {
    console.error(`\n❌ Error fetching 'accounts' table (Status: ${status}):\n`, error);
  } else {
    console.log('\n✅ Successfully queried accounts table!');
    console.log('Data:', data);
  }

  // Fetch assets
  const { error: asErr } = await supabase.from('assets').select('id').limit(1);
  if (asErr) {
      console.log('❌ Error fetching assets:', asErr.message);
  } else {
      console.log('✅ assets table exists.');
  }
}

testConnection();
