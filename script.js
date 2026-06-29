'use strict';

const MAX_CHARS = 2953;
const DEBOUNCE_MS = 150;

const EC_DESCRIPTIONS = {
  L: 'L — Low (~7% data recovery). Smallest QR code size.',
  M: 'M — Medium (~15% data recovery). Good balance for most uses.',
  Q: 'Q — Quartile (~25% data recovery). Better for printed materials.',
  H: 'H — High (~30% data recovery). Best when using a center logo.'
};

const elements = {
  input: document.getElementById('qr-input'),
  fgColor: document.getElementById('fg-color'),
  bgColor: document.getElementById('bg-color'),
  fgHex: document.getElementById('fg-hex'),
  bgHex: document.getElementById('bg-hex'),
  qrOutput: document.getElementById('qr-output'),
  qrPlaceholder: document.getElementById('qr-placeholder'),
  downloadDiv: document.getElementById('download-btn'),
  dlBtn: document.getElementById('dl-btn'),
  charCount: document.getElementById('char-count'),
  sizeSlider: document.getElementById('qr-size'),
  sizeVal: document.getElementById('size-val'),
  ecDesc: document.getElementById('ec-desc'),
  iconToggle: document.getElementById('icon-enabled'),
  iconPanel: document.getElementById('icon-panel'),
  iconSizeSlider: document.getElementById('icon-size'),
  iconSizeVal: document.getElementById('icon-size-val'),
  iconFileInput: document.getElementById('icon-file'),
  iconUrlInput: document.getElementById('icon-url'),
  iconUrlLoadBtn: document.getElementById('icon-url-load'),
  iconPreview: document.getElementById('icon-preview'),
  iconPreviewPlaceholder: document.getElementById('icon-preview-placeholder'),
  iconPreviewName: document.getElementById('icon-preview-name'),
  iconPreviewStatus: document.getElementById('icon-preview-status'),
  iconClearBtn: document.getElementById('icon-clear'),
  iconError: document.getElementById('icon-error')
};

const state = {
  currentECLevel: null,
  currentECKey: 'L',
  debounceTimer: null,
  customIcon: null,
  iconSourceLabel: '',
  iconObjectUrl: null,
  baseQRCanvas: null
};

function debounce(fn) {
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(fn, DEBOUNCE_MS);
}

function updateCharCount() {
  const len = elements.input.value.length;
  elements.charCount.textContent = `${len} / ${MAX_CHARS}`;
  elements.charCount.className =
    'char-count' +
    (len > MAX_CHARS * 0.9 ? ' danger' : len > MAX_CHARS * 0.7 ? ' warn' : '');
}

function setPlaceholder(message, isError = false) {
  elements.qrOutput.classList.remove('is-visible');
  elements.qrPlaceholder.style.display = 'flex';
  elements.qrPlaceholder.classList.toggle('is-error', isError);
  elements.downloadDiv.classList.remove('is-visible');

  const textEl = elements.qrPlaceholder.querySelector('[data-placeholder-text]');
  if (textEl) {
    textEl.textContent = message;
  }
}

