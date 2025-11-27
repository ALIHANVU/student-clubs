/**
 * Haptic Feedback Utility
 * Мягкая вибрация как на iPhone - деликатные короткие импульсы
 */

export const haptic = {
  // Очень лёгкий - для переключения табов, выбора элементов
  light: () => {
    if (navigator.vibrate) navigator.vibrate(1);
  },
  
  // Средний - для нажатия кнопок
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(3);
  },
  
  // Сильный - для важных действий
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(5);
  },
  
  // Успех - двойной мягкий тап
  success: () => {
    if (navigator.vibrate) navigator.vibrate([1, 30, 1]);
  },
  
  // Ошибка - чуть более заметный
  error: () => {
    if (navigator.vibrate) navigator.vibrate(8);
  },
  
  // Предупреждение - средний импульс
  warning: () => {
    if (navigator.vibrate) navigator.vibrate(4);
  },
  
  // Выбор - едва заметный (для скролла, picker)
  selection: () => {
    if (navigator.vibrate) navigator.vibrate(1);
  },
  
  // Импакт - для pull-to-refresh
  impact: () => {
    if (navigator.vibrate) navigator.vibrate(2);
  }
};

export default haptic;
