'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface PerformanceData {
  id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  calls_scheduled: number;
  calls_completed: number;
  revenue_collected: number;
  revenue_invoiced: number;
  no_shows: number;
  cancellations: number;
  hos_name: string;
  is_verified: boolean;
  verified_at: string | null;
  verifier_name: string | null;
  candidate_name: string;
}

export default function ValidatePerformancePage() {
  const params = useParams();
  const token = params.token as string;

  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [verifierName, setVerifierName] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/validate-performance/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPerformance(data.performance);
          if (data.performance.is_verified) {
            setValidated(true);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur de chargement');
        setLoading(false);
      });
  }, [token]);

  const handleValidate = async () => {
    setValidating(true);
    const res = await fetch(`/api/validate-performance/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifier_name: verifierName.trim() || null }),
    });
    const data = await res.json();
    setValidating(false);

    if (res.ok) {
      setValidated(true);
    } else {
      setError(data.error || 'Erreur lors de la validation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-[#F05A28] flex items-center justify-center font-bold text-white text-lg">H</div>
            <span className="font-bold text-xl text-gray-900">HUBClosing</span>
          </div>
          <p className="text-gray-500 text-sm">Validation de performance</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Lien invalide</h2>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : validated ? (
            <div className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Performance vérifiée !</h2>
              <p className="text-sm text-gray-500">
                Les performances de {performance?.candidate_name} pour l&apos;événement &quot;{performance?.event_name}&quot; sont maintenant validées.
              </p>
              <p className="text-sm text-gray-400 mt-4">Vous pouvez fermer cette page.</p>
            </div>
          ) : performance ? (
            <div>
              {/* Entête */}
              <div className="p-6 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Demande de validation de</p>
                <p className="text-lg font-semibold text-gray-900">{performance.candidate_name}</p>
              </div>

              {/* Données */}
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Événement</p>
                    <p className="font-medium text-gray-900">{performance.event_name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-medium text-gray-900">{performance.event_type}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{new Date(performance.event_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">HOS</p>
                    <p className="font-medium text-gray-900">{performance.hos_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600">Calls agenda</p>
                    <p className="text-xl font-bold text-blue-700">{performance.calls_scheduled}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600">Calls pris</p>
                    <p className="text-xl font-bold text-blue-700">{performance.calls_completed}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600">CA encaissé</p>
                    <p className="text-xl font-bold text-green-700">{Number(performance.revenue_collected).toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600">CA facturé</p>
                    <p className="text-xl font-bold text-green-700">{Number(performance.revenue_invoiced).toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-orange-600">No-shows</p>
                    <p className="text-xl font-bold text-orange-700">{performance.no_shows}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-orange-600">Annulations</p>
                    <p className="text-xl font-bold text-orange-700">{performance.cancellations}</p>
                  </div>
                </div>
              </div>

              {/* Validation */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    En validant, vous confirmez que les données ci-dessus correspondent bien aux performances réalisées.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Votre nom (optionnel)
                  </label>
                  <input
                    value={verifierName}
                    onChange={(e) => setVerifierName(e.target.value)}
                    placeholder="Nom du validateur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={handleValidate}
                  disabled={validating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                  Valider ces performances
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} HUBClosing — La marketplace des closers
        </p>
      </div>
    </div>
  );
}
