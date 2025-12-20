export const getCategoryColor = (category) => {
    const colors = {
        // Fix
        handyman: '#F97316', // Orange
        carpenter: '#92400E', // Brown
        electrician: '#EAB308', // Yellow
        plumber: '#3B82F6', // Blue
        ac_repair: '#06B6D4', // Cyan
        cleaning: '#14B8A6', // Teal
        locksmith: '#6B7280', // Gray
        painter: '#A855F7', // Purple
        gardener: '#22C55E', // Green
        pest_control: '#EF4444', // Red
        pool_cleaning: '#0EA5E9', // Sky Blue
        solar_energy: '#F59E0B', // Amber
        
        // Get Service
        laundry: '#8B5CF6', // Violet
        housekeeping: '#EC4899', // Pink
        internet_tech: '#6366F1', // Indigo
        visa_services: '#10B981', // Emerald
        
        // Transport
        moving: '#6366F1', // Indigo
        car_mechanic: '#EF4444', // Red
        motorcycle_mechanic: '#DC2626', // Red
        taxi_service: '#FBBF24', // Amber
        car_rental: '#F59E0B', // Amber
        bike_rental: '#F59E0B', // Amber
        
        // Other
        translator: '#8B5CF6', // Violet
        real_estate_agent: '#F59E0B', // Amber
        
        default: '#3B82F6' // Blue
    };
    return colors[category] || colors.default;
};

export const getCategoryIcon = (category) => {
    const color = getCategoryColor(category);

    // Default Pin
    let path = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";
    let scale = 1.5;

    // Custom shapes for specific categories
    if (['handyman', 'carpenter', 'electrician', 'plumber', 'ac_repair', 'solar_energy', 'pool_cleaning'].includes(category)) {
        // Wrench/Tool shape (simplified)
        path = "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z";
        scale = 1.2;
    } else if (['cleaning', 'pest_control', 'housekeeping', 'laundry'].includes(category)) {
        // Sparkle/Clean shape
        path = "M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9zm0-16c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7 3.13-7 7-7z"; 
        scale = 1.5;
    } else if (['taxi_service', 'moving', 'car_rental', 'bike_rental', 'car_mechanic', 'motorcycle_mechanic'].includes(category)) {
        // Car/Transport shape
        path = "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z";
        scale = 1.2;
    }

    return {
        path: path,
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#FFFFFF',
        rotation: 0,
        scale: scale,
        anchor: { x: 12, y: 12 } // Center anchor for most shapes
    };
};
