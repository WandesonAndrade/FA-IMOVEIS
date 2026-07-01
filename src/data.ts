import { Property, Broker, AboutUsConfig } from "./types";

export const BROKERS: Broker[] = [];

export const PROPERTIES: Property[] = [
  {
    id: "casa-geometria-pura",
    title: "Casa Geometria Pura",
    description:
      "Obra-prima do minimalismo arquitetônico com balanço estrutural imponente.",
    fullDescription:
      "Uma residência icônica em Alto de Pinheiros. Linhas puras de concreto aparente e painéis pivotantes de madeira. O andar superior possui um vão livre flutuante fantástico, que proporciona sombra e sofisticação sobre o jardim de estilo zen com projeto de iluminação personalizado.",
    type: "Casa de Luxo",
    location: "Alto de Pinheiros, SP",
    neighborhood: "Alto de Pinheiros",
    price: 15800000,
    suites: 4,
    bathrooms: 6,
    area: 680,
    vagas: 6,
    condominio: 3200,
    iptu: 1900,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQTpGY9lXa9DhVFxHdxOrWsKL8nSzmj24cZnF8NHZR5VQFEw-A-S8XUBttNqVc3gTdLHLGYKaeMHQ6XI6O4yHvnu99andtQhAn0c8V3_7T9NIzHAum7SLqFdBny6G2wbbUxaJWZ8tMvOMj1bbPRMrSdzx1JnrLnEYrFWdpVF4wHtkPGPsiGqtaXWFujyku1w9cFmgfEKtS5-OTjhnme9kN_gHAQJkjXGhWDgK7KaddjNYmeV5Al9uLb0iDW_Z1Qjbjc0gpIdLLRg",
    ],
    comodidades: [
      "Jardim Zen",
      "Balanço Arquitetônico",
      "Ofurô",
      "Painéis Pivotantes",
      "Energia Solar",
      "Gerador",
    ],
    brokerId: "ricardo-fontes",
    closestPlaces: [
      { name: "Parque Villa-Lobos", time: "6 min" },
      { name: "Colégio Santa Cruz", time: "4 min" },
    ],
  },
];

