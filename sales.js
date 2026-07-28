// src/sales-modals.js

export function initSalesModals() {
  const modal = document.getElementById('export-sales-modal');
  const openBtn = document.getElementById('open-export-modal-btn'); // I-bind ang ID na ito sa "Export Report" button sa Sales page
  const closeBtn = document.getElementById('close-export-modal-btn');
  const cancelBtn = document.getElementById('cancel-export-modal-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');

  const toggleModal = (show = true) => {
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  if (openBtn) openBtn.onclick = () => toggleModal(true);
  if (closeBtn) closeBtn.onclick = () => toggleModal(false);
  if (cancelBtn) cancelBtn.onclick = () => toggleModal(false);

  // Close sa backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === modal) toggleModal(false);
  });

  // Handler para sa PDF Download Button
  if (downloadPdfBtn) {
    downloadPdfBtn.onclick = () => {
      // Temporary alert muna habang wala pang html2pdf library
      alert("Preparing PDF download... Igagawad natin ang html2pdf.js integration pag-export!");
    };
  }
}