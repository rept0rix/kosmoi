import {
    Car, Home, Smartphone, Sofa, Shirt, Activity, Briefcase, Box,
    Wrench, Music, Book, Camera, Watch, Zap, Dog, Coffee,
    Monitor, Gamepad, Anchor
} from 'lucide-react';

export const MARKETPLACE_CATEGORIES = [
    {
        id: 'vehicles',
        label: 'Vehicles & Transport',
        icon: Car,
        subcategories: [
            { id: 'cars', label: 'Cars (Sedan, SUV, Pickup)' },
            { id: 'motorbikes', label: 'Motorbikes & Scooters' },
            { id: 'bicycles', label: 'Bicycles' },
            { id: 'commercial', label: 'Commercial & Trucks' },
            { id: 'parts', label: 'Parts & Accessories' },
            { id: 'rentals', label: 'Rentals' }
        ],
        fields: ['brand', 'model', 'year', 'mileage', 'transmission']
    },
    {
        id: 'real-estate',
        label: 'Real Estate',
        icon: Home,
        subcategories: [
            { id: 'sale', label: 'For Sale' },
            { id: 'rent', label: 'For Rent' },
            { id: 'lease', label: 'Leasehold' }
        ],
        fields: ['type', 'bedrooms', 'bathrooms', 'size_sqm', 'view', 'location_type']
    },
    {
        id: 'electronics',
        label: 'Electronics',
        icon: Smartphone,
        subcategories: [
            { id: 'phones', label: 'Phones & Tablets' },
            { id: 'computers', label: 'Computers & Laptops' },
            { id: 'audio', label: 'Audio & Music' },
            { id: 'cameras', label: 'Cameras & Photo' },
            { id: 'gaming', label: 'Gaming & Consoles' },
            { id: 'tv', label: 'TV & Home Appliances' }
        ],
        fields: ['brand', 'condition']
    },
    {
        id: 'furniture',
        label: 'Furniture & Home',
        icon: Sofa,
        subcategories: [
            { id: 'living', label: 'Living Room' },
            { id: 'bedroom', label: 'Bedroom' },
            { id: 'kitchen', label: 'Kitchen & Dining' },
            { id: 'garden', label: 'Garden & Outdoor' },
            { id: 'office', label: 'Office Furniture' },
            { id: 'decor', label: 'Home Decor' }
        ],
        fields: ['condition', 'material']
    },
    {
        id: 'fashion',
        label: 'Fashion',
        icon: Shirt,
        subcategories: [
            { id: 'men', label: 'Men\'s Clothing' },
            { id: 'women', label: 'Women\'s Clothing' },
            { id: 'kids', label: 'Kids & Baby' },
            { id: 'accessories', label: 'Accessories & Watches' },
            { id: 'shoes', label: 'Shoes' }
        ],
        fields: ['size', 'brand', 'condition']
    },
    {
        id: 'sports',
        label: 'Sports & Hobbies',
        icon: Activity,
        subcategories: [
            { id: 'gym', label: 'Gym & Fitness' },
            { id: 'water', label: 'Water Sports' },
            { id: 'musical', label: 'Musical Instruments' },
            { id: 'art', label: 'Art & Crafts' },
            { id: 'camping', label: 'Camping & Outdoor' }
        ],
        fields: ['condition']
    },
    {
        id: 'beauty',
        label: 'Health & Beauty',
        icon: Zap,
        subcategories: [
            { id: 'makeup', label: 'Makeup & Skincare' },
            { id: 'perfume', label: 'Perfume' },
            { id: 'supplements', label: 'Supplements' }
        ]
    },
    {
        id: 'kids',
        label: 'Babies & Kids',
        icon: Gamepad,
        subcategories: [
            { id: 'toys', label: 'Toys' },
            { id: 'strollers', label: 'Strollers & Gear' },
            { id: 'clothing', label: 'Clothing' }
        ]
    },
    {
        id: 'pets',
        label: 'Pets',
        icon: Dog,
        subcategories: [
            { id: 'dogs', label: 'Dogs' },
            { id: 'cats', label: 'Cats' },
            { id: 'supplies', label: 'Pet Supplies' },
            { id: 'adoption', label: 'Adoption' }
        ]
    },
    {
        id: 'services',
        label: 'Services',
        icon: Briefcase,
        subcategories: [
            { id: 'cleaning', label: 'Cleaning' },
            { id: 'repairs', label: 'Repairs' },
            { id: 'lessons', label: 'Lessons & Tutoring' },
            { id: 'freelance', label: 'Freelance & Jobs' }
        ]
    },
    {
        id: 'others',
        label: 'Others',
        icon: Box,
        subcategories: [
            { id: 'tools', label: 'Tools & DIY' },
            { id: 'food', label: 'Food & Drinks' },
            { id: 'tickets', label: 'Tickets & Events' },
            { id: 'books', label: 'Books & Media' }
        ]
    }
];
