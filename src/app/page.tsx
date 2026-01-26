import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Hero Section */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide mb-4">
            PROCESSO SELETIVO &bull; JUNIOR
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            GS Company <span className="text-blue-600">Tech Challenge</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Bem-vindo ao seu teste técnico. Você irá construir um <strong>CRM de Atendimento para WhatsApp</strong> simulado. Queremos ver sua habilidade com React, TypeScript e consumo de APIs.
          </p>
          
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
        {/* Passos */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">1</span>
            Sua Missão
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              title="Listar Contatos" 
              description="Consuma a API para exibir a lista de contatos na Sidebar. Mostre avatar, nome e status."
              icon="👥"
            />
            <Card 
              title="Histórico de Mensagens" 
              description="Ao clicar em um contato, carregue as mensagens dele na janela principal. Diferencie enviadas de recebidas."
              icon="💬"
            />
            <Card 
              title="Enviar Mensagens" 
              description="Implemente o input para enviar novas mensagens. Use Optimistic UI para feedback instantâneo."
              icon="✈️"
            />
          </div>
        </section>

        {/* Rotas de API */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm">2</span>
            Recursos Disponíveis (API)
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
               Rotas do Backend (Simulado)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-2 border-b border-gray-100 pb-1">Principais & Recursos</h4>
                <ul className="space-y-2">
                  <ApiRoute method="GET" path="/api/contacts" desc="Lista de contatos" />
                  <ApiRoute method="GET" path="/api/messages" desc="Mensagens do chat" />
                  <ApiRoute method="GET" path="/api/templates" desc="Templates de resposta" />
                  <ApiRoute method="GET" path="/api/notes" desc="Notas internas" />
                  <ApiRoute method="GET" path="/api/tags" desc="Tags de clientes" />
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-2 border-b border-gray-100 pb-1">Gestão & Marketing</h4>
                <ul className="space-y-2">
                  <ApiRoute method="GET" path="/api/users" desc="Membros da equipe" />
                  <ApiRoute method="GET" path="/api/queues" desc="Filas de atendimento" />
                  <ApiRoute method="GET" path="/api/settings" desc="Configurações gerais" />
                  <ApiRoute method="GET" path="/api/campaigns" desc="Campanhas de marketing" />
                  <ApiRoute method="GET" path="/api/analytics" desc="Dados para dashboard" />
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Dicas */}
        <section className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-blue-900 mb-4">💡 Dicas do Tech Lead</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>O código atual é apenas um esqueleto. <strong>Você pode (e deve) alterar</strong> os arquivos em <code>src/components</code>.</li>
            <li>Use <code>console.log</code> para inspecionar o retorno das APIs antes de começar.</li>
            <li>Não se esqueça de tipar os estados com as interfaces de <code>src/types</code>.</li>
            <li>Tente impressionar na UX: loadings, estados vazios e transições contam pontos.</li>
          </ul>
        </section>

        {/* CTA Final */}
        <section className="text-center py-8">
          <Link 
            href="/chat" 
            className="inline-block bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            🚀 Iniciar Aplicação Agora
          </Link>
          <p className="mt-4 text-gray-500 text-sm">Pronto para o desafio? Boa sorte!</p>
        </section>

      </main>

      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="max-w-5xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p className="mb-2">&copy; {new Date().getFullYear()} GS Company &bull; Processo Seletivo</p>
          <p>Feito com Next.js e Tailwind</p>
        </div>
      </footer>
    </div>
  );
}

function Card({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ApiRoute({ method, path, desc }: { method: string, path: string, desc: string }) {
  const color = method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={`font-mono text-xs px-2 py-0.5 rounded ${color} font-bold min-w-[50px] text-center`}>
        {method}
      </span>
      <div>
        <a href={path} target="_blank" className="font-mono text-gray-800 hover:underline hover:text-blue-600 block">
          {path}
        </a>
        <span className="text-gray-500 text-xs">{desc}</span>
      </div>
    </li>
  );
}
