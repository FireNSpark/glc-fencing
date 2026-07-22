let map;
let fencePolyline = null;
let pathArray = null;
let currentFeet = 0;

function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  // Initialize map with unlocked maximum satellite zoom
  map = new google.maps.Map(mapElement, {
    center: { lat: 32.1313, lng: -81.2323 },
    zoom: 20,
    maxZoom: 22,
    minZoom: 1,
    mapTypeId: 'hybrid',
    tilt: 0,
    gestureHandling: 'greedy'
  });

  // Create active polyline instance
  fencePolyline = new google.maps.Polyline({
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 4,
    editable: true,
    map: map
  });

  pathArray = fencePolyline.getPath();

  // Listen directly for map taps to drop points and calculate in real time
  map.addListener('click', (e) => {
    pathArray.push(e.latLng);
    calculateLength();
  });

  // Listen for vertex edits (dragging red points)
  google.maps.event.addListener(pathArray, 'set_at', calculateLength);
  google.maps.event.addListener(pathArray, 'insert_at', calculateLength);
  google.maps.event.addListener(pathArray, 'remove_at', calculateLength);

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
  if (!pathArray || pathArray.getLength() < 2) {
    currentFeet = 0;
  } else {
    const lengthInMeters = google.maps.geometry.spherical.computeLength(pathArray);
    currentFeet = Math.round(lengthInMeters * 3.28084);
  }

  document.getElementById("footage-display").innerText = currentFeet;
}

function undoLastPoint() {
  if (pathArray && pathArray.getLength() > 0) {
    pathArray.pop();
    calculateLength();
  }
}

function clearMap() {
  if (pathArray) {
    pathArray.clear();
    calculateLength();
  }
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
    alert("Please draw your fence line on the map first.");
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
