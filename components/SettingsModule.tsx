
import * as React from 'react';
import { Download, Upload, Trash2, AlertTriangle, HardDrive, RefreshCw, Database } from 'lucide-react';

interface SettingsModuleProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onExport, onImport, onReset }) => {
  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar pb-24 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="border-b border-gray-200 pb-6">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Database className="text-black" size={32} /> Data & Settings
            </h2>
            <p className="text-gray-500 mt-2 text-lg">Manage your local data, backups, and application state.</p>
        </div>

        {/* Data Management Section */}
        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <HardDrive size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Backup & Restore</h3>
                    <p className="text-gray-500 text-sm">Save your data to a JSON file or restore from a previous backup.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={onExport}
                    className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-all group text-left"
                >
                    <div className="bg-gray-100 p-3 rounded-full group-hover:bg-white transition-colors">
                        <Download size={24} className="text-gray-600 group-hover:text-black" />
                    </div>
                    <div>
                        <span className="block font-bold text-gray-900">Export Data</span>
                        <span className="text-xs text-gray-500">Download JSON backup</span>
                    </div>
                </button>

                <label className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-all group text-left cursor-pointer relative">
                    <input type="file" accept=".json" onChange={onImport} className="hidden" />
                    <div className="bg-gray-100 p-3 rounded-full group-hover:bg-white transition-colors">
                        <Upload size={24} className="text-gray-600 group-hover:text-black" />
                    </div>
                    <div>
                        <span className="block font-bold text-gray-900">Import Data</span>
                        <span className="text-xs text-gray-500">Restore from JSON file</span>
                    </div>
                </label>
            </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 border border-red-100 rounded-2xl p-8 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle size={120} className="text-red-500" />
            </div>

            <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="bg-white p-2 rounded-lg text-red-600 shadow-sm">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-red-700">Danger Zone</h3>
                    <p className="text-red-500 text-sm">Irreversible actions. Proceed with caution.</p>
                </div>
            </div>

            <div className="bg-white/50 border border-red-100 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 backdrop-blur-sm">
                <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Trash2 size={18} className="text-red-500"/> Reset Application
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 max-w-md">
                        This will delete <strong>ALL</strong> your tasks, routines, habits, and journal entries from this device. This action cannot be undone.
                    </p>
                </div>
                <button 
                    onClick={onReset}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                >
                    <RefreshCw size={18} /> Reset App
                </button>
            </div>
        </section>

        <div className="text-center text-xs text-gray-400 font-mono pt-8">
            LifeFlow v1.4 &bull; Local Storage Persisted
        </div>

      </div>
    </div>
  );
};
