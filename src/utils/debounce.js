/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay (default: 300)
 * @returns {Function} The debounced function with a cancel method
 * 
 * @example
 * const debouncedSearch = debounce((value) => {
 *   console.log('Searching:', value);
 * }, 300);
 * 
 * // Call multiple times - only the last call executes after 300ms
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this executes
 * 
 * // Cancel pending execution
 * debouncedSearch.cancel();
 */
export const debounce = (func, wait = 300) => {
  let timeoutId = null;

  const debouncedFn = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  // Method to cancel pending execution
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
};

export default debounce;
