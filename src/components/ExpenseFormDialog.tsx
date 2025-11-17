import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useAddClientExpenseMutation } from '@/store/expensesApi';
import { toast } from 'sonner';
import { validateExpenseForm, validateSingleField, ExpenseFormData } from '@/utils/validation/expenseValidation';
import { X } from 'lucide-react';

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseType: 'client' | 'team';
}

export const ExpenseFormDialog: React.FC<ExpenseFormDialogProps> = ({ isOpen, onClose, expenseType }) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: '',
    clientId: expenseType === 'client' ? '' : '',
    teamId: expenseType === 'team' ? '' : '',
    description: '',
    expreseCategory: '',
    netAmount: '',
    vatPercentage: '',
    status: 'no',
    file: null,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  
  const { data: clientOptionsResp } = useGetDropdownOptionsQuery('client');
  const { data: teamOptionsResp } = useGetDropdownOptionsQuery('team');
  const clientOptions = (clientOptionsResp?.data?.clients || []).map((c: any) => ({ value: c._id, label: c.name }));
  const teamOptions = (teamOptionsResp?.data?.teams || []).map((t: any) => ({ value: t._id, label: t.name }));
  
  const [addExpense, { isLoading: isAddingExpense }] = useAddClientExpenseMutation();

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: '',
        clientId: '',
        teamId: '',
        description: '',
        expreseCategory: '',
        netAmount: '',
        vatPercentage: '',
        status: 'no',
        file: null,
      });
      setFormErrors({});
    }
  }, [isOpen]);

  const handleFieldChange = (field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validate field in real-time
    const error = validateSingleField(field, value, expenseType);
    if (error) {
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async () => {
    // Validate the entire form
    const validationResult = validateExpenseForm(formData, expenseType);
    if (!validationResult.isValid) {
      setFormErrors(validationResult.errors);
      return;
    }

    try {
      // Prepare expense data exactly like in ExpensesLogTab
      const expenseData = {
        type: expenseType as 'client' | 'team',
        description: formData.description,
        clientId: expenseType === 'client' ? formData.clientId : undefined,
        userId: expenseType === 'team' ? formData.teamId : undefined,
        date: formData.date,
        expreseCategory: formData.expreseCategory.charAt(0).toUpperCase() + formData.expreseCategory.slice(1).toLowerCase(),
        netAmount: Number(formData.netAmount || 0),
        vatPercentage: Number(formData.vatPercentage || 0),
        vatAmount: undefined,
        totalAmount: undefined,
        status: formData.status as 'yes' | 'no',
        file: formData.file,
      };

      // Submit expense
      await addExpense(expenseData).unwrap();
      toast.success(`${expenseType === 'client' ? 'Client' : 'Team'} expense added successfully!`);

      // Close dialog and reset
      onClose();
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast.error('Failed to add expense. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl !rounded-none p-0 border-none for-close">
        <button 
          onClick={onClose}
          className=" bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"
        >
          <X size={16}/>
        </button>
        <DialogHeader className="bg-[#381980] sticky z-50 top-0 left-0 w-full text-center ">
          <DialogTitle className="text-center text-white py-4">Add {expenseType === 'client' ? 'Client' : 'Team'} Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4  form-change">
          <div className="grid grid-cols-2 gap-4 px-[20px]">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className={formErrors.date ? 'border-red-500' : ''}
              />
              {formErrors.date && (
                <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">{expenseType === 'client' ? 'Client' : 'Team'}</label>
              <Select 
                value={expenseType === 'client' ? formData.clientId : formData.teamId} 
                onValueChange={(v) => handleFieldChange(expenseType === 'client' ? 'clientId' : 'teamId', v)}
              >
                <SelectTrigger className={(expenseType === 'client' ? formErrors.clientId : formErrors.teamId) ? 'border-red-500' : ''}>
                  <SelectValue placeholder={`Select ${expenseType === 'client' ? 'client' : 'team'}`} />
                </SelectTrigger>
                <SelectContent>
                  {(expenseType === 'client' ? clientOptions : teamOptions).map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(expenseType === 'client' ? formErrors.clientId : formErrors.teamId) && (
                <p className="text-red-500 text-xs mt-1">{expenseType === 'client' ? formErrors.clientId : formErrors.teamId}</p>
              )}
            </div>
          </div>
          <div className='px-[20px]'>
            <label className="text-sm font-medium">Description</label>
            <Input 
              placeholder="Enter expense description" 
              value={formData.description} 
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className={formErrors.description ? 'border-red-500' : ''}
            />
            {formErrors.description && (
              <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 px-[20px]">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={formData.expreseCategory} 
                onValueChange={(v) => handleFieldChange('expreseCategory', v)}
              >
                <SelectTrigger className={formErrors.expreseCategory ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cro-filing-fee">CRO filing fee</SelectItem>
                  <SelectItem value="subsistence">Subsistence</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="mileage">Mileage</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="stationary">Stationary</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.expreseCategory && (
                <p className="text-red-500 text-xs mt-1">{formErrors.expreseCategory}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Net Amount</label>
              <Input 
                type="number" 
                placeholder="Net amount" 
                step="0.01" 
                value={formData.netAmount} 
                onChange={(e) => handleFieldChange('netAmount', e.target.value)}
                className={formErrors.netAmount ? 'border-red-500' : ''}
              />
              {formErrors.netAmount && (
                <p className="text-red-500 text-xs mt-1">{formErrors.netAmount}</p>
              )}
            </div>
          </div>
          <div className='px-[20px]'>
            <label className="text-sm font-medium">VAT %</label>
            <Input 
              type="number" 
              placeholder="0" 
              step="0.01" 
              value={formData.vatPercentage} 
              onChange={(e) => handleFieldChange('vatPercentage', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 px-[20px]">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => handleFieldChange('status', v)}
              >
                <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Not Invoiced</SelectItem>
                  <SelectItem value="yes">Invoiced</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Attachment</label>
              <Input 
                type="file" 
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  handleFieldChange('file', file);
                }} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 p-[20px] bg-[#381980]">
            <Button variant="outline" onClick={onClose} className="rounded-[6px] text-[#017DB9]">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isAddingExpense} className="!bg-[#017DB9] rounded-[6px]">
              {isAddingExpense ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
