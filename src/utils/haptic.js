/**
 * Haptic Feedback — iOS Style Vibrations
 */

export const haptic = {
  light: () => {
    if (navigator.vibrate) navigator.vibrate(1);
  },
  
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(3);
  },
  
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(5);
  },
  
  success: () => {
    if (navigator.vibrate) navigator.vibrate([1, 30, 1]);
  },
  
  error: () => {
    if (navigator.vibrate) navigator.vibrate(8);
  },
  
  warning: () => {
    if (navigator.vibrate) navigator.vibrate(4);
  },
  
  selection: () => {
    if (navigator.vibrate) navigator.vibrate(1);
  },
  
  impact: () => {
    if (navigator.vibrate) navigator.vibrate(2);
  }
};

export default haptic;
