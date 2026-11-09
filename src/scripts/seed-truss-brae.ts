/**
 * Catalog Seeding Script for Missing Brands (Truss & Brae)
 * Milestone: M2 - Catalog Seeding for Missing Brands
 * 
 * Populates products and product_images tables in local.sqlite using Drizzle ORM.
 * Fully idempotent: safe to execute repeatedly without duplicating rows.
 */
import { db, products, productImages, brands } from "../db";
import { inArray } from "drizzle-orm";

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brandId: string;
  categoryId: string;
  price: number;
  promoPrice: number | null;
  installmentCount: number;
  installmentValue: number;
  pixDiscountPercent: number;
  stock: number;
  description: string;
  howToUse: string;
  volume: string;
  rating: number | null;
  reviewCount: number;
  isFeatured: number;
  isBestSeller: number;
  createdAt: string;
}

export interface ImageRecord {
  id: string;
  productId: string;
  url: string;
  isPrimary: number;
  displayOrder: number;
}

export const TRUSS_PRODUCTS: ProductRecord[] = [
  {
    "id": "prod_truss_1",
    "name": "Truss Blond Revolution Finalizador Impermeável 100ml",
    "slug": "truss-blond-revolution-finalizador-100ml",
    "sku": "TRUSS003.1",
    "brandId": "brand_truss",
    "categoryId": "cat_finalizadores",
    "price": 161.41,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 16.14,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Blond Revolution Finalizador Impermeável 100ml ✨ Sobre o Produto O Truss Blond Revolution Finalizador cria um escudo protetor nos fios loiros, descoloridos ou com mechas. Impermeabiliza a fibra, protege contra umidade, raios UV e danos térmicos, realça o brilho e deixa os fios macios e saudáveis por até 5 lavagens. 💎 Benefícios e Resultados Impermeabiliza os fios por até 5 lavagens Protege contra danos térmicos de ferramentas de calor Brilho espelhado e maciez incomparável Neutraliza tons amarelados e preserva a cor Escudo de proteção contra umidade e opacidade 📌",
    "howToUse": "Aplique nos cabelos limpos e úmidos ou secos, distribuindo uniformemente do comprimento às pontas. Não enxágue. Pode ser usado antes de ferramentas térmicas. Evite contato com olhos e couro cabeludo irritado. Uso externo. ❓",
    "volume": "100ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.447Z"
  },
  {
    "id": "prod_truss_2",
    "name": "Truss Blond Revolution Shampoo Antioxidante 300ml",
    "slug": "truss-blond-revolution-shampoo-300ml",
    "sku": "TRUSS006.1",
    "brandId": "brand_truss",
    "categoryId": "cat_shampoo",
    "price": 132.91,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 13.29,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Blond Revolution Shampoo Antioxidante 300ml ✨ Transforme seu loiro em uma obra-prima com o Truss Blond Revolution Shampoo Antioxidante 300ml. Desenvolvido para cabelos loiros, descoloridos e com mechas, este shampoo oferece limpeza eficaz e delicada, preservando a hidratação natural dos fios. Benefícios e Resultados Neutraliza tons amarelados e alaranjados indesejados. Protege contra danos oxidativos e desbotamento precoce. Realça o brilho e a luminosidade do cabelo loiro. Ajuda a manter a cor vibrante por mais tempo. Promove cabelos mais íntegros após descoloração. Fortalece e restaura os fios fragilizados.",
    "howToUse": "Aplique o shampoo nos cabelos molhados, massageando suavemente o couro cabeludo até formar espuma. Deixe agir por 2 minutos e enxágue. Se necessário, repita a aplicação. Use de forma contínua para melhores resultados.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_3",
    "name": "Truss Uso Obrigatório Condicionador Reconstrução Imediata 300ml",
    "slug": "truss-uso-obrigatorio-condicionador-300ml",
    "sku": "TRUSS008.1",
    "brandId": "brand_truss",
    "categoryId": "cat_shampoo",
    "price": 142.41,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 14.24,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Uso Obrigatório Condicionador Reconstrução Imediata 300ml ✨ Sobre o Produto O Condicionador Truss Uso Obrigatório é a solução ideal para cabelos danificados, ressecados e quebradiços. Sua fórmula avançada promove reconstrução imediata, hidratação profunda e proteção contra danos diários, garantindo fios mais fortes e saudáveis desde a primeira aplicação. 💎 Benefícios e Resultados Reconstrução imediata da fibra capilar Desembaraço instantâneo e fácil Hidratação intensa e duradoura Proteção contra frizz e quebra Suavidade e brilho natural Blindagem contra danos externos 📌",
    "howToUse": "Após lavar os cabelos, retire o excesso de água e aplique o condicionador no comprimento e pontas. Massageie suavemente, desembarace os fios e deixe agir por 2 minutos. Enxágue bem. ❓",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_4",
    "name": "Truss Net Mask Mascara Capilar Efeito Teia 30ml",
    "slug": "truss-net-mask-mascara-30ml",
    "sku": "TRUSS007.1",
    "brandId": "brand_truss",
    "categoryId": "cat_tratamento",
    "price": 37.91,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 3.79,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Net Mask Mascara Capilar Efeito Teia 30ml ✨ A Truss Net Mask Máscara 30ml é o tratamento perfeito para cabelos danificados, quebradiços e fragilizados. Sua fórmula inteligente repara a fibra capilar de dentro para fora, devolvendo força, brilho e maciez aos fios. Benefícios e Resultados Repara a estrutura capilar de cabelos danificados e quebradiços Promove reconstrução profunda e hidratação intensa Efeito teia que potencializa a aplicação e penetração dos ativos Controla o frizz e reduz o volume excessivo Deixa os fios mais fortes, elásticos e resistentes Confere brilho radiante e toque sedoso Protege contra danos externos e envelhecimento precoce dos fios",
    "howToUse": "Após lavar os cabelos com shampoo, retire o excesso de água. Coloque uma pequena quantidade da máscara nas mãos e friccione até ativar o efeito teia. Aplique do comprimento às pontas, enluvando mecha a mecha. Deixe agir de 5 a 10 minutos e enxágue bem. Use de 1 a 3 vezes por semana.",
    "volume": "30ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_5",
    "name": "Truss Uso Obrigatório Máscara Reconstrução Imediata 180g",
    "slug": "truss-uso-obrigatorio-mascara-180ml",
    "sku": "TRUSS009.1",
    "brandId": "brand_truss",
    "categoryId": "cat_tratamento",
    "price": 199.41,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 19.94,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Uso Obrigatório Máscara Reconstrução Imediata 180g ✨ Sobre o Produto A Truss Uso Obrigatório Máscara Reconstrução Imediata 180g foi desenvolvida para cabelos danificados e ressecados, oferecendo um tratamento intensivo que alia hidratação profunda e reparação da fibra capilar. Sua fragrância sofisticada e duradoura garante uma experiência sensorial única durante o cuidado diário. 🌟 Benefícios e Resultados Reconstrução imediata da fibra capilar fragilizada Reduz até 87% da quebra com o uso contínuo da linha Promove elasticidade, maciez e flexibilidade Deixa os fios mais fortes e resistentes contra danos Ação antifrizz com brilho natural Reparação intensiva de cabelos quimicamente tratados 💆",
    "howToUse": "Após lavar os cabelos com o Shampoo Uso Obrigatório, retire o excesso de água e aplique a máscara no comprimento e pontas. Massageie mecha a mecha, deixe agir por 5 minutos e enxágue abundantemente. Utilize de 1 a 3 vezes por semana. ❓",
    "volume": "180g",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_6",
    "name": "Truss Uso Obrigatório Spray Reconstrutor 260ml",
    "slug": "truss-uso-obrigatorio-spray-reconstrutor-260ml",
    "sku": "TRUSS013.1",
    "brandId": "brand_truss",
    "categoryId": "cat_tratamento",
    "price": 161.41,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 16.14,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Uso Obrigatório Spray Reconstrutor 260ml ✨ O Truss Uso Obrigatório Spray Reconstrutor é o aliado perfeito para cabelos danificados, ressecados e quebradiços. Sua fórmula evoluída garante tratamento instantâneo, força, maciez e desembaraço, tudo isso com uma fragrância floral frutal sofisticada que dura o dia todo. Benefícios e Resultados Reconstrução imediata da fibra capilar Ultra desembaraço, força e resistência Proteção contra danos e quebra dos fios Controle do frizz e boost de brilho Flexibilidade e elasticidade restauradas Versátil: pode ser usado como leave-in ou condicionante",
    "howToUse": "Borrife de 2 a 3 vezes no comprimento e pontas, mecha a mecha. Utilize após o shampoo e antes do condicionador ou máscara para ação condicionante. Também pode ser usado como leave-in finalizador nos cabelos úmidos ou secos, proporcionando brilho extra e controle do frizz.",
    "volume": "260ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_7",
    "name": "Truss Blond Revolution Máscara Capilar Efeito Teia 180ml",
    "slug": "truss-blond-revolution-mascara-180ml",
    "sku": "TRUSS004.1",
    "brandId": "brand_truss",
    "categoryId": "cat_tratamento",
    "price": 208.91,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 20.89,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Blond Revolution Máscara Capilar Efeito Teia 180ml ✨ Sobre o Produto A Truss Blond Revolution Máscara Capilar atua preenchendo as áreas do fio danificadas pela descoloração. Sua fórmula com aminoácidos repara profundamente, restaura elasticidade e resistência, devolvendo brilho, vitalidade e integridade aos cabelos loiros. 💎 Benefícios e Resultados Reconstrução da fibra capilar fragilizada Preenchimento das áreas danificadas do fio Brilho intenso e cor vibrante Neutraliza tons amarelados Restaura elasticidade e resistência Reduz porosidade e previne quebras 📌",
    "howToUse": "Após lavar os cabelos com shampoo, retire o excesso de água. Aplique uma pequena quantidade da máscara na palma das mãos e pressione as palmas para ativar o efeito \"teia\". Distribua uniformemente no comprimento e pontas do cabelo úmido. Deixe agir de 5 a 10 minutos e enxágue completamente. Finalize como desejar. ❓",
    "volume": "180ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_8",
    "name": "Truss Uso Obrigatório Shampoo Reconstrução Imediata 300ml",
    "slug": "truss-uso-obrigatorio-shampoo-300ml",
    "sku": "TRUSS012.1",
    "brandId": "brand_truss",
    "categoryId": "cat_shampoo",
    "price": 132.91,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 13.29,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Truss Uso Obrigatório Shampoo Reconstrução Imediata 300ml 🌟 Sobre o Produto Experimente a revolução no cuidado capilar com o Truss Uso Obrigatório Shampoo 300ml, desenvolvido para recuperar cabelos danificados e ressecados desde a primeira aplicação. Com uma fórmula exclusiva e fragrância sofisticada, garante limpeza suave, reconstrução imediata e proteção contra os danos diários. Benefícios e Resultados Reconstrução imediata da fibra capilar Hidratação profunda e duradoura Até 87% menos quebra* dos fios Blindagem contra agressões externas Proporciona maciez, elasticidade e flexibilidade Combate o frizz e devolve brilho natural *Com o uso combinado da linha em comparação a shampoo sem agentes condicionantes.",
    "howToUse": "Aplique o shampoo nos cabelos molhados e massageie suavemente o couro cabeludo até formar espuma. Deixe agir por 2 minutos e enxágue bem. Se necessário, reaplique para uma limpeza completa.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_9",
    "name": "Kit Truss Blond Revolution Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml",
    "slug": "truss-blond-revolution-sh-300ml-masc-180ml",
    "sku": "KITTRUSS001.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 371.35,
    "promoPrice": 322.91,
    "installmentCount": 10,
    "installmentValue": 32.29,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml Sobre o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml Conquiste um loiro deslumbrante e livre de tons indesejados com o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml! Essa dupla poderosa é a sua aliada essencial para uma rotina completa de cuidados para cabelos loiros, descoloridos e com mechas. O Shampoo Antioxidante limpa suavemente enquanto neutraliza o amarelado, e a Máscara Efeito Teia hidrata profundamente, sela a cor e realça o brilho. Juntos, eles proporcionam um loiro vibrante, com maciez incomparável, luminosidade intensa e a proteção que seus fios precisam para se manterem saudáveis e impecáveis. Benefícios de usar o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml Neutralização de Tons Indesejados: O shampoo age na limpeza e neutralização gradual, enq",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_10",
    "name": "Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml",
    "slug": "truss-blond-revolution-sh-300ml-masc-180ml-finalizador-100ml-unico",
    "sku": "KITTRUSS004.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 546.15,
    "promoPrice": 474.91,
    "installmentCount": 10,
    "installmentValue": 47.49,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml Sobre o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml Conquiste um loiro impecável, vibrante e intensamente tratado com o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml! Este trio poderoso é a rotina completa e essencial para cabelos loiros, descoloridos e com mechas, oferecendo neutralização de tons indesejados, hidratação profunda, brilho deslumbrante e proteção duradoura. O Shampoo Antioxidante limpa suavemente enquanto corrige o amarelado, a Máscara Efeito Teia nutre e sela a cor com sua textura inovadora, e o Finalizador Impermeável cria um escudo protetor contra umidade, frizz e calor. Tenha um loiro perfeitamente cuidado, luminoso e resistente a todas as agressões do dia a dia. Benefícios de usar o Kit Tr",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_11",
    "name": "Kit Truss Blond Revolution - Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml",
    "slug": "truss-blond-revolution-masc-180ml-finalizador-100ml",
    "sku": "KITTRUSS011.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 415.05,
    "promoPrice": 360.91,
    "installmentCount": 10,
    "installmentValue": 36.09,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Blond Revolution - Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml Sobre o Kit Truss Blond Revolution - Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml Conquiste um loiro deslumbrante, protegido e com tratamento intensivo usando o Kit Truss Blond Revolution - Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml! Essa dupla poderosa é a sua aliada essencial para uma rotina de cuidados que hidrata profundamente, neutraliza tons indesejados e cria um escudo protetor contra as agressões externas. A Máscara Efeito Teia nutre intensamente, devolvendo maciez e brilho com sua textura inovadora, enquanto o Finalizador Impermeável sela as cutículas, combate o frizz e protege do calor e da umidade. Tenha um loiro perfeitamente tratado, luminoso e resistente, com um aspecto saudável e impecável. Benefícios de usar o Kit Truss Blond Revolution - Máscara Capilar Efeito Teia 180ml + Finalizador Impermeável 100ml Neutralização e Brilho Aprimor",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "180ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_12",
    "name": "Kit Truss Profissional - Net Mask Máscara Capilar Efeito Teia 30ml + Blond Revolution Finalizador Impermeável 100ml",
    "slug": "truss-net-mask-masc-30ml-blond-revolution-finalizador-100ml",
    "sku": "KITTRUSS022.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 218.4,
    "promoPrice": 189.91,
    "installmentCount": 10,
    "installmentValue": 18.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Profissional Duo Essencial - Net Mask Máscara Capilar Efeito Teia 30ml + Blond Revolution Finalizador Impermeável 100ml Sobre o Kit Truss Profissional Duo Essencial - Net Mask Máscara Capilar Efeito Teia 30ml + Blond Revolution Finalizador Impermeável 100ml Transforme seus cabelos com o poder de hidratação e proteção do Kit Truss Profissional Duo Essencial - Net Mask Máscara Capilar Efeito Teia 30ml + Blond Revolution Finalizador Impermeável 100ml! Essa dupla poderosa é a combinação perfeita para quem busca nutrição intensiva, maciez e um escudo protetor contra o frizz e as agressões externas, especialmente para cabelos loiros, descoloridos ou com mechas. A Net Mask, com sua textura inovadora em \"teia\", garante hidratação profunda e brilho, enquanto o Blond Revolution Finalizador sela as cutículas, neutraliza tons indesejados e protege seus fios da umidade e do calor. Tenha um cabelo impecável, radiante e resistente, com um toque suave e um movimento incrível. Benefícios de u",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "30ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_13",
    "name": "Kit Truss Profissional - Net Mask Máscara Capilar Efeito Teia 30ml + Uso Obrigatório Spray Reconstrutor 260ml",
    "slug": "truss-net-mask-masc-30ml-uso-obrigatorio-spray-reconstrutor-260ml",
    "sku": "KITTRUSS025.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 218.4,
    "promoPrice": 189.91,
    "installmentCount": 10,
    "installmentValue": 18.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Profissional Duo de Tratamento Essencial - Net Mask Máscara Capilar Efeito Teia 30ml + Uso Obrigatório Spray Reconstrutor 260ml Sobre o Kit Truss Profissional Duo de Tratamento Essencial - Net Mask Máscara Capilar Efeito Teia 30ml + Uso Obrigatório Spray Reconstrutor 260ml Transforme a saúde e a aparência dos seus cabelos com o Kit Truss Profissional Duo de Tratamento Essencial - Net Mask Máscara Capilar Efeito Teia 30ml + Uso Obrigatório Spray Reconstrutor 260ml! Essa dupla poderosa é a combinação perfeita para quem busca hidratação profunda, reconstrução intensa e proteção multifuncional. A Net Mask, com sua textura inovadora em \"teia\", garante que cada fio receba nutrição e brilho máximos, enquanto o Uso Obrigatório Spray Reconstrutor oferece um tratamento reconstrutor sem enxágue, proteção térmica e um toque final de maciez e brilho. Prepare-se para cabelos visivelmente mais fortes, revitalizados, resistentes à quebra e com um aspecto saudável e deslumbrante. Benefícios d",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "30ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_14",
    "name": "Kit Truss Uso Obrigatório Shampoo 300ml + Máscara 180ml",
    "slug": "truss-uso-obrigatorio-sh-300ml-masc-180ml",
    "sku": "KITTRUSS030.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 349.5,
    "promoPrice": 303.91,
    "installmentCount": 10,
    "installmentValue": 30.39,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Uso Obrigatório Shampoo 300ml + Máscara 180ml Sobre o Kit Truss Uso Obrigatório Shampoo 300ml + Máscara 180ml Transforme seus cabelos fragilizados em fios fortes, macios e radiantes com o Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Máscara 180ml! Essa dupla poderosa é a rotina de tratamento essencial para reconstruir, fortalecer e devolver a vida a todos os tipos de cabelo, especialmente aqueles danificados por químicas, calor ou agressões diárias. O Shampoo limpa suavemente e prepara os fios para receber o tratamento, enquanto a Máscara, o best-seller da linha, oferece reparação intensa, reposição de massa e hidratação profunda. Tenha um cabelo completamente revitalizado, resistente à quebra e com um aspecto saudável e deslumbrante em cada lavagem. Benefícios de usar o Kit Truss Uso Obrigatório Shampoo 300ml + Máscara 180ml Reconstrução Capilar Profunda: A máscara age diretamente na fibra danificada, repondo a massa capilar perdida e reconstruindo a estrutura intern",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_15",
    "name": "Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Condicionador 300ml + Spray Reconstrutor 260ml!",
    "slug": "truss-uso-obrigatorio-sh-300ml-cond-300ml-spray-reconstrutor-260ml",
    "sku": "KITTRUSS029.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 480.6,
    "promoPrice": 417.91,
    "installmentCount": 10,
    "installmentValue": 41.79,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Condicionador 300ml + Spray Reconstrutor 260ml! Sobre o Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Condicionador 300ml + Spray Reconstrutor 260ml! Transforme seus cabelos fragilizados em fios fortes, macios e radiantes com o Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Condicionador 300ml + Spray Reconstrutor 260ml! Este trio essencial é a sua rotina de tratamento para reconstruir, fortalecer e proteger todos os tipos de cabelo, especialmente aqueles danificados por químicas, calor ou agressões diárias. O Shampoo limpa suavemente e prepara os fios, o Condicionador sela as cutículas e desembaraça, e o Spray Reconstrutor, o best-seller da linha, oferece reparação intensa, proteção térmica e brilho. Tenha um cabelo completamente revitalizado, resistente à quebra e com um aspecto saudável e deslumbrante em cada lavagem e finalização. Benefícios de usar o Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Condicionador",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_16",
    "name": "Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Máscara 180ml + Spray Reconstrutor 260ml",
    "slug": "truss-uso-obrigatorio-sh-300ml-masc-180ml-spray-reconstrutor-260ml",
    "sku": "KITTRUSS033.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 524.3,
    "promoPrice": 455.91,
    "installmentCount": 10,
    "installmentValue": 45.59,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Máscara 180ml + Spray Reconstrutor 260ml Sobre o Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Máscara 180ml + Spray Reconstrutor 260ml Transforme seus cabelos fragilizados em fios fortes, macios e radiantes com o Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Máscara 180ml + Spray Reconstrutor 260ml! Este trio essencial é a sua rotina de tratamento definitiva para reconstruir, fortalecer e proteger todos os tipos de cabelo, especialmente aqueles danificados por químicas, calor ou agressões diárias. O Shampoo limpa suavemente e prepara os fios, a Máscara oferece reparação intensa e hidratação profunda, e o Spray Reconstrutor, o best-seller da linha, sela o tratamento, proporciona proteção térmica e um brilho deslumbrante. Tenha um cabelo completamente revitalizado, resistente à quebra e com um aspecto saudável em cada lavagem e finalização. Benefícios de usar o Kit Truss Uso Obrigatório Completo - Shampoo 300ml + Máscara",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_17",
    "name": "Kit Truss Uso Obrigatório Shampoo 300ml + Condicionador 300ml + Máscara 180ml",
    "slug": "truss-uso-obrigatorio-shampoo-300ml-condicionador-300ml-mascara-180ml",
    "sku": "KITTRUSS034.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 502.45,
    "promoPrice": 436.91,
    "installmentCount": 10,
    "installmentValue": 43.69,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Uso Obrigatório Essencial - Shampoo 300ml + Condicionador 300ml + Máscara 180ml Sobre o Kit Truss Uso Obrigatório Essencial - Shampoo 300ml + Condicionador 300ml + Máscara 180ml Transforme seus cabelos fragilizados em fios fortes, macios e radiantes com o Kit Truss Uso Obrigatório Essencial - Shampoo 300ml + Condicionador 300ml + Máscara 180ml! Este trio fundamental é a sua rotina de tratamento completa para reconstruir, fortalecer e devolver a vida a todos os tipos de cabelo, especialmente aqueles danificados por químicas, calor ou agressões diárias. O Shampoo limpa suavemente e prepara os fios, o Condicionador sela as cutículas e desembaraça, e a Máscara, o best-seller da linha, oferece reparação intensa, reposição de massa e hidratação profunda. Tenha um cabelo completamente revitalizado, resistente à quebra e com um aspecto saudável e deslumbrante em cada lavagem. Benefícios de usar o Kit Truss Uso Obrigatório Essencial - Shampoo 300ml + Condicionador 300ml + Máscara 180m",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_18",
    "name": "Kit Completo Truss Uso Obrigatório - Shampoo 300ml + Condicionador 300ml + Máscara 180ml + Spray Reconstrutor 260ml",
    "slug": "truss-uso-obrigatorio-sh-300ml-cond-300ml-masc-180ml-spray-reconstrutor-260ml",
    "sku": "KITTRUSS037.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 666.32,
    "promoPrice": 579.41,
    "installmentCount": 10,
    "installmentValue": 57.94,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Completo Truss Uso Obrigatório - Shampoo 300ml + Condicionador 300ml + Máscara 180ml + Spray Reconstrutor 260ml Sobre o Kit Completo Truss Uso Obrigatório - Shampoo 300ml + Condicionador 300ml + Máscara 180ml + Spray Reconstrutor 260ml Transforme a saúde e a beleza dos seus cabelos com o Kit Completo Truss Uso Obrigatório - Shampoo 300ml + Condicionador 300ml + Máscara 180ml + Spray Reconstrutor 260ml! Este quarteto poderoso é a rotina definitiva de tratamento e reconstrução, ideal para todos os tipos de cabelo, especialmente aqueles danificados por químicas, calor ou agressões diárias. O Shampoo inicia a limpeza suave, o Condicionador sela e desembaraça, a Máscara oferece uma reparação intensa e hidratação profunda, e o Spray Reconstrutor, o best-seller da linha, finaliza com proteção térmica, brilho e fortalecimento. Com este kit completo, seus fios serão totalmente revitalizados, tornando-se resistentes à quebra e exibindo um aspecto saudável e deslumbrante em cada etapa do cuid",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_19",
    "name": "Kit Truss Uso Obrigatório Máscara 180ml + Spray Reconstrutor 260ml",
    "slug": "truss-uso-obrigatorio-masc-180ml-spray-reconstrutor-260ml",
    "sku": "KITTRUSS042.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 382.27,
    "promoPrice": 332.41,
    "installmentCount": 10,
    "installmentValue": 33.24,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Spray Reconstrutor 260ml Sobre o Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Spray Reconstrutor 260ml Transforme seus cabelos fragilizados em fios fortes, macios e radiantes com o Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Spray Reconstrutor 260ml! Essa dupla poderosa é a sua rotina de tratamento para reconstruir, fortalecer e proteger todos os tipos de cabelo, especialmente aqueles danificados por químicas, calor ou agressões diárias. A Máscara, um best-seller da linha, oferece reparação intensa e hidratação profunda, enquanto o Spray Reconstrutor sela o tratamento, proporciona proteção térmica, brilho e fortalecimento contínuo. Tenha um cabelo completamente revitalizado, resistente à quebra e com um aspecto saudável e deslumbrante em cada aplicação. Benefícios de usar o Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Spray Reconstrutor 260ml Reconstrução Capilar Profunda: A máscara age intensivamente na ",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "180ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_20",
    "name": "Kit Truss Duo Essencial - Uso Obrigatório Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml",
    "slug": "truss-uso-obrigatorio-masc-180ml-blond-revolution-finalizador-100ml",
    "sku": "KITTRUSS045.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 382.27,
    "promoPrice": 332.41,
    "installmentCount": 10,
    "installmentValue": 33.24,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Duo Essencial - Uso Obrigatório Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml Sobre o Kit Truss Duo Essencial - Uso Obrigatório Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml Transforme a saúde e a aparência dos seus cabelos com o Kit Truss Duo Essencial - Uso Obrigatório Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml! Esta dupla poderosa é a combinação perfeita para quem busca reconstrução intensa, hidratação profunda e proteção completa, ideal para todos os tipos de cabelo, especialmente os loiros, descoloridos ou danificados. A Máscara Uso Obrigatório, um dos best-sellers da Truss, age na reparação da fibra capilar e reposição de massa, enquanto o Blond Revolution Finalizador Impermeável oferece um escudo protetor contra umidade, frizz e calor, além de neutralizar tons indesejados em cabelos loiros. Seus cabelos ficarão visivelmente mais fortes, macios, brilhantes e com um aspecto saudável e impecável. Benefícios de usar o K",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "180ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_21",
    "name": "Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Finalizador Impermeável 100ml",
    "slug": "truss-blond-revolution-sh-300ml-finalizador-100ml",
    "sku": "KITTRUSS051.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 327.65,
    "promoPrice": 284.91,
    "installmentCount": 10,
    "installmentValue": 28.49,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Finalizador Impermeável 100ml Sobre o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Finalizador Impermeável 100ml Conquiste um loiro impecável e protegido com o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Finalizador Impermeável 100ml! Essa dupla poderosa é a sua aliada essencial para uma rotina de cuidados que limpa suavemente, neutraliza tons indesejados e cria um escudo protetor contra o frizz e as agressões externas. O Shampoo Antioxidante age na limpeza e correção do amarelado, enquanto o Finalizador Impermeável sela as cutículas, combate a umidade, e protege do calor, garantindo um loiro vibrante, com maciez e uma luminosidade duradoura. Tenha um cabelo loiro perfeitamente cuidado e resistente a todas as adversidades do dia a dia. Benefícios de usar o Kit Truss Blond Revolution - Shampoo Antioxidante 300ml + Finalizador Impermeável 100ml Neutralização de Tons Indesejados: O shampoo atua na limpeza",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "300ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_truss_22",
    "name": "Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml + Uso Obrigatório Spray Reconstrutor 260ml",
    "slug": "truss-uso-obrigatorio-masc-180ml-blond-revolution-finalizador-100ml-spray-reconstrutor-260ml",
    "sku": "KITTRUSS048.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 546.15,
    "promoPrice": 474.91,
    "installmentCount": 10,
    "installmentValue": 47.49,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml + Uso Obrigatório Spray Reconstrutor 260ml Sobre o Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml + Uso Obrigatório Spray Reconstrutor 260ml Transforme seus cabelos com o poder de reconstrução, hidratação e proteção completa do Kit Truss Uso Obrigatório Essencial - Máscara 180ml + Blond Revolution Finalizador Impermeável 100ml + Uso Obrigatório Spray Reconstrutor 260ml! Este trio imbatível combina o melhor da Truss para oferecer um tratamento multifuncional que atende a todas as necessidades dos seus fios, especialmente os loiros, descoloridos, danificados ou que precisam de proteção extra. A Máscara Uso Obrigatório age na reparação profunda e reposição de massa, o Blond Revolution Finalizador sela as cutículas, combate o frizz e neutraliza tons indesejados (para loiras), e o Uso Obrigatório Spray Reconstrutor finaliza com proteção t",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "180ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.449Z"
  },
  {
    "id": "prod_truss_23",
    "name": "Kit Truss Essencial - Uso Obrigatório Spray Reconstrutor 260ml + Blond Revolution Finalizador Impermeável 100ml",
    "slug": "truss-uso-obrigatorio-spray-reconstrutor-260ml-blond-revolution-finalizador-100ml",
    "sku": "KITTRUSS052.1",
    "brandId": "brand_truss",
    "categoryId": "cat_kits",
    "price": 360.42,
    "promoPrice": 313.41,
    "installmentCount": 10,
    "installmentValue": 31.34,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Kit Truss Essencial - Uso Obrigatório Spray Reconstrutor 260ml + Blond Revolution Finalizador Impermeável 100ml Sobre o Kit Truss Essencial - Uso Obrigatório Spray Reconstrutor 260ml + Blond Revolution Finalizador Impermeável 100ml Transforme seus cabelos com o poder de reconstrução, proteção e luminosidade do Kit Truss Essencial - Uso Obrigatório Spray Reconstrutor 260ml + Blond Revolution Finalizador Impermeável 100ml! Essa dupla poderosa é a combinação perfeita para quem busca reparar danos, proteger intensamente os fios e garantir um brilho deslumbrante, especialmente para cabelos loiros, descoloridos, ou que necessitam de cuidados especiais contra o frizz e agressões externas. O Uso Obrigatório Spray Reconstrutor, um dos best-sellers da Truss, age na reparação profunda e proteção térmica, enquanto o Blond Revolution Finalizador Impermeável cria um escudo protetor contra umidade, frizz e calor, além de neutralizar tons indesejados em cabelos loiros. Tenha um cabelo visivelmente mai",
    "howToUse": "Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir conforme orientação da embalagem e enxágue bem.",
    "volume": "260ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.449Z"
  },
  {
    "id": "prod_truss_24",
    "name": "Truss Net Mask Máscara Capilar Efeito Teia 550g",
    "slug": "truss-net-mask-mascara-efeito-teia-550g",
    "sku": "TRUSS007.550",
    "brandId": "brand_truss",
    "categoryId": "cat_tratamento",
    "price": 219.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 21.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "A icônica e mais consagrada máscara de hidratação inteligente da Truss no pote profissional de 550g. Possui o exclusivo efeito teia (web effect) com nanorreposição de massa cortical que penetra profundamente nas camadas da fibra, selando as cutículas e restaurando a elasticidade de cabelos quimicamente tratados.",
    "howToUse": "Espalhe uma pequena quantidade nas mãos e friccione-as em movimentos de bater palmas para ativar o efeito teia sobre os cabelos limpos e úmidos. Massageie mecha a mecha, deixe agir de 5 a 10 minutos e enxágue abundantemente.",
    "volume": "550g",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.449Z"
  }
];

