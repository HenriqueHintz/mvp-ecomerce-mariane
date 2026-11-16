import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  Phone,
  ShieldCheck,
  Award,
  Truck,
  CreditCard,
  MessageCircle,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sobre a Loja — Mariane Cosméticos",
  description:
    "Conheça a história, a curadoria de cosméticos profissionais e a revenda oficial Madressenza da Mariane Cosméticos em Lages – SC.",
  alternates: {
    canonical: `${SITE_URL}/sobre`,
  },
  openGraph: {
    title: "Sobre a Mariane Cosméticos — Lages – SC",
    description:
      "Revendedora Oficial Madressenza e especialista em cosméticos profissionais e cronograma capilar em Lages – SC.",
    url: `${SITE_URL}/sobre`,
    siteName: "Mariane Cosméticos",
    locale: "pt_BR",
    type: "website",
  },
};

export default function SobrePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:py-12 space-y-8 md:space-y-12">
      {/* Cabeçalho Institucional */}
      <div className="space-y-2.5 md:space-y-3 border-b border-silk-200 pb-5 md:pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold md:font-bold uppercase tracking-wider md:tracking-widest text-marina-700 md:text-marina-600">
          <Sparkles className="w-4 h-4 shrink-0 text-brand-accent" aria-hidden="true" />
          <span>Institucional · Mariane Cosméticos</span>
        </div>
        <h1 className="font-serif text-[28px] leading-tight md:text-4xl text-onyx-950 font-normal">
          Sobre a Mariane Cosméticos
        </h1>
        <p className="text-[15px] md:text-base text-onyx-700 leading-relaxed italic font-serif">
          &ldquo;Linda é a mulher que bem se quer&rdquo;
        </p>
      </div>

      {/* Destaques em Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-silk-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-marina-50 text-marina-700 flex items-center justify-center">
            <Award className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-onyx-950">Revendedora Oficial Madressenza</h2>
          <p className="text-xs text-onyx-700 leading-relaxed">
            Perfumaria de ambiente refinada, difusores, sabonetes artesanais e fragrâncias marcantes com garantia de procedência.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-silk-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-brand-accent flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-onyx-950">Cosméticos Profissionais 100% Originais</h2>
          <p className="text-xs text-onyx-700 leading-relaxed">
            Curadoria especializada em cronograma capilar com marcas renomadas como Wella, L&apos;Oréal, Truss, Braé, Lola e Amend.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-silk-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-dark flex items-center justify-center">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-onyx-950">Presença Física em Lages – SC</h2>
          <p className="text-xs text-onyx-700 leading-relaxed">
            Atendimento acolhedor na Rua Blumenau, Nº 623, com opção de retirada em loja física sem custo de frete.
          </p>
        </div>
      </div>

      {/* Conteúdo Principal — História e Propósito */}
      <section className="space-y-4 text-onyx-800 text-[15px] leading-relaxed">
        <h2 className="font-serif text-2xl text-onyx-950 font-semibold pt-2">
          Nossa História &amp; Vocação
        </h2>
        <p>
          A <strong>Mariane Cosméticos</strong> nasceu do desejo profundo de aproximar o cuidado capilar de alta performance e a perfumaria fina das pessoas que valorizam autenticidade e bem-estar. Sob o lema inspirador <em>&ldquo;Linda é a mulher que bem se quer&rdquo;</em>, acreditamos que o autocuidado diário é uma celebração de autoestima, saúde e identidade.
        </p>
        <p>
          Fundada em Lages, no coração da Serra Catarinense [CONFIRMAR] (ano de fundação da loja física em Lages), sob a idealização de [CONFIRMAR] (nome da fundadora / responsável técnica), a loja consolidou-se como um ponto de referência local para cabeleireiros, profissionais da beleza e clientes exigentes que buscam fórmulas legítimas de salão para tratamento em casa.
        </p>
        <p>
          Ao longo de sua trajetória [CONFIRMAR] (marco de expansão e histórico de transição para o comércio digital), a Mariane Cosméticos preservou aquilo que a torna única: o atendimento humanizado, a orientação técnica paciente e a rigorosa seleção de produtos enviados sempre com lacre de fábrica e nota fiscal.
        </p>
      </section>

      {/* Curadoria de Marcas */}
      <section className="space-y-4 text-onyx-800 text-[15px] leading-relaxed">
        <h2 className="font-serif text-2xl text-onyx-950 font-semibold pt-2">
          Curadoria Exclusiva: Madressenza &amp; Linhas Profissionais
        </h2>
        <p>
          Temos o privilégio de ser <strong>Revendedora Oficial Madressenza</strong>, uma das marcas mais prestigiadas do Brasil em perfumaria para casa, aromatizadores de ambiente, sabonetes botânicos e linhas corporais inspiradas na elegância da natureza.
        </p>
        <p>
          Em nosso catálogo capilar, dedicamos atenção especial ao <strong>cronograma capilar</strong> (hidratação, nutrição e reconstrução), trabalhando exclusivamente com marcas consagradas no circuito internacional e nacional:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-sm">
          <li className="flex items-center gap-2 p-2.5 rounded-xl bg-silk-50 border border-silk-200">
            <span className="w-2 h-2 rounded-full bg-marina-700" />
            <span><strong>Madressenza:</strong> Perfumaria de ambiente e saboaria fina</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-xl bg-silk-50 border border-silk-200">
            <span className="w-2 h-2 rounded-full bg-marina-700" />
            <span><strong>Wella Profissional:</strong> Nutrição e reconstrução de salão</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-xl bg-silk-50 border border-silk-200">
            <span className="w-2 h-2 rounded-full bg-marina-700" />
            <span><strong>L&apos;Oréal Professionnel:</strong> Tecnologia avançada em tratamento</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-xl bg-silk-50 border border-silk-200">
            <span className="w-2 h-2 rounded-full bg-marina-700" />
            <span><strong>Truss &amp; Braé:</strong> Alta performance e reparação capilar</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-xl bg-silk-50 border border-silk-200">
            <span className="w-2 h-2 rounded-full bg-marina-700" />
            <span><strong>Lola Cosmetics:</strong> Fórmulas veganas e tratamentos intensivos</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-xl bg-silk-50 border border-silk-200">
            <span className="w-2 h-2 rounded-full bg-marina-700" />
            <span><strong>Amend Cosméticos:</strong> Especialista em cuidados específicos</span>
          </li>
        </ul>
      </section>

      {/* Compromissos e Facilidades */}
      <section className="bg-silk-50 rounded-2xl p-6 border border-silk-200 space-y-4">
        <h2 className="font-serif text-xl font-semibold text-onyx-950 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-marina-700" />
          <span>Nossos Compromissos com Você</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-onyx-700">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-marina-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-onyx-950">Frete Grátis acima de R$ 199</strong>
              <span>Envio seguro para todo o território nacional ou retirada imediata na loja física.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-marina-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-onyx-950">Condições Transparentes</strong>
              <span>Até 10x sem juros no cartão ou 5% de desconto à vista via PIX.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-marina-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-onyx-950">Horários de Atendimento</strong>
              <span>Segunda a Sexta das 09h às 18h30 | Sábado das 09h às 13h.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-emerald-dark shrink-0 mt-0.5" />
            <div>
              <strong className="block text-onyx-950">Atendimento Humanizado</strong>
              <span>Converse diretamente com nossa equipe no WhatsApp oficial: (49) 99125-1617.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Localização e Contato */}
      <div className="p-6 rounded-2xl bg-white border border-silk-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-onyx-950">Visite Nossa Loja Física</h3>
          <p className="text-sm text-onyx-700 mt-1">
            Rua Blumenau, Nº 623 — Lages – SC (CEP: 88505-300)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/produtos"
            className="px-4 py-2.5 rounded-xl bg-marina-700 text-white font-semibold text-xs hover:bg-marina-800 transition-colors shadow-xs"
          >
            Ver Catálogo
          </Link>
          <a
            href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20falar%20com%20a%20equipe."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl border border-silk-200 bg-white text-onyx-900 font-semibold text-xs hover:bg-silk-50 transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-dark" />
            <span>Falar no WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
