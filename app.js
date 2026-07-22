let map;
let currentPolyline = null;
let currentFeet = 0;

function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  // Initialize map centered at zoom 20 with no maxZoom lock
  map = new google.maps.Map(mapElement, {
    center: { lat: 32.1313, lng: -81.2323 },
    zoom: 20,
    mapTypeId: 'hybrid',
    tilt: 0,
    gestureHandling: 'greedy'
  });

  // Create primary drawing polyline immediately
  currentPolyline = new google.maps.Polyline({
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 4,
    editable: true,
    map: map
  });

  // Direct map tap listener - adds point directly to line
  map.addListener('click', (e) => {
    const path = currentPolyline.getPath();
    path.push(e.latLng);
    calculateLength();
  });

  // Listen for manual vertex adjustments/drags on the line
  const path = currentPolyline.getPath();
  google.maps.event.addListener(path, 'set_at', calculateLength);
  google.maps.event.addListener(path, 'insert_at', calculateLength);
  google.maps.event.addListener(path, 'remove_at', calculateLength);

  setupAutocomplete();
}

function setupAutocomplete() {
  const input = document.getElementById("search-box");
  if (!input) return;

  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'us' }
  });

  autocomplete.bindTo("bounds", map);
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) return;
    
    map.setCenter(place.geometry.location);
    map.setZoom(20);
  });
}

function calculateLength() {
  if (!currentPolyline) return;
  const path = currentPolyline.getPath();
  
  if (path.getLength() < 2) {
    currentFeet = 0;
  } else {
    const lengthInMeters = google.maps.geometry.spherical.computeLength(path);
    currentFeet = Math.round(lengthInMeters * 3.28084);
  }
  
  document.getElementById("footage-display").innerText = currentFeet;
}

function undoLastPoint() {
  if (currentPolyline) {
    const path = currentPolyline.getPath();
    if (path.getLength() > 0) {
      path.pop();
      calculateLength();
    }
  }
}

function clearMap() {
  if (currentPolyline) {
    currentPolyline.setPath([]);
  }
  currentFeet = 0;
  document.getElementById("footage-display").innerText = "0";
}

function submitLead() {
  const name = document.getElementById("lead-name").value;
  const phone = document.getElementById("lead-phone").value;
  const email = document.getElementById("lead-email").value;

  if (!name || !phone || !email) {
    alert("Please fill out all contact fields.");
    return;
  }

  if (currentFeet === 0) {
    alert("Please tap on the map to draw your fence line first.");
    return;
  }

  const baseMaterialCost = parseFloat(document.getElementById("material-select").value);
  const heightMultiplier = parseFloat(document.getElementById("height-select").value);
  const gateCost = parseFloat(document.getElementById("gate-select").value);
  
  const baseCost = ((currentFeet * baseMaterialCost) * heightMultiplier) + gateCost;

  const lowEnd = Math.round(baseCost * 0.90);
  const highEnd = Math.round(baseCost * 1.10);

  document.getElementById("price-display").innerText = `$${lowEnd.toLocaleString()} - $${highEnd.toLocaleString()}`;
  document.getElementById("form-container").classList.add("hidden");
  document.getElementById("result-container").classList.remove("hidden");
}
