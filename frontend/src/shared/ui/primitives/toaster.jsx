import { useToast } from '@/shared/ui/primitives/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/shared/ui/primitives/toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts
        .filter((toast) => toast.open !== false)
        .map(function ({ id, title, description, action, onOpenChange, open, ...props }) {
          const handleClose = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onOpenChange) {
              onOpenChange(false);
            }
            dismiss(id);
          };

          return (
            <Toast key={id} {...props} open={open} onOpenChange={onOpenChange}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose onClick={handleClose} />
            </Toast>
          );
        })}
      <ToastViewport />
    </ToastProvider>
  );
}
