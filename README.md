# Seven Personalizados — Sistema de Gestão & CRM

Sistema completo de gestão comercial, operacional e financeira desenvolvido sob medida para estúdios e gráficas de produtos personalizados, corte a laser e impressão 3D.

---

## 🚀 Como Abrir e Usar

1. **Acesso Direto no Navegador**:
   Basta dar **duplo clique no arquivo `index.html`** localizado na pasta raiz `seven personalizados`. Ele roda direto em qualquer navegador moderno (Chrome, Edge, Firefox, Safari) sem necessidade de instalar dependências.

2. **Hospedagem na Nuvem (Vercel ou Servidor Web)**:
   O sistema já inclui o arquivo `vercel.json` configurado. Você pode colocar no ar gratuitamente pela Vercel em segundos.

---

## 🛠️ Módulos Integrados no Sistema

### 1. 📊 Painel Geral (Dashboard)
* **Indicadores em Tempo Real**: Encomendas em aberto, Receita do mês, Despesas e Saldo operacional.
* **Próximas Entregas**: Calendário com as entregas mais próximas para você não perder prazos.
* **Alertas de Insumos Críticos**: Alerta automático quando qualquer material (filamento, chapa, copo) atinge o nível mínimo de reposição.

### 2. 📇 CRM & Funil de Vendas (Kanban com Drag & Drop)
* **5 Etapas do Funil Comercial**:
  1. *Conversas Iniciais*
  2. *Orçamento Enviado*
  3. *Aguardando Aprovação*
  4. *Fechado / Ganho* 🎉
  5. *Perdido / Arquivado*
* **Arrastar e Soltar**: Mova os cartões de clientes entre as etapas simplesmente arrastando com o mouse.
* **WhatsApp com 1 Clique**: Botão direto para abrir a conversa no WhatsApp do cliente com mensagem de abordagem pronta.
* **Total em Negociação**: Cálculo automático do valor total estimado no funil.

### 3. 📦 Encomendas & Produção
* Controle rigoroso de status: **Fila**, **Em produção**, **Pronto**, **Entregue** e **Cancelada**.
* Tabela de produtos por encomenda com campos de personalização (ex: nome, tema, cores, maquete).
* Cálculo automático de subtotais e valor total do pedido.
* Controle de status de pagamento (**Pendente**, **Parcial / Entrada**, **Pago**).

### 4. 🧱 Estoque de Insumos & Matérias-Primas
* Categorias dedicadas: **Impressão 3D** (Filamentos PLA/PETG/Resinas), **Corte a Laser** (MDF, Acrílicos), **Brindes** (Copos Térmicos Inox, Taças), **Embalagens** e **Papelaria**.
* Controle de quantidade atual vs. estoque mínimo com avisos visuais.
* Cálculo automático da margem de lucro por peça.

### 5. 💰 Financeiro & Fluxo de Caixa
* Registro de despesas categorizadas (Matéria-prima, Embalagem, Manutenção, Custos Fixos, Marketing).
* Gráfico interativo em anel com o demonstrativo de Receitas vs. Despesas do mês.
* Balanço de saldo líquido.

### 6. 📄 Gerador de Propostas Comerciais de Alto Impacto
* Assistente para criação de orçamentos formais estruturados (Cliente, Escopo da Solução, Método de Fabricação, Prazos de Entrega, Investimento e Condições de Pagamento).
* **Live Preview**: Pré-visualização da proposta timbrada e formatada.
* **Impressão / Salvar PDF**: Layout com CSS de impressão otimizado para gerar PDF profissional e enviar aos clientes.

### 7. ⚙️ Configurações do Estúdio
* Edição rápida dos dados da Seven Personalizados (Nome, Slogan, Telefones, WhatsApp comercial, E-mail e Chave Pix).

---

## 📁 Estrutura de Arquivos

```
seven personalizados/
├── index.html          # Ponto de entrada principal do sistema
├── vercel.json         # Configuração para deploy na Vercel
├── README.md           # Documentação do sistema
├── css/
│   └── styles.css      # Design System completo, dark mode e responsivo
└── js/
    ├── storage.js      # Gerenciador de dados (LocalStorage com dados de exemplo)
    ├── crm.js          # Lógica do CRM Kanban e Drag & Drop
    ├── encomendas.js   # Lógica de pedidos e itens de produção
    ├── estoque.js      # Lógica de materiais e alertas
    ├── financeiro.js   # Lógica financeira e gráficos Chart.js
    ├── propostas.js    # Lógica de propostas e impressão PDF
    └── app.js          # Inicialização e orquestração do painel SPA
```
