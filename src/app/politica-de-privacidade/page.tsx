import React from "react";
import type { Metadata } from "next";
import {
  ShieldCheck,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Ban,
  MessageCircle,
} from "lucide-react";
import { STORE_CONFIG } from "@/config/store";
import TableOfContents, { type TocItem } from "@/components/institutional/TableOfContents";
import LegalAccordion from "@/components/institutional/LegalAccordion";
import BackToTopButton from "@/components/institutional/BackToTopButton";

export const metadata: Metadata = {
  title: "Política de Privacidade e Proteção de Dados (LGPD)",
  description:
    "Política de Privacidade e conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD, Art. 9º) da Mariane Cosméticos em Lages – SC.",
};

const TOC_ITEMS: TocItem[] = [
  { id: "sec-finalidade", label: "1. Finalidade e Bases Legais" },
  { id: "sec-operadores", label: "2. Compartilhamento com Operadores" },
  { id: "sec-retencao", label: "3. Segurança e Prazos de Retenção" },
  { id: "sec-direitos", label: "4. Direitos da Titular e DPO" },
];

const LGPD_RIGHTS = [
  { icon: CheckCircle2, label: "Confirmação da existência de tratamento" },
  { icon: Eye, label: "Acesso aos dados pessoais" },
  { icon: Pencil, label: "Correção de dados incompletos ou desatualizados" },
  { icon: Trash2, label: "Anonimização ou eliminação de dados desnecessários" },
  { icon: Share2, label: "Informação sobre compartilhamento" },
  { icon: Ban, label: "Revogação do consentimento de marketing" },
];

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:py-12 space-y-6 md:space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-2.5 md:space-y-3 border-b border-silk-200 pb-5 md:pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold md:font-bold uppercase tracking-wider md:tracking-widest text-marina-700 md:text-marina-600">
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="md:hidden">Privacidade · LGPD</span>
          <span className="hidden md:inline">
            Conformidade LGPD — Lei nº 13.709/2018 (Art. 9º)
          </span>
        </div>
        <h1 className="font-serif text-[26px] leading-tight md:text-4xl text-onyx-950">
          <span className="md:hidden">Política de Privacidade</span>
          <span className="hidden md:inline">
            Política de Privacidade e Proteção de Dados
          </span>
        </h1>
        <p className="text-[13px] md:text-xs text-onyx-700 leading-relaxed">
          Última atualização: Novembro de 2026 &bull; Versão 2.0 &bull; Controladora:{" "}
          <strong>{STORE_CONFIG.legalName}</strong> ({STORE_CONFIG.name} —{" "}
          {STORE_CONFIG.physicalStore.formattedAddress}).
        </p>
      </div>

      {/* MOBILE (< 768px) */}
      <div className="md:hidden space-y-4">
        <TableOfContents items={TOC_ITEMS} />

        <div className="space-y-3">
          <LegalAccordion
            id="sec-finalidade"
            title="1. Finalidade Específica e Bases Legais do Tratamento (Art. 6º, I e III; Art. 7º e Art. 9º, I e II da LGPD)"
            defaultOpen
          >
            <p>
              A <strong>Mariane Cosméticos</strong> coleta e trata estritamente os
              dados pessoais mínimos necessários para cada finalidade informada à
              titular:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Processamento, Cobrança e Entrega do Pedido (Art. 7º, V — Execução de Contrato):</strong>{" "}
                Nome completo, telefone/WhatsApp, endereço de entrega, CEP e e-mail
                opcional são tratados exclusivamente para identificar a compradora,
                calcular o frete, viabilizar o pagamento e entregar os produtos em
                domicílio ou disponibilizá-los para retirada na loja física.
              </li>
              <li>
                <strong>Guarda Fiscal, Tributária e Garantia Legal (Art. 7º, II e VI — Obrigação Legal e Exercício Regular de Direitos):</strong>{" "}
                Os registros financeiros e de itens adquiridos são conservados para
                atendimento ao Código de Defesa do Consumidor e à legislação
                tributária.
              </li>
              <li>
                <strong>Comunicações Promocionais e Cupons (Art. 7º, I e Art. 8º — Consentimento Livre e Granular):</strong>{" "}
                Apenas quando a titular marca voluntariamente a opção desmarcada por
                padrão no checkout, utilizamos seu contato para envio de novidades e
                ofertas, podendo o consentimento ser revogado a qualquer momento.
              </li>
              <li>
                <strong>Prevenção à Fraude e Segurança (Art. 7º, IX e Art. 46 — Legítimo Interesse):</strong>{" "}
                Controle de taxa de requisições por IP (Rate Limiting), chave de
                idempotência e validação criptográfica de notificações de pagamento.
              </li>
            </ul>
          </LegalAccordion>

          <LegalAccordion
            id="sec-operadores"
            title="2. Compartilhamento com Operadores (Art. 9º, V da LGPD)"
          >
            <p>
              Não comercializamos dados pessoais. O compartilhamento ocorre
              estritamente com operadores essenciais à conclusão do pedido:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>WhatsApp (Meta Platforms Inc.):</strong> quando a titular
                opta por confirmar ou concluir o atendimento via WhatsApp oficial (
                <code>5549991251617</code>).
              </li>
              <li>
                <strong>Asaas Gestão Financeira S.A.:</strong> instituição de
                pagamento responsável pela compensação de cobranças via PIX e
                Cartão de Crédito.
              </li>
              <li>
                <strong>ViaCEP:</strong> consulta pública do CEP de 8 dígitos para
                autopreenchimento de logradouro e bairro no checkout (sem envio de
                nome ou telefone).
              </li>
            </ul>
          </LegalAccordion>

          <LegalAccordion
            id="sec-retencao"
            title="3. Segurança, Mascaramento e Prazos de Retenção (Art. 6º, VII; Art. 9º, III e Art. 16 da LGPD)"
          >
            <p>
              O acompanhamento público de pedidos utiliza tokens criptográficos de
              128 bits com mascaramento automático de dados pessoais (exibição
              parcial de nome, telefone e endereço). Os prazos de retenção seguem:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Pedidos concluídos/pagos:</strong> retidos pelo prazo legal
                de <strong>5 anos</strong> (Art. 27 do Código de Defesa do
                Consumidor e Código Tributário Nacional).
              </li>
              <li>
                <strong>Pedidos pendentes não pagos:</strong> a reserva de estoque
                expira em <strong>24 horas</strong> e os dados identificadores de
                pedidos expirados/cancelados sem pagamento são anonimizados após{" "}
                <strong>90 dias</strong>.
              </li>
            </ul>
          </LegalAccordion>

          <LegalAccordion
            id="sec-direitos"
            title="4. Direitos da Titular e Canal do Encarregado (Art. 18, Art. 41 e Res. CD/ANPD nº 18/2024)"
          >
            <p>
              Nos termos do <strong>Art. 18 da LGPD</strong>, a titular pode
              solicitar a qualquer momento e gratuitamente: confirmação da
              existência de tratamento, acesso aos dados, correção de dados
              incompletos ou desatualizados, anonimização/eliminação de dados
              desnecessários, informação sobre compartilhamento e revogação do
              consentimento de marketing.
            </p>
            <p className="font-semibold text-onyx-950">
              Canal Oficial do Controlador e Encarregado de Dados (DPO): WhatsApp
              Oficial +55 (49) 99125-1617 (<code>5549991251617</code>) |
              Atendimento Presencial: Rua Blumenau, Nº 623, Lages – SC (CEP:
              88505-300).
            </p>
          </LegalAccordion>
        </div>

        {/* Card destacado: Seus direitos (LGPD) */}
        <section
          data-whatsapp-card="true"
          className="rounded-2xl border border-marina-200 bg-marina-50/60 p-5 space-y-3.5"
        >
          <h2 className="font-serif text-[19px] leading-snug text-onyx-950">
            Seus direitos (LGPD)
          </h2>
          <ul className="space-y-2">
            {LGPD_RIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-2.5 text-[15px] text-onyx-800 leading-snug"
              >
                <Icon
                  className="w-4 h-4 text-marina-700 shrink-0 mt-1"
                  aria-hidden="true"
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 border-t border-marina-200/70 space-y-2.5 text-sm text-onyx-800">
            <p>
              <strong>Como exercer (DPO):</strong> WhatsApp Oficial{" "}
              <strong>+55 (49) 99125-1617</strong> ou atendimento presencial em{" "}
              <strong>Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)</strong>.
            </p>
            <a
              href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20exercer%20um%20direito%20previsto%20na%20LGPD."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-emerald-whatsapp hover:bg-emerald-dark text-onyx-950 hover:text-white text-[15px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-dark focus-visible:ring-offset-2"
            >
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Falar com o DPO</span>
            </a>
          </div>
        </section>

        <BackToTopButton />
      </div>

      {/* DESKTOP (>= 768px) — Layout intacto */}
      <div className="hidden md:block bg-white p-6 sm:p-8 rounded-3xl border border-silk-200 shadow-luxury-card space-y-6 text-xs sm:text-sm text-onyx-800 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            1. Finalidade Específica e Bases Legais do Tratamento (Art. 6º, I e III; Art. 7º e Art. 9º, I e II da LGPD)
          </h2>
          <p>
            A <strong>Mariane Cosméticos</strong> coleta e trata estritamente os
            dados pessoais mínimos necessários para cada finalidade informada à
            titular:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Processamento, Cobrança e Entrega do Pedido (Art. 7º, V — Execução de Contrato):</strong>{" "}
              Nome completo, telefone/WhatsApp, endereço de entrega, CEP e e-mail
              opcional são tratados exclusivamente para identificar a compradora,
              calcular o frete, viabilizar o pagamento e entregar os produtos em
              domicílio ou disponibilizá-los para retirada na loja física.
            </li>
            <li>
              <strong>Guarda Fiscal, Tributária e Garantia Legal (Art. 7º, II e VI — Obrigação Legal e Exercício Regular de Direitos):</strong>{" "}
              Os registros financeiros e de itens adquiridos são conservados para
              atendimento ao Código de Defesa do Consumidor e à legislação
              tributária.
            </li>
            <li>
              <strong>Comunicações Promocionais e Cupons (Art. 7º, I e Art. 8º — Consentimento Livre e Granular):</strong>{" "}
              Apenas quando a titular marca voluntariamente a opção desmarcada por
              padrão no checkout, utilizamos seu contato para envio de novidades e
              ofertas, podendo o consentimento ser revogado a qualquer momento.
            </li>
            <li>
              <strong>Prevenção à Fraude e Segurança (Art. 7º, IX e Art. 46 — Legítimo Interesse):</strong>{" "}
              Controle de taxa de requisições por IP (Rate Limiting), chave de
              idempotência e validação criptográfica de notificações de pagamento.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            2. Compartilhamento com Operadores (Art. 9º, V da LGPD)
          </h2>
          <p>
            Não comercializamos dados pessoais. O compartilhamento ocorre
            estritamente com operadores essenciais à conclusão do pedido:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>WhatsApp (Meta Platforms Inc.):</strong> quando a titular
              opta por confirmar ou concluir o atendimento via WhatsApp oficial (
              <code>5549991251617</code>).
            </li>
            <li>
              <strong>Asaas Gestão Financeira S.A.:</strong> instituição de
              pagamento responsável pela compensação de cobranças via PIX e
              Cartão de Crédito.
            </li>
            <li>
              <strong>ViaCEP:</strong> consulta pública do CEP de 8 dígitos para
              autopreenchimento de logradouro e bairro no checkout (sem envio de
              nome ou telefone).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            3. Segurança, Mascaramento e Prazos de Retenção (Art. 6º, VII; Art. 9º, III e Art. 16 da LGPD)
          </h2>
          <p>
            O acompanhamento público de pedidos utiliza tokens criptográficos de
            128 bits com mascaramento automático de dados pessoais (exibição
            parcial de nome, telefone e endereço). Os prazos de retenção seguem:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Pedidos concluídos/pagos:</strong> retidos pelo prazo legal
              de <strong>5 anos</strong> (Art. 27 do Código de Defesa do
              Consumidor e Código Tributário Nacional).
            </li>
            <li>
              <strong>Pedidos pendentes não pagos:</strong> a reserva de estoque
              expira em <strong>24 horas</strong> e os dados identificadores de
              pedidos expirados/cancelados sem pagamento são anonimizados após{" "}
              <strong>90 dias</strong>.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            4. Direitos da Titular e Canal do Encarregado (Art. 18, Art. 41 e Res. CD/ANPD nº 18/2024)
          </h2>
          <p>
            Nos termos do <strong>Art. 18 da LGPD</strong>, a titular pode
            solicitar a qualquer momento e gratuitamente: confirmação da
            existência de tratamento, acesso aos dados, correção de dados
            incompletos ou desatualizados, anonimização/eliminação de dados
            desnecessários, informação sobre compartilhamento e revogação do
            consentimento de marketing.
          </p>
          <p className="font-semibold text-onyx-950">
            Canal Oficial do Controlador e Encarregado de Dados (DPO): WhatsApp
            Oficial +55 (49) 99125-1617 (<code>5549991251617</code>) | Atendimento
            Presencial: Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300).
          </p>
        </section>
      </div>
    </div>
  );
}
