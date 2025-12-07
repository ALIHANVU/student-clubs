/**
 * Haptic — Облегчённая версия
 */

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const haptic = {
  light: () => canVibrate && navigator.vibrate(1),
  medium: () => canVibrate && navigator.vibrate(3),
  heavy: () => canVibrate && navigator.vibrate(5),
  success: () => canVibrate && navigator.vibrate([1, 30, 1]),
  error: () => canVibrate && navigator.vibrate(8),
};

export default haptic;
