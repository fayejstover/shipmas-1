const state = {
  phase: 'stairs', // stairs | transition | floor | selecting | unwrapping | reel
  scrollProgress: 0,
  stairsComplete: false,
  selectedPresent: null,
  selectedPresentIndex: null,
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  unwrapClicks: 0,
  unwrapThreshold: 5, // clicks needed to unwrap
  loopCount: 0,
  captionTimeouts: []
};


const presentGifs = {
  0: 'assets/video/1.gif',
  1: 'assets/video/2.gif',
  2: 'assets/video/3.gif',
  3: 'assets/video/4.gif',
  4: 'assets/video/5.gif',
  5: 'assets/video/6.gif',
  6: 'assets/video/7.gif',
  7: 'assets/video/8.gif'
};


const captions = [
  "thought of you",
  "this felt like you",
  "this made me think of you today",
  "this reminded me of you",
];

const captionsSecond = [
  "i mean it", 
  "happy holidays goon", 
];


const elements = {
  scrollContainer: document.getElementById('scroll-container'),
  scrollProgress: document.getElementById('scroll-progress'),
  phaseIndicator: document.getElementById('phase-indicator'),
  instructions: document.getElementById('instructions'),
  stairsSection: document.getElementById('stairs-section'),
  floorSection: document.getElementById('floor-section'),
  presentsContainer: document.getElementById('presents-container'),
  presents: document.querySelectorAll('.present'),
  tree: document.getElementById('tree'),
  cats: [document.getElementById('cat1'), document.getElementById('cat2')],
  unwrapZone: document.getElementById('unwrap-zone'),
  placedPresent: document.getElementById('placed-present'),
  reelOverlay: document.getElementById('reel-overlay'),
  reelCaption: document.getElementById('reel-caption'),
  exitBtn: document.getElementById('exit-btn'),
  sounds: {
    rustle: document.getElementById('rustle-sound'),
    spark: document.getElementById('spark-sound')
  }
};

