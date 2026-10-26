import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from './Card';
import { measureAsyncExecution, delay } from '../../utils/promiseUtils';
import { Layers, Play, CheckCircle2, Cpu, Code2, Globe } from 'lucide-react';

/**
 * BootstrapSyllabusShowcase Component
 * 
 * Demonstrates Key Syllabus Requirements for College Viva:
 * 1. CSS Frameworks: Coexistence of Bootstrap 5 (.alert, .badge, .progress, .row, .col) with Tailwind CSS
 * 2. JavaScript Fundamentals: Custom Promises (new Promise), async/await, and error handling
 * 3. Responsive Layouts: Bootstrap Grid (.row, .col-sm-6) inside a Tailwind flex/grid layout
 * 4. State Management: React useState and dynamic DOM updates
 */
export default function BootstrapSyllabusShowcase() {
  const [isRunningPromise, setIsRunningPromise] = useState(false);
  const [promiseResult, setPromiseResult] = useState(null);

  const handleTestPromise = async () => {
    setIsRunningPromise(true);
    setPromiseResult(null);

    // Demonstrates: JavaScript Promise creation, delay simulation, and async/await measurement
    const res = await measureAsyncExecution(async () => {
      await delay(450); // new Promise((resolve) => setTimeout(resolve, 450))
      return {
        timestamp: new Date().toLocaleTimeString(),
        status: 'Resolved Successfully via ES6 Promise constructor',
      };
    });

    setPromiseResult(res);
    setIsRunningPromise(false);
  };

  return (
    <Card className="border-indigo-100 bg-white">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Syllabus Integration & Tech Stack Verification</span>
        </CardTitle>
        <CardDescription>
          Live demonstration of Bootstrap 5 & Tailwind CSS coexistence, JavaScript Promises, and async/await
        </CardDescription>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Bootstrap Alert Component (.alert, .alert-primary) */}
        <div className="alert alert-primary d-flex align-items-center py-2.5 px-3 mb-3 border-0 rounded-3 text-sm shadow-none" role="alert">
          <Code2 className="w-4 h-4 me-2 text-primary shrink-0" />
          <div>
            <strong>Bootstrap 5 + Tailwind CSS:</strong> Bootstrap alert, progress bar, badges, and responsive grid classes render alongside Tailwind design tokens.
          </div>
        </div>

        {/* Bootstrap Responsive Grid (.row, .col-sm-6) */}
        <div className="row g-3">
          {/* Card 1: Styling Framework Status */}
          <div className="col-12 col-sm-6">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  CSS Frameworks
                </span>
                <span className="badge bg-primary">Active</span>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">
                Tailwind CSS v3 (Utility-first) + Bootstrap v5 (Components)
              </p>
              {/* Bootstrap Badges (.badge) */}
              <div className="flex flex-wrap gap-1.5">
                <span className="badge bg-secondary text-light">.alert</span>
                <span className="badge bg-secondary text-light">.progress</span>
                <span className="badge bg-secondary text-light">.row/.col</span>
                <span className="badge bg-info text-dark">Tailwind Flex/Grid</span>
              </div>
            </div>
          </div>

          {/* Card 2: JS Promises & Async/Await */}
          <div className="col-12 col-sm-6">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  JS Promises & Async/Await
                </span>
                <span className="badge bg-success">Verified</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Evaluate custom <code className="font-mono text-indigo-600">new Promise()</code> resolution and latency.
              </p>
              <button
                type="button"
                onClick={handleTestPromise}
                disabled={isRunningPromise}
                className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1 text-xs"
              >
                <Play className="w-3 h-3" />
                <span>{isRunningPromise ? 'Resolving Promise...' : 'Execute Promise Benchmark'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Promise Execution Result */}
        {promiseResult && (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Promise Resolved:</strong> {promiseResult.result?.status} (Time: {promiseResult.result?.timestamp})
              </span>
            </div>
            <span className="font-mono font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {promiseResult.durationMs}ms
            </span>
          </div>
        )}

        {/* Bootstrap Progress Bar (.progress, .progress-bar) */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>Syllabus Verification Progress</span>
            <span className="font-semibold text-emerald-600">100% Completed</span>
          </div>
          <div className="progress" style={{ height: '7px' }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated bg-success"
              role="progressbar"
              style={{ width: '100%' }}
              aria-valuenow="100"
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
