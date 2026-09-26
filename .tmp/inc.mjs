import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: inc } = await s.from('incidents').select('*').order('created_at',{ascending:false}).limit(2);
for (const i of inc) console.log(JSON.stringify({id:i.id,title:i.product_title,status:i.status,det:i.detector,before:i.conversion_before,after:i.conversion_after,loss:i.loss_per_day_gbp,dx:i.diagnosis},null,1));
const { data: fx } = await s.from('fixes').select('*').order('id',{ascending:false}).limit(2);
for (const f of fx) console.log('FIX', f.type, f.autonomy, 'approved_by='+f.approved_by, 'applied='+f.applied_at, JSON.stringify(f.after_json).slice(0,300));
const { data: ev } = await s.from('events').select('reason,added_to_cart').order('created_at',{ascending:false}).limit(6);
for (const e of ev) console.log('EV', e.added_to_cart, '|', (e.reason||'').slice(0,120));
