import React from 'react';

// TODO: Definir props (ex: contato selecionado)
export function ChatWindow() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative">
      {/* Background Pattern opcional estilo WhatsApp */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            {/* TODO: Mostrar info do contato selecionado dinamicamente */}
            <h3 className="font-semibold text-gray-800">Selecione um contato</h3>
            <p className="text-xs text-gray-500">Para começar o atendimento</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto relative z-0">
        {/* TODO: Renderizar mensagens reais */}
        
        {/* Estado vazio bonito */}
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="font-medium text-lg">GS Company Chat</p>
          <p className="text-sm text-gray-400 max-w-xs text-center">
            Selecione uma conversa ao lado para visualizar o histórico e enviar mensagens.
          </p>
          <div className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full mt-4">
            Ambiente de Teste
          </div>
        </div>
      </div>

      {/* Input Area */}
      <footer className="bg-white p-4 z-10">
        <div className="max-w-4xl mx-auto flex gap-4 items-end">
          <div className="flex-1 bg-white border border-gray-300 rounded-2xl flex items-center gap-2 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow shadow-sm">
             <button className="text-gray-400 hover:text-gray-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </button>
             <input 
              type="text" 
              placeholder="Digite uma mensagem..." 
              className="flex-1 py-2 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            />
             <button className="text-gray-400 hover:text-gray-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
               </svg>
             </button>
          </div>
          
          <button className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
