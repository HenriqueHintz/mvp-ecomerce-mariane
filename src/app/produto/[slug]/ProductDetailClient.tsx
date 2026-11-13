"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCartActions } from "@/context/CartContext";
import { Product } from "@/db/schema";
import { formatBRL } from "@/lib/pricing";
import {
  ShoppingBag,
  MessageCircle,
  Truck,
  CreditCard,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  Sparkles,
} from "lucide-react";

interface Props {
  product: Product;
  brandName: string;
  categoryName: string;
  imageUrls: string[];
}

export default function ProductDetailClient({
  product,
  brandName,
  categoryName,
  imageUrls,
}: Props) {
  const { addItem } = useCartActions();
  const [selectedImage, setSelectedImage] = useState(imageUrls[0]);
  const [mainImgError, setMainImgError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});
  const [selectedVariation, setSelectedVariation] = useState(
    product.volume || "Tamanho Padrão"
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const hasRealPromo =
    typeof product.promoPrice === "number" &&
    product.promoPrice > 0 &&
    product.promoPrice < product.price;
  const currentPrice = hasRealPromo ? product.promoPrice! : product.price;
  const installments = product.installmentCount || 10;
  const instVal =
    product.installmentValue ||
    Math.round((currentPrice / installments) * 100) / 100;
  const pixPrice = (currentPrice * 0.95).toFixed(2);

  const variations = product.volume ? [product.volume] : ["Tamanho Único"];

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        brandName: brandName,
        price: product.price,
        promoPrice: hasRealPromo ? product.promoPrice : null,
        image: selectedImage,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleWhatsApp = () => {
    const msg = `Olá, Mariane Cosméticos! Gostaria de comprar o produto:\n*${product.name}*\nMarca: ${brandName}\nVariação: ${selectedVariation}\nQtd: ${quantity}x\nPreço: R$ ${(currentPrice * quantity).toFixed(2)} (ou R$ ${(parseFloat(pixPrice) * quantity).toFixed(2)} no PIX)\nLink: https://marianecosmeticos.com.br/produto/${product.slug}`;
    window.open(
      `https://wa.me/5549991251617?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-24 lg:pb-0">
      {/* Galeria Mobile com Swipe */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex snap-x snap-mandatory overflow-x-auto gap-3 pb-2">
          {imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative w-[88vw] max-w-[380px] aspect-square shrink-0 snap-center rounded-2xl overflow-hidden bg-silk-100 border border-silk-200 shadow-sm"
            >
              {!thumbErrors[idx] && url ? (
                <Image
                  src={url}
                  alt={`${product.name} - Foto ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  onError={() => setThumbErrors((prev) => ({ ...prev, [idx]: true }))}
                  className="object-cover"
                  sizes="90vw"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-marina-50 to-silk-100 text-marina-700">
                  <Sparkles className="w-10 h-10 text-marina-500 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-marina-600">
                    {brandName}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        {imageUrls.length > 1 && (
          <p className="text-xs text-onyx-600 text-center mt-1">
            Deslize para ver mais fotos ({imageUrls.length})
          </p>
        )}
      </div>

      {/* Galeria de Fotos Desktop/Tablet com Fallback */}
      <div className="hidden md:block lg:col-span-6 space-y-4">
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-silk-100 border border-silk-200 shadow-lg">
          {!mainImgError && selectedImage ? (
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              onError={() => setMainImgError(true)}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 600px"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-marina-50 to-silk-100 text-marina-700">
              <Sparkles className="w-12 h-12 text-marina-500 mb-3" />
              <span className="text-xs font-bold uppercase tracking-widest text-marina-600">
                {brandName}
              </span>
              <span className="font-serif text-base text-onyx-900 mt-1">
                {product.name}
              </span>
            </div>
          )}
        </div>

        {/* Miniaturas */}
        {imageUrls.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {imageUrls.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedImage(url);
                  setMainImgError(false);
                }}
                className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 ${
                  selectedImage === url
                    ? "border-marina-600 shadow-md scale-105"
                    : "border-silk-200 opacity-75 hover:opacity-100"
                }`}
              >
                {!thumbErrors[idx] ? (
                  <Image
                    src={url}
                    alt={`${product.name} - Miniatura ${idx + 1}`}
                    fill
                    onError={() =>
                      setThumbErrors((prev) => ({ ...prev, [idx]: true }))
                    }
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-marina-50 text-marina-600 text-[10px] font-bold">
                    Foto {idx + 1}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detalhes & Compra */}
      <div className="lg:col-span-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest uppercase text-marina-600 bg-marina-50 px-2.5 py-0.5 rounded-full border border-marina-100">
              {brandName}
            </span>
            <span className="text-xs text-onyx-700/70">{categoryName}</span>
            {product.sku && (
              <span className="text-xs text-onyx-700/60">
                &bull; Cód: {product.sku}
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-onyx-900 leading-tight">
            {product.name}
          </h1>
        </div>

        {/* Bloco de Preço Real */}
        <div className="p-4 sm:p-5 rounded-2xl bg-silk-100 border border-silk-200 space-y-2">
          <div className="flex items-baseline gap-3">
            {hasRealPromo && (
              <span className="text-sm text-onyx-700/60 line-through tabular-nums">
                {formatBRL(product.price)}
              </span>
            )}
            <span className="text-2xl sm:text-3xl font-bold text-onyx-900 tabular-nums">
              {formatBRL(currentPrice)}
            </span>
          </div>

          <p className="text-sm text-emerald-dark font-semibold tabular-nums">
            {formatBRL(Number(pixPrice))} à vista no PIX com 5% de desconto
          </p>

          <p className="text-xs text-onyx-700 tabular-nums">
            ou em até {installments}x de {formatBRL(instVal)} sem juros no
            cartão
          </p>
        </div>

        {/* Variações / Volume */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-onyx-800 block">
            Apresentação / Volume:
          </span>
          <div className="flex flex-wrap gap-2">
            {variations.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedVariation(v)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedVariation === v
                    ? "bg-marina-600 text-white border-marina-600 shadow-sm"
                    : "bg-white text-onyx-800 border-silk-200 hover:border-marina-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de Quantidade & Ações de Compra */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase text-onyx-800">
              Quantidade:
            </span>
            <div className="flex items-center border border-silk-200 rounded-xl bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 text-onyx-700 hover:text-onyx-900 cursor-pointer"
                aria-label="Diminuir quantidade"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-bold text-onyx-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 text-onyx-700 hover:text-onyx-900 cursor-pointer"
                aria-label="Aumentar quantidade"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full bg-onyx-900 hover:bg-marina-600 text-silk-50 hover:text-white py-4 px-6 rounded-2xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500"
            >
              {added ? (
                <Check className="w-4 h-4 text-emerald-whatsapp" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
              <span>
                {added ? "Adicionado ao Carrinho!" : "Adicionar ao Carrinho"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full bg-emerald-whatsapp hover:bg-emerald-dark text-white py-4 px-6 rounded-2xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-whatsapp"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Comprar pelo WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Benefícios Reais */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-silk-200 text-center">
          <div className="p-3 bg-white rounded-xl border border-silk-200">
            <Truck className="w-5 h-5 text-marina-600 mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-onyx-900 block">
              Frete Grátis
            </span>
            <span className="text-[10px] text-onyx-700">
              A partir de R$ 199
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-silk-200">
            <ShieldCheck className="w-5 h-5 text-emerald-whatsapp mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-onyx-900 block">
              100% Original
            </span>
            <span className="text-[10px] text-onyx-700">
              Procedência oficial
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-silk-200">
            <CreditCard className="w-5 h-5 text-marina-600 mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-onyx-900 block">
              Até 10x
            </span>
            <span className="text-[10px] text-onyx-700">
              Sem juros no cartão
            </span>
          </div>
        </div>

        {/* Descrição & Modo de Uso */}
        <div className="pt-6 border-t border-silk-200 space-y-4">
          <div className="border-b border-silk-200">
            <h2 className="font-serif text-lg text-onyx-900 pb-2 border-b-2 border-marina-600 inline-block">
              Descrição do Produto
            </h2>
          </div>
          <div className="text-sm text-onyx-800 leading-relaxed space-y-3">
            <p>{product.description}</p>
          </div>

          {product.howToUse && (
            <div className="p-4 bg-silk-100 rounded-2xl border border-silk-200 space-y-2 mt-4">
              <h3 className="font-serif text-sm font-bold text-onyx-900">
                Modo de Usar Profissional
              </h3>
              <p className="text-xs text-onyx-800 leading-relaxed">
                {product.howToUse}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barra Fixa Inferior no Mobile: Preço + Adicionar à sacola */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-silk-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(26,9,24,0.08)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-xs text-emerald-800 font-semibold tabular-nums">
              {formatBRL(Number(pixPrice))} no PIX
            </span>
            <span className="block text-lg font-bold text-onyx-950 tabular-nums leading-tight">
              {formatBRL(currentPrice * quantity)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className={`min-h-[46px] px-5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0 ${
              added ? "bg-emerald-700 text-white" : "bg-marina-600 hover:bg-marina-700 text-white"
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Adicionado ✓</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Adicionar à sacola</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
