import { toast } from 'sonner';

export const showSuccess = (message: string) => {
  if (typeof toast?.success === 'function') {
    toast.success(message, {
      duration: 4000,
      closeButton: true
    });
  } else {
    console.log('Success:', message);
  }
};

export const showError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'An error occurred';
  
  if (typeof toast?.error === 'function') {
    toast.error(message, {
      duration: 6000,
      closeButton: true
    });
  } else {
    console.error('Error:', message);
  }
};

export const showInfo = (message: string) => {
  if (typeof toast?.info === 'function') {
    toast.info(message, {
      duration: 4000,
      closeButton: true
    });
  } else {
    console.log('Info:', message);
  }
};

const showWarning = (message: string) => {
  if (typeof toast?.warning === 'function') {
    toast.warning(message, {
      duration: 5000,
      closeButton: true
    });
  } else {
    console.log('Warning:', message);
  }
};