# GS Company - Frontend Challenge 🚀

Bem-vindo ao desafio técnico para vaga de Junior na **GS Company**!

Este repositório contém um *scaffold* (estrutura inicial) de um projeto Next.js simulando nosso produto principal: um **CRM de Atendimento para WhatsApp**.

## 📝 O Desafio

Sua missão é transformar este esqueleto em um painel funcional de atendimento. Você atuará como se estivesse implementando uma feature real para nossa equipe de suporte.

O foco principal é avaliar sua familiaridade com **React/Next.js**, **TypeScript**, **Gerenciamento de Estado** e consumo de **APIs**.

### O Cenário
Na GS Company, nossos clientes utilizam este painel para responder mensagens de leads e clientes vindas do WhatsApp (API Oficial ou Não-Oficial). A agilidade e a organização são essenciais.

## 🎯 Objetivos (Requisitos Obrigatórios)

Você deve completar os componentes em `src/components/` e a página `src/app/chat/page.tsx` para atingir os seguintes objetivos:

1.  **Listagem de Contatos (`Sidebar`)**:
    *   Consumir a rota `/api/contacts` para listar os usuários.
    *   Exibir Avatar, Nome e a Última Mensagem (se houver).
    *   Implementar um filtro de busca por nome.

2.  **Área de Chat (`ChatWindow`)**:
    *   Ao clicar em um contato na Sidebar, carregar o histórico de mensagens usando `/api/messages?contactId={id}`.
    *   Diferenciar visualmente mensagens enviadas (`outbound`) das recebidas (`inbound`).
    *   Exibir horário da mensagem.

3.  **Envio de Mensagens**:
    *   Implementar o input de texto e botão de enviar.
    *   Ao enviar, fazer um POST para `/api/messages`.
    *   **Importante:** Atualizar a interface imediatamente (Optimistic UI) enquanto a requisição acontece.

## 🌟 Bônus (Diferenciais)

Se quiser se destacar, implemente funcionalidades extras usando as rotas opcionais já criadas:

### 1. Funcionalidades de Chat
- **Templates de Mensagem** (`/api/templates`): Permita selecionar respostas rápidas.
- **Notas Internas** (`/api/notes`): Adicione notas privadas em um contato.
- **Etiquetas/Tags** (`/api/tags`): Categorize contatos (ex: "Cliente VIP", "Suporte").

### 2. Gestão e Dashboard
- **Equipe** (`/api/users`): Mostre quem está online/offline.
- **Filas** (`/api/queues`): Simule transferência de atendimentos entre departamentos.
- **Dashboard** (`/api/analytics`): Crie gráficos com os dados de atendimento.
- **Configurações** (`/api/settings`): Permita editar horário de funcionamento ou mensagens automáticas.

### 3. Marketing
- **Campanhas** (`/api/campaigns`): Liste campanhas de disparo em massa e seus status.

---

## 🛠 Tecnologias Recomendadas

O projeto já está configurado com:
*   [Next.js 16+](https://nextjs.org/) (App Router)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [ESLint](https://eslint.org/)

## 🚀 Como Rodar

1.  Instale as dependências:
    ```bash
    npm install
    ```

2.  Rode o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

3.  Acesse [http://localhost:3000](http://localhost:3000).

## 📦 Estrutura de Arquivos Relevante

*   `src/app/api/`: Rotas simuladas do backend (contatos, mensagens, templates, notes, tags).
*   `src/components/`: Onde você passará a maior parte do tempo.
*   `src/types/`: Definições de tipos (já criadas para ajudar).

## 💡 Dicas

*   **Não se preocupe com design perfeito**, mas a usabilidade é importante.
*   Use `console.log` para entender o formato dos dados retornados pela API.
*   Preste atenção aos tipos no TypeScript. Evite `any`.

Boa sorte! Estamos ansiosos para ver sua solução. 🚀
