/**
 * Business-category theme discovery metadata.
 * Do not advertise planned designs as available or publishable.
 * Backend theme IDs remain the existing three until an end-to-end theme is released.
 */
export const BUSINESS_CATEGORIES = [
  {id:'all', ar:'كل الأنشطة', en:'All industries'},
  {id:'fashion', ar:'أزياء وموضة', en:'Fashion'},
  {id:'streetwear', ar:'ستريت وير وأحذية', en:'Streetwear'},
  {id:'beauty', ar:'تجميل وعناية', en:'Beauty'},
  {id:'electronics', ar:'إلكترونيات', en:'Electronics'},
  {id:'grocery', ar:'أغذية وسوبر ماركت', en:'Grocery'},
  {id:'home', ar:'منزل وأثاث', en:'Home'},
  {id:'jewelry', ar:'مجوهرات وساعات', en:'Jewelry'},
  {id:'sports', ar:'رياضة ولياقة', en:'Sports'},
  {id:'kids', ar:'أطفال وألعاب', en:'Kids'},
  {id:'handmade', ar:'هدايا ومنتجات يدوية', en:'Handmade'},
] as const;
export type BusinessThemeCategory = typeof BUSINESS_CATEGORIES[number]['id'];

export const THEME_DESIGN_ROADMAP = [
  {id:'editorial-luxe',name:'Editorial Luxe',category:'fashion',legacy:'editorial',status:'available-legacy'},
  {id:'street-pulse',name:'Street Pulse',category:'streetwear',legacy:'streetwear',status:'available-legacy'},
  {id:'pure-beauty',name:'Pure Beauty',category:'beauty',status:'available'},
  {id:'tech-grid',name:'Tech Grid',category:'electronics',status:'planned'},
  {id:'fresh-market',name:'Fresh Market',category:'grocery',status:'planned'},
  {id:'living-space',name:'Living Space',category:'home',legacy:'lifestyle',status:'available-legacy'},
  {id:'golden-atelier',name:'Golden Atelier',category:'jewelry',status:'planned'},
  {id:'active-motion',name:'Active Motion',category:'sports',status:'planned'},
  {id:'little-joy',name:'Little Joy',category:'kids',status:'planned'},
  {id:'crafted-story',name:'Crafted Story',category:'handmade',status:'planned'},
] as const;

/** Only backend-supported IDs may be selected, saved or published. */
export const LEGACY_THEME_CATEGORIES: Record<'editorial'|'streetwear'|'lifestyle'|'pure-beauty', readonly BusinessThemeCategory[]> = {
  editorial:['fashion','beauty','jewelry','handmade'],
  streetwear:['streetwear','sports','electronics','fashion'],
  'pure-beauty':['beauty','jewelry','handmade'],
  lifestyle:['home','kids','grocery','handmade','beauty'],
};
