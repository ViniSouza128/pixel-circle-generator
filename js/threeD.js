let scene, camera, renderer, instancedMesh, material;
let edgeMesh = null;                    // malha de arestas (grid)
let crossMesh = null;                   // cruz de blocos nos 3 eixos
let isDragging3D = false;
let prevMouseX3D = 0, prevMouseY3D = 0;
let distance3D = 70;
let theta3D = Math.PI / 4;              // isometric
let phi3D = Math.atan(1 / Math.sqrt(2));
let threeInitialized = false;
let showGrid3D = true;
let showCenter3D = false;

const geometry = new THREE.BoxGeometry(1, 1, 1);

function initThreeD() {
  if (threeInitialized) return;
  threeInitialized = true;

  const canvas = threeCanvas;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  scene.background = new THREE.Color(C().gridBg);

  scene.add(new THREE.HemisphereLight(0xffffff, C().bg === '#0b0b0f' ? 0x1e1e2c : 0xbfb8a8, 0.7));
  const dir1 = new THREE.DirectionalLight(0xffffff, 0.9); dir1.position.set(40,50,30); scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(C().pixel, 0.6); dir2.position.set(-30,-20,-40); scene.add(dir2);

  material = new THREE.MeshPhongMaterial({ 
    color: C().pixel, 
    shininess: 12, 
    specular: 0x333333, 
    flatShading: true 
  });

  generateVoxels3D();
  updateCamera3D();
  animate3D();

  canvas.addEventListener('mousedown', e => { isDragging3D = true; prevMouseX3D = e.clientX; prevMouseY3D = e.clientY; });
  canvas.addEventListener('mousemove', onMouseMove3D);
  canvas.addEventListener('mouseup', () => isDragging3D = false);
  canvas.addEventListener('mouseleave', () => isDragging3D = false);
  canvas.addEventListener('wheel', e => {
    distance3D *= e.deltaY > 0 ? 1.08 : 0.93;
    distance3D = Math.max(30, Math.min(200, distance3D));
    updateCamera3D();
  });

  new ResizeObserver(() => {
    if (!renderer) return;
    const rect = cFrame.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }).observe(cFrame);
}

function updateCamera3D() {
  camera.position.set(
    distance3D * Math.sin(phi3D) * Math.cos(theta3D),
    distance3D * Math.cos(phi3D),
    distance3D * Math.sin(phi3D) * Math.sin(theta3D)
  );
  camera.lookAt(0, 0, 0);
}

function animate3D() {
  requestAnimationFrame(animate3D);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onMouseMove3D(e) {
  if (!isDragging3D) return;
  const dx = e.clientX - prevMouseX3D;
  const dy = e.clientY - prevMouseY3D;
  theta3D += dx * 0.005;
  phi3D -= dy * 0.005;
  phi3D = Math.max(0.1, Math.min(Math.PI - 0.1, phi3D));
  updateCamera3D();
  prevMouseX3D = e.clientX;
  prevMouseY3D = e.clientY;
}

// ==================== VOXELS + GRID + CRUZ ====================
function generateVoxels3D() {
  if (!scene) return;
  if (instancedMesh) { scene.remove(instancedMesh); instancedMesh.geometry.dispose(); }
  if (edgeMesh) { scene.remove(edgeMesh); edgeMesh.geometry.dispose(); }
  if (crossMesh) { scene.remove(crossMesh); crossMesh.geometry.dispose(); }

  const voxels = [];
  const r = diamSize / 2;
  const r2 = r * r + 0.5;
  const bound = 40;

  for (let x = -bound; x <= bound; x++) {
    for (let y = -bound; y <= bound; y++) {
      for (let z = -bound; z <= bound; z++) {
        if (x*x + y*y + z*z <= r2) voxels.push({x, y, z});
      }
    }
  }

  if (renderMode === 'thin') {
    const innerVoxels = [];
    const innerR = Math.max(4, diamSize - 2) / 2;
    const innerR2 = innerR * innerR + 0.5;
    for (let x = -bound; x <= bound; x++) for (let y = -bound; y <= bound; y++) for (let z = -bound; z <= bound; z++) {
      if (x*x + y*y + z*z <= innerR2) innerVoxels.push(`${x},${y},${z}`);
    }
    const final = voxels.filter(v => !innerVoxels.includes(`${v.x},${v.y},${v.z}`));
    voxels.length = 0;
    voxels.push(...final);
  }

  _voxelCount = voxels.length;

  // Solid voxels (sempre vermelhos)
  material.color.set(C().pixel);
  material.wireframe = false;

  instancedMesh = new THREE.InstancedMesh(geometry, material, voxels.length);
  const dummy = new THREE.Object3D();
  voxels.forEach((v,i) => {
    dummy.position.set(v.x, v.y, v.z);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(instancedMesh);

  // Arestas (grid) – só quando ativado – contornos 1px preto (corrigido bug visual)
  if (showGrid3D) {
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000 
    });
    const edges = new THREE.EdgesGeometry(geometry);
    edgeMesh = new THREE.InstancedMesh(edges, edgeMaterial, voxels.length);
    voxels.forEach((v,i) => {
      dummy.position.set(v.x, v.y, v.z);
      dummy.updateMatrix();
      edgeMesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(edgeMesh);
  }

  // Cruz de blocos nos 3 eixos → 3 espetos transparentes bem clarinhos que atravessam a esfera
  // e vão até o "infinito" (200 unidades) respeitando estilo de blocos pixelados
  const crossVoxels = [];
  const crossR = 200; // longo o suficiente para sair da esfera e criar destaque visual
  // X axis
  for (let i = -crossR; i <= crossR; i++) crossVoxels.push({x:i, y:0, z:0});
  // Y axis
  for (let i = -crossR; i <= crossR; i++) crossVoxels.push({x:0, y:i, z:0});
  // Z axis
  for (let i = -crossR; i <= crossR; i++) crossVoxels.push({x:0, y:0, z:i});

  const crossMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xeeeeee, 
    shininess: 10,
    transparent: true,
    opacity: 0.22
  });
  crossMesh = new THREE.InstancedMesh(geometry, crossMaterial, crossVoxels.length);
  crossVoxels.forEach((v,i) => {
    dummy.position.set(v.x, v.y, v.z);
    dummy.updateMatrix();
    crossMesh.setMatrixAt(i, dummy.matrix);
  });
  crossMesh.visible = showCenter3D;
  scene.add(crossMesh);

  // Zoom normalizado
  distance3D = Math.max(35, diamSize * 1.85);
  updateCamera3D();
}

function updateThreeBackground() {
  if (scene) scene.background = new THREE.Color(C().gridBg);
}

// Funções públicas chamadas pela UI
window.generateVoxels3D = generateVoxels3D;

window.toggleCenter3D = () => {
  showCenter3D = !showCenter3D;
  if (crossMesh) crossMesh.visible = showCenter3D;
};

window.toggleGrid3D = () => {
  showGrid3D = !showGrid3D;
  generateVoxels3D();   // recria com ou sem arestas
};