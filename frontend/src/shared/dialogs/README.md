# Shared Dialog System

Reusable dialog components with consistent patterns for the entire application.

## Components

### BaseDialog

Standard dialog wrapper with consistent layout and behavior.

```jsx
import { BaseDialog } from '@/shared/dialogs';

<BaseDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Dialog Title"
  description="Optional description"
  footer={<CustomFooter />}
  isLoading={false}
  size="md"
>
  <div>Dialog content</div>
</BaseDialog>
```

### ConfirmDialog

Specialized dialog for confirmations with variant support.

```jsx
import { ConfirmDialog } from '@/shared/dialogs';

<ConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
  confirmText="Yes, proceed"
  cancelText="Cancel"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  variant="warning" // info, success, warning, danger, error
/>
```

### FormDialog

Specialized dialog for forms with React Hook Form integration.

```jsx
import { FormDialog } from '@/shared/dialogs';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

<FormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Create Item"
  onSubmit={handleSubmit}
  defaultValues={{ name: '' }}
  resolver={zodResolver(schema)}
  submitText="Create"
>
  <FormField name="name" label="Name" />
</FormDialog>
```

## Hooks

### useDialog

Basic dialog state management.

```jsx
import { useDialog } from '@/shared/dialogs';

const dialog = useDialog();

<Button onClick={dialog.open}>Open Dialog</Button>
<BaseDialog
  open={dialog.isOpen}
  onOpenChange={dialog.setIsOpen}
  title="My Dialog"
>
  <Button onClick={dialog.close}>Close</Button>
</BaseDialog>
```

### useConfirmDialog

Confirmation dialog with async action support.

```jsx
import { useConfirmDialog } from '@/shared/dialogs';

const confirmDialog = useConfirmDialog(async (data) => {
  await deleteItem(data.id);
});

<Button onClick={() => confirmDialog.openConfirm({ id: 123 })}>
  Delete Item
</Button>

<ConfirmDialog
  open={confirmDialog.isOpen}
  onOpenChange={confirmDialog.closeConfirm}
  title="Delete Item"
  message="Are you sure?"
  onConfirm={confirmDialog.handleConfirm}
  isLoading={confirmDialog.isLoading}
  variant="danger"
/>
```

## Migration Guide

### Before (old pattern)

```jsx
const [showDialog, setShowDialog] = useState(false);
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await saveData();
    setShowDialog(false);
  } finally {
    setIsLoading(false);
  }
};

<Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button onClick={() => setShowDialog(false)}>Cancel</Button>
      <Button onClick={handleSubmit} disabled={isLoading}>
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### After (new pattern)

```jsx
import { useDialog } from '@/shared/dialogs';
import { ConfirmDialog } from '@/shared/dialogs';

const dialog = useDialog();

<Button onClick={dialog.open}>Open</Button>

<ConfirmDialog
  open={dialog.isOpen}
  onOpenChange={dialog.setIsOpen}
  title="Title"
  message="Content"
  onConfirm={async () => await saveData()}
  confirmText="Save"
/>
```

## Best Practices

1. **Always use the shared dialog components** - Don't create custom dialog wrappers
2. **Use the appropriate specialized component** - ConfirmDialog for confirmations, FormDialog for forms
3. **Keep dialog content focused** - Extract complex forms to separate components
4. **Handle errors gracefully** - Let dialogs stay open on error so users can retry
5. **Use descriptive titles and messages** - Be clear about what the dialog does

## File Size Guidelines

- BaseDialog: ~100 lines
- ConfirmDialog: ~90 lines
- FormDialog: ~130 lines
- useDialog: ~70 lines

All dialog files should be **≤ 150 lines**.

