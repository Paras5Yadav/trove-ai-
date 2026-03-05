import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjrgnsgsoohkjfhsnfpd.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcmduc2dzb29oa2pmaHNuZnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzM1NTIsImV4cCI6MjA4ODI0OTU1Mn0.VcSWdbRTAsdAW5blCVZlEb1O1elINifJlvCOmKW7dD4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching profiles with file counts...");
    const { data, error } = await supabase
        .from('profiles')
        .select('*, files(count)')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", JSON.stringify(data, null, 2));
    }
}
check();
