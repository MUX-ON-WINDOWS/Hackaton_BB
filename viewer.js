// VR state management
let isVRMode = false;
let renderer, scene, camera, textureLoader;
let sphere = null;
let animatingTransition = false;
let animationId = null;

// Check if the page is served over HTTPS
const isSecure = window.location.protocol === 'https:';
const vrToggle = document.getElementById('vrToggle');

// Create renderer, scene, camera ONCE
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('viewer').appendChild(renderer.domElement);

scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
textureLoader = new THREE.TextureLoader();

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

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
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.setAnimationLoop(animateVR);
}

function cleanupVR() {
    renderer.xr.enabled = false;
    renderer.setAnimationLoop(null);
    // Resume normal animation
    animate();
}

function animateVR() {
    renderer.render(scene, camera);
}

let currentScene = 'start';
const viewer = document.getElementById('viewer');
const btns = document.getElementById('choice-btns');

// Audio element for training center
let trainingAudio = null;

// Font loader for 3D text
const fontLoader = new THREE.FontLoader();
let trainingTextMeshes = [];
let trainingButton = null;
let fontLoaded = false;
let loadedFont = null;
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    loadedFont = font;
    fontLoaded = true;
});

function addTrainingTextsAndButton() {
    if (!fontLoaded) {
        setTimeout(addTrainingTextsAndButton, 100); // Wait for font
        return;
    }
    // Remove old if any
    trainingTextMeshes.forEach(mesh => scene.remove(mesh));
    trainingTextMeshes = [];
    if (trainingButton) scene.remove(trainingButton); trainingButton = null;
    // Add 3 text blocks
    const texts = [
        { text: 'Aantal drones per dag', position: [-100, 100, -470] },
        { text: '80%', position: [-200, 80, -400] }
    ];
    texts.forEach((t, i) => {
        const textGeo = new THREE.TextGeometry(t.text, {
            font: loadedFont,
            size: 18,
            height: 2,
            curveSegments: 40
        });
        const textMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.set(...t.position);
        textMesh.name = `trainingText${i+1}`;
        scene.add(textMesh);
        trainingTextMeshes.push(textMesh);
    });
    // Add 3D button (plane with text)
    const btnWidth = 300, btnHeight = 400;
    const btnGeometry = new THREE.PlaneGeometry(btnWidth, btnHeight);
    const btnCanvas = document.createElement('canvas');
    btnCanvas.width = 256; btnCanvas.height = 64;
    const ctx = btnCanvas.getContext('2d');
    // ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, btnCanvas.width, btnCanvas.height);
    // ctx.font = '32px Arial';
    // ctx.fillStyle = 'white';
    // ctx.textAlign = 'center';
    // ctx.textBaseline = 'middle';
    ctx.fillText('Continue', btnCanvas.width/2, btnCanvas.height/2);
    const btnTexture = new THREE.CanvasTexture(btnCanvas);
    const btnMaterial = new THREE.MeshBasicMaterial({ map: btnTexture, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    trainingButton = new THREE.Mesh(btnGeometry, btnMaterial);
    trainingButton.position.set(-300, -300, 0);
    trainingButton.name = 'trainingContinueBtn';
    scene.add(trainingButton);
}

function removeTrainingTextsAndButton() {
    trainingTextMeshes.forEach(mesh => scene.remove(mesh));
    trainingTextMeshes = [];
    if (trainingButton) scene.remove(trainingButton); trainingButton = null;
}

function add3DButtonsAndShelter(imagePath) {
    // Remove old buttons/icons if they exist
    if (scene.getObjectByName('leftBtn3D')) scene.remove(scene.getObjectByName('leftBtn3D'));
    if (scene.getObjectByName('rightBtn3D')) scene.remove(scene.getObjectByName('rightBtn3D'));
    if (scene.getObjectByName('shelterIcon')) scene.remove(scene.getObjectByName('shelterIcon'));
    // Only show left/right buttons on the 'Start' image
    if (imagePath.includes('Start')) {
        // Left button
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = '#2c3e50';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '48px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Left', canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const leftGeometry = new THREE.PlaneGeometry(40, 20);
        const leftBtn3D = new THREE.Mesh(leftGeometry, textMaterial);
        leftBtn3D.position.set(200, 40, -100);
        leftBtn3D.name = 'leftBtn3D';
        scene.add(leftBtn3D);
        // Right button
        const canvasRight = document.createElement('canvas');
        canvasRight.width = 256;
        canvasRight.height = 128;
        const contextRight = canvasRight.getContext('2d');
        contextRight.fillStyle = '#2c3e50';
        contextRight.fillRect(0, 0, canvasRight.width, canvasRight.height);
        contextRight.font = '48px Arial';
        contextRight.fillStyle = 'white';
        contextRight.textAlign = 'center';
        contextRight.textBaseline = 'middle';
        contextRight.fillText('Right', canvasRight.width / 2, canvasRight.height / 2);
        const textureRight = new THREE.CanvasTexture(canvasRight);
        const rightMaterial = new THREE.MeshBasicMaterial({ map: textureRight, side: THREE.DoubleSide });
        const rightGeometry = new THREE.PlaneGeometry(40, 20);
        const rightBtn3D = new THREE.Mesh(rightGeometry, rightMaterial);
        rightBtn3D.position.set(200, 40, 100);
        rightBtn3D.name = 'rightBtn3D';
        scene.add(rightBtn3D);
    }
    // Only show shelter icon on Left/Right images
    if (imagePath.includes('Right') || imagePath.includes('Left')) {
        const loader = new THREE.TextureLoader();
        loader.load('img/iconShelter.png', function(texture) {
            const material = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true,
                opacity: 1.0
            });
            const sprite = new THREE.Sprite(material);
            if (imagePath.includes('Right')) {
                sprite.position.set(100, -30, -400);
            } else {
                sprite.position.set(180, -30, 420);
            }
            sprite.scale.set(50, 50, 1);
            sprite.name = 'shelterIcon';
            scene.add(sprite);
        });
    }
}

