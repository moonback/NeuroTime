import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, Mission } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { generateDocumentNumber } from '../services/pdfService';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialData?: Invoice | null;
  missions: Mission[];
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, onSave, initialData, missions }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([]);
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
  const [showMissionSelector, setShowMissionSelector] = useState(false);

  useEffect(() => {
    if (initialData) {
      setInvoiceNumber(initialData.invoiceNumber);
      // Pour les factures existantes, on garde la première mission si elle existe
      setSelectedMissionIds(initialData.missionId ? [initialData.missionId] : []);
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
      setSelectedMissionIds([]);
      setClient('');
      setClientAddress('');
      setClientEmail('');
      setIssueDate(format(new Date(), 'yyyy-MM-dd'));
      setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
      setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
      setTaxRate(0);
      setStatus('draft');
      setNotes('');
      setShowMissionSelector(true);
    }
  }, [initialData, isOpen]);

  // Fonction pour synchroniser les articles avec les missions sélectionnées
  useEffect(() => {
    if (selectedMissionIds.length === 0) {
      // Si aucune mission sélectionnée, ne rien faire (garder les articles manuels)
      return;
    }

    const selectedMissions = missions.filter(m => selectedMissionIds.includes(m.id));
    
    if (selectedMissions.length === 0) return;

    // Déterminer le client (utiliser le premier ou vérifier si tous ont le même)
    const firstMission = selectedMissions[0];
    const allSameClient = selectedMissions.every(m => m.client === firstMission.client);
    
    if (allSameClient && firstMission.client && !client) {
      setClient(firstMission.client);
    }

    // Créer des articles pour chaque mission sélectionnée
    const missionItems: InvoiceItem[] = selectedMissions.map(mission => ({
      description: `${mission.title} - ${mission.location}${mission.description ? ` (${mission.description})` : ''}`,
      quantity: 1,
      unitPrice: mission.totalEarnings,
      total: mission.totalEarnings
    }));

    // Mettre à jour les articles : garder les articles manuels et remplacer les articles de missions
    setItems(prevItems => {
      // Identifier les articles qui correspondent à des missions (pour les remplacer)
      const missionItemDescriptions = new Set(
        selectedMissions.map(m => `${m.title} - ${m.location}`)
      );
      
      // Garder uniquement les articles manuels (ceux qui ne correspondent pas à des missions)
      const existingManualItems = prevItems.filter(item => {
        const isMissionItem = Array.from(missionItemDescriptions).some(desc => 
          item.description.startsWith(desc)
        );
        return !isMissionItem && item.description.trim() !== '';
      });
      
      // Combiner les articles manuels avec les nouveaux articles de missions
      return [...existingManualItems, ...missionItems];
    });
  }, [selectedMissionIds, missions]);

  const handleMissionToggle = (missionId: string) => {
    setSelectedMissionIds(prev => {
      if (prev.includes(missionId)) {
        // Retirer la mission (le useEffect s'occupera de mettre à jour les articles)
        return prev.filter(id => id !== missionId);
      } else {
        // Ajouter la mission (le useEffect s'occupera de mettre à jour les articles)
        return [...prev, missionId];
      }
    });
  };

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
      // Erreurs de validation affichées dans le formulaire
      return;
    }

    const invoice: Invoice = {
      id: initialData?.id || crypto.randomUUID(),
      invoiceNumber,
      missionId: selectedMissionIds.length > 0 ? selectedMissionIds[0] : undefined, // Garder la première pour compatibilité
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
                Missions ({selectedMissionIds.length} sélectionnée{selectedMissionIds.length > 1 ? 's' : ''})
              </label>
              <button
                type="button"
                onClick={() => setShowMissionSelector(!showMissionSelector)}
                className="glass-button w-full px-4 py-2 rounded-lg flex items-center justify-between hover:bg-primary-500/20 transition-all"
              >
                <span>
                  {selectedMissionIds.length > 0 
                    ? `${selectedMissionIds.length} mission${selectedMissionIds.length > 1 ? 's' : ''} sélectionnée${selectedMissionIds.length > 1 ? 's' : ''}`
                    : 'Sélectionner des missions'
                  }
                </span>
                <Plus size={18} className={showMissionSelector ? 'rotate-45' : ''} />
              </button>
            </div>
          </div>

          {showMissionSelector && (
            <div className="glass-card p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-primary-300 mb-3">Sélectionner les missions à facturer</h3>
              <div className="space-y-2">
                {missions.filter(m => m.status === 'completed').length === 0 ? (
                  <p className="text-gray-400 text-sm">Aucune mission terminée disponible</p>
                ) : (
                  missions
                    .filter(m => m.status === 'completed')
                    .map(mission => (
                      <label
                        key={mission.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-500/10 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMissionIds.includes(mission.id)}
                          onChange={() => handleMissionToggle(mission.id)}
                          className="w-4 h-4 rounded border-primary-500 text-primary-500 focus:ring-primary-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-300">{mission.title}</p>
                          <p className="text-xs text-gray-400">
                            {mission.client} • {format(new Date(mission.endTime), 'dd MMM yyyy', { locale: fr })} • {mission.totalEarnings.toFixed(2)} €
                          </p>
                        </div>
                      </label>
                    ))
                )}
              </div>
              {selectedMissionIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-primary-500/20">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMissionIds([]);
                      setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
                      setClient('');
                    }}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              )}
            </div>
          )}

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

