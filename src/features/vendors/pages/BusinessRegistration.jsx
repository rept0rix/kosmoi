import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl, cn } from '@/shared/lib/utils';
import { db } from '@/api/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  Upload,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Store,
  User,
  Phone,
  Search,
  Building2,
  Sparkles,
  Zap,
  ArrowLeft,
  Globe,
  Clock,
  Map as MapIcon,
  Image as ImageIcon
} from 'lucide-react';
import GoogleMap from '@/components/GoogleMap';
import { RegisterBusinessForm } from '@/features/vendors/components/RegisterBusinessForm';
import { CategorySelector } from '@/features/vendors/components/CategorySelector';
import { PhoneVerification } from '@/features/vendors/components/PhoneVerification';

// --- Constants ---

const languages = [
  { value: 'english', label: 'English' },
  { value: 'thai', label: 'Thai' },
  { value: 'hebrew', label: 'Hebrew' },
  { value: 'russian', label: 'Russian' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'chinese', label: 'Chinese' },
];

const areaOptions = [
  'Bo Phut',
  'Lamai',
  'Chaweng',
  'Maenam',
  'Bang Rak',
  'Nathon',
  'Taling Ngam',
  'Choeng Mon',
  'Lipanoi',
  'Butterfly Garden'
];

// --- Main Component ---

