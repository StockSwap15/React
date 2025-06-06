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
    // Handle Supabase error format
    if ('code' in error && 'message' in error) {
      const code = (error as { code: string }).code;
      const message = (error as { message: string }).message;
      
      // Handle specific Supabase error codes
      switch (code) {
        case 'PGRST116':
          return 'Invalid query parameter format';
        case '23505':
          return 'A record with this information already exists';
        case '23503':
          return 'This operation would violate referential integrity';
        case '42P01':
          return 'The requested resource does not exist';
        default:
          return message || 'An unexpected database error occurred';
      }
    }
    
    if ('message' in error) {
      return String(error.message);
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }
  
  return 'An unexpected error occurred';
};

const formatSupabaseError = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  // Handle network connectivity issues
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }
  
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
  if (error.status === 400) {
    return 'Invalid request. Please check your input and try again.';
  }
  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  if (error.status >= 500) {
    return 'A server error occurred. Please try again later.';
  }
  return error.message || 'An error occurred';
};

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 90000, // Increased from 30000ms to 90000ms
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
  maxDelayMs: number = 30000 // Increased from 15000ms to 30000ms
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
      
      // Don't retry on certain HTTP status codes
      if ('status' in error && typeof error.status === 'number') {
        if ([401, 403, 404].includes(error.status)) {
          throw lastError;
        }
      }
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 1000;
      const delayMs = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + jitter,
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
  
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (message.includes('JWT') || message.includes('token')) {
    return 'Your session has expired. Please refresh the page to continue.';
  }
  
  if (message.includes('timeout') || error instanceof TimeoutError) {
    return 'The request timed out. Please check your internet connection and try again.';
  }
  
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (message.includes('PGRST116')) {
    return 'Invalid query parameter format. Please try again.';
  }
  
  return message;
};