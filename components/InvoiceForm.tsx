import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, Mission } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { generateDocumentNumber } from '../services/pdfService';
import { useToast } from './Toast';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialData?: Invoice | null;
  missions: Mission[];
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, onSave, initialData, missions }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [missionId, setMissionId] = useState<string>('');
  const [client, setClient] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('draft');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setInvoiceNumber(initialData.invoiceNumber);
      setMissionId(initialData.missionId || '');
      setClient(initialData.client);
      setClientAddress(initialData.clientAddress || '');
      setClientEmail(initialData.clientEmail || '');
      setIssueDate(initialData.issueDate);
      setDueDate(initialData.dueDate);
      setItems(initialData.items.length > 0 ? initialData.items : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
      setTaxRate(initialData.taxRate || 0);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    } else {
      // Générer un nouveau numéro de facture
      const year = new Date().getFullYear();
      const sequence = Math.floor(Math.random() * 1000) + 1;
      setInvoiceNumber(generateDocumentNumber('FAC', year, sequence));
      setMissionId('');
      setClient('');
      setClientAddress('');
      setClientEmail('');
      setIssueDate(format(new Date(), 'yyyy-MM-dd'));
      setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
      setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
      setTaxRate(0);
      setStatus('draft');
      setNotes('');
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (missionId) {
      const mission = missions.find(m => m.id === missionId);
      if (mission) {
        setClient(mission.client || '');
        // Ajouter automatiquement un article basé sur la mission
        const missionItem: InvoiceItem = {
          description: `${mission.title} - ${mission.location}`,
          quantity: 1,
          unitPrice: mission.totalEarnings,
          total: mission.totalEarnings
        };
        setItems([missionItem]);
      }
    }
  }, [missionId, missions]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = 'Le numéro de facture est requis';
    if (!client.trim()) newErrors.client = 'Le client est requis';
    if (!issueDate) newErrors.issueDate = 'La date d\'émission est requise';
    if (!dueDate) newErrors.dueDate = 'La date d\'échéance est requise';
    
    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'La description est requise';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'La quantité doit être supérieure à 0';
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Le prix unitaire doit être positif';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    const invoice: Invoice = {
      id: initialData?.id || crypto.randomUUID(),
      invoiceNumber,
      missionId: missionId || undefined,
      client,
      clientAddress: clientAddress || undefined,
      clientEmail: clientEmail || undefined,
      issueDate,
      dueDate,
      items: items.filter(item => item.description.trim() !== ''),
      subtotal: calculateSubtotal(),
      tax: taxRate > 0 ? calculateTax() : undefined,
      taxRate: taxRate > 0 ? taxRate : undefined,
      total: calculateTotal(),
      status,
      notes: notes || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(invoice);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass-strong border-b border-primary-500/20 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary-300">
            {initialData ? 'Modifier la facture' : 'Nouvelle facture'}
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg hover:bg-red-500/20 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Numéro de facture *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={`glass-button w-full px-4 py-2 rounded-lg ${errors.invoiceNumber ? 'border-red-500' : ''}`}
                required
              />
              {errors.invoiceNumber && (
                <p className="text-red-400 text-xs mt-1">{errors.invoiceNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mission (optionnel)
              </label>
              <select
                value={missionId}
                onChange={(e) => setMissionId(e.target.value)}
                className="glass-button w-full px-4 py-2 rounded-lg"
              >
                <option value="">Aucune mission</option>
                {missions.map(mission => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title} - {mission.client}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client *
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className={`glass-button w-full px-4 py-2 rounded-lg ${errors.client ? 'border-red-500' : ''}`}
              required
            />
            {errors.client && (
              <p className="text-red-400 text-xs mt-1">{errors.client}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Adresse client
              </label>
              <textarea
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="glass-button w-full px-4 py-2 rounded-lg"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email client
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="glass-button w-full px-4 py-2 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date d'émission *
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className={`glass-button w-full px-4 py-2 rounded-lg ${errors.issueDate ? 'border-red-500' : ''}`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date d'échéance *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`glass-button w-full px-4 py-2 rounded-lg ${errors.dueDate ? 'border-red-500' : ''}`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="glass-button w-full px-4 py-2 rounded-lg"
              >
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="paid">Payée</option>
                <option value="overdue">En retard</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Articles *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="glass-button px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-500/20 transition-all"
              >
                <Plus size={16} />
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="glass-card p-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-xs text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className={`glass-button w-full px-3 py-2 rounded-lg text-sm ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
                        placeholder="Description de l'article"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Qté</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className={`glass-button w-full px-3 py-2 rounded-lg text-sm ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Prix unit.</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={`glass-button w-full px-3 py-2 rounded-lg text-sm ${errors[`item_${index}_unitPrice`] ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Total</label>
                      <input
                        type="text"
                        value={`${item.total.toFixed(2)} €`}
                        readOnly
                        className="glass-button w-full px-3 py-2 rounded-lg text-sm bg-primary-500/10"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="glass-button p-2 rounded-lg hover:bg-red-500/20 transition-all text-red-300"
                        disabled={items.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Taux de TVA (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="glass-button w-full px-4 py-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-button w-full px-4 py-2 rounded-lg"
              rows={3}
            />
          </div>

          <div className="glass-card p-4 flex justify-end items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Sous-total HT: <span className="text-primary-300 font-semibold">{calculateSubtotal().toFixed(2)} €</span></p>
              {taxRate > 0 && (
                <p className="text-sm text-gray-400">TVA ({taxRate}%): <span className="text-primary-300 font-semibold">{calculateTax().toFixed(2)} €</span></p>
              )}
              <p className="text-lg font-bold text-primary-300 mt-2">Total TTC: {calculateTotal().toFixed(2)} €</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-primary-500/20">
            <button
              type="button"
              onClick={onClose}
              className="glass-button px-6 py-2 rounded-lg hover:bg-gray-500/20 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-dark-300 font-semibold px-6 py-2 rounded-lg glow-blue transition-all"
            >
              {initialData ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;

