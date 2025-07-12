// 1) Point PDF.js at its worker:
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.8.162/pdf.worker.min.js';

const pdfList      = document.getElementById('pdf-list');
const pdfContainer = document.getElementById('pdf-container');
const zoomInBtn    = document.getElementById('zoom-in');
const zoomOutBtn   = document.getElementById('zoom-out');
const zoomLevelTxt = document.getElementById('zoom-level');

const playPauseButton = document.getElementById("play-pause");
let isPlaying = false; // Track play/pause state
let scrollInterval; // Store the interval ID for scrolling

let pdfDoc = null;           // PDFDocumentProxy
let currentScale = 1.2;      // 120% start
const scaleStep = 0.1;
const minScale  = 0.5;
const maxScale  = 5.0;


// Update the “100% / 120% / 200%” text
function updateZoomText() {
  zoomLevelTxt.textContent = `${Math.round(currentScale * 100)}%`;
}

// Core: clear & render every page from the already-loaded pdfDoc
async function renderPages() {
  if (!pdfDoc) return;
  pdfContainer.innerHTML = '';
  const outputScale = window.devicePixelRatio || 1;

  for (let num = 1; num <= pdfDoc.numPages; num++) {
    const page    = await pdfDoc.getPage(num);
    const vp      = page.getViewport({ scale: currentScale });

    const canvas  = document.createElement('canvas');
    const ctx     = canvas.getContext('2d');

    // real pixel size
    canvas.width  = Math.floor(vp.width  * outputScale);
    canvas.height = Math.floor(vp.height * outputScale);
    // CSS size
    canvas.style.width  = `${vp.width}px`;
    canvas.style.height = `${vp.height}px`;

    pdfContainer.appendChild(canvas);

    await page.render({
      canvasContext: ctx,
      viewport: vp,
      transform: outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null
    }).promise;
  }
}

// Load once, cache the PDFDocumentProxy, then render
async function loadPdf(url) {
  pdfContainer.innerHTML = '<p>Loading…</p>';
  try {
    pdfDoc = await pdfjsLib.getDocument(url).promise;
    renderPages();
  } catch (err) {
    pdfContainer.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
    console.error(err);
  }
}

// Update the UI text and apply CSS scale
function applyZoom() {
  zoomLevelTxt.textContent = `${Math.round(currentScale * 100)}%`;
  pdfContainer.style.transform = `scale(${currentScale})`;
}

// Zoom controls
zoomInBtn.addEventListener('click', () => {
 
	applyZoom();
  if (currentScale + scaleStep <= maxScale) {
    currentScale += scaleStep;
  }
});
zoomOutBtn.addEventListener('click', () => {
  if (currentScale - scaleStep >= minScale) {
    currentScale -= scaleStep;
	applyZoom();
  }
});
updateZoomText();

// Menu clicks just call loadPdf with the URL
pdfList.addEventListener('click', e => {

	clearInterval(scrollInterval); // Stop scrolling when a new PDF is loaded
	playPauseButton.classList.remove("active");
	isPlaying = false; // Reset play state
  const a = e.target.closest('a[data-url]');
  if (!a) return;
  e.preventDefault();

  // highlight
  pdfList.querySelectorAll('a.active').forEach(x => x.classList.remove('active'));
  a.classList.add('active');

  // make sure zoom is consistent
  zoomLevelTxt.textContent = '100%'; // Reset zoom text
  const previousScale = currentScale; // Store previous scale
  currentScale = 1; // Reset scale to 100%

  loadPdf(a.dataset.url);
  currentScale = previousScale; // Restore previous scale
  applyZoom(); // Apply the restored scale

});

const speedBar = document.getElementById("scroller");


let speed = { value: 20 }; // Initialize speed variable
speedBar.value = speed.value; // Set initial slider value

// Toggle play/pause state
playPauseButton.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playPauseButton.classList.toggle("active");

  // use symbol for play/pause
  
  if (isPlaying) {
	// Resume scrolling
	scrollInterval = setInterval(() => {
	  window.scrollBy(0, (speed.value / 10));
	}, 100);
  } else {
	// Pause scrolling
	clearInterval(scrollInterval);
  }
});


// Handle scroll events
speedBar.addEventListener("input", (e) => {
  speed.value = parseFloat(speedBar.value);
});


const plus = document.getElementById("scroll-plus");
const minus = document.getElementById("scroll-minus");

// Increase speed
plus.addEventListener("click", () => {
  speed.value += 10; // Increase speed by 0.1
  speedBar.value = speed.value; // Update the slider value
});

// Decrease speed
minus.addEventListener("click", () => {
  speed.value = Math.max(0, speed.value - 10); // Decrease speed by 0.1 but not below 0
  speedBar.value = speed.value; // Update the slider value
});
