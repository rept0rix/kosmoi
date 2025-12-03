import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// מיפוי סוגי מקומות של Google לקטגוריות שלנו
const categoryMapping = {
  // Fix category
  'electrician': { super_category: 'fix', sub_category: 'electrician' },
  'plumber': { super_category: 'fix', sub_category: 'plumber' },
  'carpenter': { super_category: 'fix', sub_category: 'carpenter' },
  'locksmith': { super_category: 'fix', sub_category: 'locksmith' },
  'painter': { super_category: 'fix', sub_category: 'painter' },
  'roofing_contractor': { super_category: 'fix', sub_category: 'handyman' },
  'general_contractor': { super_category: 'fix', sub_category: 'handyman' },
  'handyman': { super_category: 'fix', sub_category: 'handyman' },
  'hvac_contractor': { super_category: 'fix', sub_category: 'ac_repair' },
  'car_repair': { super_category: 'fix', sub_category: 'car_mechanic' },
  
  // Eat category
  'restaurant': { super_category: 'eat', sub_category: 'restaurant' },
  'cafe': { super_category: 'eat', sub_category: 'cafe' },
  'bar': { super_category: 'eat', sub_category: 'bar' },
  'meal_takeaway': { super_category: 'eat', sub_category: 'takeaway' },
  'meal_delivery': { super_category: 'eat', sub_category: 'delivery' },
  'bakery': { super_category: 'eat', sub_category: 'bakery' },
  
  // Shop category
  'store': { super_category: 'shop', sub_category: 'general_store' },
  'clothing_store': { super_category: 'shop', sub_category: 'clothing' },
  'supermarket': { super_category: 'shop', sub_category: 'supermarket' },
  'convenience_store': { super_category: 'shop', sub_category: 'convenience_store' },
  'shopping_mall': { super_category: 'shop', sub_category: 'mall' },
  
  // Enjoy category
  'tourist_attraction': { super_category: 'enjoy', sub_category: 'attraction' },
  'amusement_park': { super_category: 'enjoy', sub_category: 'amusement_park' },
  'aquarium': { super_category: 'enjoy', sub_category: 'aquarium' },
  'art_gallery': { super_category: 'enjoy', sub_category: 'art_gallery' },
  'museum': { super_category: 'enjoy', sub_category: 'museum' },
  'zoo': { super_category: 'enjoy', sub_category: 'zoo' },
  'night_club': { super_category: 'enjoy', sub_category: 'nightclub' },
  'spa': { super_category: 'enjoy', sub_category: 'spa' },
  
  // Travel category
  'travel_agency': { super_category: 'travel', sub_category: 'travel_agency' },
  'car_rental': { super_category: 'travel', sub_category: 'car_rental' },
  'lodging': { super_category: 'travel', sub_category: 'hotel' },
  'airport': { super_category: 'travel', sub_category: 'airport' },
  
  // Get Service category
  'laundry': { super_category: 'get_service', sub_category: 'laundry' },
  'hair_care': { super_category: 'get_service', sub_category: 'hair_salon' },
  'beauty_salon': { super_category: 'get_service', sub_category: 'beauty_salon' },
  'real_estate_agency': { super_category: 'get_service', sub_category: 'real_estate_agent' },
  'moving_company': { super_category: 'get_service', sub_category: 'moving' },
  
  // Help category
  'hospital': { super_category: 'help', sub_category: 'hospital' },
  'doctor': { super_category: 'help', sub_category: 'doctor' },
  'dentist': { super_category: 'help', sub_category: 'dentist' },
  'pharmacy': { super_category: 'help', sub_category: 'pharmacy' },
  'veterinary_care': { super_category: 'help', sub_category: 'veterinary' },
  'lawyer': { super_category: 'help', sub_category: 'lawyer' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // בדיקת הרשאה - רק אדמין יכול להריץ את הפונקציה הזו
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const apiKey = Deno.env.get('gnew');
    if (!apiKey) {
      return Response.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    // קבלת פרמטרים מהבקשה
    const body = await req.json().catch(() => ({}));
    const { 
      textQuery = 'services in Koh Samui',
      maxResults = 200,
      dryRun = true // אם true, לא ישמור את הנתונים, רק יחזיר אותם
    } = body;

    const importedPlaces = [];
    const errors = [];
    let nextPageToken = null;

    console.log(`Starting import with query: "${textQuery}"`);

    do {
      // קריאה ל-Google Places API (Text Search)
      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
      
      const requestBody = {
        textQuery,
        maxResultCount: Math.min(20, maxResults - importedPlaces.length), // Google מגביל ל-20 לכל קריאה
        locationBias: {
          circle: {
            center: {
              latitude: 9.5297,
              longitude: 100.0626
            },
            radius: 50000.0 // 50km רדיוס סביב קוסמוי
          }
        }
      };

      if (nextPageToken) {
        requestBody.pageToken = nextPageToken;
      }

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.priceLevel,places.editorialSummary,places.photos,places.id'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.places || data.places.length === 0) {
        break;
      }

      // עיבוד כל מקום
      for (const place of data.places) {
        try {
          // בדיקה אם המקום כבר קיים (לפי Google Place ID)
          const existing = await base44.asServiceRole.entities.ServiceProvider.filter({
            google_place_id: place.id
          });

          if (existing && existing.length > 0) {
            console.log(`Skipping existing place: ${place.displayName?.text}`);
            continue;
          }

          // מציאת הקטגוריה המתאימה
          let mappedCategory = null;
          if (place.types) {
            for (const type of place.types) {
              if (categoryMapping[type]) {
                mappedCategory = categoryMapping[type];
                break;
              }
            }
          }

          // אם לא מצאנו קטגוריה מתאימה, נדלג על המקום הזה
          if (!mappedCategory) {
            console.log(`No matching category for: ${place.displayName?.text} (types: ${place.types?.join(', ')})`);
            continue;
          }

          // בניית אובייקט ServiceProvider
          const serviceProvider = {
            business_name: place.displayName?.text || 'Unknown',
            description: place.editorialSummary?.text || '',
            phone: place.internationalPhoneNumber || '',
            location: place.formattedAddress || '',
            latitude: place.location?.latitude,
            longitude: place.location?.longitude,
            super_category: mappedCategory.super_category,
            sub_category: mappedCategory.sub_category,
            average_rating: place.rating || 0,
            total_reviews: place.userRatingCount || 0,
            price_range: place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 'premium' : 
                        place.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' ? 'budget' : 'moderate',
            verified: false,
            status: 'pending', // יצטרך אישור מנהל לפני שיופיע באפליקציה
            google_place_id: place.id,
            images: place.photos?.slice(0, 5).map(photo => 
              `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`
            ) || []
          };

          importedPlaces.push(serviceProvider);

        } catch (placeError) {
          console.error(`Error processing place ${place.displayName?.text}:`, placeError);
          errors.push({
            place: place.displayName?.text,
            error: placeError.message
          });
        }
      }

      nextPageToken = data.nextPageToken;

      // הפסקה קצרה בין קריאות כדי לא להגיע למגבלת Rate
      if (nextPageToken && importedPlaces.length < maxResults) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (nextPageToken && importedPlaces.length < maxResults);

    // שמירה בדאטהבייס (אם לא במצב dry run)
    let savedCount = 0;
    if (!dryRun && importedPlaces.length > 0) {
      // שמירה בקבוצות של 50 (למניעת עומס)
      const batchSize = 50;
      for (let i = 0; i < importedPlaces.length; i += batchSize) {
        const batch = importedPlaces.slice(i, i + batchSize);
        await base44.asServiceRole.entities.ServiceProvider.bulkCreate(batch);
        savedCount += batch.length;
        console.log(`Saved batch ${Math.floor(i / batchSize) + 1}, total saved: ${savedCount}`);
      }
    }

    return Response.json({
      success: true,
      summary: {
        total_found: importedPlaces.length,
        saved: dryRun ? 0 : savedCount,
        errors: errors.length,
        dry_run: dryRun
      },
      places: dryRun ? importedPlaces : importedPlaces.slice(0, 10), // מחזיר רק 10 ראשונים אם לא dry run
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});