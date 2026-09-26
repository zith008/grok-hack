import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { error } = await s.from('products').update({ cost: 20 }).eq('shopify_id','10515224068228');
console.log(error ?? 'cost set: Cashmere Scarf = £20');
