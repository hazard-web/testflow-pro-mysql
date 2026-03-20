// ============================================
// Toast & Search Integration Guide
// ============================================

/\*
TOAST NOTIFICATIONS
===================

1. Import the hook:
   import { useToast } from '../context/ToastContext';

2. In your component:
   const { success, error, warning, info } = useToast();

3. Use it:
   success('Test case created successfully');
   error('Failed to delete bug');
   warning('This action cannot be undone');
   info('Processing your request...');

4. Custom duration (in ms, 0 = no auto-dismiss):
   success('Saved!', 2000);
   error('Error!', 5000);

# EXAMPLES IN YOUR APP

When creating a new test case:
const { success, error } = useToast();

const handleCreate = async () => {
try {
await createTestCase(data);
success('Test case created successfully');
// refresh list...
} catch (err) {
error('Failed to create test case: ' + err.message);
}
};

When deleting:
const { success, error } = useToast();

const handleDelete = async (id) => {
try {
await deleteTestCase(id);
success('Test case deleted');
} catch (err) {
error('Could not delete test case');
}
};

# GLOBAL SEARCH

1. Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
2. Type to search across:
   - Test Cases
   - Bugs
   - Projects
   - Testers
   - Developers

3. Click result or press Enter to navigate

4. Press Escape to close

# HOW TO INTEGRATE IN COMPONENTS

Add success/error toasts to your mutation handlers:

Example with test case creation:
import { useToast } from '../context/ToastContext';
import { useCreateTC } from '../hooks/useData';

export function CreateTestCase() {
const { success, error } = useToast();
const createTC = useCreateTC();

    const handleSubmit = async (formData) => {
      try {
        await createTC.mutateAsync(formData);
        success('Test case created successfully');
        // refresh...
      } catch (err) {
        error(err.response?.data?.message || 'Failed to create test case');
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
    );

}
\*/

export default {};
