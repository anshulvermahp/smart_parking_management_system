

const Parking = require("../models/parking");

// Helper function to extract lat/lon
function extractLatLon(mapLink) {
  // Matches @lat,lon from Google Maps URL
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = mapLink.match(regex);

  if (!match) return null;

  return {
    latitude: parseFloat(match[1]),
    longitude: parseFloat(match[2]),
  };
}

function newParkingPage(req, res) {

  res.render("newParking")

}


async function addArea(req, res) {
  try {
    const {
      name,
      street,
      city,
      state,
      zip,
      country,
      mapLink,
      totalSlots,
      availableSlots,
      contactPhone,
      contactEmail,
      pricingHourly,
      pricingDaily,
      pricingMonthly,
      operationalOpen,
      operationalClose,
      amenities,
      securityCctv,
      securityGuard,
      securityGated
    } = req.body;

    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = mapLink.match(regex);
    if (!match) {
      return res.send("Invalid Google Maps link");
    }

    // Handle uploaded images (ImageKit URLs)
    const imagekit = require("../config/imagekit");
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResponse = await imagekit.upload({
            file: file.buffer,
            fileName: file.originalname,
            folder: "/parkspot/parking"
          });
          images.push(uploadResponse.url);
        } catch (err) {
          console.error("ImageKit upload error:", err);
        }
      }
    }

    // Parse amenities (comma separated)
    let amenitiesArr = [];
    if (amenities && typeof amenities === 'string') {
      amenitiesArr = amenities.split(',').map(a => a.trim()).filter(Boolean);
    }

    // Security checkboxes
    const security = {
      cctv: !!securityCctv,
      guard: !!securityGuard,
      gated: !!securityGated
    };

    await Parking.create({
      name,
      address: {
        street,
        city,
        state,
        zip,
        country
      },
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
      totalSlots,
      availableSlots,
      mapLink,
      images,
      contact: {
        phone: contactPhone,
        email: contactEmail
      },
      pricing: {
        hourly: pricingHourly,
        daily: pricingDaily,
        monthly: pricingMonthly
      },
      operationalHours: {
        open: operationalOpen,
        close: operationalClose
      },
      amenities: amenitiesArr,
      security
      // owner: req.user._id // If you have authentication
    });

    // Render the parking-added success page
    res.render('parking-added', { name });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    console.error("Error adding parking area:", errorMsg, err && err.stack ? err.stack : "");
    res.status(500).send("An error occurred: " + errorMsg);
  }
}

module.exports =
{
  extractLatLon,
  newParkingPage,
  addArea
}
