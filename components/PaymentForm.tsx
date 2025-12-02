import React, { useState, useEffect } from 'react';
import { Payment, Invoice } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from './Toast';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  initialData?: Payment | null;
  invoices: Invoice[];
  defaultInvoiceId?: string | null;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ isOpen, onClose, onSave, initialData, invoices, defaultInvoiceId }) => {
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState<'cash' | 'bank_transfer' | 'check' | 'card' | 'other'>('bank_transfer');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'refunded'>('completed');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setInvoiceId(initialData.invoiceId);
      setAmount(initialData.amount);
      setPaymentDate(initialData.paymentDate);
      setMethod(initialData.method);
      setReference(initialData.reference || '');
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    } else {
      setInvoiceId(defaultInvoiceId || '');
      setAmount(0);
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      setMethod('bank_transfer');
      setReference('');
      setStatus('completed');
      setNotes('');
    }
  }, [initialData, defaultInvoiceId, isOpen]);

  useEffect(() => {
    if (invoiceId) {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (invoice) {
        // Calculer le montant restant à payer
        // Pour simplifier, on met le montant total de la facture
        setAmount(invoice.total);
      }
    }
  }, [invoiceId, invoices]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!invoiceId) newErrors.invoiceId = 'La facture est requise';
    if (amount <= 0) newErrors.amount = 'Le montant doit être supérieur à 0';
    if (!paymentDate) newErrors.paymentDate = 'La date de paiement est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    const payment: Payment = {
      id: initialData?.id || crypto.randomUUID(),
      invoiceId,
      amount,
      paymentDate,
      method,
      reference: reference || undefined,
      status,
      notes: notes || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payment);
  };

  if (!isOpen) return null;

  const selectedInvoice = invoices.find(i => i.id === invoiceId);
  const remainingAmount = selectedInvoice ? selectedInvoice.total : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-xl max-w-2xl w-full">
        <div className="sticky top-0 glass-strong border-b border-primary-500/20 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary-300">
            {initialData ? 'Modifier le paiement' : 'Nouveau paiement'}
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg hover:bg-red-500/20 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Facture *
            </label>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className={`glass-button w-full px-4 py-2 rounded-lg ${errors.invoiceId ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Sélectionner une facture</option>
              {invoices.map(invoice => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} - {invoice.client} ({invoice.total.toFixed(2)} €)
                </option>
              ))}
            </select>
            {errors.invoiceId && (
              <p className="text-red-400 text-xs mt-1">{errors.invoiceId}</p>
            )}
            {selectedInvoice && (
              <p className="text-sm text-gray-400 mt-2">
                Montant de la facture: <span className="text-primary-300 font-semibold">{remainingAmount.toFixed(2)} €</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Montant *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className={`glass-button w-full px-4 py-2 rounded-lg ${errors.amount ? 'border-red-500' : ''}`}
                required
              />
              {errors.amount && (
                <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date de paiement *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={`glass-button w-full px-4 py-2 rounded-lg ${errors.paymentDate ? 'border-red-500' : ''}`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Méthode de paiement *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="glass-button w-full px-4 py-2 rounded-lg"
                required
              >
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="card">Carte bancaire</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Statut *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="glass-button w-full px-4 py-2 rounded-lg"
                required
              >
                <option value="pending">En attente</option>
                <option value="completed">Complété</option>
                <option value="failed">Échoué</option>
                <option value="refunded">Remboursé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Référence (numéro de chèque, référence virement, etc.)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="glass-button w-full px-4 py-2 rounded-lg"
              placeholder="Ex: CHQ-12345 ou VIR-2024-001"
            />
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

export default PaymentForm;

