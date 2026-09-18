import type { RecommendationCategory } from "@/generated/prisma/client";
import type { contactTypes, SectionType } from "@/lib/guide/sections";
import type { GuideLanguage } from "@/lib/guide/translation";

type ContactType = (typeof contactTypes)[number];

/** Textos fixos da interface do guia do hóspede. */
export type GuideStrings = {
  locale: string;
  welcome: string;
  exploreGuide: string;
  preparing: string;
  address: string;
  map: string;
  openMap: string;
  backHome: string;
  nav: { home: string; contact: string; search: string; help: string; more: string; label: string };
  contactTitle: string;
  contactSubtitle: string;
  noContact: string;
  propertyAddress: string;
  helpTitle: string;
  helpSubtitle: string;
  helpSteps: [string, string][];
  emergency: string;
  moreTitle: string;
  moreSubtitle: string;
  language: string;
  share: string;
  linkCopied: string;
  searchTitle: string;
  searchSubtitle: string;
  searchPlaceholder: string;
  searchSuggestions: string[];
  searchEmpty: (query: string) => string;
  emptySection: string;
  sectionDescriptions: Record<SectionType, string>;
  categories: Record<RecommendationCategory, string>;
  contactTypes: Record<ContactType, string>;
  copy: (label: string) => string;
  otherContacts: string;
  callTo: (name: string) => string;
  call: string;
  stats: { guests: string; bedroom: string; bedrooms: string; bed: string; beds: string; bathroom: string; bathrooms: string };
  highlights: string;
  photosSwipe: (count: number) => string;
  network: string;
  networkN: (index: number) => string;
  password: string;
  wifiQrAlt: (name: string) => string;
  wifiQrHint: string;
  information: string;
  connectionTips: string;
  checkIn: string;
  checkOut: string;
  from: string;
  until: string;
  toArrange: string;
  flexibleHours: string;
  keysAccess: string;
  onArrival: string;
  onDeparture: string;
  hostPicks: string;
  exploreNearby: string;
  seeOnMap: string;
  nearbySearches: { local_tips: string[]; restaurants: string[] };
  nearQuery: string;
  ratingLabel: string;
  stars: (value: number) => string;
  commentPlaceholder: string;
  namePlaceholder: string;
  sendError: string;
  sendDisabledPreview: string;
  sending: string;
  sendReview: string;
  thanks: string;
  rateOn: (platform: string) => string;
  talkToUs: string;
  illustrations: {
    play: string;
    pause: string;
    sofaBed: { title: string; steps: [string, string, string, string] };
  };
};

