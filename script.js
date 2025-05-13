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
    const viewerWindow = window.open('', '_blank');
    let viewerContent;
    if (location.name === 'Charkov') {
        viewerContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Charkov - Explore</title>
            <style>
                body { margin: 0; overflow: hidden; background: #000; }
                #viewer, #video-container { width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; }
                #video-container { display: flex; align-items: center; justify-content: center; background: #000; z-index: 10; }
                #intro-video { max-width: 90vw; max-height: 90vh; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
                #choice-btns {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    width: 100vw;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    pointer-events: none;
                    z-index: 20;
                    padding: 0 5vw;
                    transform: translateY(-50%);
                }
                .choice-btn {
                    pointer-events: auto;
                    background: #2c3e50;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    padding: 16px 36px;
                    font-size: 1.3rem;
                    font-family: 'Open Sans', sans-serif;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    transition: background 0.2s, transform 0.3s, filter 0.3s;
                    opacity: 0.95;
                }
                .choice-btn:hover { background: #e74c3c; }
                .blur-zoom-sphere {
                    filter: blur(0px);
                    transform: scale(1);
                    animation: blurZoom 0.7s forwards;
                }
                @keyframes blurZoom {
                    0% { filter: blur(0px); transform: scale(1); }
                    100% { filter: blur(12px); transform: scale(1.2); opacity: 0; }
                }
                #vrToggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 10px 20px;
                    background-color: #2c3e50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: 'Open Sans', sans-serif;
                    font-size: 14px;
                    z-index: 1000;
                }
                #vrToggle.active {
                    background-color: #e74c3c;
                }
                #vrToggle:disabled {
                    background-color: #95a5a6;
                    cursor: not-allowed;
                }
            </style>
            <script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'></script>
            <script src='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/vr/VRButton.js'></script>
        </head>
        <body>
            <div id="video-container">
                <video id="intro-video" src="https://www.w3schools.com/html/mov_bbb.mp4" controls autoplay></video>
            </div>
            <div id="viewer" style="display:none;">
                <div id="choice-btns" style="display:none;"></div>
            </div>
            <button id="vrToggle" disabled>Enable VR</button>
            <script>
                // VR state management
                let isVRMode = false;
                let vrRenderer = null;
                let vrScene = null;
                let vrCamera = null;
                let vrControls = null;
                
                // Check if the page is served over HTTPS
                const isSecure = window.location.protocol === 'https:';
                const vrToggle = document.getElementById('vrToggle');
                
                // Enable VR button if on HTTPS
                if (isSecure) {
                    vrToggle.disabled = false;
                } else {
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
                
                let currentScene = 'start';
                const viewer = document.getElementById('viewer');
                const btns = document.getElementById('choice-btns');
                const leftBtn = document.getElementById('left-btn');
                const rightBtn = document.getElementById('right-btn');
                let renderer, camera, scene, sphere, textureLoader;
                let animatingTransition = false;

                function show360(imagePath, transition) {
                    viewer.style.display = 'block';
                    btns.style.display = (imagePath.includes('Start')) ? 'flex' : 'none';
                    if (!renderer) {
                        renderer = new THREE.WebGLRenderer();
                        renderer.setSize(window.innerWidth, window.innerHeight);
                        viewer.appendChild(renderer.domElement);
                        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                        scene = new THREE.Scene();
                        textureLoader = new THREE.TextureLoader();
                    }
                    // Remove old sphere after transition
                    function loadNewSphere() {
                        if (sphere) scene.remove(sphere);
                        textureLoader.load(imagePath, function(texture) {
                            const geometry = new THREE.SphereGeometry(500, 60, 40);
                            geometry.scale(-1, 1, 1);
                            const material = new THREE.MeshBasicMaterial({ map: texture });
                            sphere = new THREE.Mesh(geometry, material);
                            scene.add(sphere);
                        });
                    }
                    if (transition && sphere) {
                        // Animate the current sphere
                        animatingTransition = true;
                        if (!sphere.material.userData) sphere.material.userData = {};
                        sphere.material.userData.blurZoom = true;
                        let animStart = null;
                        function animateBlurZoom(ts) {
                            if (!animStart) animStart = ts;
                            let progress = Math.min((ts - animStart) / 700, 1);
                            // Animate blur and scale
                            let blur = 12 * progress;
                            let scale = 1 + 0.2 * progress;
                            sphere.material.opacity = 1 - progress;
                            sphere.material.transparent = true;
                            renderer.domElement.style.filter = 'blur(' + blur + 'px)';
                            sphere.scale.set(scale, scale, scale);
                            if (progress < 1) {
                                requestAnimationFrame(animateBlurZoom);
                            } else {
                                renderer.domElement.style.filter = '';
                                animatingTransition = false;
                                loadNewSphere();
                            }
                        }
                        requestAnimationFrame(animateBlurZoom);
                    } else {
                        loadNewSphere();
                    }
                    camera.position.z = 0.1;
                    let isUserInteracting = false, onMouseDownMouseX = 0, onMouseDownMouseY = 0, lon = 0, lat = 0, onMouseDownLon = 0, onMouseDownLat = 0;
                    viewer.onmousedown = function(event) {
                        isUserInteracting = true;
                        onMouseDownMouseX = event.clientX;
                        onMouseDownMouseY = event.clientY;
                        onMouseDownLon = lon;
                        onMouseDownLat = lat;
                    };
                    viewer.onmousemove = function(event) {
                        if (isUserInteracting) {
                            lon = (onMouseDownMouseX - event.clientX) * 0.1 + onMouseDownLon;
                            lat = (event.clientY - onMouseDownMouseY) * 0.1 + onMouseDownLat;
                        }
                    };
                    viewer.onmouseup = function() { isUserInteracting = false; };
                    function animate() {
                        requestAnimationFrame(animate);
                        lat = Math.max(-85, Math.min(85, lat));
                        const phi = THREE.MathUtils.degToRad(90 - lat);
                        const theta = THREE.MathUtils.degToRad(lon);
                        camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
                        camera.position.y = 100 * Math.cos(phi);
                        camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
                        camera.lookAt(scene.position);
                        if (scene.getObjectByName('leftBtn3D')) {
                            scene.getObjectByName('leftBtn3D').lookAt(camera.position);
                        }
                        if (scene.getObjectByName('rightBtn3D')) {
                            scene.getObjectByName('rightBtn3D').lookAt(camera.position);
                        }
                        renderer.render(scene, camera);
                    }
                    animate();

                    // Remove old buttons if they exist
                    if (scene.getObjectByName('leftBtn3D')) scene.remove(scene.getObjectByName('leftBtn3D'));
                    if (scene.getObjectByName('rightBtn3D')) scene.remove(scene.getObjectByName('rightBtn3D'));

                    if (imagePath.includes('Start')) {
                        // Create left button
                        const canvas = document.createElement('canvas');
                        canvas.width = 256;
                        canvas.height = 128;
                        const context = canvas.getContext('2d');

                        // Background color (optional)
                        context.fillStyle = '#2c3e50';
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        // Text settings
                        context.font = '48px Arial';
                        context.fillStyle = 'white';
                        context.textAlign = 'center';
                        context.textBaseline = 'middle';
                        context.fillText('Left', canvas.width / 2, canvas.height / 2);

                        // Create a texture from the canvas
                        const texture = new THREE.CanvasTexture(canvas);

                        // Create material with the text texture
                        const textMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                        const leftGeometry = new THREE.PlaneGeometry(40, 20);
                        const leftBtn3D = new THREE.Mesh(leftGeometry, textMaterial);
                        leftBtn3D.position.set(200, 40, -100);
                        leftBtn3D.name = 'leftBtn3D';

                        scene.add(leftBtn3D);

                        // Create right button
                        const canvasRight = document.createElement('canvas');
                        canvasRight.width = 256;
                        canvasRight.height = 128;
                        const contextRight = canvasRight.getContext('2d');

                        // Background color (same as left)
                        contextRight.fillStyle = '#2c3e50';
                        contextRight.fillRect(0, 0, canvasRight.width, canvasRight.height);

                        // Text settings
                        contextRight.font = '48px Arial';
                        contextRight.fillStyle = 'white';
                        contextRight.textAlign = 'center';
                        contextRight.textBaseline = 'middle';
                        contextRight.fillText('Right', canvasRight.width / 2, canvasRight.height / 2);

                        // Create a texture from the canvas
                        const textureRight = new THREE.CanvasTexture(canvasRight);

                        // Create material with the text texture
                        const rightMaterial = new THREE.MeshBasicMaterial({ map: textureRight, side: THREE.DoubleSide });
                        const rightGeometry = new THREE.PlaneGeometry(40, 20);
                        const rightBtn3D = new THREE.Mesh(rightGeometry, rightMaterial);
                        rightBtn3D.position.set(200, 40, 100); // Adjust as needed
                        rightBtn3D.name = 'rightBtn3D';

                        scene.add(rightBtn3D);

                        // Add text overlays (optional: use THREE.js text or textures)
                    }

                    // Raycaster for button clicks
                    const raycaster = new THREE.Raycaster();
                    const mouse = new THREE.Vector2();

                    renderer.domElement.addEventListener('click', function(event) {
                        // Convert mouse to normalized device coordinates
                        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
                        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
                        // Collect clickable objects
                        const clickableObjects = [
                            scene.getObjectByName('leftBtn3D'),
                            scene.getObjectByName('rightBtn3D'),
                            scene.getObjectByName('shelterIcon')
                        ].filter(Boolean);
                        raycaster.setFromCamera(mouse, camera);
                        const intersects = raycaster.intersectObjects(clickableObjects);
                        if (intersects.length > 0) {
                            if (intersects[0].object.name === 'leftBtn3D') {
                                show360('img/StreetViewChoiceLeft.jpg', true);
                            } else if (intersects[0].object.name === 'rightBtn3D') {
                                show360('img/StreetViewChoiceRight.jpg', true);
                            } else if (intersects[0].object.name === 'shelterIcon') {
                                show360('img/bombShelterInside.png', true);
                            }
                        }
                    });

                    // Remove old shelter icon if it exists
                    if (scene.getObjectByName('shelterIcon')) scene.remove(scene.getObjectByName('shelterIcon'));

                    if (imagePath.includes('Right') || imagePath.includes('Left')) {
                        const loader = new THREE.TextureLoader();
                        loader.load('img/iconShelter.png', function(texture) {
                            const material = new THREE.SpriteMaterial({ 
                                map: texture, 
                                transparent: true,
                                opacity: 1.0  // Ensure full opacity
                            });
                            const sprite = new THREE.Sprite(material);
                            if (imagePath.includes('Right')) {
                                sprite.position.set(100, -30, -400); // Closer to camera
                            } else {
                                sprite.position.set(180, -30, 420); // Closer to camera
                            }
                            sprite.scale.set(50, 50, 1); // Larger scale
                            sprite.name = 'shelterIcon';
                            scene.add(sprite);
                            
                            // Add debug info
                            console.log('Shelter icon added:', {
                                position: sprite.position,
                                scale: sprite.scale,
                                visible: sprite.visible
                            });
                        });
                    }
                }

                // --- Video to 360 transition ---
                const video = document.getElementById('intro-video');
                video.onended = function() {
                    document.getElementById('video-container').classList.add('blur-zoom-sphere');
                    setTimeout(() => {
                        document.getElementById('video-container').style.display = 'none';
                        show360('img/StreetViewChoiceStart.jpg');
                        btns.style.display = 'flex';
                    }, 700);
                };

                // --- Button logic ---
                if (leftBtn) leftBtn.onclick = function() {
                    if (animatingTransition) return;
                    show360('img/StreetViewChoiceLeft.jpg', true);
                };
                if (rightBtn) rightBtn.onclick = function() {
                    if (animatingTransition) return;
                    show360('img/StreetViewChoiceRight.jpg', true);
                };
            </script>
        </body>
        </html>`;
    } else {
        // 360° video (Kyiv)
        viewerContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${location.name} - 360° View</title>
            <style>
                body { margin: 0; overflow: hidden; }
                #viewer { width: 100vw; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="viewer"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
            <script>
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer();
                renderer.setSize(window.innerWidth, window.innerHeight);
                document.getElementById('viewer').appendChild(renderer.domElement);

                // Create video texture
                const video = document.createElement('video');
                video.src = '${location.videoUrl}';
                video.loop = true;
                video.muted = true;
                video.play();

                const texture = new THREE.VideoTexture(video);
                const geometry = new THREE.SphereGeometry(500, 60, 40);
                geometry.scale(-1, 1, 1);
                const material = new THREE.MeshBasicMaterial({ map: texture });
                const sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);

                camera.position.z = 0.1;

                // Mouse controls
                let isUserInteracting = false;
                let onMouseDownMouseX = 0, onMouseDownMouseY = 0;
                let lon = 0, lat = 0;
                let onMouseDownLon = 0, onMouseDownLat = 0;

                document.addEventListener('mousedown', onDocumentMouseDown);
                document.addEventListener('mousemove', onDocumentMouseMove);
                document.addEventListener('mouseup', onDocumentMouseUp);

                function onDocumentMouseDown(event) {
                    isUserInteracting = true;
                    onMouseDownMouseX = event.clientX;
                    onMouseDownMouseY = event.clientY;
                    onMouseDownLon = lon;
                    onMouseDownLat = lat;
                }

                function onDocumentMouseMove(event) {
                    if (isUserInteracting) {
                        lon = (onMouseDownMouseX - event.clientX) * 0.1 + onMouseDownLon;
                        lat = (event.clientY - onMouseDownMouseY) * 0.1 + onMouseDownLat;
                    }
                }

                function onDocumentMouseUp() {
                    isUserInteracting = false;
                }

                function animate() {
                    requestAnimationFrame(animate);
                    updateCamera();
                    renderer.render(scene, camera);
                }

                function updateCamera() {
                    lat = Math.max(-85, Math.min(85, lat));
                    const phi = THREE.MathUtils.degToRad(90 - lat);
                    const theta = THREE.MathUtils.degToRad(lon);
                    camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
                    camera.position.y = 100 * Math.cos(phi);
                    camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
                    camera.lookAt(scene.position);
                }

                animate();

                window.addEventListener('resize', () => {
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(window.innerWidth, window.innerHeight);
                });
            </script>
        </body>
        </html>`;
    }
    viewerWindow.document.write(viewerContent);
    viewerWindow.document.close();
} 