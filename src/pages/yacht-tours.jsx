import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '@/components/LandingNavbar';
import Footer from '@/components/Footer';
import BoatRentalLeadForm from '@/components/forms/BoatRentalLeadForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Anchor, Clock, Info, Luggage, MapPin, ShieldCheck, Waves } from 'lucide-react';
import yachtData from '../data/yacht_listings.json';

const YachtTours = () => {
  const navigate = useNavigate();
  const fleetRef = useRef(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedYacht, setSelectedYacht] = useState(null);

  const scrollToFleet = () => {
    fleetRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openBooking = (yacht = null) => {
    setSelectedYacht(yacht);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col items-center grainy-noise text-sm md:text-base selection:bg-amber-500/30">
      <LandingNavbar />

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">
              {selectedYacht ? `Book ${selectedYacht.name}` : "Request a Private Charter"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Submit your details and a Kosmoi concierge will contact you via WhatsApp to confirm availability and logistics.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <BoatRentalLeadForm />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/yachts/yacht_hero_nano_banana_1769244783114.png"
            alt="Elite Private Charters Koh Samui"
            className="w-full h-full object-cover scale-100 transition-transform duration-1000"
          />
          {/* Enhanced Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/20 to-slate-950" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl">
          <div className="flex justify-center mb-8">
            <span className="bg-white/5 backdrop-blur-md border border-white/10 text-white/80 px-5 py-1.5 rounded-full text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              Kosmoi Elite Fleet • Verified 2026
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-heading font-medium mb-8 tracking-tight text-white leading-[0.9] italic-serif drop-shadow-2xl">
            Elite <span className="font-light opacity-60">Kosmoi</span> Charters
          </h1>
          <p className="text-base md:text-lg text-slate-200 font-light mb-12 leading-relaxed max-w-xl mx-auto tracking-wide drop-shadow-lg bg-slate-950/20 backdrop-blur-[2px] p-4 rounded-lg border border-white/5">
            Precision-engineered journeys across the Gulf of Thailand.
            Curated by <span className="text-amber-400 font-medium">Kosmoi</span> for Koh Samui's most discerning travelers.
          </p>
          <div className="flex flex-col md:flex-row gap-5 justify-center mt-4">
            <button
              onClick={scrollToFleet}
              className="bg-white text-slate-950 px-10 py-4 rounded-sm font-semibold hover:bg-amber-400 transition-all duration-300 tracking-tight text-sm uppercase"
            >
              Explore Fleet
            </button>
            <button
              onClick={() => openBooking()}
              className="border border-white/20 text-white px-10 py-4 rounded-sm font-medium hover:bg-white/5 transition-all duration-300 tracking-tight text-sm uppercase backdrop-blur-sm"
            >
              Book Your Day
            </button>
          </div>
        </div>
      </section>

      {/* The Experience Section - Daytime Focus */}
      <section className="py-24 container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-heading leading-tight">Your Day on the <br /> <span className="text-amber-500">Gulf of Thailand</span></h2>
            <p className="text-slate-400 leading-relaxed font-light text-lg">
              Forget the crowds. A private charter with Kosmoi is about pure autonomy.
              Our captains navigate to secluded bays while you enjoy gourmet service on deck.
              From Pig Island's white sands to the emerald lagoons of Ang Thong, the itinerary is yours.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-lg border border-white/10 shrink-0">
                  <Waves className="text-amber-500 w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-heading mb-1">Snorkeling</h5>
                  <p className="text-xs text-slate-500 uppercase tracking-tighter">Premium Gear Included</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-lg border border-white/10 shrink-0">
                  <Anchor className="text-amber-500 w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-heading mb-1">Private Piers</h5>
                  <p className="text-xs text-slate-500 uppercase tracking-tighter">Skip the Main Pier</p>
                </div>
              </div>
            </div>
          </div>
          <div className="aspect-video relative overflow-hidden rounded-sm border border-white/10 group">
            <img
              src="/assets/yachts/catamaran_nano_banana_1769244815572.png"
              alt="Activity"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block mb-2">Activities</span>
              <p className="text-sm font-medium">Turquoise Waters & Hidden Caves</p>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics Section */}
      <section className="py-24 bg-white/5 border-y border-white/10 w-full relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading mb-4">Logistics & Preparation</h2>
            <p className="text-slate-500 text-sm font-light">Everything you need to know for a seamless departure.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-8 border border-white/5 bg-slate-950/50 space-y-4">
              <Clock className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="font-heading text-lg">Timings</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>• Half Day: 09:30 - 13:30 / 14:30 - 18:30</li>
                <li>• Full Day: 10:00 - 17:00</li>
                <li>• Custom: Flexible upon request</li>
              </ul>
            </div>
            <div className="p-8 border border-white/5 bg-slate-950/50 space-y-4">
              <MapPin className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="font-heading text-lg">Transfers</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>• Private Car pickup from any Resort</li>
                <li>• Main Depatures: Bangrak & Petcherat Pier</li>
                <li>• Full logistics handled by our Team</li>
              </ul>
            </div>
            <div className="p-8 border border-white/5 bg-slate-950/50 space-y-4">
              <Luggage className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="font-heading text-lg">What to Bring</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>• Swimwear & Towel</li>
                <li>• Sunscreen (Ocean friendly)</li>
                <li>• Sunglasses & Hat</li>
                <li>• Camera / GoPro</li>
              </ul>
            </div>
            <div className="p-8 border border-white/5 bg-slate-950/50 space-y-4">
              <ShieldCheck className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="font-heading text-lg">Inclusions</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>• Full Crew & Captain</li>
                <li>• Soft Drinks & Drinking Water</li>
                <li>• Snorkel Equipment</li>
                <li>• Passenger Insurance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
          <div className="w-10 h-10 rounded-full border border-amber-500/50 flex items-center justify-center mb-4">
            <Info className="text-amber-500 w-5 h-5" />
          </div>
          <h2 className="text-3xl font-heading">Secure Your Date</h2>
          <p className="text-slate-400 font-light">
            Once you request a charter, a Kosmoi concierge checks real-time fleet availability. You will receive a secure payment link (Kosmoi Pay) to confirm the booking. Full pickup details are sent immediately after confirmation.
          </p>
          <button
            onClick={() => openBooking()}
            className="mt-8 bg-amber-500 text-slate-950 px-12 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition-all"
          >
            Start Request
          </button>
        </div>
      </section>

      {/* Curated Itineraries Section */}
      <section className="py-32 container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-heading mb-6 tracking-tight">Curated Itineraries</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-light">Explore the most iconic destinations around Koh Samui with our precision-planned daily programs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Pig Island (Koh Madsum)", desc: "A tropical escape just minutes away. Relax on white sands and meet the famous beach pigs.", duration: "4-6 Hours" },
            { title: "Ang Thong Marine Park", desc: "42 islands of limestone cliffs, hidden lagoons, and emerald lakes. A true nature masterpiece.", duration: "8 Hours" },
            { title: "Koh Phangan Explorer", desc: "Crystal clear bays and pristine snorkeling spots along the rugged coastline of our sister island.", duration: "6-8 Hours" },
            { title: "Sunset Cruise", desc: "Pure luxury as the sky turns gold. The ultimate way to end a day in paradise.", duration: "3-4 Hours" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all group">
              <span className="text-[10px] text-amber-500/50 mb-4 block font-mono">{item.duration}</span>
              <h4 className="text-xl font-heading mb-4 group-hover:text-amber-400 transition-colors">{item.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Cards Section */}
      <main ref={fleetRef} className="container mx-auto px-4 -mt-20 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {yachtData.map((yacht, idx) => (
            <div
              key={yacht.id}
              className={`bg-white/5 border border-white/10 p-0 rounded-none overflow-hidden transition-all duration-500 hover:border-white/30 group relative ${idx === 1 ? 'lg:translate-y-[-10px]' : ''}`}
            >
              <div className="aspect-[16/10] overflow-hidden grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0">
                <img
                  src={
                    idx === 0 ? '/assets/yachts/motor_yacht_nano_banana_1769244800082.png' :
                      idx === 1 ? '/assets/yachts/catamaran_nano_banana_1769244815572.png' :
                        '/assets/yachts/sailing_yacht_nano_banana_1769244830523.png'
                  }
                  alt={yacht.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[9px] font-bold text-white/40 tracking-[0.3em] uppercase">{yacht.category}</span>
                  <div className="w-[1px] h-3 bg-white/10" />
                  <span className="text-[9px] font-medium text-white/40 uppercase tracking-[0.2em]">{yacht.duration_hours}H ESCAPE</span>
                </div>

                <h3 className="text-xl md:text-2xl font-heading font-medium mb-3 text-white tracking-tight leading-tight">{yacht.name}</h3>

                <p className="text-slate-400 mb-8 leading-relaxed text-sm font-light min-h-[60px] line-clamp-3">
                  {yacht.description}
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-10">
                  {yacht.features.slice(0, 4).map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-wider">
                      <div className="w-1 h-1 bg-amber-500/50" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-white/5 flex justify-between items-end">
                  <div>
                    <p className="text-[8px] text-white/20 uppercase tracking-[0.4em] font-bold mb-2">Price From</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] text-white/30 font-medium">THB</span>
                      <p className="text-3xl font-heading font-medium text-white">
                        {yacht.price_thb.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openBooking(yacht)}
                    className="text-white/40 hover:text-white transition-all text-[10px] uppercase tracking-widest font-black flex items-center gap-2"
                  >
                    Check Availability
                    <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

        </div>
      </main>

      {/* Authenticity Footer */}
      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default YachtTours;