// import_vendors.js

const vendorData = [
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
];

async function importVendors() {
  for (const vendor of vendorData) {
    try {
      // Assuming create_lead is an available function/tool
      const leadData = {
        name: vendor.Name,
        category: vendor.Category,
        location: vendor.Location
      };

      console.log("Creating Lead: ", leadData);
      //await create_lead(leadData); //Disabled for safety - uncomment to run
      //console.log("Lead created successfully"); //If uncommented, will be the next line


    } catch (error) {
      console.error("Error creating lead:", error);
    }
  }

  console.log("Vendor import completed.");
}

importVendors();