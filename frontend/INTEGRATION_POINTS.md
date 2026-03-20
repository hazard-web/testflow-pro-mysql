# Integration Points for Toast Notifications

## Quick Integration Guide

### 1. Test Cases Module

**File:** `src/pages/index.jsx`

Add toasts to these operations:

```javascript
// In the TestCases component
const { success, error } = useToast();
const createTC = useCreateTC();
const updateTC = useUpdateTC();
const deleteTC = useDeleteTC();

// When creating
const handleCreate = async data => {
  try {
    await createTC.mutateAsync(data);
    success('✓ Test case created successfully');
  } catch (err) {
    error('✕ Failed to create test case');
  }
};

// When updating
const handleUpdate = async (id, data) => {
  try {
    await updateTC.mutateAsync({ id, ...data });
    success('✓ Test case updated');
  } catch (err) {
    error('✕ Failed to update test case');
  }
};

// When deleting
const handleDelete = async id => {
  try {
    await deleteTC.mutateAsync(id);
    success('✓ Test case deleted');
  } catch (err) {
    error('✕ Cannot delete test case');
  }
};
```

### 2. Bugs Module

Add toasts to bug operations:

```javascript
const { success, error } = useToast();
const createBug = useCreateBug();
const updateBug = useUpdateBug();
const deleteBug = useDeleteBug();

// Bug operations
const handleReportBug = async data => {
  try {
    await createBug.mutateAsync(data);
    success('🐛 Bug reported successfully');
  } catch (err) {
    error('✕ Failed to report bug');
  }
};

const handleResolveBug = async id => {
  try {
    await updateBug.mutateAsync({ id, status: 'Resolved' });
    success('✓ Bug marked as resolved');
  } catch (err) {
    error('✕ Failed to update bug');
  }
};
```

### 3. Projects Module

Add toasts to project operations:

```javascript
const { success, error } = useToast();
const createProject = useCreateProject();
const updateProject = useUpdateProject();
const deleteProject = useDeleteProject();

// Project operations
const handleCreateProject = async data => {
  try {
    await createProject.mutateAsync(data);
    success('📦 Project created successfully');
  } catch (err) {
    error('✕ Failed to create project');
  }
};
```

### 4. Testers Management

Add toasts to tester operations:

```javascript
const { success, error } = useToast();
const createTester = useCreateTester();
const updateTester = useUpdateTester();
const deleteTester = useDeleteTester();

// Tester operations
const handleAddTester = async data => {
  try {
    await createTester.mutateAsync(data);
    success('👤 Tester added to team');
  } catch (err) {
    error('✕ Failed to add tester');
  }
};
```

### 5. Test Runs Module

Add toasts to run operations:

```javascript
const { success, error } = useToast();
const createRun = useCreateRun();
const deleteRun = useDeleteRun();

// Run operations
const handleStartRun = async data => {
  try {
    await createRun.mutateAsync(data);
    success('▶️ Test run started');
  } catch (err) {
    error('✕ Failed to start test run');
  }
};
```

### 6. Comments & Interactions

```javascript
const { success, error } = useToast();
const postComment = usePostComment();

// Comment operations
const handlePostComment = async data => {
  try {
    await postComment.mutateAsync(data);
    success('💬 Comment posted');
  } catch (err) {
    error('✕ Failed to post comment');
  }
};
```

### 7. Settings & Profile

```javascript
const { success, error } = useToast();
const updateProfile = useUpdateProfile();
const changePassword = useChangePassword();

// Profile updates
const handleUpdateProfile = async data => {
  try {
    await updateProfile.mutateAsync(data);
    success('✓ Profile updated successfully');
  } catch (err) {
    error('✕ Failed to update profile');
  }
};

const handleChangePassword = async (oldPwd, newPwd) => {
  try {
    await changePassword.mutateAsync({ oldPwd, newPwd });
    success('🔒 Password changed successfully');
  } catch (err) {
    error('✕ Failed to change password');
  }
};
```

---

## Pattern to Follow

For each operation, use this pattern:

```javascript
const { success, error, warning } = useToast();

const handleOperation = async () => {
  try {
    // Your API call
    await apiCall();

    // Show success
    success('Operation completed');
  } catch (err) {
    // Show error with detail if available
    error(err.response?.data?.message || 'Operation failed');
  }
};
```

## Toast Duration Recommendations

```javascript
// Quick operations (< 1 second)
success('Item deleted', 3000); // 3 seconds

// Normal operations
success('Profile updated', 4000); // 4 seconds (default)

// Important/Error messages
error('Critical error', 6000); // 6 seconds

// Permanent messages (user must close)
warning('This action cannot be undone', 0); // No auto-dismiss
```

---

## Search Integration

The search is already integrated! Users can:

1. Press `Cmd+K` / `Ctrl+K` anywhere
2. Search automatically across all modules
3. Click or press Enter to navigate

No additional code needed for search - it's automatic!

---

## Tips

✨ **Pro Tips:**

- Use emoji in success messages for personality
- Keep error messages brief but informative
- Group related operations to show success batch operations
- Test with slow network to ensure toasts display properly
- Consider adding `warning()` for destructive actions
