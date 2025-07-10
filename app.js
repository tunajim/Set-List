// Point PDF.js at its worker:
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.8.162/pdf.worker.min.js";

const pdfList = document.getElementById("pdf-list");
const pdfContainer = document.getElementById("pdf-container");
let currentLink; // track the active <a> element

// Core rendering function (same as before)
async function renderPDFFromUrl(url) {
  // show loading state
  pdfContainer.innerHTML = "<p>Loading\u2026</p>";

  try {
    // fetch the PDF
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Network error: ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);

    // clear container
    pdfContainer.innerHTML = "";

    // load the document
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    // retina support & base zoom
    const baseScale = 2;
    const outputScale = window.devicePixelRatio || 1;

    // render each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: baseScale });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      pdfContainer.appendChild(canvas);

      await page.render({
        canvasContext: ctx,
        viewport,
        transform:
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
      }).promise;
    }
  } catch (err) {
    pdfContainer.innerHTML = `<p style="color:red;">Error loading PDF: ${err.message}</p>`;
    console.error(err);
  }
}

// Handle clicks on the list
pdfList.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-url]");
  if (!a) return;

  e.preventDefault();

  // highlight active link
  if (currentLink) currentLink.classList.remove("active");
  a.classList.add("active");
  currentLink = a;

  // render the selected PDF
  renderPDFFromUrl(a.dataset.url);
});

const speedBar = document.getElementById("scroller");

speedBar.value = 0; // Set initial speed value

let speed = { value: 0 }; // Initialize speed variable

// scroll the page at a constant speed
  const scrollInterval = setInterval(() => {
    window.scrollBy(0, (speed.value / 10));
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    //   clearInterval(scrollInterval);
    }
  }, 100); // Adjust the interval as needed for smoother scrolling


// Handle scroll events
speedBar.addEventListener("input", (e) => {
  speed.value = parseFloat(speedBar.value);
});
