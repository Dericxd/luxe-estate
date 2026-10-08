const fs = require('fs');

const locations = [
  "Miami, FL", "San Francisco, CA", "New York, NY", "Austin, TX", "Los Angeles, CA",
  "Denver, CO", "Seattle, WA", "Chicago, IL", "Boston, MA", "Portland, OR"
];
const propertyTypes = ["House", "Apartment", "Condo", "Villa", "Penthouse"];
const imagePlaceholders = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600607687931-cebf004f5195?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=800",
];

let sql = "INSERT INTO properties (title, location, price, price_label, listing_type, beds, baths, area, images, tag, tag_color, is_featured) VALUES \n";
const values = [];

for (let i = 0; i < 20; i++) {
  const isSale = Math.random() > 0.3;
  const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const beds = Math.floor(Math.random() * 5) + 1;
  const baths = Math.floor(Math.random() * 4) + 1;
  const price = isSale 
    ? Math.floor(Math.random() * 4000000) + 500000 
    : Math.floor(Math.random() * 15000) + 2000;
  
  let priceLabel = "";
  if (isSale) {
    if (price >= 1000000) {
      priceLabel = `$${(price / 1000000).toFixed(1)}M`;
    } else {
      priceLabel = `$${(price / 1000).toFixed(0)}k`;
    }
  } else {
    priceLabel = `$${price.toLocaleString()}/mo`;
  }

  const title = `Stunning ${type} in ${location.split(',')[0]}`;
  const imagesArray = `ARRAY['${imagePlaceholders[Math.floor(Math.random() * imagePlaceholders.length)]}']`;

  values.push(`('${title}', '${location}', ${price}, '${priceLabel}', '${isSale ? 'sale' : 'rent'}', ${beds}, ${baths}, '${Math.floor(Math.random() * 4000) + 800} sqft', ${imagesArray}, '${type}', 'gray', false)`);
}

sql += values.join(',\n') + ';';
fs.writeFileSync('scripts/seed.sql', sql);
console.log('Generated seed.sql');
