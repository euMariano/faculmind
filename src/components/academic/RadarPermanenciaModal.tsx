import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../../services/sound';
import { useApi } from '../../context/ApiContext';

interface RadarPermanenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RadarPermanenciaModal: React.FC<RadarPermanenciaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const api = useApi();
  const [mood, setMood] = useState<'focado' | 'ansioso' | 'exausto' | 'disposto'>('focado');
  const [academicChallenge, setAcademicChallenge] = useState('');
  const [financialChallenge, setFinancialChallenge] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault