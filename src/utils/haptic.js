/**
 * Haptic Feedback Utility
 * Вибрация при взаимодействии (iOS/Android)
 */

export const haptic = {
  // Лёгкая вибрация (нажатие кнопки)
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  // Средняя вибрация (успешное действие)
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  // Сильная вибрация (ошибка, удаление)
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  },

  // Успех (двойная короткая)
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  // Ошибка (длинная)
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  },

  // Предупреждение
  warning: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 30]);
    }
  }
};

export default haptic;