export const DICTIONARY = {
  pt: {
    appName: "FA Imóveis",
    tagline: "A Arte de Viver Bem",
    subtitle:
      "Curadoria exclusiva dos imóveis mais extraordinários nas localizações mais desejadas.",
    searchPlaceholder: "R$ 5.000.000+",
    searchBtn: "Explorar",
    locationLabel: "Localização",
    typeLabel: "Tipo",
    priceLabel: "Preço Máximo",
    properties: "Propriedades",
    aboutUs: "Sobre Nós",
    concierge: "Concierge",
    neighborhoods: "Bairros",
    contact: "Contato",
    exclusivity: "Exclusividade",
    weeklyHighlights: "Destaques da Semana",
    viewAll: "Ver todos os imóveis",
    suites: "Quartos",
    area: "Área",
    vagas: "Vagas",
    condominio: "Condomínio",
    iptu: "IPTU",
    detailsBtn: "Ver Detalhes",
    sobConsulta: "Sob Consulta",
    specialistsTitle: "Nossos Especialistas",
    specialistsSubtitle:
      "Atendimento personalizado com os maiores conhecedores do mercado de alto padrão em São Paulo.",
    whatsappBtn: "WhatsApp",
    aboutSpecialist: "Sobre o Especialista",
    propertiesUnderManagement: "Imóveis Sob Gestão",
    startJourney: "Inicie Sua Próxima Jornada",
    journeySubtitle:
      "Interessado em uma das propriedades ou busca uma consultoria privada? Entre em contato diretamente para um atendimento exclusivo.",
    fullName: "Nome Completo",
    email: "E-mail",
    phone: "Telefone",
    interestLabel: "Qual o seu interesse?",
    messageLabel: "Mensagem",
    sendBtn: "Enviar Mensagem",
    simularParcelas: "Simular parcelas",
    interestFinancing: "Interessado no financiamento?",
    verifiedAgent: "Especialista Verificado",
    aboutProperty: "Sobre o Imóvel",
    comodidades: "Comodidades",
    privilegedLocation: "Localização Privilegiada",
    similarProperties: "Propriedades Semelhantes",
    fullPortfolio: "Ver Portfólio Completo",
    scheduleVisit: "Agendar Visita",
    speakWithSpecialist: "Falar com Especialista",
    allRightsReserved: "Todos os direitos reservados.",
    yearsOfExperience: "Anos de Mercado",
    propertiesSold: "Imóveis Vendidos",
    averageRating: "Avaliação Média",
    contactDirectly: "E-mail Direto",
    creci: "CRECI",
    successTitle: "Mensagem Enviada!",
    successMessage:
      "Obrigado por entrar em contato. Nosso especialista entrará em contato o mais rápido possível.",
    close: "Fechar",
    favorites: "Favoritos",
    noFavorites:
      "Nenhuma propriedade favoritada ainda. Toque no ícone de coração para salvar suas favoritas.",
    myMessages: "Minhas Mensagens",
    noMessages: "Nenhum contato enviado ainda.",
    adminPanel: "Painel Admin",
  },
  en: {
    appName: "FA Imóveis",
    tagline: "The Art of Living Well in São Paulo",
    subtitle:
      "Exclusive curation of the most extraordinary properties in the most coveted locations.",
    searchPlaceholder: "R$ 5,000,000+",
    searchBtn: "Explore",
    locationLabel: "Location",
    typeLabel: "Type",
    priceLabel: "Max Price",
    properties: "Properties",
    aboutUs: "About Us",
    concierge: "Concierge",
    neighborhoods: "Neighborhoods",
    contact: "Contact",
    exclusivity: "Exclusivity",
    weeklyHighlights: "Weekly Highlights",
    viewAll: "View all properties",
    suites: "Bedrooms",
    area: "Area",
    vagas: "Parking",
    condominio: "Condo Fee",
    iptu: "Property Tax",
    detailsBtn: "View Details",
    sobConsulta: "Upon Request",
    specialistsTitle: "Our Specialists",
    specialistsSubtitle:
      "Personalized service with the leading connoisseurs of the luxury market in São Paulo.",
    whatsappBtn: "WhatsApp",
    aboutSpecialist: "About the Specialist",
    propertiesUnderManagement: "Managed Properties",
    startJourney: "Begin Your Next Journey",
    journeySubtitle:
      "Interested in a property or looking for private consulting? Reach out directly for exclusive guidance.",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    interestLabel: "What is your interest?",
    messageLabel: "Message",
    sendBtn: "Send Message",
    simularParcelas: "Simulate installments",
    interestFinancing: "Interested in financing?",
    verifiedAgent: "Verified Specialist",
    aboutProperty: "About the Property",
    comodidades: "Amenities",
    privilegedLocation: "Privileged Location",
    similarProperties: "Similar Properties",
    fullPortfolio: "View Full Portfolio",
    scheduleVisit: "Schedule Visit",
    speakWithSpecialist: "Speak with Specialist",
    allRightsReserved: "All rights reserved.",
    yearsOfExperience: "Years in Market",
    propertiesSold: "Properties Sold",
    averageRating: "Average Rating",
    contactDirectly: "Direct Email",
    creci: "CRECI",
    successTitle: "Message Sent!",
    successMessage:
      "Thank you for your inquiry. Our specialist will get back to you as soon as possible.",
    close: "Close",
    favorites: "Favorites",
    noFavorites:
      "No bookmarked properties yet. Tap the heart icon to save your favorites.",
    myMessages: "My Inquiries",
    noMessages: "No inquiries sent yet.",
    adminPanel: "Admin Panel",
  },
};

