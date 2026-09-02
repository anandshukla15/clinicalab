import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function DisclaimerBanner({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
        <p>
          <strong>Medical Notice:</strong> For informational/educational use only. Always consult a healthcare professional for clinical decisions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl border-y border-r border-amber-500/20 my-4 text-xs text-amber-200/90 leading-relaxed shadow-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
            Important Medical Disclaimer
          </h4>
          <p>
            This tool is for <strong>educational and informational purposes only</strong> and does <strong>not</strong> provide a medical diagnosis.
            Laboratory reference ranges may vary by testing laboratory, method, age, sex, and individual clinical history.
            Laboratory values should never be interpreted in isolation without qualified healthcare supervision.
            If you have critical abnormal findings or are experiencing symptoms, please consult a qualified physician or seek prompt medical care.
          </p>
        </div>
      </div>
    </div>
  );
}
