// Slug para SimpleIcons CDN (cdn.simpleicons.org/<slug>) — logos monocromos.
// Si falta o falla, CarBrandLogo cae a favicon de Google con el dominio.
const BRAND_SLUGS: Record<string, { slug: string; domain: string }> = {
  ford:           { slug: 'ford',          domain: 'ford.com' },
  chevrolet:      { slug: 'chevrolet',     domain: 'chevrolet.com' },
  chevy:          { slug: 'chevrolet',     domain: 'chevrolet.com' },
  volkswagen:     { slug: 'volkswagen',    domain: 'volkswagen.com' },
  vw:             { slug: 'volkswagen',    domain: 'volkswagen.com' },
  toyota:         { slug: 'toyota',        domain: 'toyota.com' },
  renault:        { slug: 'renault',       domain: 'renault.com' },
  peugeot:        { slug: 'peugeot',       domain: 'peugeot.com' },
  citroen:        { slug: 'citroen',       domain: 'citroen.com' },
  fiat:           { slug: 'fiat',          domain: 'fiat.com' },
  honda:          { slug: 'honda',         domain: 'honda.com' },
  nissan:         { slug: 'nissan',        domain: 'nissan.com' },
  hyundai:        { slug: 'hyundai',       domain: 'hyundai.com' },
  kia:            { slug: 'kia',           domain: 'kia.com' },
  'mercedes-benz':{ slug: '',              domain: 'mercedes-benz.com' },
  mercedes:       { slug: '',              domain: 'mercedes-benz.com' },
  bmw:            { slug: 'bmw',           domain: 'bmw.com' },
  audi:           { slug: 'audi',          domain: 'audi.com' },
  jeep:           { slug: 'jeep',          domain: 'jeep.com' },
  ram:            { slug: '',              domain: 'ramtrucks.com' },
  dodge:          { slug: 'dodge',         domain: 'dodge.com' },
  chrysler:       { slug: 'chrysler',      domain: 'chrysler.com' },
  mitsubishi:     { slug: 'mitsubishi',    domain: 'mitsubishi-motors.com' },
  subaru:         { slug: 'subaru',        domain: 'subaru.com' },
  suzuki:         { slug: 'suzuki',        domain: 'globalsuzuki.com' },
  mazda:          { slug: 'mazda',         domain: 'mazda.com' },
  lexus:          { slug: '',              domain: 'lexus.com' },
  porsche:        { slug: 'porsche',       domain: 'porsche.com' },
  volvo:          { slug: 'volvo',         domain: 'volvocars.com' },
  mini:           { slug: 'mini',          domain: 'mini.com' },
  alfa:           { slug: 'alfaromeo',     domain: 'alfaromeo.com' },
  'alfa romeo':   { slug: 'alfaromeo',     domain: 'alfaromeo.com' },
  jaguar:         { slug: 'jaguar',        domain: 'jaguar.com' },
  'land rover':   { slug: 'landrover',     domain: 'landrover.com' },
  land:           { slug: 'landrover',     domain: 'landrover.com' },
  iveco:          { slug: 'iveco',         domain: 'iveco.com' },
  scania:         { slug: 'scania',        domain: 'scania.com' },
  daf:            { slug: 'daf',           domain: 'daf.com' },
  byd:            { slug: 'byd',           domain: 'byd.com' },
  geely:          { slug: 'geely',         domain: 'geely.com' },
  chery:          { slug: 'chery',         domain: 'cheryinternational.com' },
  haval:          { slug: 'haval',         domain: 'haval-global.com' },
  isuzu:          { slug: 'isuzu',         domain: 'isuzu.com' },
};

function normalize(marca: string): string {
  return marca
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function lookup(marca: string): { slug: string; domain: string } | null {
  const key = normalize(marca);
  if (BRAND_SLUGS[key]) return BRAND_SLUGS[key];
  const first = key.split(/[\s-]+/)[0];
  if (BRAND_SLUGS[first]) return BRAND_SLUGS[first];
  return null;
}

export function getBrandSimpleIconUrl(marca: string | null | undefined): string | null {
  if (!marca) return null;
  const m = lookup(marca);
  if (!m || !m.slug) return null;
  return `https://cdn.simpleicons.org/${m.slug}`;
}

export function getBrandFaviconUrl(marca: string | null | undefined, size = 64): string | null {
  if (!marca) return null;
  const m = lookup(marca);
  if (!m) return null;
  return `https://www.google.com/s2/favicons?domain=${m.domain}&sz=${size}`;
}
