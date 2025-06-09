/**
 * Безопасное получение свойства объекта с проверкой на null/undefined
 * @param obj Объект, из которого получаем свойство
 * @param path Путь к свойству в виде строки, например "user.profile.name"
 * @param defaultValue Значение по умолчанию, если свойство не найдено
 * @returns Значение свойства или defaultValue
 */
export function safeGetProperty<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj || !path) {
    return defaultValue;
  }
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined && current !== null ? current as T : defaultValue;
}

// Re-export типичные вспомогательные функции для работы с объектами
export default {
  safeGetProperty
};