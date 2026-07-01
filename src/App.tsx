import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Maximize2,
  BedDouble,
  Briefcase,
  Award,
  Phone,
  Mail,
  Calendar,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Building,
  Check,
  MessageSquare,
  FileText,
} from "lucide-react";

import {
  ActiveView,
  Property,
  Broker,
  ContactMessage,
  Client,
  AboutUsConfig,
} from "./types";
import { PROPERTIES, BROKERS, DICTIONARY, DEFAULT_ABOUT_US } from "./data";
import {
  fetchPropertiesFromFirebase,
  seedPropertiesToFirebase,
  isConfigured,
  fetchBrokersFromFirebase,
  seedBrokersToFirebase,
  fetchClientsFromFirebase,
  auth,
  fetchAboutUsFromFirebase,
  saveAboutUsToFirebase,
} from "./lib/firebase";

import Header from "./components/Header";
import Footer from "./components/Footer";
import PropertyCard from "./components/PropertyCard";
import SearchFilter from "./components/SearchFilter";
import ContactForm from "./components/ContactForm";
import FinancingModal from "./components/FinancingModal";
import AdminPanel from "./components/AdminPanel";
import ContractModal from "./components/ContractModal";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>("home");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    "casa-modernista-jardins",
  );
  const [selectedBrokerId, setSelectedBrokerId] =
    useState<string>("ricardo-fontes");
  const language = "pt";

  // Admin authentication states
  const [adminUser, setAdminUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminUser(user);
      } else {
        setAdminUser(null);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Persistent-like offline states
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("fa_imoveis_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error reading favorites from localStorage:", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("fa_imoveis_favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("Error saving favorites to localStorage:", e);
    }
  }, [favorites]);
  const [sentMessages, setSentMessages] = useState<ContactMessage[]>([]);
  const [activeImageIndexes, setActiveImageIndexes] = useState<
    Record<string, number>
  >({});

  // Dynamic properties, brokers, & clients loaded from Firebase with static data fallback
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [brokers, setBrokers] = useState<Broker[]>(BROKERS);
  const [clients, setClients] = useState<Client[]>([]);
  const [aboutUsConfig, setAboutUsConfig] =
    useState<AboutUsConfig>(DEFAULT_ABOUT_US);

  // Contract Modal states
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedContractProperty, setSelectedContractProperty] =
    useState<Property | null>(null);
  const [selectedContractBuyer, setSelectedContractBuyer] =
    useState<Client | null>(null);
  const [selectedContractOwner, setSelectedContractOwner] =
    useState<Client | null>(null);

  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");

  useEffect(() => {
    const loadData = async () => {
      setLoadingProperties(true);
      try {
        const [fetchedProps, fetchedBrokers, fetchedClients, fetchedAboutUs] =
          await Promise.all([
            fetchPropertiesFromFirebase(),
            fetchBrokersFromFirebase(),
            fetchClientsFromFirebase(),
            fetchAboutUsFromFirebase(),
          ]);
        setProperties(fetchedProps);
        setBrokers(fetchedBrokers);
        setClients(fetchedClients);
        setAboutUsConfig(fetchedAboutUs);
      } catch (err) {
        console.warn(
          "Erro ao carregar dados do Firebase, usando fallback local:",
          err,
        );
      } finally {
        setLoadingProperties(false);
      }
    };
    loadData();
  }, []);

  const handleSeedFirebase = async () => {
    setSyncStatus("syncing");
    try {
      const [successProps, successBrokers] = await Promise.all([
        seedPropertiesToFirebase(),
        seedBrokersToFirebase(),
      ]);
      if (successProps && successBrokers) {
        setSyncStatus("success");
        const [fetchedProps, fetchedBrokers] = await Promise.all([
          fetchPropertiesFromFirebase(),
          fetchBrokersFromFirebase(),
        ]);
        setProperties(fetchedProps);
        setBrokers(fetchedBrokers);
        setTimeout(() => setSyncStatus("idle"), 3000);
      } else {
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
    } catch (err) {
      console.error(err);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  // Filtering States
  const [searchFilters, setSearchFilters] = useState({
    location: "Todos",
    type: "Todos",
    maxPrice: 0,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  // Modal State
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView, selectedPropertyId, selectedBrokerId]);

  const dict = DICTIONARY[language];

  // Favoriting Toggle
  const handleFavoriteToggle = (propertyId: string) => {
    setFavorites((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId],
    );
  };

  // Search Filter Handler
  const handleSearch = (filters: typeof searchFilters) => {
    setSearchFilters(filters);
    setIsFiltered(
      filters.location !== "Todos" ||
        filters.type !== "Todos" ||
        filters.maxPrice > 0,
    );
  };

  const handleResetFilters = () => {
    setSearchFilters({ location: "Todos", type: "Todos", maxPrice: 0 });
    setIsFiltered(false);
  };

  // Submit Contact Inquiry
  const handleMessageSubmit = (
    msgData: Omit<ContactMessage, "id" | "date">,
  ) => {
    const newMessage: ContactMessage = {
      ...msgData,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString(
        language === "pt" ? "pt-BR" : "en-US",
        {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        },
      ),
    };
    setSentMessages((prev) => [newMessage, ...prev]);
  };

  // Filtered Properties List
  const filteredProperties = properties.filter((property) => {
    if (
      searchFilters.location !== "Todos" &&
      property.location !== searchFilters.location
    ) {
      return false;
    }
    if (
      searchFilters.type !== "Todos" &&
      property.type !== searchFilters.type
    ) {
      return false;
    }
    if (
      searchFilters.maxPrice > 0 &&
      property.price > 0 &&
      property.price > searchFilters.maxPrice
    ) {
      return false;
    }
    return true;
  });

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) ||
    properties[0] ||
    PROPERTIES[0];
  const selectedBroker =
    brokers.find((b) => b.id === selectedBrokerId) || brokers[0] || BROKERS[0];

  // Custom Property detail broker
  const propertyBroker =
    brokers.find((b) => b.id === selectedProperty.brokerId) ||
    brokers[0] ||
    BROKERS[0];

  // Lookups for linked owner and buyer clients
  const propertyOwner = clients.find(
    (c) =>
      c.type === "owner" &&
      (c.id === selectedProperty.ownerId ||
        c.propertyId === selectedProperty.id),
  );
  const propertyBuyers = clients.filter(
    (c) => c.type === "buyer" && c.propertyId === selectedProperty.id,
  );

  // Helper for currency formatting
  const formatBRL = (value: number) => {
    if (value === 0) return dict.sobConsulta;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 transition-colors duration-300">
      {/* Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        language={language}
        onLanguageToggle={() => {}}
        favoritesCount={favorites.length}
        messagesCount={sentMessages.length}
      />

      {/* Main Container - padding top matches fixed header height */}
      <main className="flex-grow pt-20">
        <AnimatePresence mode="wait">
          {/* VIEW: HOME */}
          {currentView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-16"
            >
              {/* Majestic Hero Banner */}
              <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black text-white">
                {/* Visual architectural background matching first screen */}
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6BJ0-5BGQiDSssLM7U4hcEDcouwLF5mtKNbBvtvc6CUsawgOl1ZQLp3JBrbmYAx7J5KYgF3bq-CpdL8sM0IolV4cQNVoFI8gsywY5zMSWVvKY-znm_OojtgyX4omcaeA2Hi9XcUZ_JlEY30ZlChK6qhkQqSvySf0PXwRhft9v2npIFVcBkh9xPNXVxHeO9TadRWn_0rYvqAXFjgpb8EMTUBwEkhgWBUTidkhleg-jpYaTHO4oUqb_7Cymgk53172_7COl583nKA"
                    alt="Luxury Estate Architecture"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    className="w-full h-full object-cover opacity-50 scale-100 transition-transform duration-10000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-6">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-4">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">
                      {dict.exclusivity}
                    </span>
                  </div>

                  <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto">
                    {dict.tagline}
                  </h1>

                  <p className="font-sans text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
                    {dict.subtitle}
                  </p>

                  {/* Search Filter Overlay */}
                  <div className="pt-8">
                    <SearchFilter
                      onSearch={handleSearch}
                      onReset={handleResetFilters}
                      language={language}
                      isFiltered={isFiltered}
                      properties={properties}
                    />
                  </div>
                </div>

                {/* Visual decoration: bottom wave or line */}
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-gray-50 to-transparent" />
              </section>

              {/* Filtered Status Info if Search is active */}
              {isFiltered && (
                <div className="max-w-7xl mx-auto px-6">
                  <div className="bg-yellow-600/5 border border-yellow-600/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm">
                      {language === "pt"
                        ? "Resultados da busca para:"
                        : "Search results for:"}{" "}
                      <span className="font-bold text-gray-900">
                        {searchFilters.location !== "Todos"
                          ? searchFilters.location
                          : ""}
                        {searchFilters.location !== "Todos" &&
                        searchFilters.type !== "Todos"
                          ? " • "
                          : ""}
                        {searchFilters.type !== "Todos"
                          ? searchFilters.type
                          : ""}
                        {searchFilters.maxPrice > 0
                          ? ` • ${language === "pt" ? "Até" : "Up to"} ${formatBRL(searchFilters.maxPrice)}`
                          : ""}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({filteredProperties.length}{" "}
                        {language === "pt"
                          ? "imóveis encontrados"
                          : "properties found"}
                        )
                      </span>
                    </div>
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-bold text-yellow-600 hover:text-black hover:underline transition-all cursor-pointer"
                    >
                      {language === "pt"
                        ? "Limpar Filtros e Ver Todos"
                        : "Clear Filters and View All"}
                    </button>
                  </div>
                </div>
              )}

              {/* Properties Grid */}
              <section className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block mb-1">
                      {language === "pt"
                        ? "Portfólio de Luxo"
                        : "Luxury Portfolio"}
                    </span>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
                      {dict.weeklyHighlights}
                    </h2>
                  </div>
                  {isFiltered && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {dict.viewAll} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {filteredProperties.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 space-y-4">
                    <span className="text-4xl">🏝️</span>
                    <h3 className="font-serif text-xl font-bold">
                      {language === "pt"
                        ? "Nenhum imóvel encontrado"
                        : "No properties found"}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      {language === "pt"
                        ? "Tente relaxar os filtros de pesquisa ou remover a restrição de valor máximo."
                        : "Try resetting your search parameters or increasing the maximum budget."}
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="bg-black text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase cursor-pointer"
                    >
                      {language === "pt" ? "Limpar Filtros" : "Clear Filters"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={favorites.includes(property.id)}
                        onFavoriteToggle={() =>
                          handleFavoriteToggle(property.id)
                        }
                        onDetailsClick={() => {
                          setSelectedPropertyId(property.id);
                          setCurrentView("property-detail");
                        }}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Specialists section matching style 3 */}
              <section className="bg-gray-950 text-white py-16">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                    <span className="text-[11px] font-bold text-yellow-500 uppercase tracking-widest block">
                      FA Imóveis Associates
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
                      {dict.specialistsTitle}
                    </h2>
                    <p className="text-gray-400 text-xs md:text-sm">
                      {dict.specialistsSubtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {brokers.map((broker) => (
                      <div
                        key={broker.id}
                        onClick={() => {
                          setSelectedBrokerId(broker.id);
                          setCurrentView("broker-detail");
                        }}
                        className="group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-500 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer"
                      >
                        <div className="relative h-72 bg-gray-950 overflow-hidden">
                          <img
                            src={broker.image}
                            alt={broker.name}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                        </div>
                        <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest block mb-1">
                              {broker.specialty}
                            </span>
                            <h3 className="font-serif text-lg font-bold text-white group-hover:text-yellow-500 transition-colors">
                              {broker.name}
                            </h3>
                            <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                              {broker.title}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
                            <span>
                              {broker.yearsOfExperience}{" "}
                              {language === "pt" ? "Anos" : "Years"} Exp
                            </span>
                            <span className="text-yellow-500 font-bold">
                              ★ {broker.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* General Contact section */}
              <section
                id="contato-secao"
                className="max-w-4xl mx-auto px-6 py-8"
              >
                <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
                  <span className="text-[11px] font-bold text-yellow-600 uppercase tracking-widest block">
                    {language === "pt" ? "Contato Geral" : "General Inquiry"}
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-gray-900">
                    {dict.startJourney}
                  </h2>
                  <p className="text-gray-500 text-xs md:text-sm">
                    {dict.journeySubtitle}
                  </p>
                </div>

                <ContactForm
                  language={language}
                  onMessageSubmit={handleMessageSubmit}
                  type="general"
                />
              </section>
            </motion.div>
          )}

          {/* VIEW: PROPERTY DETAILS */}
          {currentView === "property-detail" && (
            <motion.div
              key="property-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto px-6 py-8 space-y-10"
            >
              {/* Back Button and Breadcrumbs */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button
                  onClick={() => setCurrentView("home")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black transition-colors cursor-pointer uppercase tracking-wider"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {language === "pt"
                    ? "Voltar para os imóveis"
                    : "Back to properties"}
                </button>
                <div className="text-[11px] font-sans text-gray-400 uppercase tracking-widest">
                  Home &gt; {selectedProperty.location.split(",")[0]} &gt;{" "}
                  <span className="text-gray-900 font-bold">
                    {selectedProperty.title}
                  </span>
                </div>
              </div>

              {/* Title & Top Info Header matching first parts of screen 2 */}
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-6">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="bg-yellow-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                      {selectedProperty.type}
                    </span>
                    {selectedProperty.status &&
                      selectedProperty.status !== "available" && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider font-bold ${
                            selectedProperty.status === "interested"
                              ? "bg-amber-500 text-black"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {selectedProperty.status === "interested"
                            ? "🟡 Reservado"
                            : "🔴 Vendido"}
                        </span>
                      )}
                    {(!selectedProperty.status ||
                      selectedProperty.status === "available") &&
                      selectedProperty.badge && (
                        <span className="bg-black text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                          {selectedProperty.badge}
                        </span>
                      )}
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-950 mb-2">
                    {selectedProperty.title}
                  </h1>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                    {selectedProperty.description}
                  </p>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    {language === "pt"
                      ? "Preço de Aquisição"
                      : "Purchase Value"}
                  </span>
                  <span className="text-3xl md:text-4xl font-serif font-black text-gray-950">
                    {formatBRL(selectedProperty.price)}
                  </span>
                  {!selectedProperty.isSobConsulta &&
                    selectedProperty.price > 0 && (
                      <button
                        onClick={() => setIsFinancingModalOpen(true)}
                        className="text-xs text-yellow-600 hover:text-black font-semibold underline mt-1 cursor-pointer"
                      >
                        {dict.simularParcelas}
                      </button>
                    )}
                </div>
              </div>

              {/* Media gallery grid matching middle part of screen 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main large image with custom simple carousel */}
                <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gray-50 h-[450px]">
                  <img
                    src={
                      selectedProperty.images[
                        activeImageIndexes[selectedProperty.id] || 0
                      ]
                    }
                    alt={selectedProperty.title}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    className="w-full h-full object-cover"
                  />

                  {/* Image counter / Navigation */}
                  {selectedProperty.images.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          const currentIdx =
                            activeImageIndexes[selectedProperty.id] || 0;
                          const nextIdx =
                            (currentIdx - 1 + selectedProperty.images.length) %
                            selectedProperty.images.length;
                          setActiveImageIndexes((prev) => ({
                            ...prev,
                            [selectedProperty.id]: nextIdx,
                          }));
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/70 backdrop-blur-md hover:bg-white text-black rounded-full shadow-md transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const currentIdx =
                            activeImageIndexes[selectedProperty.id] || 0;
                          const nextIdx =
                            (currentIdx + 1) % selectedProperty.images.length;
                          setActiveImageIndexes((prev) => ({
                            ...prev,
                            [selectedProperty.id]: nextIdx,
                          }));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/70 backdrop-blur-md hover:bg-white text-black rounded-full shadow-md transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Bookmark button */}
                  <button
                    onClick={() => handleFavoriteToggle(selectedProperty.id)}
                    className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md hover:bg-white rounded-full shadow-lg text-gray-700 hover:text-red-500 cursor-pointer transition-all transform hover:scale-105"
                  >
                    <Heart
                      className={`w-5 h-5 ${favorites.includes(selectedProperty.id) ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </button>

                  {/* Indicator info dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-md py-1.5 px-3 rounded-full">
                    {selectedProperty.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setActiveImageIndexes((prev) => ({
                            ...prev,
                            [selectedProperty.id]: idx,
                          }))
                        }
                        className={`w-2 h-2 rounded-full transition-all ${
                          (activeImageIndexes[selectedProperty.id] || 0) === idx
                            ? "bg-white scale-125"
                            : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sub-gallery images or specs breakdown block */}
                <div className="flex flex-col gap-6 justify-between h-full">
                  {/* Thumbnails if multiple images, otherwise specs card */}
                  {selectedProperty.images.length > 1 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProperty.images.map((img, index) => (
                        <div
                          key={index}
                          onClick={() =>
                            setActiveImageIndexes((prev) => ({
                              ...prev,
                              [selectedProperty.id]: index,
                            }))
                          }
                          className={`h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                            (activeImageIndexes[selectedProperty.id] || 0) ===
                            index
                              ? "border-yellow-600 scale-98 shadow-md"
                              : "border-transparent opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt=""
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-600/5 p-4 rounded-xl border border-yellow-600/10">
                      <p className="text-[10px] text-yellow-700 font-extrabold uppercase tracking-widest mb-1">
                        {language === "pt"
                          ? "Atendimento Premium"
                          : "Exclusive Treatment"}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {language === "pt"
                          ? "Esta propriedade possui curadoria exclusiva e acompanhamento individualizado em todas as etapas da visita e negociação."
                          : "This property has custom curation and personal concierge assistance during all viewing and negotiation steps."}
                      </p>
                    </div>
                  )}

                  {/* Ficha de Negociação / Proprietário card */}
                  {(propertyOwner ||
                    propertyBuyers.length > 0 ||
                    (selectedProperty.status &&
                      selectedProperty.status !== "available")) && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md space-y-4 text-left">
                      <h3 className="font-sans text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-2">
                        <span className="text-sm">📋</span>{" "}
                        {language === "pt"
                          ? "Ficha de Acompanhamento"
                          : "Tracking Sheet"}
                      </h3>

                      {propertyOwner && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">
                            {language === "pt"
                              ? "Proprietário / Vendedor"
                              : "Owner / Seller"}
                          </span>
                          <p className="text-xs font-bold text-gray-950">
                            {propertyOwner.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {propertyOwner.phone} • {propertyOwner.email}
                          </p>
                        </div>
                      )}

                      {propertyBuyers.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">
                            {language === "pt"
                              ? "Clientes Interessados"
                              : "Interested Clients"}
                          </span>
                          <div className="space-y-2">
                            {propertyBuyers.map((buyer) => (
                              <div
                                key={buyer.id}
                                className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center gap-3"
                              >
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {buyer.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-gray-500 font-mono">
                                      {buyer.phone}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider ${
                                        buyer.buyerStatus === "signed_contract"
                                          ? "bg-red-50 text-red-700"
                                          : "bg-yellow-50 text-yellow-700"
                                      }`}
                                    >
                                      {buyer.buyerStatus === "signed_contract"
                                        ? language === "pt"
                                          ? "Vendido"
                                          : "Sold"
                                        : language === "pt"
                                          ? "Interessado"
                                          : "Interested"}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedContractProperty(
                                      selectedProperty,
                                    );
                                    setSelectedContractBuyer(buyer);
                                    setSelectedContractOwner(
                                      propertyOwner || undefined,
                                    );
                                    setContractModalOpen(true);
                                  }}
                                  title={
                                    language === "pt"
                                      ? "Gerar Contrato de Venda"
                                      : "Generate Contract"
                                  }
                                  className="p-2 bg-yellow-500 hover:bg-black text-black hover:text-white rounded-xl transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center border border-yellow-400"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedProperty.status &&
                        selectedProperty.status !== "available" && (
                          <div className="pt-2 border-t border-gray-100">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block mb-1">
                              {language === "pt"
                                ? "Status de Negociação"
                                : "Deal Status"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                                selectedProperty.status === "sold"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {selectedProperty.status === "sold"
                                ? language === "pt"
                                  ? "🔴 Vendido"
                                  : "🔴 Sold"
                                : language === "pt"
                                  ? "🟡 Reservado"
                                  : "🟡 Reserved"}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Pricing financial card */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md space-y-4">
                    <h3 className="font-sans text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {language === "pt"
                        ? "Detalhamento Mensal"
                        : "Monthly Breakdown"}
                    </h3>

                    <div className="space-y-2 text-sm">
                      {selectedProperty.condominio &&
                      selectedProperty.condominio > 0 ? (
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-500">
                            {dict.condominio}
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatBRL(selectedProperty.condominio)}
                          </span>
                        </div>
                      ) : null}
                      {selectedProperty.iptu && selectedProperty.iptu > 0 ? (
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-500">
                            {dict.iptu} ({language === "pt" ? "ano" : "year"})
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatBRL(selectedProperty.iptu)}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">{dict.area}</span>
                        <span className="font-bold text-gray-900">
                          {selectedProperty.area} m²
                        </span>
                      </div>
                    </div>

                    {!selectedProperty.isSobConsulta &&
                      selectedProperty.price > 0 && (
                        <button
                          onClick={() => setIsFinancingModalOpen(true)}
                          className="w-full py-3 bg-yellow-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-sm cursor-pointer"
                        >
                          {dict.simularParcelas}
                        </button>
                      )}
                  </div>
                </div>
              </div>

              {/* Grid with Description and Broker Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left content: Details */}
                <div className="lg:col-span-2 space-y-10">
                  {/* Key specs row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                        {dict.suites}
                      </span>
                      <span className="text-xl font-serif font-bold text-gray-900 flex items-center justify-center gap-1.5">
                        <BedDouble className="w-5 h-5 text-yellow-600" />
                        {selectedProperty.suites}
                      </span>
                    </div>
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                        {dict.area}
                      </span>
                      <span className="text-xl font-serif font-bold text-gray-900 flex items-center justify-center gap-1.5">
                        <Maximize2 className="w-5 h-5 text-yellow-600" />
                        {selectedProperty.area} m²
                      </span>
                    </div>
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                        {dict.vagas}
                      </span>
                      <span className="text-xl font-serif font-bold text-gray-900 flex items-center justify-center gap-1.5">
                        <span className="text-lg">🚙</span>
                        {selectedProperty.vagas}
                      </span>
                    </div>
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                        {language === "pt" ? "Banheiros" : "Bathrooms"}
                      </span>
                      <span className="text-xl font-serif font-bold text-gray-900 flex items-center justify-center gap-1.5">
                        <span className="text-lg">🚿</span>
                        {selectedProperty.bathrooms}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <h2 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2">
                      {dict.aboutProperty}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {selectedProperty.fullDescription}
                    </p>
                  </div>

                  {/* Comodidades Grid */}
                  <div className="space-y-4">
                    <h2 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2">
                      {dict.comodidades}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedProperty.comodidades.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-gray-50 text-xs text-gray-700 font-medium"
                        >
                          <Check className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privileged Location and Closer Places section */}
                  <div className="space-y-4">
                    <h2 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2">
                      {dict.privilegedLocation}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4 text-xs md:text-sm text-gray-600">
                        <p>
                          {language === "pt"
                            ? `Situado na valorizada região do ${selectedProperty.neighborhood}, este imóvel conta com excelente mobilidade e facilidade de acesso.`
                            : `Situated in the prestigious ${selectedProperty.neighborhood} area, this property has excellent mobility and reach.`}
                        </p>

                        {selectedProperty.showAddressOnSite &&
                          selectedProperty.address && (
                            <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-3 flex gap-2 items-start text-xs text-gray-800">
                              <span className="text-yellow-600 text-sm mt-0.5">
                                📍
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 block">
                                  {language === "pt" ? "Endereço:" : "Address:"}
                                </span>
                                <span>{selectedProperty.address}</span>
                              </div>
                            </div>
                          )}

                        <div className="space-y-3">
                          {selectedProperty.closestPlaces &&
                            selectedProperty.closestPlaces.map((place) => (
                              <div
                                key={place.name}
                                className="flex justify-between border-b border-gray-100 pb-2"
                              >
                                <span className="font-medium text-gray-800">
                                  {place.name}
                                </span>
                                <span className="text-yellow-600 font-bold">
                                  {place.time}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Interactive map widget */}
                      <div className="rounded-xl overflow-hidden h-48 border border-gray-100 relative group">
                        <iframe
                          src={`https://maps.google.com/maps?width=100%25&amp;height=200&amp;hl=pt&amp;q=${encodeURIComponent(
                            selectedProperty.showAddressOnSite &&
                              selectedProperty.address
                              ? selectedProperty.address
                              : `${selectedProperty.neighborhood ? selectedProperty.neighborhood + ", " : ""}${selectedProperty.location}`,
                          )}&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          aria-hidden="false"
                          tabIndex={0}
                          title="Property Location"
                          className="grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right content: Broker Contact Widget matching Image 2 style */}
                <div className="space-y-8">
                  <div className="bg-gray-950 text-white rounded-2xl p-6 shadow-xl border border-gray-800 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                        <img
                          src={propertyBroker.image}
                          alt={propertyBroker.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-extrabold block">
                          {dict.verifiedAgent}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-white leading-tight">
                          {propertyBroker.name}
                        </h4>
                        <button
                          onClick={() => {
                            setSelectedBrokerId(propertyBroker.id);
                            setCurrentView("broker-detail");
                          }}
                          className="text-[11px] text-gray-400 hover:text-white underline mt-0.5 cursor-pointer text-left block"
                        >
                          {dict.aboutSpecialist}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs text-gray-300">
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-yellow-500" />
                        <span>{propertyBroker.phone}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-yellow-500" />
                        <span>{propertyBroker.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Building className="w-4 h-4 text-yellow-500" />
                        <span>
                          {dict.creci}: {propertyBroker.creci}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/${propertyBroker.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          language === "pt"
                            ? `Olá, estou interessado na propriedade ${selectedProperty.title} e gostaria de agendar uma conversa.`
                            : `Hello, I am interested in ${selectedProperty.title} and would like to chat.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white text-center text-xs font-bold uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>🟢</span>
                        {dict.whatsappBtn}
                      </a>
                      <button
                        onClick={() => {
                          const contactFormElement = document.getElementById(
                            "agendar-visita-form",
                          );
                          contactFormElement?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }}
                        className="border border-white hover:bg-white hover:text-black text-white text-xs font-bold uppercase tracking-wider py-3 rounded-lg transition-all text-center cursor-pointer"
                      >
                        {dict.scheduleVisit}
                      </button>
                    </div>
                  </div>

                  {/* Custom contact form for booking/scheduling visits */}
                  <div id="agendar-visita-form">
                    <ContactForm
                      language={language}
                      propertyTitle={selectedProperty.title}
                      brokerName={propertyBroker.name}
                      onMessageSubmit={handleMessageSubmit}
                      type="visit"
                    />
                  </div>
                </div>
              </div>

              {/* Similar properties section */}
              <section className="pt-10 border-t border-gray-100">
                <div className="mb-8">
                  <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block mb-1">
                    {language === "pt"
                      ? "Oportunidades Relacionadas"
                      : "Curated Match"}
                  </span>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-gray-900">
                    {dict.similarProperties}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {properties
                    .filter((p) => p.id !== selectedProperty.id)
                    .slice(0, 3)
                    .map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={favorites.includes(property.id)}
                        onFavoriteToggle={() =>
                          handleFavoriteToggle(property.id)
                        }
                        onDetailsClick={() => {
                          setSelectedPropertyId(property.id);
                        }}
                        language={language}
                      />
                    ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* VIEW: BROKER DETAIL (Ricardo Fontes or other brokers) */}
          {currentView === "broker-detail" && (
            <motion.div
              key="broker-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto px-6 py-8 space-y-12"
            >
              {/* Back button */}
              <button
                onClick={() => setCurrentView("home")}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black transition-colors cursor-pointer uppercase tracking-wider"
              >
                <ChevronLeft className="w-4 h-4" />
                {language === "pt"
                  ? "Voltar para os especialistas"
                  : "Back to specialists"}
              </button>

              {/* Main Profile Layout matching screen 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left side: Avatar and Quick metrics */}
                <div className="space-y-6 flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="relative w-72 h-96 rounded-2xl overflow-hidden bg-gray-100 shadow-xl border border-gray-100">
                    <img
                      src={selectedBroker.image}
                      alt={selectedBroker.name}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      fetchPriority="high"
                      decoding="sync"
                      className="w-full h-full object-cover object-top"
                    />

                    {/* Badge */}
                    <div className="absolute bottom-4 left-4 bg-yellow-600 text-white text-[10px] font-sans font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg">
                      {selectedBroker.specialty}
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <div>
                      <h1 className="font-serif text-3xl font-black text-gray-950 mb-1">
                        {selectedBroker.name}
                      </h1>
                      <p className="text-gray-500 text-sm font-medium">
                        {selectedBroker.title}
                      </p>
                      <p className="text-xs text-yellow-600 font-bold mt-1">
                        {dict.creci}: {selectedBroker.creci}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">
                          {dict.yearsOfExperience}
                        </span>
                        <span className="text-sm font-serif font-black text-gray-900">
                          {selectedBroker.yearsOfExperience}+
                        </span>
                      </div>
                      <div className="space-y-0.5 border-l border-gray-100">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">
                          {dict.propertiesSold}
                        </span>
                        <span className="text-sm font-serif font-black text-gray-900">
                          {selectedBroker.propertiesSold}+
                        </span>
                      </div>
                      <div className="space-y-0.5 border-l border-gray-100">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">
                          {dict.averageRating}
                        </span>
                        <span className="text-sm font-serif font-black text-yellow-600">
                          ★ {selectedBroker.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Bio and contact */}
                <div className="lg:col-span-2 space-y-10">
                  {/* Elegant quotes / statement block */}
                  <div className="bg-gray-950 text-white p-8 rounded-2xl relative overflow-hidden shadow-xl border border-gray-800">
                    <div className="absolute top-4 right-6 text-6xl text-yellow-600/25 font-serif italic font-black">
                      “
                    </div>
                    <p className="font-serif text-lg md:text-xl font-medium tracking-wide italic leading-relaxed max-w-lg mb-2 text-yellow-500">
                      &ldquo;{selectedBroker.quote}&rdquo;
                    </p>
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mt-4">
                      {selectedBroker.name}
                    </span>
                  </div>

                  {/* Biography */}
                  <div className="space-y-4">
                    <h2 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2">
                      {dict.aboutSpecialist}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {selectedBroker.bio}
                    </p>
                  </div>

                  {/* List of Properties Managed by this Broker */}
                  <div className="space-y-6">
                    <h2 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2">
                      {dict.propertiesUnderManagement}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {properties
                        .filter((p) => p.brokerId === selectedBroker.id)
                        .map((property) => (
                          <PropertyCard
                            key={property.id}
                            property={property}
                            isFavorite={favorites.includes(property.id)}
                            onFavoriteToggle={() =>
                              handleFavoriteToggle(property.id)
                            }
                            onDetailsClick={() => {
                              setSelectedPropertyId(property.id);
                              setCurrentView("property-detail");
                            }}
                            language={language}
                          />
                        ))}
                    </div>
                  </div>

                  {/* Direct Message Form */}
                  <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-md">
                    <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">
                      {language === "pt"
                        ? `Enviar uma Mensagem Direta para ${selectedBroker.name}`
                        : `Send a Direct Message to ${selectedBroker.name}`}
                    </h3>
                    <ContactForm
                      language={language}
                      brokerName={selectedBroker.name}
                      onMessageSubmit={handleMessageSubmit}
                      type="broker"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: ABOUT US */}
          {currentView === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto px-6 py-12 space-y-16"
            >
              {/* Breadcrumbs and Hero Header */}
              <div className="space-y-4">
                <div className="text-[11px] font-sans text-gray-400 uppercase tracking-widest">
                  Home &gt;{" "}
                  <span className="text-gray-900 font-bold">
                    {language === "pt" ? "Sobre Nós" : "About Us"}
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                    {language === "pt"
                      ? aboutUsConfig.heroSubtitlePt
                      : aboutUsConfig.heroSubtitleEn}
                  </span>
                  <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-tight">
                    {language === "pt"
                      ? aboutUsConfig.heroTitlePt
                      : aboutUsConfig.heroTitleEn}
                  </h1>
                  <p className="text-gray-500 text-sm md:text-base max-w-3xl leading-relaxed">
                    {language === "pt"
                      ? aboutUsConfig.heroDescriptionPt
                      : aboutUsConfig.heroDescriptionEn}
                  </p>
                </div>
              </div>

              {/* Story Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left: Interactive Cover Cards & Key Numbers */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-gray-900 group">
                    <img
                      src={
                        aboutUsConfig.officeImage ||
                        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
                      }
                      alt="Office"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">
                        {language === "pt"
                          ? aboutUsConfig.officeImageBadgePt
                          : aboutUsConfig.officeImageBadgeEn}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-white mt-1">
                        {aboutUsConfig.officeAddress}
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <div className="space-y-1">
                      <span className="block font-serif text-3xl font-black text-gray-950">
                        {aboutUsConfig.stat1Value}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">
                        {language === "pt"
                          ? aboutUsConfig.stat1LabelPt
                          : aboutUsConfig.stat1LabelEn}
                      </span>
                    </div>
                    <div className="space-y-1 border-l border-gray-100">
                      <span className="block font-serif text-3xl font-black text-gray-950">
                        {aboutUsConfig.stat2Value}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">
                        {language === "pt"
                          ? aboutUsConfig.stat2LabelPt
                          : aboutUsConfig.stat2LabelEn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Detailed text */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-gray-900">
                      {language === "pt"
                        ? aboutUsConfig.contentTitlePt
                        : aboutUsConfig.contentTitleEn}
                    </h3>
                    {(language === "pt"
                      ? aboutUsConfig.contentParagraphsPt
                      : aboutUsConfig.contentParagraphsEn
                    )
                      .split("\n")
                      .filter((p) => p.trim())
                      .map((p, idx) => (
                        <p
                          key={idx}
                          className="text-gray-600 text-sm leading-relaxed font-sans"
                        >
                          {p}
                        </p>
                      ))}
                  </div>

                  {/* Pillars */}
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h4 className="font-sans text-xs font-bold text-yellow-600 uppercase tracking-widest">
                      {language === "pt"
                        ? "Nossos Pilares Fundamentais"
                        : "Our Fundamental Pillars"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-yellow-600 font-bold text-xs block">
                          ✧{" "}
                          {language === "pt"
                            ? aboutUsConfig.pillar1TitlePt
                            : aboutUsConfig.pillar1TitleEn}
                        </span>
                        <p className="text-gray-500 text-[11px] leading-normal">
                          {language === "pt"
                            ? aboutUsConfig.pillar1DescPt
                            : aboutUsConfig.pillar1DescEn}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-yellow-600 font-bold text-xs block">
                          ✧{" "}
                          {language === "pt"
                            ? aboutUsConfig.pillar2TitlePt
                            : aboutUsConfig.pillar2TitleEn}
                        </span>
                        <p className="text-gray-500 text-[11px] leading-normal">
                          {language === "pt"
                            ? aboutUsConfig.pillar2DescPt
                            : aboutUsConfig.pillar2DescEn}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-yellow-600 font-bold text-xs block">
                          ✧{" "}
                          {language === "pt"
                            ? aboutUsConfig.pillar3TitlePt
                            : aboutUsConfig.pillar3TitleEn}
                        </span>
                        <p className="text-gray-500 text-[11px] leading-normal">
                          {language === "pt"
                            ? aboutUsConfig.pillar3DescPt
                            : aboutUsConfig.pillar3DescEn}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map & Office Section */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 p-8 md:p-12 space-y-6 flex flex-col justify-center">
                  <div>
                    <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest block mb-1">
                      Visite-nos
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-gray-950">
                      Nossa Sede
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                    Estamos à sua inteira disposição no coração de Caxias. Venha
                    desfrutar de um café conosco e planejar seu próximo passo
                    patrimonial com nossos especialistas seniores.
                  </p>
                  <div className="space-y-2 text-xs text-gray-600 font-sans">
                    <p className="font-bold text-gray-900">
                      FA Imóveis Luxury Estate
                    </p>
                    <p>Rua São Pedro, 263 - Centro</p>
                    <p>Caxias - MA, CEP: 65600-000</p>
                    <p className="pt-2">
                      <span className="font-bold text-gray-900">Horário:</span>{" "}
                      Seg a Sex, das 8h às 18h
                    </p>
                  </div>
                </div>
                <div className="lg:col-span-7 h-80 lg:h-auto min-h-[350px] relative">
                  <iframe
                    src="https://maps.google.com/maps?width=100%25&amp;height=100%25&amp;hl=pt&amp;q=Rua%20S%C3%A3o%20Pedro%20263,%20Centro,%20Caxias%20-%20MA&amp;t=&amp;z=16&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>

              {/* Company Contact Form Section */}
              <div className="max-w-4xl mx-auto space-y-8 pt-8">
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-bold text-yellow-600 uppercase tracking-widest block">
                    Fale Conosco
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-gray-900">
                    Fale com a Diretoria
                  </h2>
                  <p className="text-gray-500 text-xs md:text-sm max-w-md mx-auto">
                    Preencha o formulário abaixo para enviar uma mensagem
                    oficial. Nosso tempo médio de resposta via WhatsApp é de
                    poucos minutos.
                  </p>
                </div>
                <ContactForm
                  language={language}
                  onMessageSubmit={handleMessageSubmit}
                  type="general"
                />
              </div>
            </motion.div>
          )}

          {/* VIEW: FAVORITES */}
          {currentView === "favorites" && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto px-6 py-8 space-y-8"
            >
              <div>
                <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block mb-1">
                  {language === "pt"
                    ? "Minha Seleção"
                    : "My Curated Collection"}
                </span>
                <h1 className="font-serif text-3xl font-black text-gray-900">
                  {dict.favorites}
                </h1>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 space-y-4">
                  <span className="text-4xl">🖤</span>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                    {dict.noFavorites}
                  </p>
                  <button
                    onClick={() => setCurrentView("home")}
                    className="bg-black hover:bg-yellow-600 text-white text-xs font-bold uppercase px-6 py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    {language === "pt"
                      ? "Ir para a página inicial"
                      : "Go back to home"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {properties
                    .filter((p) => favorites.includes(p.id))
                    .map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={true}
                        onFavoriteToggle={() =>
                          handleFavoriteToggle(property.id)
                        }
                        onDetailsClick={() => {
                          setSelectedPropertyId(property.id);
                          setCurrentView("property-detail");
                        }}
                        language={language}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: ADMIN PANEL */}
          {currentView === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              {checkingAuth ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-4 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                  <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">
                    {language === "pt"
                      ? "Verificando credenciais..."
                      : "Checking auth status..."}
                  </p>
                </div>
              ) : adminUser ? (
                <AdminPanel
                  properties={properties}
                  brokers={brokers}
                  aboutUsConfig={aboutUsConfig}
                  onSaveAboutUs={async (newConfig) => {
                    const success = await saveAboutUsToFirebase(newConfig);
                    if (success) {
                      setAboutUsConfig(newConfig);
                    }
                    return success;
                  }}
                  onRefreshProperties={async () => {
                    const fetched = await fetchPropertiesFromFirebase();
                    setProperties(fetched);
                  }}
                  onRefreshBrokers={async () => {
                    const fetched = await fetchBrokersFromFirebase();
                    setBrokers(fetched);
                  }}
                  onSeedFirebase={handleSeedFirebase}
                  isFirebaseConfigured={isConfigured}
                  language={language}
                  adminUser={adminUser}
                  onSignOut={async () => {
                    if (auth) {
                      await signOut(auth);
                    }
                    setAdminUser(null);
                  }}
                />
              ) : (
                <LoginScreen
                  language={language}
                  onLoginSuccess={(user) => setAdminUser(user)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Interactive Financing Simulation Modal popup */}
      <FinancingModal
        isOpen={isFinancingModalOpen}
        onClose={() => setIsFinancingModalOpen(false)}
        propertyTitle={selectedProperty.title}
        propertyPrice={selectedProperty.price}
        language={language}
      />

      {/* Contract Generator Modal */}
      {selectedContractProperty && selectedContractBuyer && (
        <ContractModal
          isOpen={contractModalOpen}
          onClose={() => {
            setContractModalOpen(false);
            setSelectedContractProperty(null);
            setSelectedContractBuyer(null);
            setSelectedContractOwner(null);
          }}
          property={selectedContractProperty}
          buyer={selectedContractBuyer}
          owner={selectedContractOwner || undefined}
        />
      )}

      {/* Main Footer containing embedded responsive map */}
      <Footer language={language} onViewChange={setCurrentView} />
    </div>
  );
}
