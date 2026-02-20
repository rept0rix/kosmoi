import json

vendor_data = [
    {
        "Name": "Example Restaurant 1",
        "Category": "Restaurant",
        "Location": "Chaweng"
    },
    {
        "Name": "Example Bike Rental 1",
        "Category": "Bike Rental",
        "Location": "Bophut"
    },
    {
        "Name": "Example Tour Company 1",
        "Category": "Tour",
        "Location": "Maenam"
    },
    {
        "Name": "Example Restaurant 2",
        "Category": "Restaurant",
        "Location": "Lamai"
    },
    {
        "Name": "Example Bike Rental 2",
        "Category": "Bike Rental",
        "Location": "Choeng Mon"
    },
    {
        "Name": "Example Tour Company 2",
        "Category": "Tour",
        "Location": "Nathon"
    },
    {
        "Name": "Example Restaurant 3",
        "Category": "Restaurant",
        "Location": "Bang Rak"
    },
    {
        "Name": "Example Bike Rental 3",
        "Category": "Bike Rental",
        "Location": "Hua Thanon"
    },
    {
        "Name": "Example Tour Company 3",
        "Category": "Tour",
        "Location": "Taling Ngam"
    },
    {
        "Name": "Example Restaurant 4",
        "Category": "Restaurant",
        "Location": "Lipa Noi"
    }
]

def generate_banner_description(vendor):
    name = vendor['Name']
    category = vendor['Category']
    location = vendor['Location']
    
    if category == 'Restaurant':
        description = f"[Banner] Enjoy authentic Thai cuisine at {name} in {location}. Fresh ingredients, stunning views!"
    elif category == 'Bike Rental':
        description = f"[Banner] Explore Koh Samui on two wheels with {name} in {location}. Reliable bikes, island adventures!"
    elif category == 'Tour':
        description = f"[Banner] Discover the hidden gems of Koh Samui with {name} in {location}. Unforgettable experiences await!"
    else:
        description = f"[Banner] Check out {name} in {location} for all your needs."
    
    return {
        "Name": name,
        "Category": category,
        "Location": location,
        "Banner_Description": description
    }


asset_data = [generate_banner_description(vendor) for vendor in vendor_data]

with open('day3_assets.json', 'w') as f:
    json.dump(asset_data, f, indent=4)

print("day3_assets.json created successfully!")