export const TRUSS_IMAGES: ImageRecord[] = [
  {
    "id": "img_prod_truss_1_0",
    "productId": "prod_truss_1",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_1_1",
    "productId": "prod_truss_1",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17098/truss003-2.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_1_2",
    "productId": "prod_truss_1",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17099/truss003-3.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_1_3",
    "productId": "prod_truss_1",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17100/truss003-4.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_1_4",
    "productId": "prod_truss_1",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17101/truss003-5.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_2_0",
    "productId": "prod_truss_2",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17114/truss006.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_2_1",
    "productId": "prod_truss_2",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17111/truss006-1.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_2_2",
    "productId": "prod_truss_2",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17112/truss006-2.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_2_3",
    "productId": "prod_truss_2",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17113/truss006-3.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_2_4",
    "productId": "prod_truss_2",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17110/truss-blonde-revolution.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_3_0",
    "productId": "prod_truss_3",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17121/truss008-1.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_3_1",
    "productId": "prod_truss_3",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17122/truss008-2.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_3_2",
    "productId": "prod_truss_3",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17123/truss008-3.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_3_3",
    "productId": "prod_truss_3",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_3_4",
    "productId": "prod_truss_3",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_4_0",
    "productId": "prod_truss_4",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17118/truss007.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_4_1",
    "productId": "prod_truss_4",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17117/truss007-3.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_4_2",
    "productId": "prod_truss_4",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17115/truss007-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_4_3",
    "productId": "prod_truss_4",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/09/produto/17897/truss007-1.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_4_4",
    "productId": "prod_truss_4",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17116/truss007-2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_5_0",
    "productId": "prod_truss_5",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_5_1",
    "productId": "prod_truss_5",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17124/truss009-1.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_5_2",
    "productId": "prod_truss_5",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17125/truss009-2.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_5_3",
    "productId": "prod_truss_5",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_5_4",
    "productId": "prod_truss_5",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_6_0",
    "productId": "prod_truss_6",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17140/truss013.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_6_1",
    "productId": "prod_truss_6",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17137/truss013-1.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_6_2",
    "productId": "prod_truss_6",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17138/truss013-2.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_6_3",
    "productId": "prod_truss_6",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17139/truss013-3.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_6_4",
    "productId": "prod_truss_6",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_6_5",
    "productId": "prod_truss_6",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_7_0",
    "productId": "prod_truss_7",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17107/truss004.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_7_1",
    "productId": "prod_truss_7",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17103/truss004-1.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_7_2",
    "productId": "prod_truss_7",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17104/truss004-2.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_7_3",
    "productId": "prod_truss_7",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17105/truss004-3.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_7_4",
    "productId": "prod_truss_7",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17106/truss004-4.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_8_0",
    "productId": "prod_truss_8",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17136/truss012.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_8_1",
    "productId": "prod_truss_8",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17135/truss012-1.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_8_2",
    "productId": "prod_truss_8",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_8_3",
    "productId": "prod_truss_8",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_8_4",
    "productId": "prod_truss_8",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/09/produto/17898/uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_9_0",
    "productId": "prod_truss_9",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17141/kittruss001.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_9_1",
    "productId": "prod_truss_9",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17114/truss006.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_9_2",
    "productId": "prod_truss_9",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17111/truss006-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_9_3",
    "productId": "prod_truss_9",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17107/truss004.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_9_4",
    "productId": "prod_truss_9",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17103/truss004-1.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_9_5",
    "productId": "prod_truss_9",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17110/truss-blonde-revolution.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_10_0",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17142/kittruss004.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_10_1",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17114/truss006.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_10_2",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17111/truss006-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_10_3",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17107/truss004.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_10_4",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17103/truss004-1.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_10_5",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_10_6",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17098/truss003-2.png",
    "isPrimary": 0,
    "displayOrder": 6
  },
  {
    "id": "img_prod_truss_10_7",
    "productId": "prod_truss_10",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17110/truss-blonde-revolution.png",
    "isPrimary": 0,
    "displayOrder": 7
  },
  {
    "id": "img_prod_truss_11_0",
    "productId": "prod_truss_11",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17143/kittruss011.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_11_1",
    "productId": "prod_truss_11",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17107/truss004.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_11_2",
    "productId": "prod_truss_11",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17103/truss004-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_11_3",
    "productId": "prod_truss_11",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_11_4",
    "productId": "prod_truss_11",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17098/truss003-2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_11_5",
    "productId": "prod_truss_11",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17110/truss-blonde-revolution.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_12_0",
    "productId": "prod_truss_12",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17144/kittruss022.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_12_1",
    "productId": "prod_truss_12",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17118/truss007.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_12_2",
    "productId": "prod_truss_12",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17116/truss007-2.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_12_3",
    "productId": "prod_truss_12",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_12_4",
    "productId": "prod_truss_12",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17098/truss003-2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_13_0",
    "productId": "prod_truss_13",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17145/kittruss025.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_13_1",
    "productId": "prod_truss_13",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17140/truss013.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_13_2",
    "productId": "prod_truss_13",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17118/truss007.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_13_3",
    "productId": "prod_truss_13",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17137/truss013-1.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_13_4",
    "productId": "prod_truss_13",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17116/truss007-2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_14_0",
    "productId": "prod_truss_14",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17147/kittruss030.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_14_1",
    "productId": "prod_truss_14",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17136/truss012.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_14_2",
    "productId": "prod_truss_14",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_14_3",
    "productId": "prod_truss_14",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_14_4",
    "productId": "prod_truss_14",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_15_0",
    "productId": "prod_truss_15",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17146/kittruss029.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_15_1",
    "productId": "prod_truss_15",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17121/truss008-1.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_15_2",
    "productId": "prod_truss_15",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17123/truss008-3.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_15_3",
    "productId": "prod_truss_15",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17136/truss012.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_15_4",
    "productId": "prod_truss_15",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_15_5",
    "productId": "prod_truss_15",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17137/truss013-1.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_15_6",
    "productId": "prod_truss_15",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 6
  },
  {
    "id": "img_prod_truss_16_0",
    "productId": "prod_truss_16",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17148/kittruss033.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_16_1",
    "productId": "prod_truss_16",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17136/truss012.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_16_2",
    "productId": "prod_truss_16",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_16_3",
    "productId": "prod_truss_16",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17140/truss013.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_16_4",
    "productId": "prod_truss_16",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_16_5",
    "productId": "prod_truss_16",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_17_0",
    "productId": "prod_truss_17",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17149/kittruss034.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_17_1",
    "productId": "prod_truss_17",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17136/truss012.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_17_2",
    "productId": "prod_truss_17",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_17_3",
    "productId": "prod_truss_17",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17121/truss008-1.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_17_4",
    "productId": "prod_truss_17",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_17_5",
    "productId": "prod_truss_17",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_18_0",
    "productId": "prod_truss_18",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17150/kittruss037.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_18_1",
    "productId": "prod_truss_18",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17136/truss012.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_18_2",
    "productId": "prod_truss_18",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17121/truss008-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_18_3",
    "productId": "prod_truss_18",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_18_4",
    "productId": "prod_truss_18",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17140/truss013.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_18_5",
    "productId": "prod_truss_18",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_18_6",
    "productId": "prod_truss_18",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 6
  },
  {
    "id": "img_prod_truss_19_0",
    "productId": "prod_truss_19",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17151/kittruss042.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_19_1",
    "productId": "prod_truss_19",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_19_2",
    "productId": "prod_truss_19",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17140/truss013.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_19_3",
    "productId": "prod_truss_19",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17137/truss013-1.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_19_4",
    "productId": "prod_truss_19",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17120/truss-uso-obrigatorio2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_19_5",
    "productId": "prod_truss_19",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17119/truss-uso-obrigatorio.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_20_0",
    "productId": "prod_truss_20",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17152/kittruss045.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_20_1",
    "productId": "prod_truss_20",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_20_2",
    "productId": "prod_truss_20",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17137/truss013-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_20_3",
    "productId": "prod_truss_20",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_20_4",
    "productId": "prod_truss_20",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17098/truss003-2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_21_0",
    "productId": "prod_truss_21",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17154/kittruss051.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_21_1",
    "productId": "prod_truss_21",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17114/truss006.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_21_2",
    "productId": "prod_truss_21",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17111/truss006-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_21_3",
    "productId": "prod_truss_21",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_21_4",
    "productId": "prod_truss_21",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17098/truss003-2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_21_5",
    "productId": "prod_truss_21",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17110/truss-blonde-revolution.png",
    "isPrimary": 0,
    "displayOrder": 5
  },
  {
    "id": "img_prod_truss_22_0",
    "productId": "prod_truss_22",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17153/kittruss048.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_22_1",
    "productId": "prod_truss_22",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17126/truss009.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_22_2",
    "productId": "prod_truss_22",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17140/truss013.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_22_3",
    "productId": "prod_truss_22",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_23_0",
    "productId": "prod_truss_23",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17155/kittruss052.png",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_truss_23_1",
    "productId": "prod_truss_23",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17140/truss013.png",
    "isPrimary": 0,
    "displayOrder": 1
  },
  {
    "id": "img_prod_truss_23_2",
    "productId": "prod_truss_23",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17137/truss013-1.png",
    "isPrimary": 0,
    "displayOrder": 2
  },
  {
    "id": "img_prod_truss_23_3",
    "productId": "prod_truss_23",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17102/truss003.png",
    "isPrimary": 0,
    "displayOrder": 3
  },
  {
    "id": "img_prod_truss_23_4",
    "productId": "prod_truss_23",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17098/truss003-2.png",
    "isPrimary": 0,
    "displayOrder": 4
  },
  {
    "id": "img_prod_truss_24_0",
    "productId": "prod_truss_24",
    "url": "https://lindacosmeticos.cdn.magazord.com.br/img/2025/07/produto/17118/truss007.png",
    "isPrimary": 1,
    "displayOrder": 0
  }
];

