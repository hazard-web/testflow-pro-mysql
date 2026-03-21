import { useEffect, useState } from 'react';
import api from '../../utils/api';
import '../styles/customfields.css';

export default function CustomFieldsManager({ projectId, testcaseId, _fields, onFieldsChange }) {
  const [projectFields, setProjectFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newField, setNewField] = useState({
    fieldName: '',
    fieldType: 'text',
    isRequired: false,
    helpText: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/custom-fields/${projectId}`);
      setProjectFields(data);
    } catch (err) {
      console.error('Failed to load custom fields:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldValues = async () => {
    if (!testcaseId) return;
    try {
      const data = await api.get(`/custom-fields/values/${testcaseId}`);
      const values = {};
      data.forEach(v => {
        values[v.field_id] = v.value ? JSON.parse(v.value) : '';
      });
      setFieldValues(values);
    } catch (err) {
      console.error('Failed to load field values:', err);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const user = await api.get('/auth/me');
      setIsAdmin(user?.role === 'admin' || user?.role === 'project_admin');
    } catch (err) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchFields();
      checkAdminStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (testcaseId) {
      fetchFieldValues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testcaseId]);

  const handleCreateField = async () => {
    if (!newField.fieldName.trim()) return;

    try {
      await api.post(`/custom-fields/${projectId}`, newField);
      setNewField({
        fieldName: '',
        fieldType: 'text',
        isRequired: false,
        helpText: '',
      });
      setShowForm(false);
      fetchFields();
    } catch (err) {
      console.error('Failed to create field:', err);
    }
  };

  const handleFieldValueChange = async (fieldId, value) => {
    if (!testcaseId) return;

    try {
      setFieldValues({ ...fieldValues, [fieldId]: value });
      await api.post(`/custom-fields/values/${testcaseId}`, { fieldId, value });
      onFieldsChange?.();
    } catch (err) {
      console.error('Failed to save field value:', err);
    }
  };

  const handleDeleteField = async fieldId => {
    if (!window.confirm('Delete this custom field?')) return;

    try {
      await api.delete(`/custom-fields/${fieldId}`);
      fetchFields();
    } catch (err) {
      console.error('Failed to delete field:', err);
    }
  };

  if (loading) return <div className="fields-loading">Loading custom fields...</div>;

  return (
    <div className="customfields-manager">
      {isAdmin && (
        <div className="fields-header">
          <h3>Custom Fields</h3>
          <button className="btn-add" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕' : '+ Add Field'}
          </button>
        </div>
      )}

      {showForm && isAdmin && (
        <div className="fields-form">
          <input
            type="text"
            placeholder="Field name"
            value={newField.fieldName}
            onChange={e => setNewField({ ...newField, fieldName: e.target.value })}
          />
          <select
            value={newField.fieldType}
            onChange={e => setNewField({ ...newField, fieldType: e.target.value })}
          >
            <option value="text">Text</option>
            <option value="select">Select</option>
            <option value="multiselect">Multi-select</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="checkbox">Checkbox</option>
          </select>
          <input
            type="text"
            placeholder="Help text (optional)"
            value={newField.helpText}
            onChange={e => setNewField({ ...newField, helpText: e.target.value })}
          />
          <label>
            <input
              type="checkbox"
              checked={newField.isRequired}
              onChange={e => setNewField({ ...newField, isRequired: e.target.checked })}
            />
            Required
          </label>
          <div className="form-buttons">
            <button className="btn-primary" onClick={handleCreateField}>
              Create
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="fields-container">
        {projectFields && projectFields.length > 0 ? (
          projectFields.map(field => (
            <div key={field.id} className="field-item">
              <div className="field-label">
                <label>{field.field_name}</label>
                {field.help_text && <span className="help-text">{field.help_text}</span>}
                {field.is_required && <span className="badge-required">Required</span>}
              </div>

              {testcaseId && (
                <div className="field-input-wrapper">
                  {field.field_type === 'text' && (
                    <input
                      type="text"
                      value={fieldValues[field.id] || ''}
                      onChange={e => handleFieldValueChange(field.id, e.target.value)}
                      placeholder={`Enter ${field.field_name}`}
                    />
                  )}

                  {field.field_type === 'number' && (
                    <input
                      type="number"
                      value={fieldValues[field.id] || ''}
                      onChange={e => handleFieldValueChange(field.id, e.target.value)}
                      placeholder={`Enter ${field.field_name}`}
                    />
                  )}

                  {field.field_type === 'date' && (
                    <input
                      type="date"
                      value={fieldValues[field.id] || ''}
                      onChange={e => handleFieldValueChange(field.id, e.target.value)}
                    />
                  )}

                  {field.field_type === 'select' && field.field_options && (
                    <select
                      value={fieldValues[field.id] || ''}
                      onChange={e => handleFieldValueChange(field.id, e.target.value)}
                    >
                      <option value="">Select {field.field_name}</option>
                      {JSON.parse(field.field_options || '[]').map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.field_type === 'checkbox' && (
                    <input
                      type="checkbox"
                      checked={fieldValues[field.id] === true || fieldValues[field.id] === 'true'}
                      onChange={e => handleFieldValueChange(field.id, e.target.checked)}
                    />
                  )}
                </div>
              )}

              {isAdmin && !testcaseId && (
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteField(field.id)}
                  title="Delete field"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="no-fields">No custom fields for this project</div>
        )}
      </div>
    </div>
  );
}
