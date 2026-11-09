import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Copy, Search, Send, FileText } from 'lucide-react';
import { useApi } from '../../context/ApiContext';
import { sound } from '../../services/sound';
import { Ticket } from '../../types';

interface OmbudsmanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: () => void;
}

export const OmbudsmanModal: React.FC<OmbudsmanModalProps> = ({ isOpen, onClose, onTicketCreated }) => {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'create' | 'track'>('create');
  const [nickname, setNickname] = useState('Estudante_' + Math.floor(100 + Math.random() * 900));
  const [course, setCourse] = useState('Secretariado Executivo');
  const [category, setCategory] = useState('Infraestrutura & Salas');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setSubmitting(true);
    try {
      const ticket = await api.createTicket({
        studentNickname: nickname,
        course,
        category,
        subject,
        description,
        priority
      });
      setCreatedTicket(ticket);
      sound.playSuccess();
      if (onTicketCreated) onTicketCreated();
    } catch {
      alert('Erro ao registrar manifestação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    try {
      const allTickets: Ticket[] = await api.getTickets();
      const match = allTickets.find((t: Ticket) => t.id.toLowerCase() === trackingId.trim().toLowerCase());
      if (match) {
        setTrackedTicket(match);
        setNotFound(false);
      } else {
        setTrackedTicket(null);
        setNotFound(true);
      }
    } catch {
      alert('Erro ao consultar protocolo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              Canal Seguro • Anonimato Garantido
            </span>
          </div>
          <h2 className="text-xl font-bold">Da Reclamação à Solução</h2>
          <p className="text-xs text-slate-300 mt-1">
            Espaço confidencial para registrar sugestões, queixas de disciplinas e demandas sem exposição de identidade.
          </p>

          {/* Toggle Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs