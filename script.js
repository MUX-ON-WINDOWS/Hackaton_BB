// Initialize the map
const map = L.map('map').setView([48.3794, 31.1656], 6); // Center on Ukraine

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// VR state management
let isVRMode = false;
let vrRenderer = null;
let vrScene = null;
let vrCamera = null;
let vrControls = null;

// Check if the page is served over HTTPS
const isSecure = window.location.protocol === 'https:';
const vrToggle = document.getElementById('vrToggle');

// Disable VR button if not on HTTPS
if (!isSecure) {
    vrToggle.disabled = true;
    vrToggle.title = 'VR mode requires HTTPS';
}

// VR Toggle button click handler
vrToggle.addEventListener('click', () => {
    if (!isSecure) return;
    
    isVRMode = !isVRMode;
    vrToggle.textContent = isVRMode ? 'Disable VR' : 'Enable VR';
    vrToggle.classList.toggle('active');
    
    if (isVRMode) {
        initializeVR();
    } else {
        cleanupVR();
    }
});

function initializeVR() {
    if (!vrRenderer) {
        vrRenderer = new THREE.WebGLRenderer({ antialias: true });
        vrRenderer.setPixelRatio(window.devicePixelRatio);
        vrRenderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(vrRenderer.domElement);
        
        vrScene = new THREE.Scene();
        vrCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Add VR controls
        vrControls = new THREE.VRControls(vrCamera);
        vrControls.standing = true;
        
        // Add VR button
        document.body.appendChild(THREE.VRButton.createButton(vrRenderer));
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        vrScene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        vrScene.add(directionalLight);
    }
    
    // Start VR animation loop
    animateVR();
}

function cleanupVR() {
    if (vrRenderer) {
        document.body.removeChild(vrRenderer.domElement);
        vrRenderer = null;
        vrScene = null;
        vrCamera = null;
        vrControls = null;
    }
}

function animateVR() {
    if (!isVRMode) return;
    
    requestAnimationFrame(animateVR);
    
    if (vrControls) {
        vrControls.update();
    }
    
    if (vrRenderer && vrScene && vrCamera) {
        vrRenderer.render(vrScene, vrCamera);
    }
}

// Custom marker icon
const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="width: 12px; height: 12px; background-color: #e74c3c; border-radius: 50%; border: 2px solid white;"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// Location data
const locations = {
    kyiv: {
        name: 'Kyiv',
        coordinates: [50.45466, 30.5238],
        videoUrl: 'https://example.com/kyiv-360.mp4' // Replace with actual 360° video URL
    },
    charkov: {
        name: 'Charkov',
        coordinates: [49.9935, 36.2304],
        imageUrl: 'img/Odesa, Ukraine 360.png' // Use local 360° photo
    }
};

// Create markers for each location
Object.values(locations).forEach(location => {
    const marker = L.marker(location.coordinates, { icon: markerIcon })
        .addTo(map)
        .bindTooltip(location.name, {
            permanent: false,
            direction: 'top',
            className: 'custom-tooltip'
        });

    // Add click event to open 360° viewer
    marker.on('click', () => {
        open360Viewer(location);
    });
});

// Function to open 360° viewer
function open360Viewer(location) {
    const viewerWindow = window.open('viewer.html', '_blank');
    if (viewerWindow) {
        viewerWindow.onload = function() {
            // Pass location data to the viewer window
            viewerWindow.postMessage({
                type: 'locationData',
                location: location
            }, '*');
        };
    }
} 