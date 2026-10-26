import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Home, AlertTriangle } from 'lucide-react';

/**
 * NotFoundPage Component
 * 
 * 404 Route fallback.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        The route you are trying to access does not exist in this project management workspace.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