function showQR() {
  elements.qrOutput.classList.add('is-visible');
  elements.qrPlaceholder.style.display = 'none';
  elements.qrPlaceholder.classList.remove('is-error');
  elements.downloadDiv.classList.add('is-visible');
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawIconOverlay(ctx, canvasSize) {
  if (!elements.iconToggle.checked || !state.customIcon) return;

  const percent = parseInt(elements.iconSizeSlider.value, 10) / 100;
  const iconSize = canvasSize * percent;
  const x = (canvasSize - iconSize) / 2;
  const y = (canvasSize - iconSize) / 2;
  const pad = iconSize * 0.12;

  ctx.fillStyle = elements.bgColor.value;
  roundRect(ctx, x - pad, y - pad, iconSize + pad * 2, iconSize + pad * 2, iconSize * 0.18);
  ctx.fill();

  ctx.drawImage(state.customIcon, x, y, iconSize, iconSize);
}

function getDisplayCanvas() {
  return elements.qrOutput.querySelector('canvas');
}

function cacheBaseQR() {
  const display = getDisplayCanvas();
  if (!display) return;

  state.baseQRCanvas = document.createElement('canvas');
  state.baseQRCanvas.width = display.width;
  state.baseQRCanvas.height = display.height;
  state.baseQRCanvas.getContext('2d').drawImage(display, 0, 0);
}

function refreshDisplayCanvas() {
  const display = getDisplayCanvas();
  if (!display || !state.baseQRCanvas) return;

  const ctx = display.getContext('2d');
  ctx.clearRect(0, 0, display.width, display.height);
  ctx.drawImage(state.baseQRCanvas, 0, 0);

  if (elements.iconToggle.checked && state.customIcon) {
    drawIconOverlay(ctx, display.width);
  }
}

function renderCompositeCanvas() {
  if (!state.baseQRCanvas) return getDisplayCanvas();

  const size = state.baseQRCanvas.width;
  const composite = document.createElement('canvas');
  composite.width = size;
  composite.height = size;

  const ctx = composite.getContext('2d');
  ctx.drawImage(state.baseQRCanvas, 0, 0);

  if (elements.iconToggle.checked && state.customIcon) {
    drawIconOverlay(ctx, size);
  }

  return composite;
}

function generateQR() {
  const text = elements.input.value.trim();

  if (!text) {
    elements.qrOutput.innerHTML = '';
    state.baseQRCanvas = null;
    setPlaceholder('Enter text above to generate');
    return;
  }

  elements.qrOutput.innerHTML = '';
  state.baseQRCanvas = null;
  const size = parseInt(elements.sizeSlider.value, 10);

  try {
    new QRCode(elements.qrOutput, {
      text,
      width: size,
      height: size,
      colorDark: elements.fgColor.value,
      colorLight: elements.bgColor.value,
      correctLevel: state.currentECLevel
    });

    cacheBaseQR();
    refreshDisplayCanvas();
    showQR();
  } catch {
    elements.qrOutput.innerHTML = '';
    state.baseQRCanvas = null;
    setPlaceholder('Content too long for this error level. Try a lower correction level.', true);
  }
}

function scheduleGenerate() {
  debounce(generateQR);
}

function revokeIconObjectUrl() {
  if (state.iconObjectUrl) {
    URL.revokeObjectURL(state.iconObjectUrl);
    state.iconObjectUrl = null;
  }
}

function updateIconPreviewUI() {
  const hasIcon = Boolean(state.customIcon);

  elements.iconPreview.hidden = !hasIcon;
  elements.iconPreviewPlaceholder.hidden = hasIcon;
  elements.iconClearBtn.disabled = !hasIcon;

  if (hasIcon) {
    elements.iconPreview.src = state.customIcon.src;
    elements.iconPreviewName.textContent = state.iconSourceLabel || 'Custom icon';
    elements.iconPreviewStatus.textContent = 'Ready to overlay';
    elements.iconError.textContent = '';
  } else {
    elements.iconPreview.removeAttribute('src');
    elements.iconPreviewName.textContent = 'No icon selected';
    elements.iconPreviewStatus.textContent = 'Upload a file or load from URL';
  }
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

async function setCustomIcon(img, label) {
  state.customIcon = img;
  state.iconSourceLabel = label;
  updateIconPreviewUI();

  if (elements.iconToggle.checked) {
    suggestHighEC();
  }
}

function suggestHighEC() {
  if (state.currentECKey === 'H') return;

  const hBtn = document.querySelector('.error-level-btn[data-level="H"]');
  if (!hBtn) return;

  document.querySelectorAll('.error-level-btn').forEach((b) => b.classList.remove('active'));
  hBtn.classList.add('active');
  state.currentECKey = 'H';
  state.currentECLevel = QRCode.CorrectLevel.H;
  elements.ecDesc.textContent = EC_DESCRIPTIONS.H;
}

async function handleIconFile(file) {
  if (!file) return;

  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    elements.iconError.textContent = 'Please upload a PNG, JPG, WebP, or SVG file.';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    elements.iconError.textContent = 'File must be under 2 MB.';
    return;
  }

  try {
    revokeIconObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    state.iconObjectUrl = objectUrl;
    const img = await loadImageElement(objectUrl);
    await setCustomIcon(img, file.name);
    elements.iconError.textContent = '';
    if (elements.iconToggle.checked) refreshDisplayCanvas();
  } catch {
    elements.iconError.textContent = 'Failed to read the image file.';
  }
}

async function handleIconUrl() {
  const url = elements.iconUrlInput.value.trim();
  if (!url) {
    elements.iconError.textContent = 'Enter an image URL.';
    return;
  }

  try {
    const img = await loadImageElement(url);
    revokeIconObjectUrl();
    await setCustomIcon(img, url.replace(/^https?:\/\//, '').slice(0, 40));
    elements.iconError.textContent = '';
    if (elements.iconToggle.checked) refreshDisplayCanvas();
  } catch {
    elements.iconError.textContent =
      'Could not load image from URL. Check the link or CORS restrictions.';
  }
}

function clearIcon() {
  revokeIconObjectUrl();
  state.customIcon = null;
  state.iconSourceLabel = '';
  elements.iconFileInput.value = '';
  elements.iconUrlInput.value = '';
  elements.iconError.textContent = '';
  updateIconPreviewUI();
  refreshDisplayCanvas();
}

function downloadPNG() {
  const canvas = renderCompositeCanvas();
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function initErrorCorrection() {
  document.querySelectorAll('.error-level-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.error-level-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentECKey = btn.dataset.level;
      state.currentECLevel = QRCode.CorrectLevel[state.currentECKey];
      elements.ecDesc.textContent = EC_DESCRIPTIONS[state.currentECKey];
      scheduleGenerate();
    });
  });
}

function initPresets() {
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      elements.input.value = btn.dataset.text.replace(/&#10;/g, '\n');
      elements.input.focus();
      updateCharCount();
      scheduleGenerate();
    });
  });
}

