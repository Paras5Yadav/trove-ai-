import fs from 'fs';
import dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const url = envConfig.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/files?select=id,file_name,file_size,file_category,created_at,user_id,profiles(display_name,email)&status=eq.pending_review&order=created_at.desc&limit=1';

async function run() {
  const res = await fetch(url, {
    headers: {
      'apikey': envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  });
  const text = await res.text();
  console.log("Response:", text);
}
run();
