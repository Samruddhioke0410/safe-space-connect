// Image safety checks (client-side)

export interface ImageSafetyResult {
  isSafe: boolean;
  reasons: string[];
}

// Note: Full face detection and OCR would require additional libraries
// This is a placeholder for the architecture. For production:
// 1. Use face-api.js or MediaPipe for face detection
// 2. Use Tesseract.js for OCR
// 3. Run checks before upload

export async function checkImageSafety(file: File): Promise<ImageSafetyResult> {
  const reasons: string[] = [];
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    reasons.push('Invalid file type');
    return { isSafe: false, reasons };
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    reasons.push('File too large (max 5MB)');
    return { isSafe: false, reasons };
  }

  // TODO: Implement face detection
  // const hasFaces = await detectFaces(file);
  // if (hasFaces) {
  //   reasons.push('Image contains faces');
  //   return { isSafe: false, reasons };
  // }

  // TODO: Implement OCR for number detection
  // const text = await performOCR(file);
  // const hasPhoneNumbers = /\d{7,}/.test(text);
  // if (hasPhoneNumbers) {
  //   reasons.push('Image contains readable numbers');
  //   return { isSafe: false, reasons };
  // }

  // Strip EXIF data before upload
  try {
    await stripExifData(file);
  } catch (e) {
    console.warn("Could not strip EXIF data:", e);
  }

  return { isSafe: true, reasons: [] };
}

async function stripExifData(file: File): Promise<Blob> {
  // Create a canvas and draw the image without metadata
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, file.type);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function showImageBlockedMessage(reasons: string[]): string {
  if (reasons.includes('Image contains faces')) {
    return "Photos with faces are blocked to protect anonymity. Please blur or crop faces before uploading.";
  }
  if (reasons.includes('Image contains readable numbers')) {
    return "Images with readable phone numbers or IDs are blocked to protect privacy.";
  }
  return `Image blocked: ${reasons.join(', ')}`;
}