const pt: GuideStrings = {
  locale: "pt-BR",
  welcome: "Boas-vindas",
  exploreGuide: "Explorar Guia",
  preparing: "Este guia ainda está sendo preparado.",
  address: "Endereço",
  map: "Mapa",
  openMap: "Abrir no mapa",
  backHome: "Voltar ao início",
  nav: { home: "Início", contact: "Contato", search: "Buscar", help: "Ajuda", more: "Mais", label: "Navegação do guia" },
  contactTitle: "Contato",
  contactSubtitle: "Fale com o anfitrião",
  noContact: "Nenhuma forma de contato disponível.",
  propertyAddress: "Endereço do imóvel",
  helpTitle: "Ajuda",
  helpSubtitle: "Como usar este guia",
  helpSteps: [
    ["Navegue pelas seções", "Toque nos cards da página inicial para ver cada informação da sua estadia."],
    ["Use a busca", "Toque na lupa do menu inferior para encontrar qualquer informação rapidamente (ex.: senha, check-out)."],
    ["Volte ao início", "Use o botão Início do menu inferior para voltar à página principal a qualquer momento."],
    ["Salve o guia", "Adicione esta página aos favoritos ou à tela inicial do celular para acessar sempre que precisar."],
  ],
  emergency: "Emergência",
  moreTitle: "Mais",
  moreSubtitle: "Todas as seções do guia",
  language: "Idioma",
  share: "Compartilhar guia",
  linkCopied: "Link copiado!",
  searchTitle: "Buscar",
  searchSubtitle: "Encontre qualquer informação",
  searchPlaceholder: "Ex.: senha do wi-fi",
  searchSuggestions: ["Wi-Fi", "Senha", "Check-out", "Regras", "Estacionamento"],
  searchEmpty: (query) => `Nada encontrado para “${query}”.`,
  emptySection: "Esta seção ainda está vazia. Preencha no editor para ela aparecer para os hóspedes.",
  sectionDescriptions: {
    host: "Quem recebe você e como falar com o anfitrião",
    amenities: "O que o imóvel oferece",
    rules: "Combinados para uma boa estadia",
    about: "Capacidade, descrição e diferenciais",
    rooms: "Fotos e detalhes de cada cômodo",
    wifi: "Redes, senhas e dicas de conexão",
    emergency: "Telefones úteis em caso de necessidade",
    checkin: "Horários, chaves e instruções de chegada e saída",
    local_tips: "Atrações, mercados, farmácias e mais",
    restaurants: "Onde comer por perto",
    feedback: "Conte como foi sua estadia",
    transport: "Como chegar e se locomover",
    instructions: "Como usar equipamentos da casa",
    safety: "Dispositivos e orientações de segurança",
    events: "Agenda e acontecimentos da região",
    activities: "Passeios e experiências",
    services: "Lavanderia, academia, bancos...",
    accessibility: "Recursos de acessibilidade do imóvel",
  },
  categories: {
    RESTAURANTE: "Restaurante",
    ATRACAO: "Atração",
    TRANSPORTE: "Transporte",
    MERCADO: "Mercado",
    FARMACIA: "Farmácia",
    OUTRO: "Outro",
  },
  contactTypes: { whatsapp: "WhatsApp", phone: "Telefone", email: "E-mail", instagram: "Instagram", site: "Site" },
  copy: (label) => `Copiar ${label.toLowerCase()}`,
  otherContacts: "Outros contatos",
  callTo: (name) => `Ligar para ${name}`,
  call: "Ligar",
  stats: { guests: "hóspedes", bedroom: "quarto", bedrooms: "quartos", bed: "cama", beds: "camas", bathroom: "banheiro", bathrooms: "banheiros" },
  highlights: "Diferenciais",
  photosSwipe: (count) => `${count} fotos · deslize para ver`,
  network: "Rede",
  networkN: (index) => `Rede ${index}`,
  password: "Senha",
  wifiQrAlt: (name) => `QR code da rede ${name}`,
  wifiQrHint: "Aponte a câmera de outro aparelho para conectar automaticamente.",
  information: "Informações",
  connectionTips: "Dicas de conexão",
  checkIn: "Check-in",
  checkOut: "Check-out",
  from: "a partir das",
  until: "até as",
  toArrange: "A combinar",
  flexibleHours: "Precisa de outro horário? Fale com o anfitrião — sempre que possível ajustamos.",
  keysAccess: "Chaves e acesso",
  onArrival: "Na chegada",
  onDeparture: "Na saída",
  hostPicks: "Indicações do anfitrião",
  exploreNearby: "Explorar por perto",
  seeOnMap: "Ver no mapa",
  nearbySearches: {
    local_tips: ["Mercados", "Farmácias", "Atrações turísticas", "Praias", "Padarias", "Postos de combustível"],
    restaurants: ["Restaurantes", "Cafés", "Bares", "Pizzarias", "Delivery"],
  },
  nearQuery: "perto de",
  ratingLabel: "Nota",
  stars: (value) => `${value} estrela${value > 1 ? "s" : ""}`,
  commentPlaceholder: "Conte como foi sua estadia (opcional)",
  namePlaceholder: "Seu nome (opcional)",
  sendError: "Não foi possível enviar. Tente novamente.",
  sendDisabledPreview: "Envio desativado na pré-visualização",
  sending: "Enviando…",
  sendReview: "Enviar avaliação",
  thanks: "Obrigado!",
  rateOn: (platform) => `Avaliar no ${platform}`,
  talkToUs: "Fale com a gente",
  illustrations: {
    play: "Reproduzir animação",
    pause: "Pausar animação",
    sofaBed: {
      title: "Como abrir o sofá-cama",
      steps: [
        "Tire as almofadas do encosto e deixe-as de lado.",
        "Retire os assentos: eles não ficam na cama.",
        "Puxe a base de ripas para fora, segurando pela frente.",
        "Desdobre o colchão sobre a base até ele ficar plano.",
      ],
    },
  },
};

