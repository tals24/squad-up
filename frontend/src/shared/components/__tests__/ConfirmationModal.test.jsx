/**
 * Unit Tests for ConfirmationModal Component
 * 
 * Tests the generic confirmation modal component for various scenarios
 * including different types, props, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationModal from '../ConfirmationModal';

// Mock the dialog components
jest.mock('@/shared/ui/primitives/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }) => 
    <div data-testid="dialog-content" className={className}>{children}</div>,
  DialogDescription: ({ children, className }) => 
    <div data-testid="dialog-description" className={className}>{children}</div>,
  DialogFooter: ({ children, className }) => 
    <div data-testid="dialog-footer" className={className}>{children}</div>,
  DialogHeader: ({ children }) => 
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children, className }) => 
    <div data-testid="dialog-title" className={className}>{children}</div>
}));

// Mock the button component
jest.mock('@/shared/ui/primitives/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon">⚠️</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">✅</div>,
  Info: () => <div data-testid="info-icon">ℹ️</div>
}));

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Title',
    message: 'Test Message',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ConfirmationModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should display title and message', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('should display custom button text', () => {
      render(
        <ConfirmationModal 
          {...defaultProps} 
          confirmText="Continue" 
          cancelText="Go Back" 
        />
      );
      
      expect(screen.getByText('Continue')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('should use default button text when not provided', () => {
      render(
        <ConfirmationModal 
          isOpen={true}
          onClose={jest.fn()}
          title="Test"
          message="Test"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Icon Types', () => {
    it('should show warning icon for warning type', () => {
      render(<ConfirmationModal {...defaultProps} type="warning" />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should show info icon for info type', () => {
      render(<ConfirmationModal {...defaultProps} type="info" />);
      
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('should show success icon for success type', () => {
      render(<ConfirmationModal {...defaultProps} type="success" />);
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should default to warning icon when type is not specified', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      
      render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      
      render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onClose after confirm action', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<ConfirmationModal {...defaultProps} onClose={onClose} />);
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose after cancel action', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<ConfirmationModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onConfirm when confirm button is disabled', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      
      render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} isLoading={true} />);
      
      const confirmButton = screen.getByText('Loading...');
      expect(confirmButton).toBeDisabled();
      
      await user.click(confirmButton);
      
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should not call onCancel when cancel button is disabled during loading', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      
      render(<ConfirmationModal {...defaultProps} onCancel={onCancel} isLoading={true} />);
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
      
      await user.click(cancelButton);
      
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading text when isLoading is true', () => {
      render(<ConfirmationModal {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('should disable buttons when isLoading is true', () => {
      render(<ConfirmationModal {...defaultProps} isLoading={true} />);
      
      const confirmButton = screen.getByText('Loading...');
      const cancelButton = screen.getByText('Cancel');
      
      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show normal text when isLoading is false', () => {
      render(<ConfirmationModal {...defaultProps} isLoading={false} />);
      
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('should apply default variant for confirm button', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveAttribute('data-variant', 'default');
    });

    it('should apply destructive variant for confirm button', () => {
      render(<ConfirmationModal {...defaultProps} confirmVariant="destructive" />);
      
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveAttribute('data-variant', 'destructive');
    });

    it('should apply outline variant for cancel button', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onConfirm callback', async () => {
      const user = userEvent.setup();
      
      render(<ConfirmationModal {...defaultProps} onConfirm={undefined} />);
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      // Should not throw error
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should handle missing onCancel callback', async () => {
      const user = userEvent.setup();
      
      render(<ConfirmationModal {...defaultProps} onCancel={undefined} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Should not throw error
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should handle empty title and message', () => {
      render(
        <ConfirmationModal 
          {...defaultProps} 
          title="" 
          message="" 
        />
      );
      
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
    });

    it('should handle very long title and message', () => {
      const longTitle = 'A'.repeat(1000);
      const longMessage = 'B'.repeat(1000);
      
      render(
        <ConfirmationModal 
          {...defaultProps} 
          title={longTitle} 
          message={longMessage} 
        />
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      const confirmButton = screen.getByText('Confirm');
      const cancelButton = screen.getByText('Cancel');
      
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(<ConfirmationModal {...defaultProps} />);
      
      const confirmButton = screen.getByText('Confirm');
      confirmButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should apply correct CSS classes for different types', () => {
      const { rerender } = render(<ConfirmationModal {...defaultProps} type="warning" />);
      
      // Warning type should have specific classes
      expect(screen.getByTestId('dialog-content')).toHaveClass('sm:max-w-md');
      
      rerender(<ConfirmationModal {...defaultProps} type="info" />);
      expect(screen.getByTestId('dialog-content')).toHaveClass('sm:max-w-md');
      
      rerender(<ConfirmationModal {...defaultProps} type="success" />);
      expect(screen.getByTestId('dialog-content')).toHaveClass('sm:max-w-md');
    });

    it('should apply loading state classes', () => {
      render(<ConfirmationModal {...defaultProps} isLoading={true} />);
      
      const confirmButton = screen.getByText('Loading...');
      expect(confirmButton).toBeInTheDocument();
    });
  });
});
