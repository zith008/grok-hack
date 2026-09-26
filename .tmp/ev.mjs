import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await s.from('events').select('*').order('created_at',{ascending:false}).limit(3);
if (error) console.log('ERR', error.message); else console.log(JSON.stringify(data,null,1).slice(0,1500));