function lerp(start, end, t) {
  return start + (end - start) * Math.min(1, Math.max(0, t));
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function playSound(audio) {
  if (audio && audio.src) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

function isOverlapping(rect1, rect2) {
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom);
}

function setPhase(newPhase) {
  if (state.phase !== newPhase && !['selecting', 'unwrapping', 'reel'].includes(state.phase)) {
    state.phase = newPhase;
    elements.phaseIndicator.textContent = `phase: ${newPhase}`;
    updateInstructions();
  }
}

function updateInstructions() {
  switch (state.phase) {
    case 'stairs':
      elements.instructions.textContent = 'scroll gently';
      elements.instructions.classList.add('visible');
      break;
    case 'transition':
      elements.instructions.textContent = 'keep going';
      break;
    case 'floor':
      elements.instructions.textContent = 'hover over a gift, then drag it up';
      break;
    case 'selecting':
      elements.instructions.textContent = 'place the gift above';
      break;
    case 'unwrapping':
      elements.instructions.textContent = 'double-click to unwrap';
      break;
    case 'reel':
      elements.instructions.classList.remove('visible');
      break;
  }
}


function handleScroll() {
  const scrollTop = elements.scrollContainer.scrollTop;
  const maxScroll = elements.scrollContainer.scrollHeight - elements.scrollContainer.clientHeight;
  state.scrollProgress = scrollTop / maxScroll;

  // Update progress bar
  elements.scrollProgress.style.width = `${state.scrollProgress * 100}%`;

  // Phase transitions based on scroll
  if (state.scrollProgress < 0.3) {
    setPhase('stairs');
    animateStairsPhase(state.scrollProgress / 0.3);
  } else if (state.scrollProgress < 0.5) {
    setPhase('transition');
    animateTransitionPhase((state.scrollProgress - 0.3) / 0.2);
  } else {
    setPhase('floor');
    animateFloorPhase((state.scrollProgress - 0.5) / 0.5);
  }
}

function animateStairsPhase(progress) {
  // Cats walk down stairs diagonally
  const cat1StartX = 5, cat1EndX = 35;
  const cat1StartY = 5, cat1EndY = 65;
  const cat2StartX = 25, cat2EndX = 40;
  const cat2StartY = 18, cat2EndY = 68;

  elements.cats[0].style.left = `${lerp(cat1StartX, cat1EndX, progress)}%`;
  elements.cats[0].style.top = `${lerp(cat1StartY, cat1EndY, progress)}%`;
  elements.cats[1].style.left = `${lerp(cat2StartX, cat2EndX, progress)}%`;
  elements.cats[1].style.top = `${lerp(cat2StartY, cat2EndY, progress)}%`;

  // Slight parallax on stairs
  elements.stairsSection.style.transform = `translateY(${progress * -20}px)`;
  elements.stairsSection.style.opacity = 1 - progress * 0.3;
}

function animateTransitionPhase(progress) {
  // Fade out stairs, fade in floor
  elements.stairsSection.style.opacity = 1 - progress;
  elements.floorSection.style.opacity = progress;

  // Cats move to floor positions (based on 963x579 frame)
  // Cat 1: from stairs end to (0, 282) -> 0%, 48.7%
  // Cat 2: from stairs end to (106, 352) -> 11%, 60.8%
  elements.cats[0].style.top = `${lerp(65, 48.7, progress)}%`;
  elements.cats[0].style.left = `${lerp(35, 0, progress)}%`;
  elements.cats[1].style.top = `${lerp(68, 60.8, progress)}%`;
  elements.cats[1].style.left = `${lerp(40, 11, progress)}%`;
}

function animateFloorPhase(progress) {
  // Everything visible
  elements.floorSection.style.opacity = 1;
  elements.presentsContainer.style.opacity = 1;
  elements.presentsContainer.classList.add('active');
  elements.tree.style.opacity = 1;
  elements.stairsSection.style.opacity = 0;

  // Cats at final floor positions 
  elements.cats[0].style.top = '48.7%';
  elements.cats[0].style.left = '0%';
  elements.cats[0].style.width = '13.6%';  // 131/963
  elements.cats[0].style.height = '49.2%'; // 285/579
  
  elements.cats[1].style.top = '60.8%';
  elements.cats[1].style.left = '11%';
  elements.cats[1].style.width = '12%';    // 116/963
  elements.cats[1].style.height = '37.1%'; // 215/579
}


function initPresentInteractions() {
  elements.presents.forEach(present => {
  
    // Start dragging
    present.addEventListener('mousedown', (e) => {
      if (state.phase !== 'floor') return;
      e.preventDefault();
      startDragging(present, e);
    });
  });
}

function startDragging(present, e) {
  state.isDragging = true;
  state.selectedPresent = present;
  state.selectedPresentIndex = parseInt(present.dataset.index);
  state.phase = 'selecting';
  elements.phaseIndicator.textContent = 'phase: selecting';
  updateInstructions();

  const rect = present.getBoundingClientRect();
  state.dragOffset.x = e.clientX - rect.left;
  state.dragOffset.y = e.clientY - rect.top;

  // Clone to placed present
  elements.placedPresent.innerHTML = present.innerHTML;
  elements.placedPresent.style.display = 'block';
  elements.placedPresent.style.width = `${rect.width}px`;
  elements.placedPresent.style.height = `${rect.height}px`;
  elements.placedPresent.style.left = `${rect.left}px`;
  elements.placedPresent.style.top = `${rect.top}px`;

  // Show unwrap zone
  elements.unwrapZone.classList.add('visible');

  // Dim original
  present.style.opacity = '0.3';
}

function handleMouseMove(e) {
  if (!state.isDragging) return;

  const x = e.clientX - state.dragOffset.x;
  const y = e.clientY - state.dragOffset.y;
  elements.placedPresent.style.left = `${x}px`;
  elements.placedPresent.style.top = `${y}px`;

  // Check if over unwrap zone
  const zoneRect = elements.unwrapZone.getBoundingClientRect();
  const presentRect = elements.placedPresent.getBoundingClientRect();
  const isOver = isOverlapping(presentRect, zoneRect);
  elements.unwrapZone.classList.toggle('active', isOver);
}

function handleMouseUp(e) {
  if (!state.isDragging) return;

  const zoneRect = elements.unwrapZone.getBoundingClientRect();
  const presentRect = elements.placedPresent.getBoundingClientRect();
  const isOver = isOverlapping(presentRect, zoneRect);

  if (isOver) {
    elements.placedPresent.style.left = `${zoneRect.left + zoneRect.width / 2 - presentRect.width / 2}px`;
    elements.placedPresent.style.top = `${zoneRect.top + zoneRect.height / 2 - presentRect.height / 2}px`;
    
    enterUnwrappingPhase();
  } else {
    cancelDragging();
  }

  state.isDragging = false;
}

function cancelDragging() {
  if (state.selectedPresent) {
    state.selectedPresent.style.opacity = '1';
  }
  elements.placedPresent.style.display = 'none';
  elements.unwrapZone.classList.remove('visible', 'active');
  state.selectedPresent = null;
  state.selectedPresentIndex = null;
  state.phase = 'floor';
  elements.phaseIndicator.textContent = 'phase: floor';
  updateInstructions();
}


function enterUnwrappingPhase() {
  state.phase = 'unwrapping';
  elements.phaseIndicator.textContent = 'phase: unwrapping';
  updateInstructions();
  state.unwrapClicks = 0;

  elements.presentsContainer.style.opacity = '0';
  elements.presentsContainer.classList.remove('active');
  elements.tree.style.opacity = '0';
  elements.cats.forEach(cat => cat.style.opacity = '0');
  elements.unwrapZone.classList.remove('visible', 'active');
  elements.unwrapZone.style.opacity = '0';

  elements.placedPresent.classList.add('present-unwrapping');
  elements.placedPresent.style.cursor = 'pointer';
  elements.placedPresent.style.transform = 'scale(1.5)';
}

function handleUnwrapClick(e) {
  if (state.phase !== 'unwrapping') return;

  state.unwrapClicks++;
  playSound(elements.sounds.spark);
  createSpark(e.clientX, e.clientY);

  const saturation = 100 - (state.unwrapClicks / state.unwrapThreshold) * 100;
  elements.placedPresent.style.filter = `saturate(${Math.max(0, saturation)}%)`;

  if (state.unwrapClicks >= state.unwrapThreshold) {
    setTimeout(() => {
      showReel();
    }, 500);
  }
}

function createSpark(x, y) {
  const spark = document.createElement('div');
  spark.className = 'spark';
  
  const sparkImg = document.querySelector('.spark-template img');
  if (sparkImg) {
    spark.innerHTML = `<img src="${sparkImg.src}" alt="">`;
  } else {
    spark.innerHTML = '<div class="spark-placeholder"></div>';
  }
  
  spark.style.left = `${x - 15}px`;
  spark.style.top = `${y - 15}px`;
  document.body.appendChild(spark);

  setTimeout(() => spark.remove(), 600);
}





function showReel() {
  state.phase = 'reel';
  elements.phaseIndicator.textContent = 'phase: reel';
  state.loopCount = 0;

  state.captionTimeouts.forEach(t => clearTimeout(t));
  state.captionTimeouts = [];

  elements.placedPresent.style.display = 'none';

  elements.reelOverlay.style.display = 'flex';
  setTimeout(() => {
    elements.reelOverlay.classList.add('visible');
  }, 50);

  const gifImg = document.getElementById('reel-gif');
  if (gifImg) {
    const gifSrc = presentGifs[state.selectedPresentIndex] || 'assets/video/1.gif';
    // Add timestamp to force reload and restart gif animation
    gifImg.src = gifSrc + '?t=' + Date.now();
  }

  const t1 = setTimeout(() => {
    elements.reelCaption.textContent = randomFrom(captions);
    elements.reelCaption.classList.add('visible');
  }, 3000);
  state.captionTimeouts.push(t1);

  const t2 = setTimeout(() => {
    elements.reelCaption.textContent = randomFrom(captionsSecond);
    elements.exitBtn.classList.add('visible');
  }, 4500);
  state.captionTimeouts.push(t2);
}

function exitReel() {
  state.captionTimeouts.forEach(t => clearTimeout(t));
  state.captionTimeouts = [];

  // Clear gif
  const gifImg = document.getElementById('reel-gif');
  if (gifImg) {
    gifImg.src = '';
  }

  elements.reelOverlay.classList.remove('visible');
  elements.reelCaption.classList.remove('visible');
  elements.exitBtn.classList.remove('visible');

  setTimeout(() => {
    elements.reelOverlay.style.display = 'none';
    elements.reelCaption.textContent = '';
    resetScene();
  }, 800);
}

function resetScene() {
  state.phase = 'floor';
  state.unwrapClicks = 0;
  state.selectedPresent = null;
  state.selectedPresentIndex = null;
  elements.phaseIndicator.textContent = 'phase: floor';
  updateInstructions();

  // Restore elements
  elements.presentsContainer.style.opacity = '1';
  elements.presentsContainer.classList.add('active');
  elements.tree.style.opacity = '1';
  elements.cats.forEach(cat => cat.style.opacity = '1');
  elements.unwrapZone.style.opacity = '';
  elements.presents.forEach(p => p.style.opacity = '1');
  elements.placedPresent.style.filter = '';
  elements.placedPresent.style.transform = '';
  elements.placedPresent.classList.remove('present-unwrapping');
}

// Event Listeners

function initEventListeners() {
  elements.scrollContainer.addEventListener('scroll', handleScroll);

  initPresentInteractions();

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  elements.placedPresent.addEventListener('dblclick', handleUnwrapClick);

  elements.exitBtn.addEventListener('click', exitReel);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && state.phase === 'reel') {
      exitReel();
    }
  });
}

// Initialize

function init() {
  elements.instructions.classList.add('visible');
  initEventListeners();
  handleScroll(); // Set initial state
}

//dom
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