export const BRAE_PRODUCTS: ProductRecord[] = [
  {
    "id": "prod_brae_1",
    "name": "Braé Essential Fluido Reparador Leave-in com Proteção Térmica 260ml",
    "slug": "brae-essential-fluido-reparador-leave-in-260ml",
    "sku": "BRAE-ESS-001",
    "brandId": "brand_brae",
    "categoryId": "cat_finalizadores",
    "price": 149.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 14.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "O Fluido Reparador Leave-in Braé Essential é o icônico finalizador multifuncional formulado com ácido hialurônico, aminoácidos e pantenol. Proporciona reparação profunda da fibra, proteção térmica contra temperaturas de até 230°C, ação antifrizz duradoura e proteção solar contra radiação UV. Sela instantaneamente as cutículas capilares, prevenindo pontas duplas e proporcionando toque sedoso com brilho radiante sem pesar.",
    "howToUse": "Agite antes de usar. Com os cabelos limpos e úmidos ou secos, borrife no comprimento e pontas a uma distância de aproximadamente 20 centímetros. Penteie para distribuir uniformemente. Não enxágue. Finalize como desejar com secador, prancha ou secagem natural ao ar.",
    "volume": "260ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_2",
    "name": "Braé Essential Shampoo Reparador Diário 250ml",
    "slug": "brae-essential-shampoo-reparador-250ml",
    "sku": "BRAE-ESS-002",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 109.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 10.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Shampoo de limpeza suave e nutritiva desenvolvido para cabelos secos, opacos ou danificados por processos diários. Sua fórmula inovadora rica em complexo de aminoácidos higieniza o couro cabeludo sem agredir a barreira lipídica, devolvendo maciez e maleabilidade aos fios desde a raiz.",
    "howToUse": "Aplique sobre os cabelos molhados e massageie o couro cabeludo delicadamente com as pontas dos dedos até a formação de espuma cremosa. Enxágue abundantemente e repita o processo se necessário.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_3",
    "name": "Braé Essential Condicionador Reparador Diário 250ml",
    "slug": "brae-essential-condicionador-reparador-250ml",
    "sku": "BRAE-ESS-003",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 119.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 11.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Condicionador reparador de alta performance com efeito desembaraçante imediato. Promove selagem imediata das cutículas, retém a hidratação dentro do córtex capilar e restaura a emoliência dos fios, reduzindo o atrito e conferindo toque suave e sedoso.",
    "howToUse": "Após o uso do shampoo, aplique o condicionador no comprimento e pontas dos cabelos úmidos. Deixe agir por 2 a 3 minutos e enxágue totalmente.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_4",
    "name": "Braé Essential Máscara de Reparação Profunda 500g",
    "slug": "brae-essential-mascara-reparacao-profunda-500g",
    "sku": "BRAE-ESS-004",
    "brandId": "brand_brae",
    "categoryId": "cat_tratamento",
    "price": 189.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 18.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Máscara de tratamento regenerador intensivo em tamanho profissional 500g. Enriquecida com blend de queratina vegetal e vitaminas fortalecedoras, regenera as áreas sensibilizadas da fibra capilar, recupera a força elástica e confere maciez e brilho espetaculares.",
    "howToUse": "Distribua uniformemente sobre os cabelos limpos e úmidos, massageando mecha a mecha. Deixe agir de 5 a 10 minutos para absorção dos ativos e enxágue abundantemente.",
    "volume": "500g",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_5",
    "name": "Braé Revival Shampoo Reconstrutor de Resgate 250ml",
    "slug": "brae-revival-shampoo-reconstrutor-250ml",
    "sku": "BRAE-REV-001",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 114.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 11.49,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Shampoo reconstrutor inovador desenvolvido especificamente para cabelos fragilizados, porosos e severamente danificados por processos químicos. Limpa delicadamente enquanto deposita ativos proteicos que preparam a fibra para a reconstrução intensiva de massa.",
    "howToUse": "Aplique nos cabelos úmidos e massageie delicadamente até formar espuma rica e abundante. Enxágue completamente e repita a lavagem se desejar ação potencializada.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_6",
    "name": "Braé Revival Condicionador Reconstrutor Intenso 250ml",
    "slug": "brae-revival-condicionador-reconstrutor-250ml",
    "sku": "BRAE-REV-002",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 124.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 12.49,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Condicionador fortificante com tecnologia de reconstrução contínua. Envolve cada fio em uma camada de aminoácidos e óleos nobres, selando as cutículas e impedindo a perda de massa capilar e a formação de quebras.",
    "howToUse": "Após higienizar os fios, espalhe o condicionador do meio às pontas. Deixe agir por 2 a 3 minutos e enxágue com água abundante.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_7",
    "name": "Braé Revival Máscara Reconstrutora de Impacto 500g",
    "slug": "brae-revival-mascara-reconstrutora-impacto-500g",
    "sku": "BRAE-REV-003",
    "brandId": "brand_brae",
    "categoryId": "cat_tratamento",
    "price": 189.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 18.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "O mais poderoso tratamento de resgate para cabelos extremamente danificados, elásticos e quebradiços. Sua fórmula ultraconcentrada repara as pontes proteicas danificadas, devolvendo resistência imediata, densidade e vida aos fios que passaram por descolorações severas ou agressões químicas.",
    "howToUse": "Aplique mecha a mecha nos cabelos lavados e úmidos, enluvando do comprimento às pontas. Deixe agir por 5 a 10 minutos sob touca ou toalha aquecida se preferir. Enxágue completamente.",
    "volume": "500g",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_8",
    "name": "Braé Revival Gorgeous Shine Oil Óleo Reparador 60ml",
    "slug": "brae-revival-gorgeous-shine-oil-60ml",
    "sku": "BRAE-REV-004",
    "brandId": "brand_brae",
    "categoryId": "cat_oleos",
    "price": 139.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 13.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Óleo finalizador reconstrutor formulado com blend nutritivo de óleos de coco, abacate e macadâmia. Trata as pontas ressecadas, restaura lipídios essenciais, combate o frizz e adiciona brilho luminoso tridimensional com absorção instantânea e toque acetinado.",
    "howToUse": "Deposite 2 a 3 gotas nas palmas das mãos, friccione e distribua uniformemente no comprimento e pontas dos cabelos secos ou úmidos antes da escova ou como reparador finalizador.",
    "volume": "60ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_9",
    "name": "Braé Divine Shampoo Antifrizz e Alinhamento 250ml",
    "slug": "brae-divine-shampoo-antifrizz-250ml",
    "sku": "BRAE-DIV-001",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 109.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 10.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Shampoo disciplinante com fórmula enriquecida por extratos de semente de linho e blend de óleos nobres. Limpa suavemente, alinha as fibras capilares rebeldes e combate o frizz de maneira duradoura, preparando os fios para um efeito liso impecável e natural.",
    "howToUse": "Aplique nos cabelos úmidos e massageie delicadamente o couro cabeludo. Enxágue completamente e repita o procedimento para potencializar a ação nutritiva e disciplinante.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_10",
    "name": "Braé Divine Condicionador Antifrizz e Alinhamento 250ml",
    "slug": "brae-divine-condicionador-antifrizz-250ml",
    "sku": "BRAE-DIV-002",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 119.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 11.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Condicionador nutritivo com tecnologia antiumidade de última geração. Sela as cutículas, confere maleabilidade e controle imediato aos fios indisciplinados, garantindo toque macio, desembaraço fluido e prolongamento do efeito liso.",
    "howToUse": "Espalhe pelo comprimento e pontas nos cabelos úmidos após a lavagem com shampoo. Deixe agir por 2 a 3 minutos e enxágue totalmente.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_11",
    "name": "Braé Divine Máscara Hidratante e Nutritiva Antifrizz 500g",
    "slug": "brae-divine-mascara-hidratante-antifrizz-500g",
    "sku": "BRAE-DIV-003",
    "brandId": "brand_brae",
    "categoryId": "cat_tratamento",
    "price": 179.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 17.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Máscara de nutrição profunda e alinhamento capilar desenvolvida com complexo botânico de semente de linho e semente de algodão. Hidrata intensamente as camadas profundas do córtex, reduz o volume excessivo, combate o frizz em dias úmidos e deixa os cabelos extremamente brilhantes e aveludados.",
    "howToUse": "Aplique mecha por mecha nos cabelos limpos e úmidos. Massageie enluvando os fios e deixe agir por 10 minutos. Enxágue com água morna ou fria para potencializar o brilho.",
    "volume": "500g",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_12",
    "name": "Braé Divine Plume Sensation Sérum Reparador Antifrizz 60ml",
    "slug": "brae-divine-plume-sensation-serum-60ml",
    "sku": "BRAE-DIV-004",
    "brandId": "brand_brae",
    "categoryId": "cat_oleos",
    "price": 129.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 12.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Sérum finalizador ultraleve com textura acetinada de toque seco. Cria uma película protetora invisível contra umidade e agentes externos, disciplina pontas rebeldes, previne pontas duplas e confere leveza, maleabilidade e perfume sofisticado.",
    "howToUse": "Aplique de 2 a 3 pumps na palma das mãos e espalhe homogeneamente sobre o comprimento e pontas dos fios úmidos ou secos.",
    "volume": "60ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_13",
    "name": "Braé Bond Angel Plex Tratamento Fortificante Pós-Química 250ml",
    "slug": "brae-bond-angel-plex-tratamento-fortificante-pos-quimica-250ml",
    "sku": "BRAE-BND-001",
    "brandId": "brand_brae",
    "categoryId": "cat_tratamento",
    "price": 159.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 15.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Tratamento reconstrutor intensivo pós-descoloração e processos químicos de salão (Plex Effect Passo 3). Multiplica e regenera as pontes de sulfeto quebradas, impedindo a degradação da fibra, eliminando a porosidade e restaurando a força elástica máxima dos fios fragilizados.",
    "howToUse": "Utilize 1 a 2 vezes por semana. Após o shampoo, retire o excesso de água e aplique generosamente em todo o comprimento e pontas. Deixe agir por 15 minutos e enxágue bem. Finalize com condicionador.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_14",
    "name": "Braé Bond Angel Shampoo Fortificante Pós-Química 250ml",
    "slug": "brae-bond-angel-shampoo-fortificante-pos-quimica-250ml",
    "sku": "BRAE-BND-002",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 114.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 11.49,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Shampoo fortificante com pH balanceado desenvolvido especificamente para cabelos submetidos a descoloração, mechas ou tinturas constantes. Limpa suavemente enquanto deposita microaminoácidos que protegem as ligações químicas internas da fibra.",
    "howToUse": "Aplique nos cabelos molhados e massageie suavemente. Enxágue completamente e, se julgar necessário, reaplique para higienização profunda.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_15",
    "name": "Braé Bond Angel Thermal Blonde Fluido Reconstrutor e Matizador 200ml",
    "slug": "brae-bond-angel-thermal-blonde-fluido-matizador-200ml",
    "sku": "BRAE-BND-003",
    "brandId": "brand_brae",
    "categoryId": "cat_finalizadores",
    "price": 139.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 13.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Fluido regenerador termoativado multifuncional para cabelos loiros, com mechas ou grisalhos. Neutraliza reflexos amarelados e alaranjados indesejados através de micropigmentos violetas, protege contra fontes térmicas de até 230°C e sela as cutículas sensibilizadas.",
    "howToUse": "Borrife uniformemente sobre os cabelos limpos e úmidos antes de iniciar o processo de secagem ou prancha. Não enxágue.",
    "volume": "200ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_16",
    "name": "Braé Glow Shine Shampoo de Brilho e Sedosidade 250ml",
    "slug": "brae-glow-shine-shampoo-brilho-sedosidade-250ml",
    "sku": "BRAE-GLW-001",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 109.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 10.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Shampoo iluminador formulado com extrato de algas marinhas e semente de linhaça. Remove resíduos opacificantes e impurezas sem agredir a barreira de hidratação, ativando reflexos de luminosidade multidimensional e deixando o cabelo leve, solto e com toque sedoso.",
    "howToUse": "Aplique sobre os cabelos molhados, massageie o couro cabeludo até formar espuma rica e enxágue em seguida.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_17",
    "name": "Braé Glow Shine Condicionador de Brilho Radiante 250ml",
    "slug": "brae-glow-shine-condicionador-brilho-250ml",
    "sku": "BRAE-GLW-002",
    "brandId": "brand_brae",
    "categoryId": "cat_shampoo",
    "price": 119.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 11.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Condicionador desembaraçante formulado para polimento das cutículas e reflexão máxima da luz. Condiciona profundamente, combate o aspecto áspero e opaco e promove maciez duradoura sem pesar nos fios.",
    "howToUse": "Aplique nos cabelos limpos e úmidos, espalhando no comprimento e pontas. Deixe agir por 2 minutos e enxágue completamente.",
    "volume": "250ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 0,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_18",
    "name": "Braé Glow Shine Máscara de Brilho Espelhado 500g",
    "slug": "brae-glow-shine-mascara-brilho-intenso-500g",
    "sku": "BRAE-GLW-003",
    "brandId": "brand_brae",
    "categoryId": "cat_tratamento",
    "price": 179.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 17.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Tratamento concentrado de hidratação e brilho envernizado. Sua ação reconstrutora leve e altamente nutritiva restaura a superfície dos fios, conferindo brilho espelhado, toque aveludado e maciez incomparável aos cabelos opacos e sem vida.",
    "howToUse": "Aplique a máscara por todo o cabelo limpo e úmido, enluvando mecha a mecha. Deixe agir por 5 minutos e enxágue com água abundante.",
    "volume": "500g",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_19",
    "name": "Braé Glow Shine Fluido Ativador de Brilho Spray 200ml",
    "slug": "brae-glow-shine-fluido-ativador-brilho-200ml",
    "sku": "BRAE-GLW-004",
    "brandId": "brand_brae",
    "categoryId": "cat_finalizadores",
    "price": 129.9,
    "promoPrice": null,
    "installmentCount": 10,
    "installmentValue": 12.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Spray finalizador e termoativado que potencializa o brilho dos cabelos com efeito gloss reluzente. Oferece proteção contra o calor do secador e da prancha, elimina o frizz rebelde e mantém o penteado alinhado com balanço natural.",
    "howToUse": "Borrife no comprimento e pontas dos cabelos úmidos antes da escovação ou nos cabelos secos para acabamento de brilho cristalino instantâneo.",
    "volume": "200ml",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 0,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_20",
    "name": "Kit Braé Revival Reconstrução Total — Shampoo 250ml + Condicionador 250ml + Máscara 500g",
    "slug": "kit-brae-revival-reconstrucao-total-sh-cond-masc",
    "sku": "KITBRAE-REV-01",
    "brandId": "brand_brae",
    "categoryId": "cat_kits",
    "price": 429.7,
    "promoPrice": 369.9,
    "installmentCount": 10,
    "installmentValue": 36.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "Tratamento de choque completo para recuperação imediata de cabelos quimicamente fragilizados, elásticos e quebradiços. Reúne o Shampoo Reconstrutor 250ml, Condicionador Reconstrutor 250ml e a cultuada Máscara de Impacto 500g, devolvendo massa capilar, elasticidade e força extraordinárias com economia exclusiva.",
    "howToUse": "Lave os fios com o Shampoo Revival, retire o excesso de umidade e aplique a Máscara Reconstrutora de Impacto por 5 a 10 minutos. Enxágue bem e sele com o Condicionador Revival.",
    "volume": "Kit 3 Produtos",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  },
  {
    "id": "prod_brae_21",
    "name": "Kit Braé Divine Antifrizz Absoluto — Shampoo 250ml + Condicionador 250ml + Máscara 500g",
    "slug": "kit-brae-divine-antifrizz-absoluto-sh-cond-masc",
    "sku": "KITBRAE-DIV-01",
    "brandId": "brand_brae",
    "categoryId": "cat_kits",
    "price": 409.7,
    "promoPrice": 349.9,
    "installmentCount": 10,
    "installmentValue": 34.99,
    "pixDiscountPercent": 5,
    "stock": 15,
    "description": "O combo definitivo para cabelos indisciplinados que buscam efeito liso, controle absoluto de volume e blindagem total contra o frizz e umidade. Contém Shampoo Divine 250ml, Condicionador Divine 250ml e Máscara Hidratante e Nutritiva 500g em oferta especial.",
    "howToUse": "Higienize os cabelos com o Shampoo Divine. Aplique a Máscara Divine enluvando mecha por mecha por 5 a 10 minutos. Enxágue abundantemente e complete o alinhamento com o Condicionador Divine.",
    "volume": "Kit 3 Produtos",
    "rating": null,
    "reviewCount": 0,
    "isFeatured": 1,
    "isBestSeller": 1,
    "createdAt": "2026-11-08T22:36:43.448Z"
  }
];

