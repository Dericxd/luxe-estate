import { notFound } from "next/navigation";

import { getPropertyBySlugOrId } from "../../lib/properties";
import { Navbar } from "../../components/Navbar";
import { PropertyGallery } from "../../components/PropertyGallery";

import { PropertyMapWrapper } from "../../components/PropertyMapWrapper";

interface PropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const resolvedParams = await params;
  const property = await getPropertyBySlugOrId(resolvedParams.slug);

  if (!property) {
    notFound();
  }

  const images = property.images;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <PropertyGallery images={images} title={property.title} />

          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
                <div className="mb-4">
                  <h1 className="text-4xl font-display font-light text-nordic dark:text-white mb-2">{property.price_label}</h1>
                  <p className="text-nordic/60 dark:text-white/60 font-medium flex items-center gap-1">
                    <span className="material-icons text-mosque text-sm">location_on</span>
                    {property.location}
                  </p>
                </div>
                
                <div className="h-px bg-slate-100 dark:bg-white/10 my-6"></div>
                
                <div className="flex items-center gap-4 mb-6">
                  <img alt="Agent" className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-nordic-dark shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4TxUmdQRb2VMjuaNxLEwLorv_dgHzoET2_wL5toSvew6nhtziaR3DX-U69DBN7J74yO6oKokpw8tqEFutJf13MeXghCy7FwZuAxnoJel6FYcKeCRUVinpZtrNnkZvXd-MY5_2MAtRD7JP5BieHixfCaeAPW04jm-y-nvF3HIrwcZ_HRDk_MrNP5WiPV3u9zNrEgM-SQoWGh4xLVSV444aZAbVl03mjjsW5WBpIeodCyqJxprTDp6Q157D06VxcdUSCf-l9UKQT-w"/>
                  <div>
                    <h3 className="font-semibold text-nordic dark:text-white">Sarah Jenkins</h3>
                    <div className="flex items-center gap-1 text-xs text-mosque font-medium">
                      <span className="material-icons text-[14px]">star</span>
                      <span>Top Rated Agent</span>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button className="p-2 rounded-full bg-mosque/10 text-mosque hover:bg-mosque hover:text-white transition-colors">
                      <span className="material-icons text-sm">chat</span>
                    </button>
                    <button className="p-2 rounded-full bg-mosque/10 text-mosque hover:bg-mosque hover:text-white transition-colors">
                      <span className="material-icons text-sm">call</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-mosque hover:bg-mosque/90 text-white py-4 px-6 rounded-lg font-medium transition-all shadow-lg shadow-mosque/20 flex items-center justify-center gap-2 group">
                    <span className="material-icons text-xl group-hover:scale-110 transition-transform">calendar_today</span>
                    Schedule Visit
                  </button>
                  <button className="w-full bg-transparent border border-nordic/10 dark:border-white/10 hover:border-mosque text-nordic/80 dark:text-white/80 hover:text-mosque py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                    <span className="material-icons text-xl">mail_outline</span>
                    Contact Agent
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 p-2 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 dark:bg-white/5 z-0">
                  <PropertyMapWrapper location={property.location} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 lg:row-start-2 -mt-8 lg:w-2/3 space-y-8">
          <div className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
            <h2 className="text-lg font-semibold mb-6 text-nordic dark:text-white">Property Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 dark:bg-white/5 rounded-lg border border-mosque/10 dark:border-white/5">
                <span className="material-icons text-mosque text-2xl mb-2">square_foot</span>
                <span className="text-xl font-bold text-nordic dark:text-white">{property.area}</span>
                <span className="text-xs uppercase tracking-wider text-nordic/50 dark:text-white/50 text-center">Size</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 dark:bg-white/5 rounded-lg border border-mosque/10 dark:border-white/5">
                <span className="material-icons text-mosque text-2xl mb-2">bed</span>
                <span className="text-xl font-bold text-nordic dark:text-white">{property.beds}</span>
                <span className="text-xs uppercase tracking-wider text-nordic/50 dark:text-white/50">Bedrooms</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 dark:bg-white/5 rounded-lg border border-mosque/10 dark:border-white/5">
                <span className="material-icons text-mosque text-2xl mb-2">shower</span>
                <span className="text-xl font-bold text-nordic dark:text-white">{property.baths}</span>
                <span className="text-xs uppercase tracking-wider text-nordic/50 dark:text-white/50">Bathrooms</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 dark:bg-white/5 rounded-lg border border-mosque/10 dark:border-white/5">
                <span className="material-icons text-mosque text-2xl mb-2">directions_car</span>
                <span className="text-xl font-bold text-nordic dark:text-white">2</span>
                <span className="text-xs uppercase tracking-wider text-nordic/50 dark:text-white/50">Garage</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
            <h2 className="text-lg font-semibold mb-4 text-nordic dark:text-white">About this home</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-nordic/70 dark:text-white/70 leading-relaxed">
              <p className="mb-4">
                Experience modern luxury in this stunning home located in {property.location}. Designed with an emphasis on indoor-outdoor living, the residence features high-end finishes and an open concept perfect for entertaining.
              </p>
              <p>
                A remarkable property offering unparalleled comfort and style. Whether you are looking for a serene retreat or a place to host guests, this property provides all the amenities you need to live beautifully.
              </p>
            </div>
            <button className="mt-4 text-mosque font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              Read more
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
            <h2 className="text-lg font-semibold mb-6 text-nordic dark:text-white">Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-center gap-3 text-nordic/70 dark:text-white/70">
                <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                <span>Smart Home System</span>
              </div>
              <div className="flex items-center gap-3 text-nordic/70 dark:text-white/70">
                <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                <span>Swimming Pool</span>
              </div>
              <div className="flex items-center gap-3 text-nordic/70 dark:text-white/70">
                <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                <span>Central Heating & Cooling</span>
              </div>
              <div className="flex items-center gap-3 text-nordic/70 dark:text-white/70">
                <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                <span>Electric Vehicle Charging</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
