import React from "react";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade e Proteção de Dados (LGPD)",
  description:
    "Política de Privacidade e conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) da Mariane Cosméticos em Lages – SC.",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3 border-b border-silk-200 pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-marina-600">
          <ShieldCheck className="w-4 h-4" />
          <span>Conformidade LGPD — Lei nº 13.709/2018</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-onyx-950">
          Política de Privacidade
        </h1>
        <p className="text-xs text-onyx-700">
          Última atualização: Novembro de 2026 &bull; Controladora:{" "}
          <strong>Mariane Cosméticos</strong> (Rua Blumenau, Nº 623, Lages – SC,
          CEP 88505-300).
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-silk-200 shadow-luxury-card space-y-6 text-xs sm:text-sm text-onyx-800 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            1. Dados Coletados e Finalidade (Art. 6º, I e III da LGPD)
          </h2>
          <p>
            A <strong>Mariane Cosméticos</strong> coleta estritamente os dados
            pessoais mínimos necessários para a execução de pedidos e
            atendimento solicitados pela titular (Art. 7º, V da LGPD — Execução
            de Contrato):
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Nome completo e telefone/WhatsApp:</strong> identificação
              do pedido e contato direto para confirmação de pagamento e
              entrega.
            </li>
            <li>
              <strong>Endereço e CEP (quando aplicável):</strong> cálculo de
              frete e despacho dos produtos adquiridos.
            </li>
            <li>
              <strong>E-mail (opcional):</strong> envio de comprovantes do
              pedido quando solicitado.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            2. Armazenamento, Segurança e Retenção (Art. 6º, VII e Art. 16 da LGPD)
          </h2>
          <p>
            Os registros de pedidos são armazenados de forma segura e utilizados
            exclusivamente para cumprimento das obrigações comerciais, fiscais e
            de garantia legal (Código de Defesa do Consumidor). Não vendemos nem
            compartilhamos dados pessoais com terceiros para fins publicitários.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            3. Direitos da Titular dos Dados (Art. 18 da LGPD)
          </h2>
          <p>
            A qualquer momento, você pode solicitar a confirmação da existência
            de tratamento, o acesso, a correção de dados incompletos ou a
            eliminação de dados desnecessários entrando em contato pelo nosso
            canal oficial de atendimento e Encarregado de Dados:
          </p>
          <p className="font-semibold text-onyx-950">
            WhatsApp Oficial: +55 (49) 99125-1617 | Endereço físico: Rua
            Blumenau, Nº 623, Lages – SC (CEP: 88505-300).
          </p>
        </section>
      </div>
    </div>
  );
}
