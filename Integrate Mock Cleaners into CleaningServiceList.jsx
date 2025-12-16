// Assuming CleaningServiceList.jsx exists and renders a list of cleaning services.
import React from 'react';

const mockCleaners = [
  {
    "business_name": "Samui Sparkle Cleaning",
    "description": "Reliable cleaning services for homes and villas.",
    "price_range": "1500-3000 THB",
    "location": "Bophut"
  },
  {
    "business_name": "Island Shine Cleaning",
    "description": "Professional cleaning for condos and apartments.",
    "price_range": "1200-2500 THB",
    "location": "Chaweng"
  },
  {
    "business_name": "Tropical Cleaners",
    "description": "Eco-friendly cleaning solutions for your home.",
    "price_range": "1800-3500 THB",
    "location": "Lamai"
  },
  {
    "business_name": "Koh Samui Cleaning Services",
    "description": "Comprehensive cleaning services for all your needs.",
    "price_range": "1000-4000 THB",
    "location": "Maenam"
  },
  {
    "business_name": "Crystal Clear Cleaning",
    "description": "High-quality cleaning for luxury villas.",
    "price_range": "2500-5000 THB",
    "location": "Choeng Mon"
  },
  {
    "business_name": "White Sand Cleaning",
    "description": "Affordable and efficient cleaning services.",
    "price_range": "800-2000 THB",
    "location": "Bang Rak"
  },
  {
    "business_name": "Samui Home Cleaning",
    "description": "Your trusted partner for a clean home.",
    "price_range": "1300-2800 THB",
    "location": "Nathon"
  },
  {
    "business_name": "Paradise Cleaning",
    "description": "Cleaning services with a personal touch.",
    "price_range": "1600-3200 THB",
    "location": "Hua Thanon"
  },
  {
    "business_name": "Ocean Breeze Cleaning",
    "description": "Reliable cleaning for your office or business.",
    "price_range": "2000-4500 THB",
    "location": "Bo Phut Hills"
  },
  {
    "business_name": "Green Leaf Cleaning",
    "description": "Sustainable cleaning practices for a healthy home.",
    "price_range": "1900-3800 THB",
    "location": "Ban Tai"
  }
];

const CleaningServiceList = () => {
  return (
    <ul>
      {mockCleaners.map((cleaner, index) => (
        <li key={index}>
          <h3>{cleaner.business_name}</h3>
          <p>{cleaner.description}</p>
          <p>Price Range: {cleaner.price_range}</p>
          <p>Location: {cleaner.location}</p>
        </li>
      ))}
    </ul>
  );
};

export default CleaningServiceList;