const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const generateRandomProperties = () => {
  const properties = [];
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

  for (let i = 0; i < 20; i++) {
    const isSale = Math.random() > 0.3;
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const beds = Math.floor(Math.random() * 5) + 1;
    const baths = Math.floor(Math.random() * 4) + 1;
    const price = isSale 
      ? Math.floor(Math.random() * 4000000) + 500000 
      : Math.floor(Math.random() * 15000) + 2000;
    
    // Formatting price label
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

    const tag = type;
    const title = `Stunning ${type} in ${location.split(',')[0]}`;

    properties.push({
      title,
      location,
      price,
      price_label: priceLabel,
      listing_type: isSale ? "sale" : "rent",
      beds,
      baths,
      area: `${Math.floor(Math.random() * 4000) + 800} sqft`,
      images: [imagePlaceholders[Math.floor(Math.random() * imagePlaceholders.length)]],
      tag,
      tag_color: "gray",
      is_featured: false,
    });
  }

  return properties;
};

const seed = async () => {
  console.log("Generating 20 random properties...");
  const properties = generateRandomProperties();
  
  console.log("Inserting into Supabase...");
  const { data, error } = await supabase
    .from('properties')
    .insert(properties)
    .select();

  if (error) {
    console.error("Error inserting properties:", error);
  } else {
    console.log(`Successfully inserted ${data.length} properties.`);
  }
};

seed();
