import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await s.from('products').select('shopify_id,title,price,cost').order('title');
for (const p of data) console.log(p.shopify_id, '|', p.title, '| £'+p.price, '| cost', p.cost);
