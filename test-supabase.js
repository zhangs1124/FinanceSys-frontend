import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing target_currencies...');
    const { data: currencies, error: error1 } = await supabase.from('target_currencies').select('*');
    console.log('Currencies:', currencies, 'Error:', error1);

    console.log('\nTesting exchange_rates...');
    const { data: rates, error: error2 } = await supabase.from('exchange_rates').select('*').limit(5);
    console.log('Rates:', rates, 'Error:', error2);
}

testConnection();