let goHomeButton = null;

function addGoHomeButton() {
    if (goHomeButton) scene.remove(goHomeButton);
    const btnWidth = 120, btnHeight = 40;
    const btnGeometry = new THREE.PlaneGeometry(btnWidth, btnHeight);
    const btnCanvas = document.createElement('canvas');
    btnCanvas.width = 256; btnCanvas.height = 64;
    const ctx = btnCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(44,62,80,0.7)';
    ctx.fillRect(0, 0, btnCanvas.width, btnCanvas.height);
    ctx.font = '32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ga naar huis', btnCanvas.width/2, btnCanvas.height/2);
    const btnTexture = new THREE.CanvasTexture(btnCanvas);
    const btnMaterial = new THREE.MeshBasicMaterial({ map: btnTexture, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    goHomeButton = new THREE.Mesh(btnGeometry, btnMaterial);
    goHomeButton.position.set(-300, 100, 0);
    goHomeButton.name = 'goHomeBtn';
    scene.add(goHomeButton);
}

function removeGoHomeButton() {
    if (goHomeButton) {
        scene.remove(goHomeButton);
        goHomeButton = null;
    }
}

// Add raycasting for 3D buttons and shelter icon
function setupRaycasting() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    renderer.domElement.addEventListener('click', function(event) {
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        const clickableObjects = [
            scene.getObjectByName('leftBtn3D'),
            scene.getObjectByName('rightBtn3D'),
            scene.getObjectByName('shelterIcon'),
            trainingButton,
            goHomeButton
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
            } else if (intersects[0].object.name === 'trainingContinueBtn') {
                console.log('Continue button clicked!');
                const videoElem = document.getElementById('intro-video');
                videoElem.src = 'video/droneGameplay.mp4';
                videoElem.currentTime = 0;
                videoElem.play();
                document.getElementById('video-container').style.display = 'flex';
                document.getElementById('viewer').style.display = 'none';
                videoElem.onended = function() {
                    document.getElementById('video-container').style.display = 'none';
                    document.getElementById('viewer').style.display = 'block';
                    // Open trainingCenter.png with NO text or button, and play audio3.mp4
                    removeTrainingTextsAndButton();
                    show360('img/trainingCenter.png');
                    // Play audio3.mp4
                    if (trainingAudio && !trainingAudio.paused) {
                        trainingAudio.pause();
                        trainingAudio.currentTime = 0;
                    }
                    if (!window.trainingAudio3) {
                        window.trainingAudio3 = new Audio('audio/audio3.wav');
                        window.trainingAudio3.loop = false;
                    }
                    window.trainingAudio3.currentTime = 0;
                    window.trainingAudio3.play();
                    window.trainingAudio3.onended = function() {
                        addGoHomeButton();
                    };
                };
            } else if (intersects[0].object.name === 'goHomeBtn') {
                const videoElem = document.getElementById('intro-video');
                videoElem.src = 'video/loopVideo.mp4';
                videoElem.currentTime = 0;
                videoElem.play();
                document.getElementById('video-container').style.display = 'flex';
                document.getElementById('viewer').style.display = 'none';
                videoElem.onended = function() {
                    document.getElementById('video-container').style.display = 'none';
                    document.getElementById('viewer').style.display = 'block';
                    show360('img/StreetViewChoiceStart.jpg');
                };
            }
        }
    });
}
setupRaycasting();

