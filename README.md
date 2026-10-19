# ❄️ MG Climatização & Elétrica Residencial

Sistema web profissional e responsivo para gestão completa de serviços de instalação, higienização e manutenção de ar-condicionado e elétrica residencial/comercial.

Desenvolvido com foco **mobile-first** para técnicos em campo em Manaus/AM, com painel gerencial desktop, persistência no Supabase e emissão de laudos técnicos em conformidade com a legislação federal brasileira (**Lei nº 13.589/2018 - PMOC**).

---

## 🚀 Funcionalidades Principais

1. **Painel Operacional (Dashboard):**
   - Indicadores em tempo real: atendimentos do dia, ordens em andamento, propostas pendentes, faturamento mensal e clientes ativos.
   - Radar de higienização preventiva com alertas antecipados.
   - Alerta dinâmico de insumos em estoque crítico.

2. **Agenda Técnica & Rotas:**
   - Programação técnica diária e semanal com horários e status.
   - Abertura de rotas direto no Google Maps.
   - Confirmação de horário com cliente via WhatsApp com 1 clique.
   - Conversão de agendamento em Ordem de Serviço.

3. **Ordens de Serviço (O.S.):**
   - Código único sequencial (`OS-2026-XXXX`).
   - Checklists técnicos interativos para Climatização e Elétrica.
   - Galeria fotográfica de **Antes e Depois** com envio da câmera do celular.
   - Recálculo automático do ciclo preventivo de higienização do aparelho ao concluir o serviço.

4. **Orçamentos Comerciais:**
   - Propostas técnicas numeradas (`ORC-2026-XXXX`).
   - Prazos de validade ágeis (7, 15 ou 30 dias).
   - Conversão de orçamento aprovado em O.S. sem redigitação.
   - Envio de proposta no WhatsApp e impressão em folha formal timbrada A4.

5. **Central de Lembretes Preventivos:**
   - Sincronização automática com a base de aparelhos cadastrados.
   - Radar categorizado por vencidos, próximos 30 dias e contatados.
   - Mensagens persuasivas no WhatsApp e agendamento instantâneo.

6. **Estoque & Materiais:**
   - Controle de gases refrigerantes (R410A, R32), bactericidas concentrados, tubos de cobre, disjuntores e conectores.
   - Alertas de nível mínimo (`quantity <= min_stock`).
   - Avaliação financeira do estoque a preço de custo vs. venda.
   - Histórico de entradas (compras), saídas e balanços.
   - Catálogo de fornecedores e distribuidoras com link direto para o WhatsApp.

7. **Fluxo de Caixa & Financeiro:**
   - Controle de receitas, despesas operacionais (combustível, ferramentas, refeição) e saldo em caixa.
   - Exclusão e auditoria de lançamentos com modal de confirmação.
   - Sincronização automática com pagamentos de O.S.

8. **Certificados de Garantia:**
   - Emissão de termos de garantia formal timbrados (`GAR-2026-XXXX`).
   - Prazos de 30 a 90 dias com cobertura e exclusões legais.
   - Linhas para assinatura dupla e compartilhamento via WhatsApp.

9. **PMOC Legal (Lei Federal 13.589/2018):**
   - Plano de Manutenção, Operação e Controle obrigatório para comércios, clínicas e edifícios climatizados.
   - Inventário por TAG de cada aparelho, cálculo de carga térmica total em BTUs e rotinas operacionais (ANVISA RE nº 09/2003 e Portaria MS nº 3.523/1998).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Estilização:** Tailwind CSS v4, Lucide React (100% ícones SVG)
- **Banco de Dados:** Supabase PostgreSQL com Row Level Security (RLS)
- **Design System:** Paleta institucional Azul Royal Cobalto (`#0754D8`), Azul Marinho (`#103778`), Azul Gelo (`#EAF3FF`) e Cinza Grafite (`#263447`)

---

## ⚙️ Como Executar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/MatheusLobo007/mg-climatizacao.git
   cd mg-climatizacao
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie o arquivo `.env.local` baseado no `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

5. **Compilar para produção:**
   ```bash
   npm run build
   ```

---

## 📄 Licença

Projeto desenvolvido sob medida para **MG Climatização & Elétrica**. Todos os direitos reservados.
