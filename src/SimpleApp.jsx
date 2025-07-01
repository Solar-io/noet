import React, { useState } from "react";
import { FileText, Plus, Settings, LogOut } from "lucide-react";

const SimpleNoetApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Noet</h1>
            <p className="text-gray-600">Simple login test</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
          >
            Login (Test)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="w-64 bg-gray-50 border-r border-gray-200">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Noet</h2>
          <p className="text-gray-600">Simple Version</p>
        </div>
      </div>
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold">Notes</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="text-center text-gray-500">
            <p>Simple note app working!</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-slate-500 bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <FileText size={40} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">
            Simple App Working
          </h3>
          <p className="text-slate-600 mb-6">
            If you can see this, the basic React app is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleNoetApp;