export const BRAE_IMAGES: ImageRecord[] = [
  {
    "id": "img_prod_brae_1_0",
    "productId": "prod_brae_1",
    "url": "/products/brae/brae-essential-fluido-reparador-leave-in-260ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_2_0",
    "productId": "prod_brae_2",
    "url": "/products/brae/brae-essential-shampoo-reparador-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_3_0",
    "productId": "prod_brae_3",
    "url": "/products/brae/brae-essential-condicionador-reparador-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_4_0",
    "productId": "prod_brae_4",
    "url": "/products/brae/brae-essential-mascara-reparacao-profunda-500g.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_5_0",
    "productId": "prod_brae_5",
    "url": "/products/brae/brae-revival-shampoo-reconstrutor-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_6_0",
    "productId": "prod_brae_6",
    "url": "/products/brae/brae-revival-condicionador-reconstrutor-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_7_0",
    "productId": "prod_brae_7",
    "url": "/products/brae/brae-revival-mascara-reconstrutora-impacto-500g.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_8_0",
    "productId": "prod_brae_8",
    "url": "/products/brae/brae-revival-gorgeous-shine-oil-60ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_9_0",
    "productId": "prod_brae_9",
    "url": "/products/brae/brae-divine-shampoo-antifrizz-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_10_0",
    "productId": "prod_brae_10",
    "url": "/products/brae/brae-divine-condicionador-antifrizz-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_11_0",
    "productId": "prod_brae_11",
    "url": "/products/brae/brae-divine-mascara-hidratante-antifrizz-500g.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_12_0",
    "productId": "prod_brae_12",
    "url": "/products/brae/brae-divine-plume-sensation-serum-60ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_13_0",
    "productId": "prod_brae_13",
    "url": "/products/brae/brae-bond-angel-plex-tratamento-fortificante-pos-quimica-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_14_0",
    "productId": "prod_brae_14",
    "url": "/products/brae/brae-bond-angel-shampoo-fortificante-pos-quimica-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_15_0",
    "productId": "prod_brae_15",
    "url": "/products/brae/brae-bond-angel-thermal-blonde-fluido-matizador-200ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_16_0",
    "productId": "prod_brae_16",
    "url": "/products/brae/brae-glow-shine-shampoo-brilho-sedosidade-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_17_0",
    "productId": "prod_brae_17",
    "url": "/products/brae/brae-glow-shine-condicionador-brilho-250ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_18_0",
    "productId": "prod_brae_18",
    "url": "/products/brae/brae-glow-shine-mascara-brilho-intenso-500g.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_19_0",
    "productId": "prod_brae_19",
    "url": "/products/brae/brae-glow-shine-fluido-ativador-brilho-200ml.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_20_0",
    "productId": "prod_brae_20",
    "url": "/products/brae/kit-brae-revival-reconstrucao-total.webp",
    "isPrimary": 1,
    "displayOrder": 0
  },
  {
    "id": "img_prod_brae_21_0",
    "productId": "prod_brae_21",
    "url": "/products/brae/kit-brae-divine-antifrizz-absoluto.webp",
    "isPrimary": 1,
    "displayOrder": 0
  }
];

