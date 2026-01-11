import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const FormContainer = ({
  title,
  subtitle,
  children,
  onSave,
  onCancel,
  isLoading = false,
  isSaving = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  showBackButton = true,
  backUrl = '/',
  className = '',
}) => {
  return (
    <div className={`form-container ${className}`}>
      <div className="form-section animate-slide-in">
        <div className="form-header">
          <div className="flex items-center gap-4 mb-4">
            {showBackButton && (
              <Link to={backUrl} className="btn btn-ghost btn-sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            )}
          </div>
          <h1 className="form-title">{title}</h1>
          {subtitle && <p className="form-subtitle">{subtitle}</p>}
        </div>

        <div className="card">
          <div className="card-content">
            <form onSubmit={onSave}>
              {children}

              <div
                className="flex justify-end gap-4 mt-8 pt-6"
                style={{ borderTop: '1px solid rgba(79, 183, 179, 0.2)' }}
              >
                <Button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="btn btn-secondary"
                >
                  {cancelText}
                </Button>
                <Button type="submit" disabled={isSaving || isLoading} className="btn btn-primary">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {saveText}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  className = '',
  ...props
}) => {
  const inputId = `field-${name}`;

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-textarea ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`form-select ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
          {...props}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {props.children}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-input ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
          {...props}
        />
      )}

      {helpText && <p className="text-sm mt-1 text-neutral-600">{helpText}</p>}

      {error && <p className="text-sm mt-1 text-error-600">{error}</p>}
    </div>
  );
};

const FormGrid = ({ children, columns = 2, className = '' }) => {
  return <div className={`form-grid grid-cols-${columns} ${className}`}>{children}</div>;
};

const FormSection = ({ title, children, className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3 className="text-h4 mb-4" style={{ color: 'var(--color-text-light)' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export { FormContainer, FormField, FormGrid, FormSection };
