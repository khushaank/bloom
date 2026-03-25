/**
 * Bloom Image Cropper
 * Provides image upload, crop, and position adjustment functionality
 */

class ImageCropper {
  constructor(options = {}) {
    this.options = {
      aspectRatio: options.aspectRatio || 16 / 9,
      minWidth: options.minWidth || 100,
      minHeight: options.minHeight || 100,
      maxWidth: options.maxWidth || 2000,
      maxHeight: options.maxHeight || 2000,
      quality: options.quality || 0.9,
      ...options
    };
    
    this.originalImage = null;
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.cropBox = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDraggingBox = false;
    this.isDraggingCorner = null;
  }

  /**
   * Initialize the image cropper with a file input
   */
  init(fileInputSelector, canvasSelector) {
    this.fileInput = document.querySelector(fileInputSelector);
    this.canvas = document.querySelector(canvasSelector);
    
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'imageCropCanvas';
      this.canvas.style.cssText = 'max-width: 100%; border: 1px solid #ddd; margin: 10px 0; cursor: crosshair; display: none;';
      document.body.appendChild(this.canvas);
    }
    
    this.ctx = this.canvas.getContext('2d');
    
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    this.canvas.addEventListener('mousedown', (e) => this.startCrop(e));
    this.canvas.addEventListener('mousemove', (e) => this.moveCrop(e));
    this.canvas.addEventListener('mouseup', (e) => this.endCrop(e));
    this.canvas.addEventListener('mouseleave', (e) => this.endCrop(e));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.endCrop(e));
  }

  /**
   * Handle file selection
   */
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.setupCanvasAndDraw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Setup canvas and initial crop box
   */
  setupCanvasAndDraw() {
    const displayWidth = Math.min(this.originalImage.width, 600);
    const displayHeight = (displayWidth / this.originalImage.width) * this.originalImage.height;
    
    this.canvas.width = displayWidth;
    this.canvas.height = displayHeight;
    this.canvas.style.display = 'block';
    
    // Initialize crop box (center, 80% of image)
    const width = displayWidth * 0.8;
    const height = width / this.options.aspectRatio;
    const x = (displayWidth - width) / 2;
    const y = (displayHeight - height) / 2;
    
    this.cropBox = {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.min(width, displayWidth),
      height: Math.min(height, displayHeight)
    };
    
    this.draw();
  }

  /**
   * Draw canvas with image and crop overlay
   */
  draw() {
    if (!this.originalImage || !this.ctx) return;

    // Calculate scale
    const scaleX = this.canvas.width / this.originalImage.width;
    const scaleY = this.canvas.height / this.originalImage.height;

    // Draw image
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(
      this.originalImage,
      0, 0,
      this.canvas.width,
      this.canvas.height
    );

    // Draw dark overlay outside crop area
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Clear crop area
    this.ctx.clearRect(
      this.cropBox.x,
      this.cropBox.y,
      this.cropBox.width,
      this.cropBox.height
    );

    // Draw crop box border
    this.ctx.strokeStyle = '#4d7a52';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.cropBox.x,
      this.cropBox.y,
      this.cropBox.width,
      this.cropBox.height
    );

    // Draw corner handles
    const handleSize = 8;
    this.ctx.fillStyle = '#4d7a52';
    const corners = [
      { x: this.cropBox.x, y: this.cropBox.y },
      { x: this.cropBox.x + this.cropBox.width, y: this.cropBox.y },
      { x: this.cropBox.x, y: this.cropBox.y + this.cropBox.height },
      { x: this.cropBox.x + this.cropBox.width, y: this.cropBox.y + this.cropBox.height }
    ];
    corners.forEach(corner => {
      this.ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
    });

    // Draw center circle for positioning
    this.ctx.fillStyle = '#4d7a52';
    this.ctx.beginPath();
    this.ctx.arc(
      this.cropBox.x + this.cropBox.width / 2,
      this.cropBox.y + this.cropBox.height / 2,
      4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  /**
   * Start crop interaction
   */
  startCrop(e) {
    if (!this.cropBox) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on crop box area
    if (this.isInCropBox(x, y)) {
      this.isDraggingBox = true;
    } else {
      this.isDraggingCorner = this.getCornerAtPoint(x, y);
      if (this.isDraggingCorner) {
        this.isDrawing = true;
      }
    }

    this.startX = x;
    this.startY = y;
  }

  /**
   * Move crop during interaction
   */
  moveCrop(e) {
    if (!this.cropBox) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isDraggingBox) {
      const dx = x - this.startX;
      const dy = y - this.startY;

      this.cropBox.x = Math.max(0, Math.min(this.cropBox.x + dx, this.canvas.width - this.cropBox.width));
      this.cropBox.y = Math.max(0, Math.min(this.cropBox.y + dy, this.canvas.height - this.cropBox.height));

      this.startX = x;
      this.startY = y;
      this.draw();
    } else if (this.isDrawing && this.isDraggingCorner) {
      this.resizeCropBox(x, y);
      this.draw();
    }

    // Update cursor
    if (this.getCornerAtPoint(x, y)) {
      this.canvas.style.cursor = this.getCursorForCorner(this.getCornerAtPoint(x, y));
    } else if (this.isInCropBox(x, y)) {
      this.canvas.style.cursor = 'move';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  /**
   * End crop interaction
   */
  endCrop(e) {
    this.isDraggingBox = false;
    this.isDraggingCorner = null;
    this.isDrawing = false;
  }

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    this.canvas.dispatchEvent(mouseEvent);
  }

  /**
   * Handle touch move
   */
  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    this.canvas.dispatchEvent(mouseEvent);
  }

  /**
   * Check if point is in crop box
   */
  isInCropBox(x, y) {
    const padding = 8;
    return x > this.cropBox.x + padding &&
           x < this.cropBox.x + this.cropBox.width - padding &&
           y > this.cropBox.y + padding &&
           y < this.cropBox.y + this.cropBox.height - padding;
  }

  /**
   * Get corner at point
   */
  getCornerAtPoint(x, y) {
    const tolerance = 12;
    const cx = this.cropBox.x + this.cropBox.width / 2;
    const cy = this.cropBox.y + this.cropBox.height / 2;

    const corners = {
      'tl': { x: this.cropBox.x, y: this.cropBox.y },
      'tr': { x: this.cropBox.x + this.cropBox.width, y: this.cropBox.y },
      'bl': { x: this.cropBox.x, y: this.cropBox.y + this.cropBox.height },
      'br': { x: this.cropBox.x + this.cropBox.width, y: this.cropBox.y + this.cropBox.height }
    };

    for (let [key, corner] of Object.entries(corners)) {
      if (Math.abs(x - corner.x) < tolerance && Math.abs(y - corner.y) < tolerance) {
        return key;
      }
    }
    return null;
  }

  /**
   * Get cursor style for corner
   */
  getCursorForCorner(corner) {
    const cursors = {
      'tl': 'nwse-resize',
      'tr': 'nesw-resize',
      'bl': 'nesw-resize',
      'br': 'nwse-resize'
    };
    return cursors[corner] || 'default';
  }

  /**
   * Resize crop box from corner
   */
  resizeCropBox(x, y) {
    const corner = this.isDraggingCorner;
    const minSize = 50;

    if (corner === 'br') {
      this.cropBox.width = Math.max(minSize, x - this.cropBox.x);
      this.cropBox.height = this.cropBox.width / this.options.aspectRatio;
    } else if (corner === 'bl') {
      const newWidth = Math.max(minSize, this.cropBox.x + this.cropBox.width - x);
      this.cropBox.x = this.cropBox.x + this.cropBox.width - newWidth;
      this.cropBox.width = newWidth;
      this.cropBox.height = this.cropBox.width / this.options.aspectRatio;
    } else if (corner === 'tr') {
      const newHeight = Math.max(minSize, y - this.cropBox.y);
      this.cropBox.width = newHeight * this.options.aspectRatio;
      this.cropBox.height = newHeight;
    } else if (corner === 'tl') {
      const newHeight = Math.max(minSize, this.cropBox.y + this.cropBox.height - y);
      this.cropBox.y = this.cropBox.y + this.cropBox.height - newHeight;
      this.cropBox.width = newHeight * this.options.aspectRatio;
      this.cropBox.height = newHeight;
      this.cropBox.x = Math.max(0, this.cropBox.x);
    }

    // Keep bounds
    this.cropBox.x = Math.max(0, Math.min(this.cropBox.x, this.canvas.width - this.cropBox.width));
    this.cropBox.y = Math.max(0, Math.min(this.cropBox.y, this.canvas.height - this.cropBox.height));
  }

  /**
   * Get the cropped image as data URL
   */
  getCroppedImage(type = 'image/png') {
    if (!this.originalImage) return null;

    const scaleX = this.originalImage.width / this.canvas.width;
    const scaleY = this.originalImage.height / this.canvas.height;

    const cropX = this.cropBox.x * scaleX;
    const cropY = this.cropBox.y * scaleY;
    const cropWidth = this.cropBox.width * scaleX;
    const cropHeight = this.cropBox.height * scaleY;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(
      this.originalImage,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    return croppedCanvas.toDataURL(type, this.options.quality);
  }

  /**
   * Get the cropped image as blob
   */
  getCroppedImageBlob(type = 'image/png') {
    return new Promise((resolve) => {
      const data = this.getCroppedImage(type);
      fetch(data)
        .then(res => res.blob())
        .then(blob => resolve(blob));
    });
  }

  /**
   * Reset the cropper
   */
  reset() {
    this.originalImage = null;
    this.cropBox = null;
    if (this.canvas) {
      this.canvas.style.display = 'none';
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageCropper;
}
