import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


const supabase = createClient(supabaseUrl, supabaseAnonKey);

const additionalImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687931-cebf00551068?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
];

async function run() {
  console.log('Fetching properties...');
  const { data: properties, error: fetchError } = await supabase.from('properties').select('*');
  
  if (fetchError) {
    console.error('Error fetching properties:', fetchError);
    return;
  }
  
  console.log(`Found ${properties.length} properties. Updating...`);
  
  for (const property of properties) {
    // Current images array, if it exists and has items, otherwise use image_url or empty array
    let currentImages: string[] = [];
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      currentImages = property.images;
    } else if (property.image_url) {
      currentImages = [property.image_url];
    }
    
    // Add additional images to have at least 4 in total
    const needed = 4 - currentImages.length;
    let newImages = [...currentImages];
    
    if (needed > 0) {
      // Just randomly shuffle and pick some additional images
      const shuffled = [...additionalImages].sort(() => 0.5 - Math.random());
      newImages = [...newImages, ...shuffled.slice(0, needed)];
    }
    
    // Update property
    const { error: updateError } = await supabase
      .from('properties')
      .update({ images: newImages })
      .eq('id', property.id);
      
    if (updateError) {
      console.error(`Error updating property ${property.id}:`, updateError);
    } else {
      console.log(`Updated property ${property.id} with ${newImages.length} images.`);
    }
  }
  
  console.log('Done.');
}

run();
