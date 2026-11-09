const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRANDS = [
  {
    slug: 'madressenza',
    name: 'Madressenza',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <rect width="800" height="400" fill="#FAF9F6"/>
      <g transform="translate(400, 110)" text-anchor="middle">
        <circle cx="0" cy="0" r="62" fill="none" stroke="#8C6D3F" stroke-width="2.5" stroke-dasharray="5 5"/>
        <circle cx="0" cy="0" r="52" fill="none" stroke="#1A1A1A" stroke-width="2"/>
        <path d="M-26 20 L-26 -20 L-6 12 L0 0 L6 12 L26 -20 L26 20" fill="none" stroke="#8C6D3F" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="0" cy="-32" r="4" fill="#8C6D3F"/>
      </g>
      <text x="400" y="255" font-family="'Cinzel', 'Playfair Display', 'Didot', 'Georgia', serif" font-size="78" font-weight="700" fill="#1A1A1A" text-anchor="middle" letter-spacing="12">MADRESSENZA</text>
      <line x1="180" y1="298" x2="280" y2="298" stroke="#8C6D3F" stroke-width="2" opacity="0.6"/>
      <circle cx="400" cy="298" r="4.5" fill="#8C6D3F"/>
      <line x1="520" y1="298" x2="620" y2="298" stroke="#8C6D3F" stroke-width="2" opacity="0.6"/>
      <text x="400" y="342" font-family="'Montserrat', 'Helvetica Neue', 'Arial', sans-serif" font-size="22" font-weight="700" fill="#8C6D3F" text-anchor="middle" letter-spacing="8">PERFUMARIA FINA &amp; DIFUSORES</text>
    </svg>`
  },
  {
    slug: 'wella-profissional',
    name: 'Wella Profissional',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <rect width="800" height="400" fill="#FAF9F6"/>
      <g transform="translate(400, 105) scale(1.75)" fill="none" stroke="#D13239" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-40 28 C-35 8 -22 -18 -8 -26 C-4 -28 6 -32 18 -26 C30 -20 38 -4 42 28"/>
        <path d="M-28 28 C-24 14 -14 -6 -2 -14 C6 -18 16 -18 24 -10 C30 -2 34 14 36 28"/>
        <path d="M-14 28 C-10 18 -4 2 4 -4 C10 -8 16 -6 20 2 C24 10 26 20 28 28"/>
      </g>
      <text x="400" y="265" font-family="'Arial Black', 'Helvetica Neue', sans-serif" font-size="115" font-weight="900" fill="#1A1A1A" text-anchor="middle" letter-spacing="6">WELLA</text>
      <text x="400" y="335" font-family="'Montserrat', 'Helvetica Neue', 'Arial', sans-serif" font-size="28" font-weight="800" fill="#D13239" text-anchor="middle" letter-spacing="12">PROFESSIONALS</text>
    </svg>`
  },
  {
    slug: 'loreal-professionnel',
    name: "L'Oréal Professionnel",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <rect width="800" height="400" fill="#FAF9F6"/>
      <text x="400" y="165" font-family="'Helvetica Neue', 'Arial', sans-serif" font-size="108" font-weight="900" fill="#1A1A1A" text-anchor="middle" letter-spacing="4">L&apos;ORÉAL</text>
      <text x="400" y="255" font-family="'Helvetica Neue', 'Arial', sans-serif" font-size="46" font-weight="800" fill="#1A1A1A" text-anchor="middle" letter-spacing="12">PROFESSIONNEL</text>
      <line x1="240" y1="310" x2="330" y2="310" stroke="#1A1A1A" stroke-width="2.5"/>
      <text x="400" y="320" font-family="'Helvetica Neue', 'Arial', sans-serif" font-size="28" font-weight="700" fill="#1A1A1A" text-anchor="middle" letter-spacing="10">PARIS</text>
      <line x1="470" y1="310" x2="560" y2="310" stroke="#1A1A1A" stroke-width="2.5"/>
    </svg>`
  },
  {
    slug: 'truss',
    name: 'Truss',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <rect width="800" height="400" fill="#FAF9F6"/>
      <g transform="translate(400, 105)">
        <circle cx="0" cy="0" r="54" fill="#1A1A1A"/>
        <text x="0" y="19" font-family="'Montserrat', sans-serif" font-size="52" font-weight="900" fill="#FAF9F6" text-anchor="middle">T</text>
      </g>
      <text x="400" y="265" font-family="'Montserrat', 'Helvetica Neue', 'Arial', sans-serif" font-size="112" font-weight="900" fill="#1A1A1A" text-anchor="middle" letter-spacing="18">TRUSS</text>
      <text x="400" y="335" font-family="'Montserrat', 'Helvetica Neue', 'Arial', sans-serif" font-size="28" font-weight="800" fill="#666666" text-anchor="middle" letter-spacing="12">PROFESSIONAL</text>
    </svg>`
  },
  {
    slug: 'brae',
    name: 'Braé',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <rect width="800" height="400" fill="#FAF9F6"/>
      <text x="400" y="225" font-family="'Montserrat', 'Helvetica Neue', 'Arial', sans-serif" font-size="140" font-weight="900" fill="#1A1A1A" text-anchor="middle" letter-spacing="20">BRAÉ</text>
      <line x1="220" y1="275" x2="580" y2="275" stroke="#8C6D3F" stroke-width="4"/>
      <text x="400" y="330" font-family="'Montserrat', 'Helvetica Neue', 'Arial', sans-serif" font-size="28" font-weight="800" fill="#8C6D3F" text-anchor="middle" letter-spacing="12">HAIR CARE</text>
    </svg>`
  },
  {
    slug: 'lola-cosmetics',
    name: 'Lola Cosmetics',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <rect width="800" height="400" fill="#FAF9F6"/>
      <g transform="translate(400, 160)">
        <rect x="-240" y="-115" width="480" height="185" rx="32" fill="#FF5E7E"/>
        <text x="0" y="5" font-family="'Arial Black', 'Impact', sans-serif" font-size="108" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">Lola</text>
        <text x="0" y="50" font-family="'Montserrat', sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="10">COSMETICS</text>
      </g>
      <text x="400" y="330" font-family="'Montserrat', sans-serif" font-size="24" font-weight="800" fill="#1A1A1A" text-anchor="middle" letter-spacing="8">VEGAN &amp; CRUELTY FREE</text>
    </svg>`
  },
  {
    slug: 'amend',
    name: 'Amend',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <rect width="800" height="400" fill="#FAF9F6"/>
      <text x="400" y="225" font-family="'Helvetica Neue', 'Arial', sans-serif" font-size="130" font-weight="900" fill="#1A1A1A" text-anchor="middle" letter-spacing="16">AMEND</text>
      <line x1="220" y1="275" x2="580" y2="275" stroke="#1A1A1A" stroke-width="3.5"/>
      <text x="400" y="330" font-family="'Montserrat', sans-serif" font-size="26" font-weight="800" fill="#666666" text-anchor="middle" letter-spacing="12">COSMÉTICOS</text>
    </svg>`
  }
];

async function main() {
  const brandsDir = path.join(__dirname, '..', 'public', 'brands');

  for (const b of BRANDS) {
    const svgBuffer = Buffer.from(b.svg);
    const webpPath = path.join(brandsDir, `${b.slug}.webp`);
    const pngPath = path.join(brandsDir, `${b.slug}.png`);

    await sharp(svgBuffer)
      .resize(800, 400)
      .webp({ quality: 95 })
      .toFile(webpPath);

    await sharp(svgBuffer)
      .resize(800, 400)
      .png({ quality: 95 })
      .toFile(pngPath);

    console.log(`✓ Generated ${b.name} logo (800x400 ultra large) -> ${b.slug}.webp & .png`);
  }
  console.log('ALL 7 BRAND LOGOS REGENERATED TO FILL THE CARD!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