const en: GuideStrings = {
  locale: "en-US",
  welcome: "Welcome",
  exploreGuide: "Explore the guide",
  preparing: "This guide is still being prepared.",
  address: "Address",
  map: "Map",
  openMap: "Open in maps",
  backHome: "Back to home",
  nav: { home: "Home", contact: "Contact", search: "Search", help: "Help", more: "More", label: "Guide navigation" },
  contactTitle: "Contact",
  contactSubtitle: "Talk to your host",
  noContact: "No contact options available.",
  propertyAddress: "Property address",
  helpTitle: "Help",
  helpSubtitle: "How to use this guide",
  helpSteps: [
    ["Browse the sections", "Tap the cards on the home page to see each piece of information about your stay."],
    ["Use search", "Tap the magnifying glass in the bottom menu to quickly find anything (e.g. password, check-out)."],
    ["Go back home", "Use the Home button in the bottom menu to return to the main page at any time."],
    ["Save the guide", "Bookmark this page or add it to your phone's home screen to open it whenever you need."],
  ],
  emergency: "Emergency",
  moreTitle: "More",
  moreSubtitle: "All guide sections",
  language: "Language",
  share: "Share guide",
  linkCopied: "Link copied!",
  searchTitle: "Search",
  searchSubtitle: "Find any information",
  searchPlaceholder: "E.g. wi-fi password",
  searchSuggestions: ["Wi-Fi", "Password", "Check-out", "Rules", "Parking"],
  searchEmpty: (query) => `Nothing found for “${query}”.`,
  emptySection: "This section is still empty. Fill it in the editor so guests can see it.",
  sectionDescriptions: {
    host: "Who's hosting you and how to reach them",
    amenities: "What the property offers",
    rules: "Guidelines for a great stay",
    about: "Capacity, description and highlights",
    rooms: "Photos and details of each room",
    wifi: "Networks, passwords and connection tips",
    emergency: "Useful numbers in case you need them",
    checkin: "Times, keys and arrival and departure instructions",
    local_tips: "Attractions, markets, pharmacies and more",
    restaurants: "Where to eat nearby",
    feedback: "Tell us about your stay",
    transport: "Getting here and getting around",
    instructions: "How to use the appliances",
    safety: "Safety equipment and guidance",
    events: "What's happening in the area",
    activities: "Tours and experiences",
    services: "Laundry, gym, banks...",
    accessibility: "Accessibility features",
  },
  categories: {
    RESTAURANTE: "Restaurant",
    ATRACAO: "Attraction",
    TRANSPORTE: "Transport",
    MERCADO: "Market",
    FARMACIA: "Pharmacy",
    OUTRO: "Other",
  },
  contactTypes: { whatsapp: "WhatsApp", phone: "Phone", email: "Email", instagram: "Instagram", site: "Website" },
  copy: (label) => `Copy ${label.toLowerCase()}`,
  otherContacts: "Other contacts",
  callTo: (name) => `Call ${name}`,
  call: "Call",
  stats: { guests: "guests", bedroom: "bedroom", bedrooms: "bedrooms", bed: "bed", beds: "beds", bathroom: "bathroom", bathrooms: "bathrooms" },
  highlights: "Highlights",
  photosSwipe: (count) => `${count} photos · swipe to see`,
  network: "Network",
  networkN: (index) => `Network ${index}`,
  password: "Password",
  wifiQrAlt: (name) => `QR code for network ${name}`,
  wifiQrHint: "Point another device's camera here to connect automatically.",
  information: "Information",
  connectionTips: "Connection tips",
  checkIn: "Check-in",
  checkOut: "Check-out",
  from: "from",
  until: "until",
  toArrange: "To be arranged",
  flexibleHours: "Need a different time? Talk to your host — we'll adjust whenever possible.",
  keysAccess: "Keys and access",
  onArrival: "On arrival",
  onDeparture: "On departure",
  hostPicks: "Host's picks",
  exploreNearby: "Explore nearby",
  seeOnMap: "See on map",
  nearbySearches: {
    local_tips: ["Supermarkets", "Pharmacies", "Attractions", "Beaches", "Bakeries", "Gas stations"],
    restaurants: ["Restaurants", "Cafés", "Bars", "Pizza", "Delivery"],
  },
  nearQuery: "near",
  ratingLabel: "Rating",
  stars: (value) => `${value} star${value > 1 ? "s" : ""}`,
  commentPlaceholder: "Tell us about your stay (optional)",
  namePlaceholder: "Your name (optional)",
  sendError: "Couldn't send. Please try again.",
  sendDisabledPreview: "Sending is disabled in preview",
  sending: "Sending…",
  sendReview: "Send review",
  thanks: "Thank you!",
  rateOn: (platform) => `Review on ${platform}`,
  talkToUs: "Get in touch",
  illustrations: {
    play: "Play animation",
    pause: "Pause animation",
    sofaBed: {
      title: "How to open the sofa bed",
      steps: [
        "Take the back cushions off and set them aside.",
        "Remove the seat cushions: they don't stay on the bed.",
        "Pull the slatted base out, holding it by the front.",
        "Unfold the mattress over the base until it lies flat.",
      ],
    },
  },
};

