let map;
let fencePolyline = null;
let pathArray = null;
let currentFeet = 0;

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_WEB_APP_URL_HERE';

const PRICING_DATA = {
  wood_privacy:         { label: 'Wood Privacy', low: 18, high: 22, singleGate: 200, doubleGate: 400 },
  wood_semi_privacy:    { label: 'Wood Semi-Privacy', low: 20, high: 24, singleGate: 200, doubleGate: 400 },
  wood_board_on_board:  { label: 'Wood Board on Board', low: 20, high: 24, singleGate: 200, doubleGate: 400 },
  vinyl_privacy:        { label: 'Vinyl Privacy', low: 36, high: 38, singleGate: 450, doubleGate: 900 },
  chain_link:           { label: 'Chain Link', low: 18, high: 21, singleGate: 100, doubleGate: 200 },
  ornamental_aluminum: { label: 'Ornamental Aluminum', low: 40, high: 45, singleGate: 250, doubleGate: 450 }
};

function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  map = new google.maps.Map(mapElement, {
    center: { lat: 32.1313, lng: -81.2323 },
    zoom: 20,
    maxZoom: 24,
    minZoom: 1,
    mapTypeId: 'hybrid',
    tilt: 0,
    gestureHandling: 'greedy'
  });

  fencePolyline = new google.maps.Polyline({
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 4,
    editable: true,
    map: map
  });

  pathArray = fencePolyline.getPath();

  map.addListener('click', (e) => {
    pathArray.push(e.latLng);
    calculateLength();
  });

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

async function submitLead() {
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

  const selectedMaterialKey = document.getElementById("material-select").value;
  const materialData = PRICING_DATA[selectedMaterialKey] || PRICING_DATA.wood_privacy;

  const heightSelect = document.getElementById("height-select");
  const heightText = heightSelect.options[heightSelect.selectedIndex].text;
  const heightMultiplier = parseFloat(heightSelect.value);

  const singleGateCount = parseInt(document.getElementById("single-gate-select").value, 10) || 0;
  const doubleGateCount = parseInt(document.getElementById("double-gate-select").value, 10) || 0;

  const singleGateTotal = singleGateCount * materialData.singleGate;
  const doubleGateTotal = doubleGateCount * materialData.doubleGate;

  const lowEnd = Math.round(((currentFeet * materialData.low) * heightMultiplier) + singleGateTotal + doubleGateTotal);
  const highEnd = Math.round(((currentFeet * materialData.high) * heightMultiplier) + singleGateTotal + doubleGateTotal);

  // Send payload to Google Sheets / Gmail Script
  try {
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        email,
        footage: currentFeet,
        material: materialData.label,
        height: heightText,
        singleGates: singleGateCount,
        doubleGates: doubleGateCount,
        lowEnd,
        highEnd
      })
    });
  } catch (err) {
    console.error("Google Script logging failed:", err);
  }

  document.getElementById("price-display").innerText = `$${lowEnd.toLocaleString()} - $${highEnd.toLocaleString()}`;
  document.getElementById("form-container").classList.add("hidden");
  document.getElementById("result-container").classList.remove("hidden");
}
