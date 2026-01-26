import React from 'react';

// TODO: Receber lista de contatos como props ou buscar da API
export function Sidebar() {
  return (
    <aside className="w-80 h-full border-r border-gray-200 bg-white flex flex-col shadow-sm z-10">
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Conversas</h2>
          <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded-full">3 ativas</span>
        </div>
        
        {/* TODO: Implementar barra de busca funcional */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar contato..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Lista de Contatos */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* TODO: Listar contatos aqui usando map */}
        
        {/* Placeholder estático para visualização inicial */}
        <div className="divide-y divide-gray-50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 items-center group">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
              </div>
            </div>
          ))}
          
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              Carregando contatos...
            </p>
            <p className="text-xs text-gray-400 mt-1">
              (Implemente a busca na API)
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer da Sidebar (Opcional) */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-400">
        GS Company CRM v1.0
      </div>
    </aside>
  );
}
