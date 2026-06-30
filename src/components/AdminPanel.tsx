import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff,
  Save, 
  X, 
  RefreshCw, 
  Database, 
  Building2, 
  DollarSign, 
  Sliders,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  UserCheck,
  UserPlus,
  FileText,
  Link,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { Property, Broker, Client, AdminUser, AboutUsConfig } from '../types';
import { BROKERS, DICTIONARY } from '../data';
import ContractModal from './ContractModal';
import { 
  savePropertyToFirebase, 
  deletePropertyFromFirebase,
  saveBrokerToFirebase,
  deleteBrokerToFirebase,
  fetchClientsFromFirebase,
  saveClientToFirebase,
  deleteClientFromFirebase,
  fetchAdminUsersFromFirebase,
  saveAdminUserToFirebase,
  deleteAdminUserFromFirebase
} from '../lib/firebase';

interface AdminPanelProps {
  properties: Property[];
  brokers?: Broker[];
  onRefreshProperties: () => Promise<void>;
  onRefreshBrokers?: () => Promise<void>;
  onSeedFirebase: () => Promise<void>;
  isFirebaseConfigured: boolean;
  language: 'pt' | 'en';
  adminUser?: any;
  onSignOut?: () => void;
  aboutUsConfig: AboutUsConfig;
  onSaveAboutUs: (newConfig: AboutUsConfig) => Promise<boolean>;
}

const DEFAULT_AMENITIES = [
  'Piscina Privativa', 'Academia', 'Sauna', 'Spa', 'Adega Climatizada', 
  'Pé Direito Duplo', 'Vista Panorâmica', 'Portaria 24h', 'Automação Residencial', 
  'Espaço Gourmet', 'Solarium', 'Heliponto', 'Jardim Paisagístico', 'Gerador Full',
  'Garagem', 'Sala de estar e jantar', 'Cozinha', 'Área de Serviço', 'Banheiro Social', 
  'Escritura Pública Registrada', 'Apta para Financiamento'
];

