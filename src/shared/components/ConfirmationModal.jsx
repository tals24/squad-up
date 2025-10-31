import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/primitives/dialog";
import { Button } from "@/shared/ui/primitives/button";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

/**
 * Generic Confirmation Modal Component
 * 
 * A reusable confirmation popup that can be used throughout the application
 * for various confirmation scenarios (warnings, confirmations, etc.)
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when modal is closed
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message/description
 * @param {string} props.confirmText - Text for confirm button (default: "Confirm")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {function} props.onConfirm - Function to call when confirm is clicked
 * @param {function} props.onCancel - Function to call when cancel is clicked
 * @param {string} props.type - Modal type: "warning", "info", "success" (default: "warning")
 * @param {boolean} props.isLoading - Whether confirm button is in loading state
 * @param {string} props.confirmVariant - Variant for confirm button: "default", "destructive" (default: "default")
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "warning",
  isLoading = false,
  confirmVariant = "default",
}) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-500" />;
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getConfirmButtonVariant = () => {
    if (confirmVariant === "destructive") {
      return "destructive";
    }
    return "default";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400 mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:justify-end">
          {cancelText && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              confirmVariant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-cyan-600 hover:bg-cyan-700 text-white"
            }
          >
            {isLoading ? "Loading..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
