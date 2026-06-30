export interface Property {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  type: string;
  location: string;
  neighborhood: string;
  price: number;
  isSobConsulta?: boolean;
  suites: number;
  bathrooms: number;
  area: number;
  vagas: number;
  condominio?: number;
  iptu?: number;
  images: string[];
  badge?: string;
  comodidades: string[];
  brokerId: string;
  closestPlaces?: { name: string; time: string }[];
  address?: string;
  showAddressOnSite?: boolean;
  ownerId?: string;
  status?: 'available' | 'interested' | 'sold';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'owner' | 'buyer'; // owner = Dono, buyer = Comprador
  propertyId?: string;     // Vinculado a este imóvel
  buyerStatus?: 'interested' | 'signed_contract' | ''; // Status do comprador se type for 'buyer'
  createdAt?: string;
  cpf?: string;
  address?: string;
  spouseName?: string;
}

export interface Broker {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  creci: string;
  image: string;
  rating: number;
  yearsOfExperience: number;
  propertiesSold: number;
  bio: string;
  specialty: string;
  instagram: string;
  linkedin: string;
  quote: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  date: string;
  propertyTitle?: string;
  brokerName?: string;
  type: 'general' | 'visit' | 'broker';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'broker';
  createdAt?: string;
}

export type ActiveView = 'home' | 'property-detail' | 'broker-detail' | 'favorites' | 'messages' | 'about' | 'admin';

export interface AboutUsConfig {
  heroSubtitlePt: string;
  heroSubtitleEn: string;
  heroTitlePt: string;
  heroTitleEn: string;
  heroDescriptionPt: string;
  heroDescriptionEn: string;
  
  officeImage: string;
  officeImageBadgePt: string;
  officeImageBadgeEn: string;
  officeAddress: string;
  
  stat1Value: string;
  stat1LabelPt: string;
  stat1LabelEn: string;
  stat2Value: string;
  stat2LabelPt: string;
  stat2LabelEn: string;
  
  contentTitlePt: string;
  contentTitleEn: string;
  
  contentParagraphsPt: string;
  contentParagraphsEn: string;
  
  pillar1TitlePt: string;
  pillar1TitleEn: string;
  pillar1DescPt: string;
  pillar1DescEn: string;

  pillar2TitlePt: string;
  pillar2TitleEn: string;
  pillar2DescPt: string;
  pillar2DescEn: string;

  pillar3TitlePt: string;
  pillar3TitleEn: string;
  pillar3DescPt: string;
  pillar3DescEn: string;
}