const formatBRLInput = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '';
  const clean = String(value).replace(/\D/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export default function AdminPanel({
  properties,
  brokers,
  onRefreshProperties,
  onRefreshBrokers,
  onSeedFirebase,
  isFirebaseConfigured,
  language,
  adminUser,
  onSignOut,
  aboutUsConfig,
  onSaveAboutUs
}: AdminPanelProps) {
  const dict = DICTIONARY[language];
  
  // View states
  const [isEditing, setIsEditing] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Partial<Property> | null>(null);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'properties' | 'brokers' | 'clients' | 'users' | 'aboutUs'>('properties');

  // Client states
  const [clients, setClients] = useState<Client[]>([]);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client> | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null);

  // Admin User states
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<AdminUser> | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Contract Modal states
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedContractProperty, setSelectedContractProperty] = useState<Property | null>(null);
  const [selectedContractBuyer, setSelectedContractBuyer] = useState<Client | null>(null);
  const [selectedContractOwner, setSelectedContractOwner] = useState<Client | null>(null);
  
  // Broker states
  const [isEditingBroker, setIsEditingBroker] = useState(false);
  const [currentBroker, setCurrentBroker] = useState<Partial<Broker> | null>(null);
  const [brokerSearchTerm, setBrokerSearchTerm] = useState('');
  const [confirmDeleteBrokerId, setConfirmDeleteBrokerId] = useState<string | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // About Us State
  const [aboutUsForm, setAboutUsForm] = useState<AboutUsConfig>(aboutUsConfig);
  
  useEffect(() => {
    if (aboutUsConfig) {
      setAboutUsForm(aboutUsConfig);
    }
  }, [aboutUsConfig]);

  // Form local states for arrays
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imagesList, setImagesList] = useState<string[]>([]);

  // Statistics
  const totalValue = properties.reduce((acc, p) => acc + (p.isSobConsulta ? 0 : (p.price || 0)), 0);
  const averagePrice = properties.filter(p => !p.isSobConsulta).length 
    ? totalValue / properties.filter(p => !p.isSobConsulta).length 
    : 0;

  // Load clients on mount and refresh
  const handleRefreshClients = async () => {
    try {
      const fetched = await fetchClientsFromFirebase();
      setClients(fetched);
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
    }
  };

  // Load admin users on mount and refresh
  const handleRefreshUsers = async () => {
    try {
      let fetched: AdminUser[] = [];
      if (isFirebaseConfigured) {
        fetched = await fetchAdminUsersFromFirebase();
      }
      
      // Merge with or fallback to localStorage users
      const localAdminsStored = localStorage.getItem('fa_imoveis_admin_users');
      const localAdmins = localAdminsStored ? JSON.parse(localAdminsStored) : [];
      
      // Create a unified set based on email
      const merged = [...fetched];
      localAdmins.forEach((lu: AdminUser) => {
        if (!merged.some(mu => mu.email.toLowerCase() === lu.email.toLowerCase())) {
          merged.push(lu);
        }
      });
      
      setAdminUsers(merged);
    } catch (e) {
      console.error("Erro ao carregar usuários administrativos:", e);
    }
  };

  useEffect(() => {
    handleRefreshClients();
    handleRefreshUsers();
  }, []);

  const handleCreateUserNew = () => {
    setCurrentUser({
      id: '',
      name: '',
      email: '',
      password: '',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    setConfirmPassword('');
    setShowPassword(false);
    setIsEditingUser(true);
  };

  const handleEditUserSelect = (user: AdminUser) => {
    setCurrentUser(user);
    setConfirmPassword(user.password || '');
    setShowPassword(false);
    setIsEditingUser(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!currentUser.name || !currentUser.email || !currentUser.password) {
      setErrorMessage(language === 'pt' ? 'Nome, E-mail e Senha são campos obrigatórios.' : 'Name, Email and Password are required.');
      return;
    }

    if (currentUser.password !== confirmPassword) {
      setErrorMessage(language === 'pt' ? 'As senhas não coincidem!' : 'Passwords do not match!');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const userId = currentUser.id || `user_${Date.now()}`;
      const updatedUser: AdminUser = {
        id: userId,
        name: currentUser.name || '',
        email: currentUser.email || '',
        password: currentUser.password || '',
        role: currentUser.role || 'admin',
        createdAt: currentUser.createdAt || new Date().toISOString()
      };

      // Always save to localStorage first for reliable offline support
      const localAdminsStored = localStorage.getItem('fa_imoveis_admin_users');
      const localAdmins = localAdminsStored ? JSON.parse(localAdminsStored) : [];
      const updatedLocalAdmins = localAdmins.filter((u: AdminUser) => u.id !== userId);
      updatedLocalAdmins.push(updatedUser);
      localStorage.setItem('fa_imoveis_admin_users', JSON.stringify(updatedLocalAdmins));

      // Save to Firebase if configured
      if (isFirebaseConfigured) {
        await saveAdminUserToFirebase(updatedUser);
      }

      setSuccessMessage(
        language === 'pt' 
          ? 'Usuário administrador salvo com sucesso!' 
          : 'Admin user saved successfully!'
      );
      setIsEditingUser(false);
      setCurrentUser(null);
      await handleRefreshUsers();
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Erro ao salvar usuário.' : 'Error saving user.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      // Remove from localStorage
      const localAdminsStored = localStorage.getItem('fa_imoveis_admin_users');
      const localAdmins = localAdminsStored ? JSON.parse(localAdminsStored) : [];
      const updatedLocalAdmins = localAdmins.filter((u: AdminUser) => u.id !== id);
      localStorage.setItem('fa_imoveis_admin_users', JSON.stringify(updatedLocalAdmins));

      // Remove from Firebase if configured
      if (isFirebaseConfigured) {
        await deleteAdminUserFromFirebase(id);
      }

      setSuccessMessage(language === 'pt' ? 'Usuário removido com sucesso!' : 'User removed successfully!');
      setConfirmDeleteUserId(null);
      await handleRefreshUsers();
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Erro ao remover usuário.' : 'Error removing user.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleCreateClientNew = () => {
    setCurrentClient({
      id: '',
      name: '',
      email: '',
      phone: '',
      type: 'buyer',
      propertyId: '',
      buyerStatus: 'interested',
      cpf: '',
      address: '',
      spouseName: '',
      createdAt: new Date().toISOString()
    });
    setIsEditingClient(true);
  };

  const handleEditClientSelect = (client: Client) => {
    setCurrentClient(client);
    setIsEditingClient(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    if (!currentClient.name || !currentClient.email || !currentClient.phone) {
      setErrorMessage(language === 'pt' ? 'Nome, E-mail e Telefone são campos obrigatórios.' : 'Name, Email and Phone are required.');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const clientId = currentClient.id || `client_${Date.now()}`;
      const updatedClient: Client = {
        id: clientId,
        name: currentClient.name || '',
        email: currentClient.email || '',
        phone: currentClient.phone || '',
        type: currentClient.type || 'buyer',
        propertyId: currentClient.propertyId || '',
        buyerStatus: currentClient.type === 'buyer' ? (currentClient.buyerStatus || 'interested') : '',
        cpf: currentClient.cpf || '',
        address: currentClient.address || '',
        spouseName: currentClient.spouseName || '',
        createdAt: currentClient.createdAt || new Date().toISOString()
      };

      const saved = await saveClientToFirebase(updatedClient);

      if (saved) {
        // Automatically sync property status/owner depending on relationship
        if (updatedClient.propertyId) {
          const matchedProperty = properties.find(p => p.id === updatedClient.propertyId);
          if (matchedProperty) {
            let changes: Partial<Property> = {};
            if (updatedClient.type === 'owner') {
              changes.ownerId = clientId;
            } else if (updatedClient.type === 'buyer') {
              if (updatedClient.buyerStatus === 'interested') {
                changes.status = 'interested';
              } else if (updatedClient.buyerStatus === 'signed_contract') {
                changes.status = 'sold';
              }
            }
            if (Object.keys(changes).length > 0) {
              const updatedPropertyObj: Property = {
                ...matchedProperty,
                ...changes
              };
              await savePropertyToFirebase(updatedPropertyObj);
              await onRefreshProperties();
            }
          }
        }

        setSuccessMessage(
          language === 'pt' 
            ? 'Cliente cadastrado e atualizado com sucesso!' 
            : 'Client registered and updated successfully!'
        );
        setIsEditingClient(false);
        setCurrentClient(null);
        await handleRefreshClients();
      } else {
        setErrorMessage(language === 'pt' ? 'Erro ao salvar cliente.' : 'Error saving client.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Erro ao conectar-se.' : 'Failed to connect.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleDeleteClient = async (id: string) => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const clientToDelete = clients.find(c => c.id === id);
      const success = await deleteClientFromFirebase(id);
      if (success) {
        if (clientToDelete && clientToDelete.propertyId) {
          const matchedProperty = properties.find(p => p.id === clientToDelete.propertyId);
          if (matchedProperty) {
            let changes: Partial<Property> = {};
            if (clientToDelete.type === 'owner' && matchedProperty.ownerId === id) {
              changes.ownerId = '';
            } else if (clientToDelete.type === 'buyer' && (matchedProperty.status === 'interested' || matchedProperty.status === 'sold')) {
              changes.status = 'available';
            }
            if (Object.keys(changes).length > 0) {
              const updatedPropertyObj = { ...matchedProperty, ...changes };
              await savePropertyToFirebase(updatedPropertyObj);
              await onRefreshProperties();
            }
          }
        }

        setSuccessMessage(language === 'pt' ? 'Cliente removido com sucesso!' : 'Client removed successfully!');
        setConfirmDeleteClientId(null);
        await handleRefreshClients();
      } else {
        setErrorMessage(language === 'pt' ? 'Erro ao remover cliente.' : 'Error removing client.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Erro ao conectar-se.' : 'Failed to connect.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // Sync state arrays when editing is opened
  useEffect(() => {
    if (currentProperty) {
      setSelectedAmenities(currentProperty.comodidades || []);
      setImagesList(currentProperty.images || []);
    } else {
      setSelectedAmenities([]);
      setImagesList([]);
    }
  }, [currentProperty]);

  const handleAboutUsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const success = await onSaveAboutUs(aboutUsForm);
      if (success) {
        setSuccessMessage(
          language === 'pt' 
            ? 'Conteúdo do Sobre Nós atualizado com sucesso!' 
            : 'About Us content updated successfully!'
        );
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(
          language === 'pt' 
            ? 'Erro ao salvar alterações no Firebase. Verifique sua conexão.' 
            : 'Error saving changes to Firebase. Check your connection.'
        );
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        language === 'pt' 
          ? 'Erro inesperado ao salvar alterações.' 
          : 'Unexpected error saving changes.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setCurrentProperty({
      id: '',
      title: '',
      description: '',
      fullDescription: '',
      type: 'Casa Simples',
      location: 'Caxias, MA',
      neighborhood: 'Centro',
      price: 0,
      isSobConsulta: false,
      suites: 3,
      bathrooms: 3,
      area: 120,
      vagas: 2,
      condominio: 0,
      iptu: 0,
      images: [],
      badge: 'Novo',
      comodidades: [],
      brokerId: 'felipe-alencar',
      closestPlaces: [],
      address: '',
      showAddressOnSite: false,
      ownerId: '',
      status: 'available'
    });
    setIsEditing(true);
  };

  const handleEditSelect = (property: Property) => {
    setCurrentProperty(property);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const success = await deletePropertyFromFirebase(id);
      if (success) {
        setSuccessMessage(language === 'pt' ? 'Imóvel removido com sucesso!' : 'Property removed successfully!');
        setConfirmDeleteId(null);
        await onRefreshProperties();
      } else {
        setErrorMessage(language === 'pt' ? 'Erro ao remover o imóvel.' : 'Error removing property.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Ocorreu um erro inesperado.' : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleCreateNewBroker = () => {
    setCurrentBroker({
      id: '',
      name: '',
      title: '',
      phone: '',
      email: '',
      creci: '',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
      rating: 5.0,
      yearsOfExperience: 5,
      propertiesSold: 10,
      bio: '',
      specialty: '',
      instagram: '',
      linkedin: '',
      quote: ''
    });
    setIsEditingBroker(true);
  };

  const handleEditBrokerSelect = (broker: Broker) => {
    setCurrentBroker(broker);
    setIsEditingBroker(true);
  };

  const handleDeleteBroker = async (id: string) => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const success = await deleteBrokerToFirebase(id);
      if (success) {
        setSuccessMessage(language === 'pt' ? 'Corretor removido com sucesso!' : 'Broker removed successfully!');
        setConfirmDeleteBrokerId(null);
        if (onRefreshBrokers) {
          await onRefreshBrokers();
        }
      } else {
        setErrorMessage(language === 'pt' ? 'Erro ao remover o corretor do Firestore.' : 'Error deleting broker.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Erro ao conectar-se.' : 'Failed to connect.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleSaveBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBroker) return;

    if (!currentBroker.name) {
      setErrorMessage(language === 'pt' ? 'O nome do corretor é obrigatório.' : 'Broker name is required.');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const brokerId = currentBroker.id || `broker_${Date.now()}`;
      const finalBroker: Broker = {
        id: brokerId,
        name: currentBroker.name || '',
        title: currentBroker.title || '',
        phone: currentBroker.phone || '',
        email: currentBroker.email || '',
        creci: currentBroker.creci || '',
        image: currentBroker.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
        rating: Number(currentBroker.rating ?? 5.0),
        yearsOfExperience: Number(currentBroker.yearsOfExperience ?? 5),
        propertiesSold: Number(currentBroker.propertiesSold ?? 10),
        bio: currentBroker.bio || '',
        specialty: currentBroker.specialty || '',
        instagram: currentBroker.instagram || '',
        linkedin: currentBroker.linkedin || '',
        quote: currentBroker.quote || '',
      };

      const saved = await saveBrokerToFirebase(finalBroker);
      if (saved) {
        setSuccessMessage(
          language === 'pt' 
            ? 'Corretor salvo com sucesso!' 
            : 'Broker successfully saved!'
        );
        setIsEditingBroker(false);
        setCurrentBroker(null);
        if (onRefreshBrokers) {
          await onRefreshBrokers();
        }
      } else {
        setErrorMessage(language === 'pt' ? 'Erro ao salvar corretor no Firestore.' : 'Error saving broker.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Erro ao salvar corretor.' : 'Error saving broker.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      setImagesList([...imagesList, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagesList(imagesList.filter((_, i) => i !== index));
  };

  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddCustomAmenity = () => {
    if (customAmenityInput.trim() && !selectedAmenities.includes(customAmenityInput.trim())) {
      setSelectedAmenities([...selectedAmenities, customAmenityInput.trim()]);
      setCustomAmenityInput('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProperty) return;

    if (!currentProperty.title || !currentProperty.location || !currentProperty.neighborhood) {
      setErrorMessage(language === 'pt' ? 'Título, Cidade e Bairro são campos obrigatórios.' : 'Title, City and Neighborhood are required fields.');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    const finalProperty: Property = {
      ...(currentProperty as Property),
      images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'],
      comodidades: selectedAmenities,
    };

    try {
      const saved = await savePropertyToFirebase(finalProperty);
      if (saved) {
        setSuccessMessage(
          language === 'pt' 
            ? 'Imóvel publicado e atualizado com sucesso!' 
            : 'Property successfully published and updated!'
        );
        setIsEditing(false);
        setCurrentProperty(null);
        await onRefreshProperties();
      } else {
        setErrorMessage(language === 'pt' ? 'Erro ao salvar o imóvel no Firestore.' : 'Error saving property to Firestore.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(language === 'pt' ? 'Erro ao conectar-se ao servidor.' : 'Failed to connect to server.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // Filter properties by search term
  const filtered = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Header and status info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-1.5 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block">
              Painel Administrativo
            </span>
            {adminUser && (
              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[9px] font-bold rounded-full border border-yellow-200">
                {adminUser.email || 'Admin'}
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-black text-gray-950 tracking-tight">
            {activeTab === 'properties' && 'Gerenciador de Portfólio'}
            {activeTab === 'brokers' && 'Gerenciador de Corretores'}
            {activeTab === 'clients' && 'Gerenciador de Clientes'}
            {activeTab === 'users' && 'Gerenciador de Usuários'}
            {activeTab === 'aboutUs' && 'Editor do Sobre Nós'}
          </h1>
          <p className="text-gray-500 text-xs md:text-sm">
            {activeTab === 'properties' && 'Cadastre, edite e remova imóveis integrados diretamente com o banco de dados Firebase Firestore.'}
            {activeTab === 'brokers' && 'Gerencie a equipe de corretores, cadastrando novos membros e atualizando informações e contatos.'}
            {activeTab === 'clients' && 'Cadastre e gerencie os donos de imóveis e compradores interessados. Vincule compradores a imóveis específicos e altere o status de negociação de forma automática.'}
            {activeTab === 'users' && 'Cadastre novos usuários administrativos, mude senhas e configure perfis de acesso para corretores e gerentes.'}
            {activeTab === 'aboutUs' && 'Edite todo o conteúdo da página "Sobre Nós" (História, Valores, Pilares, Sede, Imagem e Estatísticas) em tempo real.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-sans text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              {language === 'pt' ? 'Sair do Painel' : 'Sign Out'}
            </button>
          )}

          {activeTab === 'properties' && (
            <>
              <button
                onClick={onRefreshProperties}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-100 font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {language === 'pt' ? 'Recarregar Imóveis' : 'Reload Properties'}
              </button>
              
              {!isEditing && (
                <button
                  onClick={handleCreateNew}
                  className="px-5 py-2.5 bg-black hover:bg-yellow-600 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'pt' ? 'Cadastrar Imóvel' : 'Add Property'}
                </button>
              )}
            </>
          )}

          {activeTab === 'brokers' && (
            <>
              <button
                onClick={onRefreshBrokers}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-100 font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {language === 'pt' ? 'Recarregar Corretores' : 'Reload Brokers'}
              </button>
              
              {!isEditingBroker && (
                <button
                  onClick={handleCreateNewBroker}
                  className="px-5 py-2.5 bg-black hover:bg-yellow-600 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'pt' ? 'Cadastrar Corretor' : 'Add Broker'}
                </button>
              )}
            </>
          )}

          {activeTab === 'clients' && (
            <>
              <button
                onClick={handleRefreshClients}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-100 font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {language === 'pt' ? 'Recarregar Clientes' : 'Reload Clients'}
              </button>
              
              {!isEditingClient && (
                <button
                  onClick={handleCreateClientNew}
                  className="px-5 py-2.5 bg-black hover:bg-yellow-600 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'pt' ? 'Cadastrar Cliente' : 'Add Client'}
                </button>
              )}
            </>
          )}

          {activeTab === 'users' && (
            <>
              <button
                onClick={handleRefreshUsers}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-100 font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {language === 'pt' ? 'Recarregar Usuários' : 'Reload Users'}
              </button>
              
              {!isEditingUser && (
                <button
                  onClick={handleCreateUserNew}
                  className="px-5 py-2.5 bg-black hover:bg-yellow-600 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'pt' ? 'Cadastrar Usuário' : 'Add User'}
                </button>
              )}
            </>
          )}

          {activeTab === 'aboutUs' && (
            <button
              onClick={() => {
                const btn = document.getElementById('about-us-save-button');
                if (btn) btn.click();
              }}
              className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {language === 'pt' ? 'Salvar Alterações' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Messages alert */}
      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded-xl flex items-center gap-2.5 text-left"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-xl flex items-center gap-2.5 text-left"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Database warning box */}
      {!isFirebaseConfigured && (
        <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Modo de Demonstração (Sem Firebase Ativo)
            </h4>
            <p className="text-xs text-yellow-700 leading-relaxed max-w-3xl">
              Como o Firebase não foi configurado ou ativado via UI, o gerenciamento funcionará em estado temporário na memória do navegador. Para ter persistência definitiva em nuvem, configure as chaves secretas do Firebase no painel do AI Studio.
            </p>
          </div>
          <button
            onClick={onSeedFirebase}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {language === 'pt' ? 'Semear Dados Iniciais' : 'Seed Original Data'}
          </button>
        </div>
      )}

      {/* TABS SELECTOR (ABAS) */}
      {!isEditing && !isEditingBroker && !isEditingClient && !isEditingUser && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-6 py-3 font-serif text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
              activeTab === 'properties'
                ? 'border-yellow-500 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🏡 {language === 'pt' ? 'Imóveis' : 'Properties'}
          </button>
          <button
            onClick={() => setActiveTab('brokers')}
            className={`px-6 py-3 font-serif text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
              activeTab === 'brokers'
                ? 'border-yellow-500 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            👔 {language === 'pt' ? 'Corretores' : 'Brokers'}
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-6 py-3 font-serif text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'border-yellow-500 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            👥 {language === 'pt' ? 'Clientes' : 'Clients'}
          </button>
          <button
            onClick={() => setActiveTab('aboutUs')}
            className={`px-6 py-3 font-serif text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
              activeTab === 'aboutUs'
                ? 'border-yellow-500 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📖 {language === 'pt' ? 'Sobre Nós' : 'About Us'}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-serif text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-yellow-500 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            ⚙️ {language === 'pt' ? 'Configurações' : 'Settings'}
          </button>
        </div>
      )}

      {/* VIEW 1: PROPERTY FORM EDITOR */}
      {isEditing && currentProperty && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden text-left"
        >
          {/* Form Header */}
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                {currentProperty.id ? 'Modo de Edição' : 'Publicar Nova Propriedade'}
              </span>
              <h3 className="font-serif text-xl font-bold text-gray-950">
                {currentProperty.id ? `Editar: ${currentProperty.title}` : 'Preencha a ficha do imóvel'}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentProperty(null);
              }}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-8">
            {/* Secao 1: Informacoes Basicas */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                1. Informações Essenciais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Título de Destaque *</label>
                  <input
                    type="text"
                    required
                    value={currentProperty.title || ''}
                    onChange={e => setCurrentProperty({...currentProperty, title: e.target.value})}
                    placeholder="Ex: Mansão Suspensa no Jardim Renascença"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Badge de Destaque</label>
                  <select
                    value={currentProperty.badge || ''}
                    onChange={e => setCurrentProperty({...currentProperty, badge: e.target.value || undefined})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Exclusivo">Exclusivo</option>
                    <option value="Destaque">Destaque</option>
                    <option value="">Sem Destaque</option>
                  </select>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipo do Imóvel</label>
                  <select
                    value={currentProperty.type || 'Casa Simples'}
                    onChange={e => setCurrentProperty({...currentProperty, type: e.target.value})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  >
                    <option value="Casa Simples">Casa Simples</option>
                    <option value="Casa de Luxo">Casa de Luxo</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Apartamento Garden">Apartamento Garden</option>
                    <option value="Terreno">Terreno / Lote</option>
                    <option value="Chácara">Sítio / Chácara</option>
                  </select>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cidade / Estado *</label>
                  <input
                    type="text"
                    required
                    value={currentProperty.location || 'Caxias, MA'}
                    onChange={e => setCurrentProperty({...currentProperty, location: e.target.value})}
                    placeholder="Ex: Caxias, MA"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bairro / Região *</label>
                  <input
                    type="text"
                    required
                    value={currentProperty.neighborhood || ''}
                    onChange={e => setCurrentProperty({...currentProperty, neighborhood: e.target.value})}
                    placeholder="Ex: Seriema, Centro, Cohab"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dono / Proprietário do Imóvel</label>
                  <select
                    value={currentProperty.ownerId || ''}
                    onChange={e => setCurrentProperty({...currentProperty, ownerId: e.target.value})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  >
                    <option value="">-- Sem Proprietário Cadastrado --</option>
                    {clients.filter(c => c.type === 'owner').map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name} ({owner.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status de Negociação do Imóvel</label>
                  <select
                    value={currentProperty.status || 'available'}
                    onChange={e => setCurrentProperty({...currentProperty, status: e.target.value as any})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none font-bold"
                  >
                    <option value="available">🟢 Disponível para Venda / Ativo</option>
                    <option value="interested">🟡 Reservado / Com Interessado</option>
                    <option value="sold">🔴 Vendido / Contrato Assinado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Secao 2: Metricas e Valores */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                2. Dimensões, Composição e Valores
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preço de Venda (R$)</label>
                  <input
                    type="text"
                    disabled={!!currentProperty.isSobConsulta}
                    value={currentProperty.price ? formatBRLInput(currentProperty.price) : ''}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, '');
                      const num = clean ? parseInt(clean, 10) : 0;
                      setCurrentProperty({...currentProperty, price: num});
                    }}
                    placeholder="Ex: R$ 380.000"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5 flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!currentProperty.isSobConsulta}
                      onChange={e => setCurrentProperty({
                        ...currentProperty, 
                        isSobConsulta: e.target.checked,
                        price: e.target.checked ? 0 : currentProperty.price
                      })}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-xs font-semibold text-gray-700">Preço Sob Consulta</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Área Privativa (m²)</label>
                  <input
                    type="number"
                    value={currentProperty.area || ''}
                    onChange={e => setCurrentProperty({...currentProperty, area: Number(e.target.value)})}
                    placeholder="Ex: 350"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantidade de Quartos</label>
                  <input
                    type="number"
                    value={currentProperty.suites ?? 0}
                    onChange={e => setCurrentProperty({...currentProperty, suites: Number(e.target.value)})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Banheiros</label>
                  <input
                    type="number"
                    value={currentProperty.bathrooms ?? 0}
                    onChange={e => setCurrentProperty({...currentProperty, bathrooms: Number(e.target.value)})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vagas de Garagem</label>
                  <input
                    type="number"
                    value={currentProperty.vagas ?? 0}
                    onChange={e => setCurrentProperty({...currentProperty, vagas: Number(e.target.value)})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Secao 3: Descricoes Narrativas */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                3. Descrição Comercial
              </h4>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Resumo de Chamada (Card)</label>
                  <input
                    type="text"
                    value={currentProperty.description || ''}
                    onChange={e => setCurrentProperty({...currentProperty, description: e.target.value})}
                    placeholder="Breve resumo atraente de 1 linha para a vitrine."
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Descrição Completa e Detalhada</label>
                  <textarea
                    rows={5}
                    value={currentProperty.fullDescription || ''}
                    onChange={e => setCurrentProperty({...currentProperty, fullDescription: e.target.value})}
                    placeholder="Descreva a arquitetura, acabamento, pontos fortes e diferenciais deste imóvel de altíssimo padrão."
                    className="w-full bg-transparent border border-gray-200 focus:border-yellow-600 focus:ring-0 p-3 rounded-lg transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Secao 4: Imagens */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center justify-between">
                <span>4. Álbum de Fotos (URLs)</span>
                <span className="text-[10px] text-gray-400 lowercase font-normal">Recomendamos imagens horizontais</span>
              </h4>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="Cole aqui o link da imagem (Ex: https://images.unsplash.com/...)"
                    className="flex-1 bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-gray-950 text-white font-semibold text-xs rounded-xl hover:bg-yellow-600 transition-colors"
                  >
                    Adicionar URL
                  </button>
                </div>

                {/* Previews */}
                {imagesList.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    Nenhuma foto adicionada. Insira uma ou mais URLs acima.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
                    {imagesList.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                        <img 
                          src={url} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white py-0.5 text-center truncate px-1">
                          Foto {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Secao 5: Broker responsavel */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                5. Consultor Corretor Responsável
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vendedor Designado</label>
                  <select
                    value={currentProperty.brokerId || 'felipe-alencar'}
                    onChange={e => setCurrentProperty({...currentProperty, brokerId: e.target.value})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  >
                    {BROKERS.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.title})</option>
                    ))}
                    <option value="felipe-alencar">Felipe Alencar (Fundador &amp; Diretor)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Secao 6: Endereço & Localização */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                6. Endereço &amp; Localização (Google Maps)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Endereço Completo para o Google Maps</label>
                    <input
                      type="text"
                      value={currentProperty.address || ''}
                      onChange={e => setCurrentProperty({...currentProperty, address: e.target.value})}
                      placeholder="Ex: Avenida Alexandre Costa, 1200 - Caxias, MA"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                    <p className="text-[10px] text-gray-400">
                      Digite o endereço ou pontos de referência para que o mapa interativo possa localizar o imóvel.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!currentProperty.showAddressOnSite}
                        onChange={e => setCurrentProperty({...currentProperty, showAddressOnSite: e.target.checked})}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mostrar este endereço no site?</span>
                    </label>
                    <p className="text-[10px] text-gray-400 pl-6">
                      Se ativado, o endereço completo inserido acima será visível na página de detalhes do imóvel. Se desativado, o site usará apenas o Bairro e a Cidade para o mapa, preservando a privacidade do endereço exato.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pré-visualização em Tempo Real</span>
                  <div className="rounded-xl overflow-hidden h-40 border border-gray-100 relative bg-gray-50 flex items-center justify-center">
                    {currentProperty.address ? (
                      <iframe
                        src={`https://maps.google.com/maps?width=100%25&amp;height=150&amp;hl=pt&amp;q=${encodeURIComponent(currentProperty.address)}&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        title="Address Preview"
                        className="grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-2xl block mb-1">📍</span>
                        <p className="text-[10px] text-gray-400">Insira um endereço ao lado para visualizar o mapa.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botoes de Acao */}
            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentProperty(null);
                }}
                className="px-6 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-black hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Publicando...' : 'Salvar e Publicar'}
              </button>
            </div>

          </form>
        </motion.div>
      )}

      {/* VIEW 2: STATS CARDS & PROPERTIES LIST */}
      {!isEditing && activeTab === 'properties' && (
        <div className="space-y-8 text-left">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Portfólio Total</span>
                <span className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><Building2 className="w-4 h-4" /></span>
              </div>
              <div>
                <p className="font-serif text-2xl font-black text-gray-950">{properties.length}</p>
                <p className="text-[10px] text-gray-500">Imóveis cadastrados ativos</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor do Portfólio</span>
                <span className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-4 h-4" /></span>
              </div>
              <div>
                <p className="font-serif text-2xl font-black text-gray-950">
                  R$ {totalValue > 1000000 ? `${(totalValue / 1000000).toFixed(1)}M` : totalValue.toLocaleString('pt-BR')}
                </p>
                <p className="text-[10px] text-gray-500">Excluindo sob consulta</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preço Médio</span>
                <span className="p-2 bg-blue-50 rounded-lg text-blue-600"><Sliders className="w-4 h-4" /></span>
              </div>
              <div>
                <p className="font-serif text-2xl font-black text-gray-950">
                  R$ {averagePrice > 1000000 ? `${(averagePrice / 1000000).toFixed(1)}M` : averagePrice.toLocaleString('pt-BR')}
                </p>
                <p className="text-[10px] text-gray-500">Valor de ticket médio</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Origem de Dados</span>
                <span className="p-2 bg-purple-50 rounded-lg text-purple-600"><Sparkles className="w-4 h-4" /></span>
              </div>
              <div>
                <p className="font-serif text-xl font-black text-gray-950 truncate">
                  {isFirebaseConfigured ? 'Firestore' : 'Local Fallback'}
                </p>
                <p className="text-[10px] text-gray-500">{isFirebaseConfigured ? 'Nuvem Real-time' : 'Carregado em memória'}</p>
              </div>
            </div>
          </div>

          {/* Search bar inside list */}
          <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm max-w-md px-3 py-1">
            <span className="text-gray-400 mr-2"><Plus className="w-4 h-4 rotate-45" /></span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, bairro, cidade..."
              className="w-full bg-transparent border-none text-sm outline-none py-2 text-gray-900 focus:ring-0"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Listings Table / Cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 space-y-4 shadow-sm">
              <span className="text-4xl block">🏝️</span>
              <h3 className="font-serif text-lg font-bold text-gray-900">Nenhum imóvel encontrado</h3>
              <p className="text-gray-500 text-xs max-w-md mx-auto">
                Tente reajustar seu termo de busca ou adicione seu primeiro imóvel clicando no botão "Cadastrar Imóvel".
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="py-4 px-6 text-left">Imóvel</th>
                      <th className="py-4 px-6 text-left">Localização</th>
                      <th className="py-4 px-6 text-left">Tipo</th>
                      <th className="py-4 px-6 text-right">Preço</th>
                      <th className="py-4 px-6 text-center">Atributos</th>
                      <th className="py-4 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                    {filtered.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-100">
                              <img
                                src={property.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=150&q=80'}
                                alt=""
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-0.5 text-left max-w-xs sm:max-w-md truncate">
                              <span className="font-serif font-bold text-gray-950 block hover:text-yellow-600 transition-colors">
                                {property.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                {property.badge && (
                                  <span className="bg-yellow-500/10 text-yellow-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]">
                                    {property.badge}
                                  </span>
                                )}
                                <span>ID: {property.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6 text-left">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-gray-900 block">{property.neighborhood}</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-yellow-600 shrink-0" />
                              {property.location}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-left">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-[10px] font-medium">
                            {property.type}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right font-serif font-black text-gray-950 text-sm">
                          {property.isSobConsulta 
                            ? 'Sob Consulta' 
                            : `R$ ${(property.price || 0).toLocaleString('pt-BR')}`
                          }
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex gap-2 text-[10px] text-gray-500">
                            <span>{property.suites} Suítes</span>
                            <span>•</span>
                            <span>{property.area} m²</span>
                            <span>•</span>
                            <span>{property.vagas} Vagas</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleEditSelect(property)}
                              title="Editar imóvel"
                              className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            {confirmDeleteId === property.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(property.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded font-bold text-[10px] transition-colors"
                                >
                                  Sim, deletar
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-1 bg-gray-200 text-gray-700 rounded text-[10px] transition-colors"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(property.id)}
                                title="Deletar imóvel"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: BROKER FORM EDITOR */}
      {isEditingBroker && currentBroker && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden text-left"
        >
          {/* Form Header */}
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                {currentBroker.id ? 'Modo de Edição' : 'Cadastrar Novo Corretor'}
              </span>
              <h3 className="font-serif text-xl font-bold text-gray-950">
                {currentBroker.id ? `Editar Corretor: ${currentBroker.name}` : 'Preencha a ficha do corretor'}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsEditingBroker(false);
                setCurrentBroker(null);
              }}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSaveBroker} className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Secao 1: Informações Pessoais */}
              <div className="space-y-6">
                <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                  1. Informações Pessoais
                </h4>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={currentBroker.name || ''}
                      onChange={e => setCurrentBroker({...currentBroker, name: e.target.value})}
                      placeholder="Ex: Ricardo Fontes"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título / Cargo</label>
                    <input
                      type="text"
                      value={currentBroker.title || ''}
                      onChange={e => setCurrentBroker({...currentBroker, title: e.target.value})}
                      placeholder="Ex: Especialista em Mansões Jardins"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Especialidade / Região</label>
                    <input
                      type="text"
                      value={currentBroker.specialty || ''}
                      onChange={e => setCurrentBroker({...currentBroker, specialty: e.target.value})}
                      placeholder="Ex: Jardins Expert"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registro CRECI</label>
                    <input
                      type="text"
                      value={currentBroker.creci || ''}
                      onChange={e => setCurrentBroker({...currentBroker, creci: e.target.value})}
                      placeholder="Ex: SP-123456-F"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Secao 2: Contato e Redes Sociais */}
              <div className="space-y-6">
                <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                  2. Contato e Redes Sociais
                </h4>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={currentBroker.phone || ''}
                      onChange={e => setCurrentBroker({...currentBroker, phone: e.target.value})}
                      placeholder="Ex: +55 (11) 99123-4567"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail</label>
                    <input
                      type="email"
                      value={currentBroker.email || ''}
                      onChange={e => setCurrentBroker({...currentBroker, email: e.target.value})}
                      placeholder="Ex: ricardo.fontes@faimoveis.com.br"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome de usuário Instagram</label>
                    <input
                      type="text"
                      value={currentBroker.instagram || ''}
                      onChange={e => setCurrentBroker({...currentBroker, instagram: e.target.value})}
                      placeholder="Ex: ricardofontes.luxury (sem o @)"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">LinkedIn URL</label>
                    <input
                      type="text"
                      value={currentBroker.linkedin || ''}
                      onChange={e => setCurrentBroker({...currentBroker, linkedin: e.target.value})}
                      placeholder="Ex: https://linkedin.com/in/ricardo-fontes"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Secao 3: Métricas & Imagem */}
              <div className="space-y-6">
                <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                  3. Performance e Foto
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Avaliação (Rating)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={currentBroker.rating ?? 5.0}
                      onChange={e => setCurrentBroker({...currentBroker, rating: parseFloat(e.target.value)})}
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Anos Exp.</label>
                    <input
                      type="number"
                      value={currentBroker.yearsOfExperience ?? 5}
                      onChange={e => setCurrentBroker({...currentBroker, yearsOfExperience: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Imóveis Vendidos</label>
                    <input
                      type="number"
                      value={currentBroker.propertiesSold ?? 10}
                      onChange={e => setCurrentBroker({...currentBroker, propertiesSold: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">URL da Foto de Perfil</label>
                  <input
                    type="url"
                    value={currentBroker.image || ''}
                    onChange={e => setCurrentBroker({...currentBroker, image: e.target.value})}
                    placeholder="Cole aqui o link da imagem (Ex: https://images.unsplash.com/...)"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                  {currentBroker.image && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 mt-2 bg-gray-50">
                      <img src={currentBroker.image} alt="Preview" referrerPolicy="no-referrer" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                    </div>
                  )}
                </div>
              </div>

              {/* Secao 4: Biografia & Citação */}
              <div className="space-y-6">
                <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                  4. Biografia e Slogan
                </h4>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Frase de Efeito / Citação</label>
                    <input
                      type="text"
                      value={currentBroker.quote || ''}
                      onChange={e => setCurrentBroker({...currentBroker, quote: e.target.value})}
                      placeholder="Ex: Comprometido com a exclusividade e a satisfação absoluta."
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mini Biografia</label>
                    <textarea
                      rows={4}
                      value={currentBroker.bio || ''}
                      onChange={e => setCurrentBroker({...currentBroker, bio: e.target.value})}
                      placeholder="Descreva a trajetória do corretor, conquistas e dedicação ao mercado imobiliário de luxo."
                      className="w-full bg-transparent border border-gray-200 focus:border-yellow-600 focus:ring-0 p-3 rounded-lg transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer Buttons */}
            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingBroker(false);
                  setCurrentBroker(null);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-black hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Corretor'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* VIEW 4: STATS & BROKERS LIST */}
      {!isEditingBroker && activeTab === 'brokers' && (
        <div className="space-y-8 text-left">
          {/* Quick Metrics for Brokers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total de Corretores</span>
                <span className="p-2 bg-yellow-50 rounded-lg text-yellow-600">👔</span>
              </div>
              <div>
                <p className="font-serif text-2xl font-black text-gray-950">{(brokers || []).length}</p>
                <p className="text-[10px] text-gray-500">Membros da equipe ativos</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Experiência Média</span>
                <span className="p-2 bg-green-50 rounded-lg text-green-600">📊</span>
              </div>
              <div>
                <p className="font-serif text-2xl font-black text-gray-950">
                  {(brokers || []).length
                    ? `${((brokers || []).reduce((acc, b) => acc + (b.yearsOfExperience || 0), 0) / (brokers || []).length).toFixed(1)} anos`
                    : '0 anos'}
                </p>
                <p className="text-[10px] text-gray-500">Tempo de mercado médio</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Vendido</span>
                <span className="p-2 bg-blue-50 rounded-lg text-blue-600">🏆</span>
              </div>
              <div>
                <p className="font-serif text-2xl font-black text-gray-950">
                  {(brokers || []).reduce((acc, b) => acc + (b.propertiesSold || 0), 0)} un.
                </p>
                <p className="text-[10px] text-gray-500">Imóveis de luxo comercializados</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Origem de Dados</span>
                <span className="p-2 bg-purple-50 rounded-lg text-purple-600">⚡</span>
              </div>
              <div>
                <p className="font-serif text-xl font-black text-gray-950 truncate">
                  {isFirebaseConfigured ? 'Firestore' : 'Local Fallback'}
                </p>
                <p className="text-[10px] text-gray-500">{isFirebaseConfigured ? 'Nuvem Real-time' : 'Carregado em memória'}</p>
              </div>
            </div>
          </div>

          {/* Search bar inside list */}
          <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm max-w-md px-3 py-1">
            <span className="text-gray-400 mr-2"><Plus className="w-4 h-4 rotate-45" /></span>
            <input
              type="text"
              value={brokerSearchTerm}
              onChange={e => setBrokerSearchTerm(e.target.value)}
              placeholder="Buscar por nome, especialidade, CRECI..."
              className="w-full bg-transparent border-none text-sm outline-none py-2 text-gray-900 focus:ring-0"
            />
            {brokerSearchTerm && (
              <button onClick={() => setBrokerSearchTerm('')} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Brokers Table / Cards */}
          {(brokers || []).filter(b => 
            b.name.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
            b.creci.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
            b.specialty.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
            b.title.toLowerCase().includes(brokerSearchTerm.toLowerCase())
          ).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 space-y-4 shadow-sm">
              <span className="text-4xl block">👔</span>
              <h3 className="font-serif text-lg font-bold text-gray-900">Nenhum corretor encontrado</h3>
              <p className="text-gray-500 text-xs max-w-md mx-auto">
                Tente reajustar seu termo de busca ou adicione seu primeiro corretor clicando no botão "Cadastrar Corretor".
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="py-4 px-6 text-left">Corretor</th>
                      <th className="py-4 px-6 text-left">Especialidade / Título</th>
                      <th className="py-4 px-6 text-left">Contato</th>
                      <th className="py-4 px-6 text-center">CRECI</th>
                      <th className="py-4 px-6 text-center">Performance</th>
                      <th className="py-4 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                    {(brokers || [])
                      .filter(b => 
                        b.name.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
                        b.creci.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
                        b.specialty.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
                        b.title.toLowerCase().includes(brokerSearchTerm.toLowerCase())
                      )
                      .map((broker) => (
                        <tr key={broker.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shrink-0 bg-gray-100">
                                <img
                                  src={broker.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80'}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                              <div className="space-y-0.5 text-left max-w-xs truncate">
                                <span className="font-serif font-bold text-gray-950 block hover:text-yellow-600 transition-colors">
                                  {broker.name}
                                </span>
                                <span className="text-[10px] text-gray-500">ID: {broker.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-left">
                            <div className="space-y-0.5">
                              <span className="font-medium text-gray-900 block">{broker.title}</span>
                              <span className="text-[10px] text-gray-500">{broker.specialty}</span>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-left">
                            <div className="space-y-0.5">
                              <span className="text-gray-900 block">{broker.phone}</span>
                              <span className="text-[10px] text-gray-500 block">{broker.email}</span>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {broker.creci || 'Não informado'}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-yellow-600 font-bold">★ {broker.rating?.toFixed(1) || '5.0'}</span>
                              <span className="text-[10px] text-gray-400">
                                {broker.yearsOfExperience} anos exp • {broker.propertiesSold} vendas
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                onClick={() => handleEditBrokerSelect(broker)}
                                title="Editar corretor"
                                className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {confirmDeleteBrokerId === broker.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteBroker(broker.id)}
                                    className="px-2 py-1 bg-red-600 text-white rounded font-bold text-[10px] transition-colors"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteBrokerId(null)}
                                    className="px-1.5 py-1 bg-gray-200 text-gray-700 rounded text-[10px] transition-colors"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteBrokerId(broker.id)}
                                  title="Deletar corretor"
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: CLIENT FORM EDITOR */}
      {isEditingClient && currentClient && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden text-left"
        >
          <div className="bg-gray-950 p-6 md:p-8 text-white flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest block">
                {currentClient.id ? 'Editar Cliente' : 'Ficha de Cadastro'}
              </span>
              <h3 className="font-serif text-xl font-bold">
                {currentClient.id ? `Editar: ${currentClient.name}` : 'Cadastrar Novo Cliente'}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsEditingClient(false);
                setCurrentClient(null);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveClient} className="p-6 md:p-8 space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                Informações de Contato
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={currentClient.name || ''}
                    onChange={e => setCurrentClient({...currentClient, name: e.target.value})}
                    placeholder="Ex: Maria José de Sousa Alencar"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={currentClient.email || ''}
                    onChange={e => setCurrentClient({...currentClient, email: e.target.value})}
                    placeholder="Ex: cliente@provedor.com"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={currentClient.phone || ''}
                    onChange={e => setCurrentClient({...currentClient, phone: e.target.value})}
                    placeholder="Ex: (99) 98112-2334"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                Documentação & Dados Complementares
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CPF</label>
                  <input
                    type="text"
                    value={currentClient.cpf || ''}
                    onChange={e => setCurrentClient({...currentClient, cpf: e.target.value})}
                    placeholder="Ex: 123.456.789-00"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nome do Cônjuge (se aplicável)</label>
                  <input
                    type="text"
                    value={currentClient.spouseName || ''}
                    onChange={e => setCurrentClient({...currentClient, spouseName: e.target.value})}
                    placeholder="Ex: Nome completo do parceiro(a)"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Endereço Atual</label>
                  <input
                    type="text"
                    value={currentClient.address || ''}
                    onChange={e => setCurrentClient({...currentClient, address: e.target.value})}
                    placeholder="Ex: Rua, número, complemento, bairro, cidade - UF"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                Perfil & Vínculo com Imóvel
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Perfil do Cliente *</label>
                  <select
                    value={currentClient.type || 'buyer'}
                    onChange={e => setCurrentClient({...currentClient, type: e.target.value as any})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none font-bold"
                  >
                    <option value="buyer">Comprador / Interessado</option>
                    <option value="owner">Proprietário / Dono de Imóvel</option>
                  </select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vincular a Imóvel</label>
                  <select
                    value={currentClient.propertyId || ''}
                    onChange={e => setCurrentClient({...currentClient, propertyId: e.target.value})}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  >
                    <option value="">-- Nenhum Imóvel Selecionado --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.neighborhood}] {p.title} - {p.isSobConsulta ? 'Sob Consulta' : `R$ ${p.price?.toLocaleString('pt-BR')}`}
                      </option>
                    ))}
                  </select>
                </div>

                {currentClient.type === 'buyer' && (
                  <div className="md:col-span-12 space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status do Comprador com o Imóvel</label>
                    <select
                      value={currentClient.buyerStatus || 'interested'}
                      onChange={e => setCurrentClient({...currentClient, buyerStatus: e.target.value as any})}
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none font-bold"
                    >
                      <option value="interested">🟡 Interessado (Reserva o imóvel)</option>
                      <option value="signed_contract">🔴 Contrato Assinado (Vende o imóvel)</option>
                    </select>
                    <p className="text-[10px] text-gray-500 italic mt-1">
                      * Nota: O status do imóvel vinculado será alterado de acordo com esta seleção.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingClient(false);
                  setCurrentClient(null);
                }}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl font-sans text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-black hover:bg-yellow-600 text-white rounded-xl font-sans text-xs font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Ficha do Cliente'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* VIEW 6: STATS & CLIENTS LIST */}
      {!isEditingClient && activeTab === 'clients' && (
        <div className="space-y-8 text-left">
          {/* Quick Metrics for Clients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total de Clientes</span>
                <span className="font-serif text-2xl font-black text-gray-950">{clients.length}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Proprietários (Donos)</span>
                <span className="font-serif text-2xl font-black text-gray-950">{clients.filter(c => c.type === 'owner').length}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Compradores Reservados</span>
                <span className="font-serif text-2xl font-black text-gray-950">
                  {clients.filter(c => c.type === 'buyer' && c.buyerStatus === 'interested').length}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Contratos Assinados</span>
                <span className="font-serif text-2xl font-black text-gray-950">
                  {clients.filter(c => c.type === 'buyer' && c.buyerStatus === 'signed_contract').length}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar & List Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Buscar clientes por nome, email ou telefone..."
                  value={clientSearchTerm}
                  onChange={e => setClientSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/20 rounded-xl py-2 px-4 text-xs text-gray-900 outline-none transition-all pl-10"
                />
                <Users className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={handleCreateClientNew}
                className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-yellow-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Cliente
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-gray-200 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-gray-900">Nenhum cliente cadastrado</h3>
                <p className="text-gray-500 text-xs max-w-md mx-auto">
                  Adicione seu primeiro cliente proprietário ou comprador para gerenciar o vínculo de vendas.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="py-4 px-6 text-left">Cliente</th>
                        <th className="py-4 px-6 text-left">Tipo</th>
                        <th className="py-4 px-6 text-left">Contato</th>
                        <th className="py-4 px-6 text-left">Imóvel Vinculado</th>
                        <th className="py-4 px-6 text-center">Status de Venda</th>
                        <th className="py-4 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                      {clients
                        .filter(c => 
                          c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                          c.phone.toLowerCase().includes(clientSearchTerm.toLowerCase())
                        )
                        .map((client) => {
                          const linkedProperty = properties.find(p => p.id === client.propertyId);
                          return (
                            <tr key={client.id} className="hover:bg-gray-50/40 transition-colors">
                              <td className="py-4 px-6">
                                <div className="text-left font-bold text-gray-950 text-sm">
                                  {client.name}
                                  <span className="text-[10px] text-gray-400 block font-normal">ID: {client.id}</span>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-left">
                                {client.type === 'owner' ? (
                                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Proprietário (Dono)
                                  </span>
                                ) : (
                                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Comprador
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-6 text-left">
                                <div className="space-y-0.5">
                                  <span className="text-gray-900 block font-semibold">{client.phone}</span>
                                  <span className="text-[10px] text-gray-500 block">{client.email}</span>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-left">
                                {linkedProperty ? (
                                  <div className="space-y-0.5 max-w-xs">
                                    <span className="font-serif font-semibold text-gray-900 block truncate">
                                      {linkedProperty.title}
                                    </span>
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-yellow-600" />
                                      {linkedProperty.neighborhood}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">Nenhum imóvel</span>
                                )}
                              </td>

                              <td className="py-4 px-6 text-center">
                                {client.type === 'owner' ? (
                                  <span className="text-gray-500 font-semibold flex items-center justify-center gap-1 text-[10px]">
                                    <UserCheck className="w-3 h-3 text-blue-500" />
                                    Dono do Imóvel
                                  </span>
                                ) : (
                                  <>
                                    {client.buyerStatus === 'interested' && (
                                      <span className="bg-yellow-50 text-yellow-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                        Interessado (Reservado)
                                      </span>
                                    )}
                                    {client.buyerStatus === 'signed_contract' && (
                                      <span className="bg-red-50 text-red-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                        Contrato Assinado (Vendido)
                                      </span>
                                    )}
                                    {!client.buyerStatus && (
                                      <span className="text-gray-400 italic">Sem Status</span>
                                    )}
                                  </>
                                )}
                              </td>

                              <td className="py-4 px-6 text-center">
                                <div className="flex justify-center items-center gap-1.5">
                                  {client.type === 'buyer' && client.propertyId && (
                                    <button
                                      onClick={() => {
                                        const prop = properties.find(p => p.id === client.propertyId);
                                        if (prop) {
                                          const own = clients.find(c => c.type === 'owner' && (c.id === prop.ownerId || c.propertyId === prop.id));
                                          setSelectedContractProperty(prop);
                                          setSelectedContractBuyer(client);
                                          setSelectedContractOwner(own || undefined);
                                          setContractModalOpen(true);
                                        }
                                      }}
                                      title={language === 'pt' ? 'Gerar Contrato de Compra e Venda' : 'Generate Contract'}
                                      className="p-1.5 text-yellow-600 hover:text-white hover:bg-yellow-600 rounded-lg transition-all cursor-pointer shadow-sm border border-yellow-100"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleEditClientSelect(client)}
                                    title="Editar cliente"
                                    className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  
                                  {confirmDeleteClientId === client.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="px-2 py-1 bg-red-600 text-white rounded font-bold text-[10px] transition-colors"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteClientId(null)}
                                        className="px-1.5 py-1 bg-gray-200 text-gray-700 rounded text-[10px] transition-colors"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteClientId(client.id)}
                                      title="Deletar cliente"
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: USER FORM EDITOR */}
      {isEditingUser && currentUser && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden text-left"
        >
          <div className="bg-gray-950 p-6 md:p-8 text-white flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest block">
                {currentUser.id ? 'Editar Usuário' : 'Ficha de Cadastro'}
              </span>
              <h3 className="font-serif text-xl font-bold">
                {currentUser.id ? `Editar: ${currentUser.name}` : 'Cadastrar Novo Usuário'}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsEditingUser(false);
                setCurrentUser(null);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveUser} className="p-6 md:p-8 space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-yellow-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                Dados de Acesso & Identificação
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={currentUser.name || ''}
                    onChange={e => setCurrentUser({...currentUser, name: e.target.value})}
                    placeholder="Ex: Carlos Eduardo de Sousa"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">E-mail de Login</label>
                  <input
                    type="email"
                    required
                    value={currentUser.email || ''}
                    onChange={e => setCurrentUser({...currentUser, email: e.target.value})}
                    placeholder="Ex: carlos.corretor@faimoveis.com.br"
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Senha de Acesso</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={currentUser.password || ''}
                      onChange={e => setCurrentUser({...currentUser, password: e.target.value})}
                      placeholder="Defina uma senha segura"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 pl-0 pr-8 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1.5 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha de acesso"
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 pl-0 pr-8 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingUser(false);
                  setCurrentUser(null);
                }}
                className="px-6 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-black hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Usuário'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* VIEW: STATS & USERS LIST */}
      {!isEditingUser && activeTab === 'users' && (
        <div className="space-y-8 text-left">
          {/* Quick Metrics for Users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total de Usuários</span>
                <span className="font-serif text-2xl font-black text-gray-950">{adminUsers.length}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Sincronização</span>
                <span className="font-sans text-xs font-bold text-gray-800 block mt-1">
                  {isFirebaseConfigured ? '🟢 Sincronizado com Firebase' : '💾 Armazenamento Local'}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar & List Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Buscar usuários por nome ou email..."
                  value={userSearchTerm}
                  onChange={e => setUserSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/20 rounded-xl py-2 px-4 text-xs text-gray-900 outline-none transition-all pl-10"
                />
                <Users className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={handleCreateUserNew}
                className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-yellow-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Usuário
              </button>
            </div>

            {adminUsers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-gray-200 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-gray-900">Nenhum usuário customizado cadastrado</h3>
                <p className="text-gray-500 text-xs max-w-md mx-auto">
                  Crie novos usuários para acessar o painel administrativo com credenciais personalizadas.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="py-4 px-6 text-left">Usuário</th>
                        <th className="py-4 px-6 text-left">E-mail</th>
                        <th className="py-4 px-6 text-left">Senha Cadastrada</th>
                        <th className="py-4 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                      {adminUsers
                        .filter(u => 
                          u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                        )
                        .map((user) => {
                          return (
                            <tr key={user.id} className="hover:bg-gray-50/40 transition-colors">
                              <td className="py-4 px-6">
                                <div className="text-left font-bold text-gray-950 text-sm">
                                  {user.name}
                                  <span className="text-[10px] text-gray-400 block font-normal">ID: {user.id}</span>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-left font-medium">
                                {user.email}
                              </td>

                              <td className="py-4 px-6 text-left">
                                <span className="font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-600 select-none">
                                  ••••••••
                                </span>
                              </td>

                              <td className="py-4 px-6 text-center">
                                <div className="flex justify-center items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditUserSelect(user)}
                                    title="Editar usuário e trocar senha"
                                    className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  
                                  {confirmDeleteUserId === user.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="px-2 py-1 bg-red-600 text-white rounded font-bold text-[10px] transition-colors"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteUserId(null)}
                                        className="px-1.5 py-1 bg-gray-200 text-gray-700 rounded text-[10px] transition-colors"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteUserId(user.id)}
                                      title="Excluir usuário"
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'aboutUs' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden text-left p-6 md:p-8"
        >
          <form onSubmit={handleAboutUsSubmit} className="space-y-8">
            {/* Seção 1: Hero & Cabeçalho */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-black text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
                ✨ {language === 'pt' ? 'Cabeçalho Principal (Hero)' : 'Main Header (Hero)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {language === 'pt' ? 'Subtítulo' : 'Subtitle'}
                  </label>
                  <input
                    type="text"
                    value={aboutUsForm.heroSubtitlePt}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, heroSubtitlePt: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {language === 'pt' ? 'Título Principal' : 'Main Title'}
                  </label>
                  <input
                    type="text"
                    value={aboutUsForm.heroTitlePt}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, heroTitlePt: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                    required
                  />
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  {language === 'pt' ? 'Descrição Breve' : 'Short Description'}
                </label>
                <textarea
                  rows={2}
                  value={aboutUsForm.heroDescriptionPt}
                  onChange={(e) => setAboutUsForm({ ...aboutUsForm, heroDescriptionPt: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                  required
                />
              </div>
            </div>

            {/* Seção 2: Fotos & Endereço da Sede */}
            <div className="space-y-4 pt-4">
              <h3 className="font-serif text-lg font-black text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
                🏢 {language === 'pt' ? 'Sede Própria & Contato' : 'Headquarters & Contact'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {language === 'pt' ? 'URL da Imagem da Sede' : 'Office Image URL'}
                  </label>
                  <input
                    type="url"
                    value={aboutUsForm.officeImage}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, officeImage: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                    placeholder="https://images.unsplash.com/..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {language === 'pt' ? 'Endereço Completo' : 'Complete Address'}
                  </label>
                  <input
                    type="text"
                    value={aboutUsForm.officeAddress}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, officeAddress: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                    placeholder="Rua São Pedro, 263 Centro, Caxias, MA"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {language === 'pt' ? 'Etiqueta da Imagem' : 'Image Badge'}
                  </label>
                  <input
                    type="text"
                    value={aboutUsForm.officeImageBadgePt}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, officeImageBadgePt: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Métricas & Estatísticas */}
            <div className="space-y-4 pt-4">
              <h3 className="font-serif text-lg font-black text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
                📊 {language === 'pt' ? 'Métricas & Estatísticas' : 'Metrics & Statistics'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                    {language === 'pt' ? 'Métrica 1' : 'Metric 1'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                        {language === 'pt' ? 'Valor' : 'Value'}
                      </label>
                      <input
                        type="text"
                        value={aboutUsForm.stat1Value}
                        onChange={(e) => setAboutUsForm({ ...aboutUsForm, stat1Value: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                        placeholder="100%"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                        {language === 'pt' ? 'Descrição' : 'Description'}
                      </label>
                      <input
                        type="text"
                        value={aboutUsForm.stat1LabelPt}
                        onChange={(e) => setAboutUsForm({ ...aboutUsForm, stat1LabelPt: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                    {language === 'pt' ? 'Métrica 2' : 'Metric 2'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                        {language === 'pt' ? 'Valor' : 'Value'}
                      </label>
                      <input
                        type="text"
                        value={aboutUsForm.stat2Value}
                        onChange={(e) => setAboutUsForm({ ...aboutUsForm, stat2Value: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                        placeholder="R$ 50M+"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                        {language === 'pt' ? 'Descrição' : 'Description'}
                      </label>
                      <input
                        type="text"
                        value={aboutUsForm.stat2LabelPt}
                        onChange={(e) => setAboutUsForm({ ...aboutUsForm, stat2LabelPt: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 4: Conteúdo da História */}
            <div className="space-y-4 pt-4">
              <h3 className="font-serif text-lg font-black text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
                📖 {language === 'pt' ? 'Nossa História & Parágrafos' : 'Our Story & Paragraphs'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {language === 'pt' ? 'Título do Conteúdo' : 'Content Title'}
                  </label>
                  <input
                    type="text"
                    value={aboutUsForm.contentTitlePt}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, contentTitlePt: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {language === 'pt' ? 'Parágrafos da História (Pule linha para separar)' : 'Story Paragraphs (Break line to separate)'}
                  </label>
                  <textarea
                    rows={8}
                    value={aboutUsForm.contentParagraphsPt}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, contentParagraphsPt: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção 5: Pilares Fundamentais */}
            <div className="space-y-6 pt-4">
              <h3 className="font-serif text-lg font-black text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
                💎 {language === 'pt' ? 'Pilares Fundamentais' : 'Fundamental Pillars'}
              </h3>
              
              {/* Pilar 1 */}
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                  {language === 'pt' ? 'Pilar 1' : 'Pillar 1'}
                </span>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Título</label>
                    <input
                      type="text"
                      value={aboutUsForm.pillar1TitlePt}
                      onChange={(e) => setAboutUsForm({ ...aboutUsForm, pillar1TitlePt: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Descrição</label>
                    <input
                      type="text"
                      value={aboutUsForm.pillar1DescPt}
                      onChange={(e) => setAboutUsForm({ ...aboutUsForm, pillar1DescPt: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pilar 2 */}
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                  {language === 'pt' ? 'Pilar 2' : 'Pillar 2'}
                </span>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Título</label>
                    <input
                      type="text"
                      value={aboutUsForm.pillar2TitlePt}
                      onChange={(e) => setAboutUsForm({ ...aboutUsForm, pillar2TitlePt: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Descrição</label>
                    <input
                      type="text"
                      value={aboutUsForm.pillar2DescPt}
                      onChange={(e) => setAboutUsForm({ ...aboutUsForm, pillar2DescPt: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pilar 3 */}
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <span className="text-[11px] font-extrabold text-yellow-600 uppercase tracking-widest block">
                  {language === 'pt' ? 'Pilar 3' : 'Pillar 3'}
                </span>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Título</label>
                    <input
                      type="text"
                      value={aboutUsForm.pillar3TitlePt}
                      onChange={(e) => setAboutUsForm({ ...aboutUsForm, pillar3TitlePt: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Descrição</label>
                    <input
                      type="text"
                      value={aboutUsForm.pillar3DescPt}
                      onChange={(e) => setAboutUsForm({ ...aboutUsForm, pillar3DescPt: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm font-sans transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Save Button to click programmatically */}
            <button id="about-us-save-button" type="submit" className="hidden" />

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {language === 'pt' ? 'Salvando...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {language === 'pt' ? 'Salvar Alterações' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Contract Modal */}
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
    </div>
  );
}