function initIconTabs() {
  const tabs = document.querySelectorAll('[data-icon-tab]');
  const panels = document.querySelectorAll('[data-icon-panel]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.iconTab;
      tabs.forEach((t) => t.classList.toggle('active', t.dataset.iconTab === target));
      panels.forEach((p) => p.classList.toggle('active', p.dataset.iconPanel === target));
    });
  });
}

function initIconUpload() {
  elements.iconToggle.addEventListener('change', () => {
    elements.iconPanel.classList.toggle('is-visible', elements.iconToggle.checked);

    if (elements.iconToggle.checked && state.customIcon) {
      suggestHighEC();
    }

    refreshDisplayCanvas();
  });

  elements.iconSizeSlider.addEventListener('input', () => {
    elements.iconSizeVal.textContent = `${elements.iconSizeSlider.value}%`;
    refreshDisplayCanvas();
  });

  elements.iconFileInput.addEventListener('change', (e) => {
    handleIconFile(e.target.files[0]);
  });

  const fileDrop = document.querySelector('.file-drop');
  if (fileDrop) {
    ['dragenter', 'dragover'].forEach((evt) => {
      fileDrop.addEventListener(evt, (e) => {
        e.preventDefault();
        fileDrop.style.borderColor = 'rgba(167,139,250,0.5)';
      });
    });
    fileDrop.addEventListener('dragleave', () => {
      fileDrop.style.borderColor = '';
    });
    fileDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDrop.style.borderColor = '';
      handleIconFile(e.dataTransfer.files[0]);
    });
  }

  elements.iconUrlLoadBtn.addEventListener('click', handleIconUrl);
  elements.iconUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleIconUrl();
    }
  });

  elements.iconClearBtn.addEventListener('click', clearIcon);

  elements.iconSizeVal.textContent = `${elements.iconSizeSlider.value}%`;
  updateIconPreviewUI();
}

function init() {
  state.currentECLevel = QRCode.CorrectLevel.L;
  updateCharCount();

  elements.input.addEventListener('input', () => {
    updateCharCount();
    scheduleGenerate();
  });

  elements.fgColor.addEventListener('input', () => {
    elements.fgHex.textContent = elements.fgColor.value;
    scheduleGenerate();
  });

  elements.bgColor.addEventListener('input', () => {
    elements.bgHex.textContent = elements.bgColor.value;
    scheduleGenerate();
  });

  elements.sizeSlider.addEventListener('input', () => {
    elements.sizeVal.textContent = `${elements.sizeSlider.value} px`;
    scheduleGenerate();
  });

  elements.dlBtn.addEventListener('click', downloadPNG);

  initErrorCorrection();
  initPresets();
  initIconTabs();
  initIconUpload();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', init);