export async function seedTrussAndBrae() {
  console.log("=== INICIANDO SEEDING: TRUSS E BRAE (MARIANE COSMETICOS) ===");

  // 1. Garantir que as marcas oficiais existem na tabela brands
  await db
    .insert(brands)
    .values([
      {
        id: "brand_truss",
        name: "Truss",
        slug: "truss",
        description: "Tratamento de alta performance para recuperacao e brilho extremo.",
      },
      {
        id: "brand_brae",
        name: "Braé",
        slug: "brae",
        description: "Alta tecnologia em saúde capilar, nutrição e proteção intensiva.",
      },
    ])
    .onConflictDoNothing();

  const allProducts = [...TRUSS_PRODUCTS, ...BRAE_PRODUCTS];
  const allImages = [...TRUSS_IMAGES, ...BRAE_IMAGES];
  const productIds = allProducts.map((p) => p.id);

  console.log(`Carregando ${TRUSS_PRODUCTS.length} produtos Truss e ${BRAE_PRODUCTS.length} produtos Brae...`);

  // 2. Idempotencia: remover registros anteriores destas marcas antes de reinserir
  console.log("Removendo registros existentes das marcas Truss e Brae para garantir idempotencia...");
  await db.delete(productImages).where(inArray(productImages.productId, productIds));
  await db.delete(products).where(inArray(products.id, productIds));

  // 3. Inserir produtos na tabela products
  console.log(`Inserindo ${allProducts.length} produtos no banco...`);
  for (const prod of allProducts) {
    await db.insert(products).values(prod);
  }

  // 4. Inserir imagens na tabela product_images
  console.log(`Inserindo ${allImages.length} imagens no banco...`);
  for (const img of allImages) {
    await db.insert(productImages).values(img);
  }

  // 5. Verificacao imediata pos-seeding
  const trussCount = await db.select().from(products).where(inArray(products.brandId, ["brand_truss"]));
  const braeCount = await db.select().from(products).where(inArray(products.brandId, ["brand_brae"]));
  const totalCount = await db.select().from(products);

  console.log("\n=== SEEDING CONCLUIDO COM SUCESSO ===");
  console.log(`Produtos Truss no banco: ${trussCount.length}`);
  console.log(`Produtos Brae no banco: ${braeCount.length}`);
  console.log(`Total geral de produtos: ${totalCount.length}`);

  if (trussCount.length === 0 || braeCount.length === 0) {
    throw new Error("Falha na verificacao: Truss ou Brae ficou com 0 produtos no banco!");
  }
}

// Executar se chamado diretamente via CLI
if (require.main === module || process.argv[1]?.includes("seed-truss-brae")) {
  seedTrussAndBrae().catch((err) => {
    console.error("Erro ao executar seed-truss-brae:", err);
    process.exit(1);
  });
}
