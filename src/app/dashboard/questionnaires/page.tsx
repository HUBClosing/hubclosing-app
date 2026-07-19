'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import {
  Plus, X, GripVertical, Trash2, Save, ArrowLeft,
  Type, ListChecks, ToggleLeft, ClipboardList, ChevronDown, ChevronUp,
  Link2, AlertTriangle,
} from 'lucide-react';
import type { QuestionType, Questionnaire, QuestionnaireQuestion } from '@/types/database';

// ============================================================
// Types locaux pour le builder
// ============================================================

interface LocalQuestion {
  id: string;
  tempId: string; // ID local pour le drag & les keys
  question_text: string;
  question_type: QuestionType;
  options: string[];
  is_required: boolean;
  sort_order: number;
  isNew: boolean; // true = pas encore en BDD
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: typeof Type; desc: string }[] = [
  { value: 'text', label: 'Texte libre', icon: Type, desc: 'Réponse ouverte' },
  { value: 'mcq', label: 'QCM', icon: ListChecks, desc: 'Choix multiples' },
  { value: 'yesno', label: 'Oui / Non', icon: ToggleLeft, desc: 'Réponse binaire' },
];

// ============================================================
// Composant QuestionEditor
// ============================================================

function QuestionEditor({
  question,
  index,
  totalQuestions,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  question: LocalQuestion;
  index: number;
  totalQuestions: number;
  onUpdate: (tempId: string, updates: Partial<LocalQuestion>) => void;
  onRemove: (tempId: string) => void;
  onMoveUp: (tempId: string) => void;
  onMoveDown: (tempId: string) => void;
}) {
  const addOption = () => {
    onUpdate(question.tempId, { options: [...question.options, ''] });
  };

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[idx] = value;
    onUpdate(question.tempId, { options: newOptions });
  };

  const removeOption = (idx: number) => {
    if (question.options.length <= 2) return;
    onUpdate(question.tempId, { options: question.options.filter((_, i) => i !== idx) });
  };

  const typeConfig = QUESTION_TYPES.find(t => t.value === question.question_type);
  const TypeIcon = typeConfig?.icon || Type;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Grip + numéro */}
          <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
            <GripVertical className="h-4 w-4 text-gray-300" />
            <span className="text-xs text-gray-400 font-medium">{index + 1}</span>
          </div>

          <div className="flex-1 space-y-3">
            {/* Header : type + actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TypeIcon className="h-4 w-4 text-brand-amber" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {typeConfig?.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onMoveUp(question.tempId)}
                  disabled={index === 0}
                  className="p-1 rounded text-gray-400 hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(question.tempId)}
                  disabled={index === totalQuestions - 1}
                  className="p-1 rounded text-gray-400 hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(question.tempId)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Texte de la question */}
            <input
              type="text"
              value={question.question_text}
              onChange={(e) => onUpdate(question.tempId, { question_text: e.target.value })}
              placeholder="Saisissez votre question..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/20 font-medium"
            />

            {/* Options QCM */}
            {question.question_type === 'mcq' && (
              <div className="space-y-2 pl-2 border-l-2 border-brand-amber/20">
                {question.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 block rounded-lg border border-gray-200 px-3 py-1.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/20"
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-1 text-gray-300 hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-xs text-brand-dark hover:text-brand-amber transition-colors font-medium pl-6"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une option
                </button>
              </div>
            )}

            {/* Oui/Non preview */}
            {question.question_type === 'yesno' && (
              <div className="flex gap-2 pl-2">
                <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-200">Oui</span>
                <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">Non</span>
              </div>
            )}

            {/* Toggle obligatoire */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={question.is_required}
                onChange={(e) => onUpdate(question.tempId, { is_required: e.target.checked })}
                className="rounded border-gray-300 text-brand-amber focus:ring-brand-amber/20"
              />
              <span className="text-xs text-gray-500">Obligatoire</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Page principale — Liste + Builder
// ============================================================

export default function QuestionnairesPage() {
  const router = useRouter();
  const supabase = createClient();

  // State : mode liste ou édition
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // État du questionnaire en cours d'édition
  const [editId, setEditId] = useState<string | null>(null); // null = création
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);

  // Charger la liste
  const loadQuestionnaires = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('questionnaires')
      .select('*, questionnaire_questions(count)')
      .order('created_at', { ascending: false });
    setQuestionnaires((data || []) as Questionnaire[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadQuestionnaires();
  }, [loadQuestionnaires]);

  // Ouvrir le builder pour créer
  const startNew = () => {
    setEditId(null);
    setTitle('');
    setDescription('');
    setQuestions([]);
    setError('');
    setMode('edit');
  };

  // Ouvrir le builder pour éditer
  const startEdit = async (q: Questionnaire) => {
    setEditId(q.id);
    setTitle(q.title);
    setDescription(q.description || '');
    setError('');

    // Charger les questions
    const { data } = await supabase
      .from('questionnaire_questions')
      .select('*')
      .eq('questionnaire_id', q.id)
      .order('sort_order', { ascending: true });

    setQuestions(
      (data || []).map((qq: QuestionnaireQuestion) => ({
        id: qq.id,
        tempId: qq.id,
        question_text: qq.question_text,
        question_type: qq.question_type,
        options: qq.options || [],
        is_required: qq.is_required,
        sort_order: qq.sort_order,
        isNew: false,
      }))
    );
    setMode('edit');
  };

  // Ajouter une question
  const addQuestion = (type: QuestionType) => {
    const tempId = `new_${Date.now()}`;
    setQuestions(prev => [
      ...prev,
      {
        id: '',
        tempId,
        question_text: '',
        question_type: type,
        options: type === 'mcq' ? ['', ''] : [],
        is_required: true,
        sort_order: prev.length,
        isNew: true,
      },
    ]);
  };

  const updateQuestion = (tempId: string, updates: Partial<LocalQuestion>) => {
    setQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, ...updates } : q));
  };

  const removeQuestion = (tempId: string) => {
    setQuestions(prev => prev.filter(q => q.tempId !== tempId));
  };

  const moveQuestionUp = (tempId: string) => {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.tempId === tempId);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  };

  const moveQuestionDown = (tempId: string) => {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.tempId === tempId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  // Sauvegarder le questionnaire
  const handleSave = async () => {
    setSaving(true);
    setError('');

    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      setSaving(false);
      return;
    }

    if (questions.length === 0) {
      setError('Ajoutez au moins une question.');
      setSaving(false);
      return;
    }

    const emptyQuestions = questions.filter(q => !q.question_text.trim());
    if (emptyQuestions.length > 0) {
      setError('Toutes les questions doivent avoir un texte.');
      setSaving(false);
      return;
    }

    const invalidMcq = questions.filter(
      q => q.question_type === 'mcq' && q.options.some(o => !o.trim())
    );
    if (invalidMcq.length > 0) {
      setError('Toutes les options QCM doivent être remplies.');
      setSaving(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non connecté'); setSaving(false); return; }

    let questionnaireId = editId;

    if (editId) {
      // Update existant
      const { error: updateErr } = await supabase
        .from('questionnaires')
        .update({ title: title.trim(), description: description.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', editId);

      if (updateErr) { setError(updateErr.message); setSaving(false); return; }

      // Supprimer les anciennes questions et recréer
      await supabase.from('questionnaire_questions').delete().eq('questionnaire_id', editId);
    } else {
      // Créer le questionnaire
      const { data: newQ, error: insertErr } = await supabase
        .from('questionnaires')
        .insert({
          recruiter_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
        })
        .select('id')
        .single();

      if (insertErr || !newQ) {
        setError(insertErr?.message || 'Erreur lors de la création');
        setSaving(false);
        return;
      }
      questionnaireId = newQ.id;
    }

    // Insérer les questions
    const questionsToInsert = questions.map((q, idx) => ({
      questionnaire_id: questionnaireId,
      question_text: q.question_text.trim(),
      question_type: q.question_type,
      options: q.question_type === 'mcq' ? q.options.filter(o => o.trim()) : [],
      is_required: q.is_required,
      sort_order: idx,
    }));

    const { error: qInsertErr } = await supabase
      .from('questionnaire_questions')
      .insert(questionsToInsert);

    if (qInsertErr) {
      setError(qInsertErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setMode('list');
    loadQuestionnaires();
  };

  // Supprimer un questionnaire
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce questionnaire ? Les réponses existantes seront conservées.')) return;
    await supabase.from('questionnaires').delete().eq('id', id);
    loadQuestionnaires();
  };

  // ============================================================
  // Rendu — Mode Liste
  // ============================================================

  if (mode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Questionnaires</h1>
            <p className="text-gray-500 mt-1">
              Créez des questionnaires personnalisés pour qualifier vos candidats
            </p>
          </div>
          <Button onClick={startNew} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nouveau questionnaire
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : questionnaires.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun questionnaire</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Créez votre premier questionnaire pour qualifier les candidats qui postulent à vos offres.
              </p>
              <Button onClick={startNew} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Créer mon premier questionnaire
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questionnaires.map((q) => {
              const questionCount = (q as Record<string, unknown>).questionnaire_questions as { count: number }[] | undefined;
              const count = questionCount?.[0]?.count || 0;
              return (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-brand-dark truncate">{q.title}</h3>
                        {q.description && (
                          <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{q.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {count} question{count !== 1 ? 's' : ''} &middot; Créé le {new Date(q.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(q)}
                          className="text-sm font-medium text-brand-dark bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Rendu — Mode Édition / Création (Builder)
  // ============================================================

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => setMode('list')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux questionnaires
        </button>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">
          {editId ? 'Modifier le questionnaire' : 'Nouveau questionnaire'}
        </h1>
        <p className="text-gray-500 mt-1">
          Construisez votre questionnaire question par question. Il sera envoyé aux candidats après leur candidature.
        </p>
      </div>

      {/* Infos du questionnaire */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-amber" />
            Informations
          </h2>
          <Input
            label="Titre du questionnaire"
            placeholder="Ex : Questionnaire closer immobilier"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            label="Description (optionnel)"
            placeholder="Décrivez l'objectif de ce questionnaire..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Liste des questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-brand-dark">
            Questions ({questions.length})
          </h2>
        </div>

        {questions.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-400 text-sm">
                Ajoutez votre première question ci-dessous
              </p>
            </CardContent>
          </Card>
        )}

        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.tempId}
            question={q}
            index={idx}
            totalQuestions={questions.length}
            onUpdate={updateQuestion}
            onRemove={removeQuestion}
            onMoveUp={moveQuestionUp}
            onMoveDown={moveQuestionDown}
          />
        ))}
      </div>

      {/* Boutons d'ajout */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500 mb-3">Ajouter une question :</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {QUESTION_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => addQuestion(type.value)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:border-brand-amber hover:bg-brand-amber/5 transition-all text-left"
                >
                  <Icon className="h-4 w-4 text-brand-amber shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-brand-dark block">{type.label}</span>
                    <span className="text-xs text-gray-400">{type.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} isLoading={saving} className="flex-1" size="lg">
          <Save className="h-4 w-4 mr-2" /> {editId ? 'Enregistrer les modifications' : 'Créer le questionnaire'}
        </Button>
        <Button variant="secondary" size="lg" onClick={() => setMode('list')}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