export const DEFAULT_ABOUT_US: AboutUsConfig = {
  heroSubtitlePt: "FA Imóveis Luxury Estate",
  heroSubtitleEn: "FA Imóveis Luxury Estate",
  heroTitlePt: "Nossa História & Valores",
  heroTitleEn: "Our Story & Values",
  heroDescriptionPt:
    "Excelência, discrição absoluta e curadoria especializada no mercado de alto padrão de Caxias, MA.",
  heroDescriptionEn:
    "Excellence, absolute discretion, and specialized curation in the high-end market of Caxias, MA.",

  officeImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBGzuV18loojQPwPEK8KnLH9ew170xhZwBZUh1hoFcT-U9IkS57iD395_1fEwtF19KK7xz_SMQ_b-tb6PcouQvAoNrdva86SNwdnVNnY9W00sp_KvaoGLCvfi2wcVLY07Vv3_YR681U5VUGmNxZ8qTX1XeilaniZtsWTE18xGVQJ-5NApD_AJX6-Prsofyp6mW3kYiEOe8Q2WwbZnmstnHxIoj4NZ_ghbfUNeeXkPzCn2Rq51pYjEPCqIijIbrnPBI5-OCZ5B1BRw",
  officeImageBadgePt: "Sede Própria",
  officeImageBadgeEn: "Headquarters",
  officeAddress: "Rua São Pedro, 263 Centro",

  stat1Value: "100%",
  stat1LabelPt: "Atendimento Exclusivo",
  stat1LabelEn: "Exclusive Service",
  stat2Value: "R$ 50M+",
  stat2LabelPt: "Ativos sob Curadoria",
  stat2LabelEn: "Curated Assets",

  contentTitlePt: "A Arte de Unir Histórias e Lares Extraordinários",
  contentTitleEn: "The Art of Uniting Stories and Extraordinary Homes",

  contentParagraphsPt:
    "A FA Imóveis nasceu do desejo profundo de preencher uma lacuna essencial no mercado imobiliário do Maranhão: um atendimento focado na altíssima exclusividade, sofisticação e segurança patrimonial. Acreditamos que a busca por uma nova residência não se resume a um processo de compra e venda; trata-se da materialização de conquistas pessoais e da criação de um legado familiar.\n\nFundada no coração de Caxias, MA, consolidamo-nos como a imobiliária boutique de referência absoluta na intermediação e assessoria de imóveis de alto padrão. Nossa curadoria rigorosa analisa detalhadamente o potencial de cada ativo, desde a assinatura arquitetônica até a segurança jurídica de cada transação, assegurando que nossos clientes tomem decisões baseadas em solidez e transparência.\n\nNossa sede própria, localizada na Rua São Pedro, 263 - Centro, Caxias MA, foi inteiramente desenhada para proporcionar uma experiência de acolhimento sob medida, proporcionando discrição absoluta e total conforto aos nossos parceiros de negócios e clientes.",
  contentParagraphsEn:
    "FA Imóveis was born from a deep desire to fill an essential gap in the Maranhão real estate market: a service focused on ultra-exclusivity, sophistication, and asset protection. We believe that searching for a new residence is not just a buy-and-sell process; it is the materialization of personal achievements and the creation of a family legacy.\n\nFounded in the heart of Caxias, MA, we have established ourselves as the boutique real estate agency of absolute reference in high-end property brokerage and advisory. Our rigorous curation analyzes the potential of each asset in detail, from architectural signature to the legal safety of each transaction, ensuring our clients make decisions based on solidity and transparency.\n\nOur headquarters, located at Rua São Pedro, 263 - Centro, Caxias MA, was entirely designed to provide a tailored, welcoming experience, ensuring absolute discretion and complete comfort for our business partners and clients.",

  pillar1TitlePt: "Curadoria Rigorosa",
  pillar1TitleEn: "Rigorous Curation",
  pillar1DescPt:
    "Selecionamos criteriosamente propriedades que reúnem valor arquitetônico, localização premium e acabamentos nobres.",
  pillar1DescEn:
    "We carefully select properties that combine architectural value, premium location, and noble finishes.",

  pillar2TitlePt: "Discrição Absoluta",
  pillar2TitleEn: "Absolute Discretion",
  pillar2DescPt:
    "Garantimos sigilo integral em todas as etapas da negociação, respeitando rigorosamente a privacidade dos envolvidos.",
  pillar2DescEn:
    "We guarantee complete confidentiality at all stages of negotiation, strictly respecting the privacy of those involved.",

  pillar3TitlePt: "Solidez e Confiança",
  pillar3TitleEn: "Solidity & Trust",
  pillar3DescPt:
    "Proporcionamos suporte jurídico e assessoria completa em cada fase, transformando complexidade em segurança.",
  pillar3DescEn:
    "We provide legal support and complete advisory at every stage, turning complexity into safety.",
};
