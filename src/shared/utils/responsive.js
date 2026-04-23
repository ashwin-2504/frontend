import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
// Usually 350-375 width for mobile-first design
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

/**
 * Linear scaling based on screen width
 */
export const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Linear scaling based on screen height
 */
export const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scaling with a factor to prevent over-scaling on large devices
 * @param {number} size - The original size to scale
 * @param {number} factor - The scaling factor (default 0.5)
 */
export const moderateScale = (size, factor = 0.5) => 
  size + (scale(size) - size) * factor;

/**
 * Moderate scaling for vertical dimensions
 */
export const moderateVerticalScale = (size, factor = 0.5) => 
  size + (verticalScale(size) - size) * factor;

/**
 * Shorthand aliases
 */
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;

// Screen dimensions for layout calculations
export const WINDOW = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};