function show360(imagePath, transition) {
    viewer.style.display = 'block';
    btns.style.display = (imagePath.includes('Start')) ? 'flex' : 'none';
    removeGoHomeButton();

    // Handle audio for training center
    let skipTextAndButton = false;
    if (window.trainingAudio3 && !window.trainingAudio3.paused && imagePath === 'img/trainingCenter.png') {
        skipTextAndButton = true;
    }
    if (imagePath === 'img/trainingCenter.png') {
        if (!skipTextAndButton) {
            if (!trainingAudio) {
                trainingAudio = new Audio('audio/audio1.wav');
                trainingAudio.loop = false;
            }
            trainingAudio.currentTime = 0;
            trainingAudio.play();
            addTrainingTextsAndButton();
        } else {
            removeTrainingTextsAndButton();
        }
    } else {
        if (trainingAudio && !trainingAudio.paused) {
            trainingAudio.pause();
            trainingAudio.currentTime = 0;
        }
        removeTrainingTextsAndButton();
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
            add3DButtonsAndShelter(imagePath);
        });
    }
    if (transition && sphere) {
        animatingTransition = true;
        if (!sphere.material.userData) sphere.material.userData = {};
        sphere.material.userData.blurZoom = true;
        let animStart = null;
        function animateBlurZoom(ts) {
            if (!animStart) animStart = ts;
            let progress = Math.min((ts - animStart) / 700, 1);
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
    // Touch controls for mobile
    let lastTouchX = 0, lastTouchY = 0;
    viewer.ontouchstart = function(event) {
        if (event.touches.length === 1) {
            isUserInteracting = true;
            lastTouchX = event.touches[0].clientX;
            lastTouchY = event.touches[0].clientY;
            onMouseDownLon = lon;
            onMouseDownLat = lat;
        }
    };
    viewer.ontouchmove = function(event) {
        if (isUserInteracting && event.touches.length === 1) {
            lon = (lastTouchX - event.touches[0].clientX) * 0.1 + onMouseDownLon;
            lat = (event.touches[0].clientY - lastTouchY) * 0.1 + onMouseDownLat;
        }
    };
    viewer.ontouchend = function() {
        isUserInteracting = false;
    };
    function animate() {
        if (isVRMode) return; // Don't run normal animation in VR
        animationId = requestAnimationFrame(animate);
        lat = Math.max(-85, Math.min(85, lat));
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
        camera.position.y = 100 * Math.cos(phi);
        camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(scene.position);
        // Make left/right buttons always face the camera
        const leftBtn3D = scene.getObjectByName('leftBtn3D');
        const rightBtn3D = scene.getObjectByName('rightBtn3D');
        if (leftBtn3D) leftBtn3D.lookAt(camera.position);
        if (rightBtn3D) rightBtn3D.lookAt(camera.position);
        if (trainingButton) trainingButton.lookAt(camera.position);
        renderer.render(scene, camera);
    }
    if (!isVRMode) animate();
}

// Video to 360 transition
const video = document.getElementById('intro-video');
video.onended = function() {
    document.getElementById('video-container').classList.add('blur-zoom-sphere');
    setTimeout(() => {
        document.getElementById('video-container').style.display = 'none';
        show360('img/StreetViewChoiceStart.jpg');
        btns.style.display = 'flex';
    }, 700);
};

// Listen for messages from the main window
window.addEventListener('message', function(event) {
    if (event.data.type === 'locationData') {
        const location = event.data.location;
        document.title = `${location.name} - 360° View`;
        
        // If it's a video location, set up video
        if (location.videoUrl) {
            const video = document.getElementById('intro-video');
            video.src = location.videoUrl;
            video.loop = true;
            video.muted = true;
            video.play();
        } else if (location.imageUrl) {
            // If it's an image location, show it directly
            document.getElementById('video-container').style.display = 'block';
            show360(location.imageUrl);
        }
    }
});

// Start the viewer page with the 360 image 'img/trainingCenter.png' by default
show360('img/trainingCenter.png'); 