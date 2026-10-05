export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-slate-200 text-center">
        <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
          🏑
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          KBC Hallenhockey
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Turnierverwaltung für mU14 & wU14
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Setup & SDD erfolgreich initialisiert
        </div>
      </div>
    </main>
  )
}
