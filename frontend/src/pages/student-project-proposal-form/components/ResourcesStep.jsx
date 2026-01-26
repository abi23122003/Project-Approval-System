import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ResourcesStep = ({ formData, onChange, errors }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const budgetCategories = [
    { value: 'equipment', label: 'Equipment and Hardware' },
    { value: 'software', label: 'Software Licenses' },
    { value: 'materials', label: 'Materials and Supplies' },
    { value: 'travel', label: 'Travel and Field Work' },
    { value: 'services', label: 'Professional Services' },
    { value: 'other', label: 'Other Expenses' }
  ];

  const addBudgetItem = () => {
    const budgetItems = formData?.budgetItems || [];
    onChange('budgetItems', [
      ...budgetItems,
      {
        id: Date.now(),
        category: '',
        description: '',
        quantity: 1,
        unitCost: '',
        totalCost: ''
      }
    ]);
  };

  const removeBudgetItem = (id) => {
    const budgetItems = formData?.budgetItems || [];
    onChange('budgetItems', budgetItems?.filter(item => item?.id !== id));
  };

  const updateBudgetItem = (id, field, value) => {
    const budgetItems = formData?.budgetItems || [];
    const updatedItems = budgetItems?.map(item => {
      if (item?.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          const qty = parseFloat(updated?.quantity) || 0;
          const cost = parseFloat(updated?.unitCost) || 0;
          updated.totalCost = (qty * cost)?.toFixed(2);
        }
        return updated;
      }
      return item;
    });
    onChange('budgetItems', updatedItems);
  };

  const calculateTotalBudget = () => {
    const budgetItems = formData?.budgetItems || [];
    return budgetItems?.reduce((sum, item) => sum + (parseFloat(item?.totalCost) || 0), 0)?.toFixed(2);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e?.target?.files);
    const newFiles = files?.map(file => ({
      id: Date.now() + Math.random(),
      name: file?.name,
      size: (file?.size / 1024)?.toFixed(2),
      type: file?.type,
      uploadDate: new Date()
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (id) => {
    setUploadedFiles(uploadedFiles?.filter(file => file?.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="Package" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Resource Requirements</p>
          <p className="text-xs text-muted-foreground mt-1">
            Detail all resources needed for your project including equipment, software, materials, and budget allocation.
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Required Equipment and Facilities
        </label>
        <textarea
          value={formData?.equipmentRequirements || ''}
          onChange={(e) => onChange('equipmentRequirements', e?.target?.value)}
          placeholder="List all equipment, lab facilities, and infrastructure needed for your project"
          rows={5}
          maxLength={1500}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(formData?.equipmentRequirements || '')?.length}/1500 characters
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Software and Tools
        </label>
        <textarea
          value={formData?.softwareRequirements || ''}
          onChange={(e) => onChange('softwareRequirements', e?.target?.value)}
          placeholder="Specify software licenses, development tools, and online platforms required"
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(formData?.softwareRequirements || '')?.length}/1000 characters
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-foreground">
            Budget Breakdown
          </label>
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={addBudgetItem}
          >
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {(formData?.budgetItems || [])?.map((item, index) => (
            <div
              key={item?.id}
              className="p-4 border border-border rounded-lg bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Item {index + 1}</h4>
                <button
                  onClick={() => removeBudgetItem(item?.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>

              <Select
                label="Category"
                options={budgetCategories}
                value={item?.category}
                onChange={(value) => updateBudgetItem(item?.id, 'category', value)}
                placeholder="Select category"
                required
              />

              <Input
                label="Description"
                type="text"
                value={item?.description}
                onChange={(e) => updateBudgetItem(item?.id, 'description', e?.target?.value)}
                placeholder="Describe the item"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  value={item?.quantity}
                  onChange={(e) => updateBudgetItem(item?.id, 'quantity', e?.target?.value)}
                  min="1"
                  required
                />
                <Input
                  label="Unit Cost ($)"
                  type="number"
                  value={item?.unitCost}
                  onChange={(e) => updateBudgetItem(item?.id, 'unitCost', e?.target?.value)}
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  label="Total Cost ($)"
                  type="text"
                  value={item?.totalCost}
                  disabled
                />
              </div>
            </div>
          ))}

          {(!formData?.budgetItems || formData?.budgetItems?.length === 0) && (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <Icon name="DollarSign" size={32} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No budget items added</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Item" to start building your budget</p>
            </div>
          )}
        </div>

        {formData?.budgetItems && formData?.budgetItems?.length > 0 && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total Project Budget:</span>
              <span className="text-lg font-heading font-semibold text-primary">
                ${calculateTotalBudget()}
              </span>
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Supporting Documents
        </label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Icon name="Upload" size={32} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
            <p className="text-sm text-foreground mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, XLS, XLSX (Max 10MB per file)
            </p>
          </label>
        </div>

        {uploadedFiles?.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles?.map((file) => (
              <div
                key={file?.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon name="FileText" size={20} color="var(--color-foreground)" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">{file?.size} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file?.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Additional Resource Notes
        </label>
        <textarea
          value={formData?.additionalNotes || ''}
          onChange={(e) => onChange('additionalNotes', e?.target?.value)}
          placeholder="Any additional information about resource requirements, constraints, or special considerations"
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(formData?.additionalNotes || '')?.length}/1000 characters
        </p>
      </div>
    </div>
  );
};

export default ResourcesStep;