const es: GuideStrings = {
  locale: "es",
  welcome: "Bienvenida",
  exploreGuide: "Explorar la guía",
  preparing: "Esta guía todavía se está preparando.",
  address: "Dirección",
  map: "Mapa",
  openMap: "Abrir en el mapa",
  backHome: "Volver al inicio",
  nav: { home: "Inicio", contact: "Contacto", search: "Buscar", help: "Ayuda", more: "Más", label: "Navegación de la guía" },
  contactTitle: "Contacto",
  contactSubtitle: "Habla con tu anfitrión",
  noContact: "No hay formas de contacto disponibles.",
  propertyAddress: "Dirección del alojamiento",
  helpTitle: "Ayuda",
  helpSubtitle: "Cómo usar esta guía",
  helpSteps: [
    ["Recorre las secciones", "Toca las tarjetas de la página de inicio para ver cada información de tu estadía."],
    ["Usa el buscador", "Toca la lupa del menú inferior para encontrar cualquier dato rápidamente (ej.: contraseña, check-out)."],
    ["Vuelve al inicio", "Usa el botón Inicio del menú inferior para volver a la página principal en cualquier momento."],
    ["Guarda la guía", "Agrega esta página a favoritos o a la pantalla de inicio del celular para abrirla cuando la necesites."],
  ],
  emergency: "Emergencia",
  moreTitle: "Más",
  moreSubtitle: "Todas las secciones de la guía",
  language: "Idioma",
  share: "Compartir guía",
  linkCopied: "¡Enlace copiado!",
  searchTitle: "Buscar",
  searchSubtitle: "Encuentra cualquier información",
  searchPlaceholder: "Ej.: contraseña del wi-fi",
  searchSuggestions: ["Wi-Fi", "Contraseña", "Check-out", "Normas", "Estacionamiento"],
  searchEmpty: (query) => `No se encontró nada para “${query}”.`,
  emptySection: "Esta sección todavía está vacía. Complétala en el editor para que los huéspedes la vean.",
  sectionDescriptions: {
    host: "Quién te recibe y cómo contactarlo",
    amenities: "Lo que ofrece el alojamiento",
    rules: "Acuerdos para una buena estadía",
    about: "Capacidad, descripción y diferenciales",
    rooms: "Fotos y detalles de cada ambiente",
    wifi: "Redes, contraseñas y consejos de conexión",
    emergency: "Teléfonos útiles en caso de necesidad",
    checkin: "Horarios, llaves e instrucciones de llegada y salida",
    local_tips: "Atracciones, mercados, farmacias y más",
    restaurants: "Dónde comer cerca",
    feedback: "Cuéntanos cómo fue tu estadía",
    transport: "Cómo llegar y moverse",
    instructions: "Cómo usar los equipos de la casa",
    safety: "Equipos y orientaciones de seguridad",
    events: "Agenda y eventos de la zona",
    activities: "Paseos y experiencias",
    services: "Lavandería, gimnasio, bancos...",
    accessibility: "Recursos de accesibilidad",
  },
  categories: {
    RESTAURANTE: "Restaurante",
    ATRACAO: "Atracción",
    TRANSPORTE: "Transporte",
    MERCADO: "Mercado",
    FARMACIA: "Farmacia",
    OUTRO: "Otro",
  },
  contactTypes: { whatsapp: "WhatsApp", phone: "Teléfono", email: "Correo", instagram: "Instagram", site: "Sitio web" },
  copy: (label) => `Copiar ${label.toLowerCase()}`,
  otherContacts: "Otros contactos",
  callTo: (name) => `Llamar a ${name}`,
  call: "Llamar",
  stats: { guests: "huéspedes", bedroom: "habitación", bedrooms: "habitaciones", bed: "cama", beds: "camas", bathroom: "baño", bathrooms: "baños" },
  highlights: "Diferenciales",
  photosSwipe: (count) => `${count} fotos · desliza para ver`,
  network: "Red",
  networkN: (index) => `Red ${index}`,
  password: "Contraseña",
  wifiQrAlt: (name) => `Código QR de la red ${name}`,
  wifiQrHint: "Apunta la cámara de otro dispositivo para conectarte automáticamente.",
  information: "Información",
  connectionTips: "Consejos de conexión",
  checkIn: "Check-in",
  checkOut: "Check-out",
  from: "desde las",
  until: "hasta las",
  toArrange: "A coordinar",
  flexibleHours: "¿Necesitas otro horario? Habla con el anfitrión — siempre que sea posible lo ajustamos.",
  keysAccess: "Llaves y acceso",
  onArrival: "A la llegada",
  onDeparture: "A la salida",
  hostPicks: "Recomendaciones del anfitrión",
  exploreNearby: "Explorar cerca",
  seeOnMap: "Ver en el mapa",
  nearbySearches: {
    local_tips: ["Supermercados", "Farmacias", "Atracciones", "Playas", "Panaderías", "Gasolineras"],
    restaurants: ["Restaurantes", "Cafeterías", "Bares", "Pizzerías", "Delivery"],
  },
  nearQuery: "cerca de",
  ratingLabel: "Calificación",
  stars: (value) => `${value} estrella${value > 1 ? "s" : ""}`,
  commentPlaceholder: "Cuéntanos cómo fue tu estadía (opcional)",
  namePlaceholder: "Tu nombre (opcional)",
  sendError: "No se pudo enviar. Inténtalo de nuevo.",
  sendDisabledPreview: "Envío desactivado en la vista previa",
  sending: "Enviando…",
  sendReview: "Enviar reseña",
  thanks: "¡Gracias!",
  rateOn: (platform) => `Reseñar en ${platform}`,
  talkToUs: "Contáctanos",
  illustrations: {
    play: "Reproducir animación",
    pause: "Pausar animación",
    sofaBed: {
      title: "Cómo abrir el sofá cama",
      steps: [
        "Quita los cojines del respaldo y déjalos a un lado.",
        "Retira los asientos: no se quedan en la cama.",
        "Tira de la base de listones hacia fuera, sujetándola por delante.",
        "Despliega el colchón sobre la base hasta que quede plano.",
      ],
    },
  },
};

export const guideStrings: Record<GuideLanguage, GuideStrings> = { pt, en, es };
