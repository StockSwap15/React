class TimeoutError extends Error {
  constructor(message = 'The operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      return String(error.message);
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    // Handle PostgrestError format
    if ('code' in error && 'message' in error) {
      return `Error ${error.code}: ${String(error.message)}`;
    }
    // Convert object to string for better error messages
    return JSON.stringify(error);
  }
  
  return 'An unexpected error occurred';
};

const formatSupabaseError = (error: any): string => {
  if (error.code === '23505') {
    return 'A record with this information already exists';
  }
  if (error.code === '23503') {
    return 'This operation would violate referential integrity';
  }
  if (error.code === '42P01') {
    return 'The requested resource does not exist';
  }
  if (error.message?.includes('JWT')) {
    return 'Your session has expired. Please refresh the page to continue.';
  }
  if (error.message?.includes('timeout')) {
    return 'The request timed out. Please check your internet connection and try again.';
  }
  return error.message || 'An error occurred';
};

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  errorMessage?: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject(new TimeoutError(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([
    promise.then(result => {
      return result;
    }),
    timeoutPromise
  ]);
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 5,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 15000
): Promise<T> => {
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;
      
      // Don't retry if we're offline
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      // Don't retry if it's a JWT error (session expired)
      if (lastError.message?.includes('JWT')) {
        throw lastError;
      }
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delayMs = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelayMs
      );
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delayMs}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError || new Error('Max retry attempts reached');
};

// Handle common error scenarios
const handleCommonErrors = (error: unknown): string => {
  const message = getErrorMessage(error);
  
  if (message.includes('JWT') || message.includes('token')) {
    return 'Your session has expired. Please refresh the page to continue.';
  }
  
  if (message.includes('timeout') || error instanceof TimeoutError) {
    return 'The request timed out. Please check your internet connection and try again.';
  }
  
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  return message;
};