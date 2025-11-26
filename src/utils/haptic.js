/**
 * Haptic Feedback Utility
 */

export const haptic = {
  light: () => {
    if (navigator.vibrate) navigator.vibrate(10);
  },
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(20);
  },
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(30);
  },
  success: () => {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  },
  error: () => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  },
  warning: () => {
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
  }
};

export default haptic;
