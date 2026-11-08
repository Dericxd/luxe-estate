const fs = require('fs');

const locations = [
  "Miami, FL", "San Francisco, CA", "New York, NY", "Austin, TX", "Los Angeles, CA",
  "Denver, CO", "Seattle, WA", "Chicago, IL", "Boston, MA", "Portland, OR"
];
const propertyTypes = ["House", "Apartment", "Condo", "Villa", "Penthouse"];

// 30 unique real-estate & luxury architecture photos from Unsplash
const uniquePropertyImages = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
];

let sql = "INSERT INTO properties (title, location, price, price_label, listing_type, beds, baths, area, images, tag, tag_color, is_featured) VALUES \n";
const values = [];

for (let i = 0; i < 20; i++) {
  const isSale = Math.random() > 0.3;
  const type = propertyTypes[i % propertyTypes.length];
  const location = locations[i % locations.length];
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
  // Each property gets a unique primary image plus 3 secondary gallery images
  const gallery = [
    uniquePropertyImages[i],
    uniquePropertyImages[(i + 7) % uniquePropertyImages.length],
    uniquePropertyImages[(i + 13) % uniquePropertyImages.length],
    uniquePropertyImages[(i + 19) % uniquePropertyImages.length],
  ];
  const imagesArray = `ARRAY[${gallery.map((img) => `'${img}'`).join(', ')}]`;

  values.push(`('${title}', '${location}', ${price}, '${priceLabel}', '${isSale ? 'sale' : 'rent'}', ${beds}, ${baths}, '${Math.floor(Math.random() * 4000) + 800} sqft', ${imagesArray}, '${type}', 'gray', false)`);
}

sql += values.join(',\n') + ';';
fs.writeFileSync('scripts/seed.sql', sql);
console.log('Generated seed.sql with unique images');
