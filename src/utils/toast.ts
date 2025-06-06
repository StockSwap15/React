import { toast } from 'sonner';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'An error occurred';
  toast.error(message);
};

const showInfo = (message: string) => {
  toast.info(message);
};

const showWarning = (message: string) => {
  toast.warning(message);
};