// Custom hook to debounce rapid value changes (e.g. while typing in search inputs)
import { useState, useEffect } from 'react';

export default function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel timer if value or delay changes before the timer fires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
