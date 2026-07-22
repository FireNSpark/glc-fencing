let map, drawingManager, currentPolyline = null;
let currentFeet = 0;

function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  map = new google.maps.Map(mapElement, {
    center: { lat: 32.1313, lng: -81.2323 },
    zoom: 20,
    maxZoom: 22,
    mapTypeId: 'hybrid',
    tilt: 0,
    gestureHandling: 'greedy'
  });

  setupAutocomplete();
  setupDrawingManager();
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

function setupDrawingManager() {
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYLINE,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [google.maps.drawing.OverlayType.POLYLINE]
    },
    polylineOptions: {
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      editable: true,
      draggable: false
    }
  });

  drawingManager.setMap(map);

  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
    if (event.type === google.maps.drawing.OverlayType.POLYLINE) {
      if (currentPolyline) currentPolyline.setMap(null);
      currentPolyline = event.overlay;
      
      bindPathListeners(currentPolyline.getPath());
    }
  });
}

function bindPathListeners(path) {
  calculateLength();
  google.maps.event.addListener(path, 'insert_at', calculateLength);
  google.maps.event.addListener(path, 'set_at', calculateLength);
  google.maps.event.addListener(path, 'remove_at', calculateLength);
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
    currentPolyline.setMap(null);
    currentPolyline = null;
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
