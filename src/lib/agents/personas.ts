// 20 shopper personas. Each reads a real product page and decides:
// view / add_to_cart / leave, with a reason and any blockers hit.
//
// Sensitivity design: each blocker is a dealbreaker for 6-9 personas and
// merely annoying for the rest. So a healthy page converts most of the panel,
// and removing ONE attribute drops conversion visibly without zeroing it —
// which is what a realistic merchant mistake looks like.

import type { BlockerId } from './types';

export interface Persona {
  id: string;
  name: string;
  /** One line the prompt renders as "You are ..." */
  profile: string;
  /** Max they will pay, as a multiple of the market median for the item. */
  price_tolerance: number;
  /** Blockers that make them leave outright. */
  dealbreakers: BlockerId[];
}

export const PERSONAS: Persona[] = [
  { id: 'p01', name: 'Budget student',        profile: 'a student on a tight budget buying for yourself; you compare prices before anything else',                     price_tolerance: 1.0,  dealbreakers: ['price_vs_comps', 'returns'] },
  { id: 'p02', name: 'Sizing-anxious buyer',  profile: 'someone between sizes who has been burned by bad fits and will not buy without measurements',                   price_tolerance: 1.3,  dealbreakers: ['size_guide'] },
  { id: 'p03', name: 'Gift buyer',            profile: 'buying a gift for someone else; you need it to look good and be returnable if the size is wrong',               price_tolerance: 1.4,  dealbreakers: ['returns', 'size_guide'] },
  { id: 'p04', name: 'Brand hunter',          profile: 'you only buy specific brands and check authenticity cues in the images and description',                        price_tolerance: 1.6,  dealbreakers: ['lead_image'] },
  { id: 'p05', name: 'Sensitive skin',        profile: 'you react badly to synthetics and will not buy anything without a full material composition',                   price_tolerance: 1.3,  dealbreakers: ['materials'] },
  { id: 'p06', name: 'Resale flipper',        profile: 'you buy to resell; margin is everything and you check condition detail obsessively',                            price_tolerance: 0.85, dealbreakers: ['price_vs_comps', 'lead_image'] },
  { id: 'p07', name: 'Deal hunter',           profile: 'you never pay full price and will leave the moment something looks overpriced',                                 price_tolerance: 0.95, dealbreakers: ['price_vs_comps'] },
  { id: 'p08', name: 'Sustainability buyer',  profile: 'you buy secondhand on principle and need to know the fabric and its condition',                                 price_tolerance: 1.3,  dealbreakers: ['materials'] },
  { id: 'p09', name: 'First-time visitor',    profile: 'you have never heard of this shop; everything unclear reads as a risk',                                         price_tolerance: 1.1,  dealbreakers: ['returns', 'lead_image'] },
  { id: 'p10', name: 'Returning customer',    profile: 'you have bought here before and trust the shop; you need less convincing than most',                            price_tolerance: 1.5,  dealbreakers: ['price_vs_comps'] },
  { id: 'p11', name: 'Mobile impulse buyer',  profile: 'browsing on your phone in a spare minute; you decide on the first image and the price alone',                   price_tolerance: 1.2,  dealbreakers: ['lead_image'] },
  { id: 'p12', name: 'Detail reader',         profile: 'you read every line of the description and leave if anything important is missing',                             price_tolerance: 1.4,  dealbreakers: ['materials', 'size_guide'] },
  { id: 'p13', name: 'Tall buyer',            profile: 'you are tall and nothing ever fits; exact length measurements decide the purchase',                             price_tolerance: 1.4,  dealbreakers: ['size_guide'] },
  { id: 'p14', name: 'Plus-size buyer',       profile: 'sizing is inconsistent across brands so you need real measurements, not a letter size',                         price_tolerance: 1.3,  dealbreakers: ['size_guide', 'returns'] },
  { id: 'p15', name: 'Collector',             profile: 'you collect a specific era or label; condition and provenance detail matter more than price',                   price_tolerance: 1.8,  dealbreakers: ['lead_image', 'materials'] },
  { id: 'p16', name: 'Cautious spender',      profile: 'a larger purchase for you; you need the returns policy spelled out before committing',                          price_tolerance: 1.1,  dealbreakers: ['returns'] },
  { id: 'p17', name: 'Comparison shopper',    profile: 'you have three tabs open on rival shops and pick on price and clarity',                                         price_tolerance: 1.0,  dealbreakers: ['price_vs_comps', 'size_guide'] },
  { id: 'p18', name: 'Last-minute buyer',     profile: 'you need it fast and will not chase missing information; anything unclear and you move on',                     price_tolerance: 1.4,  dealbreakers: ['returns', 'size_guide'] },
  { id: 'p19', name: 'Quality sceptic',       profile: 'you assume things are cheaply made until the page proves otherwise with fabric and construction detail',        price_tolerance: 1.3,  dealbreakers: ['materials', 'lead_image'] },
  { id: 'p20', name: 'Loyal brand fan',       profile: 'you love this label and are easy to convince, but you still will not overpay wildly',                           price_tolerance: 1.7,  dealbreakers: ['price_vs_comps'] },
];

export const PERSONA_COUNT = PERSONAS.length;
