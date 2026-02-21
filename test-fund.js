import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFund() {
    console.log('Testing fund_data...');
    const { data: funds, error: error1 } = await supabase.from('fund_data').select('*').limit(1);
    console.log('Funds data:', funds, 'Error:', error1);
    console.log('Funds count:', funds ? funds.length : 0, 'Error:', error1);

    console.log('Testing fund_nav_history...');
    const { data: history, error: error2 } = await supabase.from('fund_nav_history').select('*').limit(5);
    console.log('History count:', history ? history.length : 0, 'Error:', error2);
}

testFund();
