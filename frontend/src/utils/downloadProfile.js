import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_PX = {
  // A4 at 96 DPI (CSS pixels)
  // portrait: 210mm x 297mm => 8.27in x 11.69in
  portrait: { width: 794, height: 1123 },
  landscape: { width: 1123, height: 794 },
};

function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();
  return Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  ).then(() => undefined);
}

/**
 * Capture a DOM node and download it as a PDF that visually matches the on-screen layout.
 *
 * @param {HTMLElement} node - Root element that wraps the rendered profile/template.
 * @param {Object} options
 * @param {string} [options.fileName='profile.pdf']
 * @param {'p'|'l'} [options.orientation='p'] - 'p' for portrait, 'l' for landscape.
 * @param {boolean} [options.hasPhoto] - When true, keep natural top layout; when false, we can center on the page.
 * @param {boolean} [options.centerIfNoPhoto=true] - Center the content on A4 when there is no photo.
 */
export async function downloadProfileAsPDF(node, options = {}) {
  const {
    fileName = 'profile.pdf',
    orientation = 'p',
    hasPhoto = undefined,
    centerIfNoPhoto = true,
  } = options;

  if (!node) {
    throw new Error('Template root element is missing');
  }

  const shouldCenter = Boolean(centerIfNoPhoto && hasPhoto === false);

  // Hide elements with 'no-print' class before capture
  const noPrintElements = node.querySelectorAll('.no-print');
  const originalDisplayValues = [];
  noPrintElements.forEach((el) => {
    originalDisplayValues.push(el.style.display);
    el.style.display = 'none';
  });

  try {
    // Ensure all fonts & images are loaded before capture
    await document.fonts?.ready?.catch?.(() => undefined);

    // Render into an offscreen A4-sized sandbox so we don't capture the whole page
    // and so the output matches A4 proportions.
    const sandbox = document.createElement('div');
    sandbox.setAttribute('data-pdf-sandbox', 'true');
    sandbox.style.position = 'fixed';
    sandbox.style.left = '-100000px';
    sandbox.style.top = '0';
    sandbox.style.background = '#ffffff';
    sandbox.style.overflow = 'hidden';
    sandbox.style.padding = '0';
    sandbox.style.margin = '0';
    sandbox.style.zIndex = '-1';

    const a4Size = orientation === 'l' ? A4_PX.landscape : A4_PX.portrait;
    sandbox.style.width = `${a4Size.width}px`;

    const clone = node.cloneNode(true);
    // Ensure the captured node uses the sandbox width (avoids huge scaling/shrinking)
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    clone.style.margin = '0';
    clone.style.boxSizing = 'border-box';

    // Hide any no-print elements inside the clone too (defensive)
    clone.querySelectorAll?.('.no-print')?.forEach?.((el) => {
      el.style.display = 'none';
    });

    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    await waitForImages(clone);

    const canvas = await html2canvas(clone, {
      scale: 2, // higher scale for sharper text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: sandbox.clientWidth,
      windowWidth: sandbox.clientWidth,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) => {
        // Ignore elements with no-print class (backup check)
        return element.classList?.contains('no-print');
      },
    });

    document.body.removeChild(sandbox);

    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20; // Add margin to avoid content being too close to edges
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    // Calculate image dimensions maintaining aspect ratio (fit to available width)
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeight / contentHeight);
    
    // Create a temporary canvas for cropping
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = Math.ceil(contentHeight * (canvas.width / imgWidth));
    
    // Add pages and split content
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) {
        pdf.addPage();
      }
      
      // Calculate the source Y position in the original canvas (in pixels)
      const sourceY = Math.floor(pageNum * contentHeight * (canvas.width / imgWidth));
      const sourceHeight = Math.min(tempCanvas.height, canvas.height - sourceY);
      
      // Clear and draw the cropped portion
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(
        canvas,
        0, sourceY, canvas.width, sourceHeight,  // Source rectangle
        0, 0, canvas.width, sourceHeight         // Destination rectangle
      );
      
      // Convert cropped canvas to image
      const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
      
      // Calculate the display height for this page (might be less on last page)
      const displayHeight = (sourceHeight * imgWidth) / canvas.width;

      // If it's a single-page PDF and there's no photo, center the block on the A4 page.
      // If a photo exists, keep the normal top alignment.
      const x = margin;
      const y =
        shouldCenter && totalPages === 1 && displayHeight < contentHeight
          ? margin + (contentHeight - displayHeight) / 2
          : margin;
      
      // Add the cropped image to the PDF page
      pdf.addImage(
        pageImgData, 
        'PNG', 
        x,
        y,
        imgWidth, 
        displayHeight, 
        undefined, 
        'FAST'
      );
    }

    pdf.save(fileName);
  } finally {
    // Restore original display values for no-print elements
    noPrintElements.forEach((el, index) => {
      el.style.display = originalDisplayValues[index] || '';
    });
  }
}

/**
 * Capture a DOM node and download it as a PNG image.
 *
 * @param {HTMLElement} node
 * @param {Object} options
 * @param {string} [options.fileName='profile.png']
 */
export async function downloadProfileAsImage(node, options = {}) {
  const { fileName = 'profile.png' } = options;

  if (!node) {
    throw new Error('Template root element is missing');
  }

  await document.fonts?.ready?.catch?.(() => undefined);

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imgData;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


