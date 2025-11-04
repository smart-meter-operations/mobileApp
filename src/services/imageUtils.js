import ImageMarker from 'react-native-image-marker';
import { COLORS } from '../constants';
import * as FileSystem from 'expo-file-system';

/**
 * Applies a text watermark to an image.
 *
 * @param {string} imageUri The URI of the image to watermark.
 * @param {string} watermarkText The text to apply as a watermark.
 * @param {Object} options Optional styling and positioning options
 * @param {('topLeft'|'topRight'|'bottomLeft'|'bottomRight')} [options.position]
 * @param {string} [options.color]
 * @param {string} [options.fontName]
 * @param {number} [options.fontSize]
 * @param {number} [options.X] Horizontal padding from the edge (positive numbers move inward)
 * @param {number} [options.Y] Vertical padding from the edge (positive numbers move inward)
 * @param {{dx:number,dy:number,radius:number,color:string}} [options.shadowStyle]
 * @returns {Promise<string>} The URI of the watermarked image.
 */
export const applyWatermark = async (imageUri, watermarkText, options = {}) => {
  try {
    console.log(`Applying watermark to: ${imageUri}`);
    
    // On Android, some native libraries work better with a raw path without the 'file://' prefix.
    // Let's also ensure the file exists before trying to use it.
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error(`Image file does not exist at URI: ${imageUri}`);
    }
    const path = imageUri.startsWith('file://') ? imageUri.substring(7) : imageUri;

    // Use react-native-image-marker to draw text on the image
    const resultUri = await ImageMarker.markText({
      src: path,
      text: watermarkText,
      position: options.position || 'bottomRight',
      color: options.color || '#FFFFFF',
      fontName: options.fontName || 'Arial',
      fontSize: options.fontSize || 24,
      scale: 1,
      quality: 100,
      shadowStyle: options.shadowStyle || {
        dx: 2,
        dy: 2,
        radius: 3,
        color: '#000000'
      },
      // Padding from edges. For bottom positions, use positive padding inwards
      X: typeof options.X === 'number' ? options.X : -20,
      Y: typeof options.Y === 'number' ? options.Y : -20,
    });

    console.log('Watermark applied successfully. New URI:', resultUri);
    // The library returns a path, ensure it's a valid file URI
    return resultUri.startsWith('file://') ? resultUri : `file://${resultUri}`;
  } catch (error) {
    // Log the detailed error from the native module
    console.error('Failed to apply watermark. Raw Error:', JSON.stringify(error, null, 2));
    console.error(`Details: Image URI was "${imageUri}", Watermark text was "${watermarkText}"`);
    // Return original image URI on failure
    return imageUri;
  }
};