export default function BusinessRegistration() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();

  // View State: 'landing' | 'claim' | 'register'
  const [view, setView] = useState('landing');

  // Check if user already has a business
  const { data: existingBusiness, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['my-business', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await db.entities.ServiceProvider.get({ owner_id: user.id });
      return Array.isArray(data) ? data[0] : data;
    },
    enabled: !!user?.id,
  });

  if (isLoadingAuth || isLoadingBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-xl bg-white/80 backdrop-blur-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-800">Login Required</h2>
            <p className="text-slate-600 mb-6">
              Please log in to manage or register your business on Kosmoi.
            </p>
            <Button
              onClick={() => navigateToLogin()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login / Register
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <LandingView
              key="landing"
              existingBusiness={existingBusiness}
              onSelectClaim={() => setView('claim')}
              onSelectRegister={() => setView('register')}
            />
          )}
          {view === 'claim' && (
            <ClaimBusinessView
              key="claim"
              onBack={() => setView('landing')}
              onClaimSuccess={() => navigate(createPageUrl('BusinessDashboard'))}
            />
          )}
          {view === 'register' && (
            <RegisterBusinessForm
              key="register"
              onBack={() => setView('landing')}
              onSuccess={() => navigate(createPageUrl('BusinessDashboard'))}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Sub-Views ---

function LandingView({ existingBusiness, onSelectClaim, onSelectRegister }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 text-center"
    >
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="absolute left-0 top-0 -mt-2 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Kosmoi Business Hub
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-2">
          Manage your digital presence, receive bookings, and grow your customer base.
        </p>
      </div>

      {existingBusiness && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto"
        >
          <Card className="border-2 border-blue-100 shadow-xl bg-white backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
            onClick={() => navigate(createPageUrl('BusinessDashboard'))}>
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{existingBusiness.business_name}</h3>
              <p className="text-slate-500 mb-6 text-sm">Your business is already registered.</p>
              <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                Manage My Business
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Options Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8">

        {/* Claim Option */}
        <Card
          className="group relative overflow-hidden border-2 border-transparent hover:border-blue-100 hover:shadow-xl transition-all cursor-pointer bg-white"
          onClick={onSelectClaim}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-8 relative z-10 flex flex-col items-center h-full text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Search className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">I have an existing business</h3>
            <p className="text-slate-500 mb-6 flex-grow">
              Is your business on Google Maps? Claim it and get instant access to manage your profile.
            </p>
            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
              Find & Claim Business
            </Button>
          </CardContent>
        </Card>

        {/* Register New Option */}
        <Card
          className="group relative overflow-hidden border-2 border-transparent hover:border-purple-100 hover:shadow-xl transition-all cursor-pointer bg-white"
          onClick={onSelectRegister}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-8 relative z-10 flex flex-col items-center h-full text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">I want to list a new business</h3>
            <p className="text-slate-500 mb-6 flex-grow">
              Join our provider network, create a new business page, and start receiving bookings.
            </p>
            <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800">
              Register New Business
            </Button>
          </CardContent>
        </Card>

      </div>
    </motion.div>
  );
}

function ClaimBusinessView({ onBack, onClaimSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  useEffect(() => {
    // Initialize Google Places Services
    const initServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        if (!autocompleteService.current) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        if (!placesService.current) {
          placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        }
      }
    };

    const interval = setInterval(() => {
      if (window.google) {
        initServices();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (input) => {
    setSearchTerm(input);
    if (!input || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    const samuiBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(9.4, 99.9),
      new window.google.maps.LatLng(9.6, 100.1)
    );

    autocompleteService.current.getPlacePredictions(
      { input, locationBias: samuiBounds, types: ['establishment'] },
      (results, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handleSelectPrediction = (placeId) => {
    if (!placesService.current) return;

    setIsLoading(true);
    placesService.current.getDetails(
      { placeId, fields: ['name', 'formatted_address', 'geometry', 'photos', 'international_phone_number', 'website', 'rating'] },
      (place, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSelectedPlace({ ...place, placeId });
        }
      }
    );
  };

  const claimMutation = useMutation({
    mutationFn: async (/** @type {any} */ placeData) => {
      // Fix: Strictly check placeData to avoid 'void' inference which caused lint errors
      if (!placeData || !placeData.name) throw new Error("No place data provided");

      const payload = {
        business_name: placeData.name,
        description: `Imported from Google Maps: ${placeData.formatted_address || 'No address'}`,
        location: placeData.formatted_address || '',
        latitude: placeData.geometry?.location?.lat() || 0,
        longitude: placeData.geometry?.location?.lng() || 0,
        status: 'pending_verification',
        verified: false,
        phone: placeData.international_phone_number || '',
        category: 'other',
        google_place_id: placeData.placeId || '',
        metadata: {
          google_rating: placeData.rating || 0,
          google_photos: placeData.photos?.map(p => p.getUrl()) || []
        }
      };

      return await db.entities.ServiceProvider.create(payload);
    },
    onSuccess: () => {
      onClaimSuccess();
    },
    onError: (error) => {
      console.error("Claim failed:", error);
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Find Your Business</h2>

          <div className="relative mb-6">
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Type business name..."
              className="pr-10 py-6 text-lg"
              autoFocus
            />
          </div>

          {predictions.length > 0 && !selectedPlace && (
            <div className="space-y-2 border rounded-lg p-2 max-h-60 overflow-y-auto bg-slate-50">
              {predictions.map((p) => (
                <div
                  key={p.place_id}
                  className="p-3 hover:bg-white hover:shadow-sm cursor-pointer rounded-md transition-all flex items-start gap-3"
                  onClick={() => handleSelectPrediction(p.place_id)}
                >
                  <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{p.structured_formatting.main_text}</p>
                    <p className="text-sm text-slate-500">{p.structured_formatting.secondary_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedPlace && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{selectedPlace.name}</h3>
              <p className="text-slate-600 mb-4">{selectedPlace.formatted_address}</p>
              {selectedPlace.international_phone_number && (
                <p className="text-slate-500 mb-4 text-sm font-mono">{selectedPlace.international_phone_number}</p>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                onClick={() => claimMutation.mutate(selectedPlace)}
                disabled={claimMutation.isPending}
              >
                {claimMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Store className="w-4 h-4 mr-2" />}
                This is my business - Claim it
              </Button>
              <Button variant="ghost" className="mt-2 text-sm text-slate-500" onClick={() => setSelectedPlace(null)}>
                Not my business
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Main Address / Location <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. 123 Beach Road, Lamai"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Areas</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-slate-50 max-h-32 overflow-y-auto">
                      {areaOptions.map((area) => (
                        <Badge
                          key={area}
                          variant={formData.service_areas.includes(area) ? 'default' : 'outline'}
                          className="cursor-pointer hover:bg-blue-100"
                          onClick={() => handleAreaToggle(area)}
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Languages Spoken</Label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <Badge
                        key={lang.value}
                        variant={formData.languages.includes(lang.value) ? 'secondary' : 'outline'}
                        className={cn(
                          "cursor-pointer px-3 py-1",
                          formData.languages.includes(lang.value) ? "bg-green-100 text-green-800 border-green-200" : ""
                        )}
                        onClick={() => handleLanguageToggle(lang.value)}
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        {lang.label}
                      </Badge>
                    ))}
                  </div>
                </div>


              </div >

    <div className="flex justify-between mt-8">
      <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
      <Button onClick={() => setStep(3)} disabled={!isStep2Valid()} className="bg-blue-600 hover:bg-blue-700 h-12 px-8">
        Next: Map Pin &nbsp; <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
            </motion.div >
          )
}

{/* Step 3: Map Pin */ }
{
  step === 3 && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-2 text-blue-600 mb-4 border-b pb-2">
        <MapPin className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Confirm Location on Map</h3>
      </div>

      <p className="text-sm text-slate-500">Drag the map or click to pin the exact entrance of your business.</p>

      <div className="h-[400px] w-full rounded-xl overflow-hidden border-2 border-slate-200 relative">
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          {/* Wrap GoogleMap in a full-size container since it doesn't accept className */}
          <div className="w-full h-full">
            <GoogleMap
              height="100%"
              center={mapPosition || { lat: 9.512, lng: 100.058 }}
              zoom={13}
              onMapClick={handleMapLocationChange}
              markers={mapPosition ? [{
                lat: mapPosition.lat,
                lng: mapPosition.lng,
                title: 'Business Location'
              }] : []}
            />
          </div>
        </div>
        {/* Overlay for interaction hint */}
        {!mapPosition && (
          <div className="absolute top-4 left-4 right-4 bg-white/90 p-4 rounded-lg shadow-md text-center z-10 pointer-events-none">
            <p className="font-semibold text-blue-800">Please click on the map to set location</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
        <Button onClick={() => setStep(4)} className="bg-blue-600 hover:bg-blue-700 h-12 px-8">
          Confirm Location &nbsp; <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

{/* Step 4: Images & Review */ }
{
  step === 4 && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-2 text-blue-600 mb-4 border-b pb-2">
        <ImageIcon className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Images & Final Review</h3>
      </div>

      <div className="space-y-4">
        <Label>Business Photos (Max 5)</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="aspect-square rounded-lg overflow-hidden border relative group">
              <img src={img} alt="business" className="w-full h-full object-cover" />
              <Button variant="destructive" size="icon" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6" onClick={() => setImages(images.filter((_, i) => i !== idx))}>
                &times;
              </Button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              {uploadingImages ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : <Upload className="w-6 h-6 text-slate-400 mb-2" />}
              <span className="text-xs text-slate-500 font-medium">Upload</span>
            </label>
          )}
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2 mt-4">
        <p><strong>Name:</strong> {formData.business_name}</p>
        <p><strong>Phone:</strong> {formData.phone}</p>
        <p><strong>Category:</strong> {formData.category}</p>
        <p><strong>Description:</strong> {formData.description.substring(0, 50)}...</p>
        <p><strong>Location:</strong> {mapPosition ? `${mapPosition.lat.toFixed(4)}, ${mapPosition.lng.toFixed(4)}` : 'Not set'}</p>
        <p><strong>Address:</strong> {formData.location}</p>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
        <Button
          onClick={handleSubmit}
          disabled={createBusinessMutation.isPending}
          className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 shadow-md"
        >
          {createBusinessMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Submit Registration
        </Button>
      </div>
    </motion.div>
  )
}

        </CardContent >
      </Card >
    </motion.div >
  );
}
