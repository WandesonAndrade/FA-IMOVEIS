import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDocFromServer,
  setLogLevel,
  getDoc,
} from "firebase/firestore";
import { PROPERTIES, BROKERS, DEFAULT_ABOUT_US } from "../data";
import { Property, Broker, Client, AdminUser, AboutUsConfig } from "../types";

// Configuração do cliente web a partir das variáveis de ambiente do Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Verifica se as configurações básicas de conexão existem
const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let db: any = null;
let auth: any = null;

// Tipos de operações para o tratamento de erros
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

// Estrutura de informações de erro do Firestore
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Função centralizada para lidar com erros do Firestore
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error("Erro no Firestore: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Inicialização do Firebase
if (isConfigured) {
  try {
    // Garante que o app não seja inicializado mais de uma vez
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // Captura o ID do banco customizado do .env, se existir
    const databaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID;

    // Inicializa o Firestore com o banco específico ou o padrão
    db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

    auth = getAuth(app);

    // Define o nível de log do Firestore como silencioso para evitar
    // que erros de conexão poluam os logs quando estiver desenvolvendo offline
    setLogLevel("silent");
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
  }
} else {
  console.log(
    "Firebase não está configurado. O site está usando o modo offline/local com as propriedades do arquivo data.ts.",
  );
}

// Valida a conexão com o Firestore durante a inicialização do app
async function testConnection() {
  if (!isConfigured || !db) return;
  try {
    // Teste padrão de conexão com tempo limite (timeout) de 2 segundos
    const fetchPromise = getDocFromServer(doc(db, "test_connection", "status"));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 2000),
    );
    await Promise.race([fetchPromise, timeoutPromise]);
    console.log("Conectado com sucesso ao Firestore!");
  } catch (error) {
    console.log(
      "Teste de conexão com o Firestore finalizado (operando em modo offline/cache ou modo de segurança/fallback).",
    );
  }
}
testConnection();

export { db, auth, isConfigured };

/**
 * Função utilitária para buscar todos os imóveis do Firestore.
 * Se o Firebase não estiver configurado ou ocorrer algum erro, retorna as propriedades estáticas como fallback (plano B).
 */
export async function fetchPropertiesFromFirebase(): Promise<Property[]> {
  if (!isConfigured || !db) {
    console.log(
      "Retornando propriedades locais (Firebase offline/não configurado)",
    );
    return PROPERTIES;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "properties"));
    if (querySnapshot.empty) {
      console.log(
        "Nenhum imóvel encontrado no Firestore. Você pode populá-lo usando a função de semente (seed).",
      );
      return PROPERTIES;
    }

    const fetched: Property[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetched.push({
        id: docSnap.id,
        title: data.title || "",
        description: data.description || "",
        fullDescription: data.fullDescription || "",
        type: data.type || "",
        location: data.location || "",
        neighborhood: data.neighborhood || "",
        price: Number(data.price ?? 0),
        isSobConsulta: !!data.isSobConsulta,
        suites: Number(data.suites ?? 0),
        bathrooms: Number(data.bathrooms ?? 0),
        area: Number(data.area ?? 0),
        vagas: Number(data.vagas ?? 0),
        condominio: data.condominio ? Number(data.condominio) : undefined,
        iptu: data.iptu ? Number(data.iptu) : undefined,
        images: Array.isArray(data.images) ? data.images : [],
        badge: data.badge || undefined,
        comodidades: Array.isArray(data.comodidades) ? data.comodidades : [],
        brokerId: data.brokerId || "",
        closestPlaces: Array.isArray(data.closestPlaces)
          ? data.closestPlaces
          : [],
      });
    });

    return fetched;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "properties");
    return PROPERTIES;
  }
}

/**
 * Insere as propriedades iniciais (do arquivo local) no Firestore para facilitar a configuração do banco.
 */
export async function seedPropertiesToFirebase(): Promise<boolean> {
  if (!isConfigured || !db) {
    console.error("Não é possível semear: Firebase não configurado.");
    return false;
  }

  try {
    for (const prop of PROPERTIES) {
      // Usamos setDoc para manter o mesmo ID definido localmente
      await setDoc(doc(db, "properties", prop.id), {
        title: prop.title,
        description: prop.description,
        fullDescription: prop.fullDescription,
        type: prop.type,
        location: prop.location,
        neighborhood: prop.neighborhood,
        price: prop.price,
        isSobConsulta: !!prop.isSobConsulta,
        suites: prop.suites,
        bathrooms: prop.bathrooms,
        area: prop.area,
        vagas: prop.vagas,
        condominio: prop.condominio || 0,
        iptu: prop.iptu || 0,
        images: prop.images,
        badge: prop.badge || "",
        comodidades: prop.comodidades,
        brokerId: prop.brokerId,
        closestPlaces: prop.closestPlaces || [],
      });
    }
    console.log("Propriedades semeadas com sucesso no Firestore!");
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "properties");
    return false;
  }
}

/**
 * Adiciona ou atualiza um imóvel no Firestore.
 */
export async function savePropertyToFirebase(
  property: Property,
): Promise<Property | null> {
  if (!isConfigured || !db) {
    console.warn("Firebase não configurado. Retornando imóvel local.");
    return {
      ...property,
      id: property.id || `prop_${Date.now()}`,
    };
  }

  const propertyId = property.id || `prop_${Date.now()}`;
  try {
    const cleanProperty = {
      id: propertyId,
      title: property.title || "",
      description: property.description || "",
      fullDescription: property.fullDescription || "",
      type: property.type || "",
      location: property.location || "",
      neighborhood: property.neighborhood || "",
      price: Number(property.price ?? 0),
      isSobConsulta: !!property.isSobConsulta,
      suites: Number(property.suites ?? 0),
      bathrooms: Number(property.bathrooms ?? 0),
      area: Number(property.area ?? 0),
      vagas: Number(property.vagas ?? 0),
      condominio: property.condominio ? Number(property.condominio) : 0,
      iptu: property.iptu ? Number(property.iptu) : 0,
      images: Array.isArray(property.images) ? property.images : [],
      badge: property.badge || "",
      comodidades: Array.isArray(property.comodidades)
        ? property.comodidades
        : [],
      brokerId: property.brokerId || "felipe-alencar",
      closestPlaces: Array.isArray(property.closestPlaces)
        ? property.closestPlaces
        : [],
    };

    await setDoc(doc(db, "properties", propertyId), cleanProperty);
    console.log("Imóvel salvo com sucesso no Firestore!", cleanProperty);
    return cleanProperty;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `properties/${propertyId}`,
    );
    return null;
  }
}

/**
 * Remove um imóvel do Firestore.
 */
export async function deletePropertyFromFirebase(id: string): Promise<boolean> {
  if (!isConfigured || !db) {
    console.warn(
      "Firebase não configurado. Não é possível deletar remotamente.",
    );
    return true;
  }

  try {
    await deleteDoc(doc(db, "properties", id));
    console.log("Imóvel removido com sucesso do Firestore!");
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `properties/${id}`);
    return false;
  }
}

/**
 * Busca todos os corretores do Firestore.
 * Se o Firebase não estiver configurado ou ocorrer algum erro, retorna os corretores estáticos como fallback.
 */
export async function fetchBrokersFromFirebase(): Promise<Broker[]> {
  if (!isConfigured || !db) {
    console.log(
      "Retornando corretores locais (Firebase offline/não configurado)",
    );
    return BROKERS;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "brokers"));
    if (querySnapshot.empty) {
      console.log(
        "Nenhum corretor encontrado no Firestore. Você pode populá-lo usando a função de semente (seed).",
      );
      return BROKERS;
    }

    const fetched: Broker[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetched.push({
        id: docSnap.id,
        name: data.name || "",
        title: data.title || "",
        phone: data.phone || "",
        email: data.email || "",
        creci: data.creci || "",
        image: data.image || "",
        rating: Number(data.rating ?? 5.0),
        yearsOfExperience: Number(data.yearsOfExperience ?? 0),
        propertiesSold: Number(data.propertiesSold ?? 0),
        bio: data.bio || "",
        specialty: data.specialty || "",
        instagram: data.instagram || "",
        linkedin: data.linkedin || "",
        quote: data.quote || "",
      });
    });

    return fetched;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "brokers");
    return BROKERS;
  }
}

/**
 * Popula o banco do Firestore com os corretores iniciais do arquivo data.ts.
 */
export async function seedBrokersToFirebase(): Promise<boolean> {
  if (!isConfigured || !db) {
    console.warn("Firebase não configurado. Impossível semear.");
    return false;
  }

  try {
    for (const broker of BROKERS) {
      const cleanBroker = {
        id: broker.id,
        name: broker.name,
        title: broker.title,
        phone: broker.phone,
        email: broker.email,
        creci: broker.creci,
        image: broker.image,
        rating: Number(broker.rating ?? 5.0),
        yearsOfExperience: Number(broker.yearsOfExperience ?? 0),
        propertiesSold: Number(broker.propertiesSold ?? 0),
        bio: broker.bio,
        specialty: broker.specialty,
        instagram: broker.instagram,
        linkedin: broker.linkedin,
        quote: broker.quote,
      };
      await setDoc(doc(db, "brokers", broker.id), cleanBroker);
    }
    console.log("Corretores semeados com sucesso no Firestore!");
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "brokers");
    return false;
  }
}

/**
 * Salva ou atualiza um corretor no Firestore.
 */
export async function saveBrokerToFirebase(
  broker: Broker,
): Promise<Broker | null> {
  if (!isConfigured || !db) {
    console.warn("Firebase não configurado. Retornando corretor local.");
    return {
      ...broker,
      id: broker.id || `broker_${Date.now()}`,
    };
  }

  const brokerId = broker.id || `broker_${Date.now()}`;
  try {
    const cleanBroker = {
      id: brokerId,
      name: broker.name || "",
      title: broker.title || "",
      phone: broker.phone || "",
      email: broker.email || "",
      creci: broker.creci || "",
      image: broker.image || "",
      rating: Number(broker.rating ?? 5.0),
      yearsOfExperience: Number(broker.yearsOfExperience ?? 0),
      propertiesSold: Number(broker.propertiesSold ?? 0),
      bio: broker.bio || "",
      specialty: broker.specialty || "",
      instagram: broker.instagram || "",
      linkedin: broker.linkedin || "",
      quote: broker.quote || "",
    };

    await setDoc(doc(db, "brokers", brokerId), cleanBroker);
    console.log("Corretor salvo com sucesso no Firestore!", cleanBroker);
    return cleanBroker;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `brokers/${brokerId}`);
    return null;
  }
}

/**
 * Remove um corretor do Firestore.
 */
export async function deleteBrokerToFirebase(id: string): Promise<boolean> {
  if (!isConfigured || !db) {
    console.warn(
      "Firebase não configurado. Não é possível deletar remotamente.",
    );
    return true;
  }

  try {
    await deleteDoc(doc(db, "brokers", id));
    console.log("Corretor removido com sucesso do Firestore!");
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `brokers/${id}`);
    return false;
  }
}

/**
 * Busca todos os clientes do Firestore.
 */
export async function fetchClientsFromFirebase(): Promise<Client[]> {
  if (!isConfigured || !db) {
    console.log(
      "Retornando clientes vazios (Firebase offline/não configurado)",
    );
    return [
      {
        id: "client-1",
        name: "Maria Silva Santos",
        email: "maria.silva@gmail.com",
        phone: "(99) 98822-1144",
        type: "owner",
        createdAt: "2026-06-25T10:00:00Z",
      },
      {
        id: "client-2",
        name: "Carlos Alberto Souza",
        email: "carlos.alberto@hotmail.com",
        phone: "(99) 99133-2255",
        type: "buyer",
        buyerStatus: "interested",
        createdAt: "2026-06-25T11:00:00Z",
      },
    ];
  }

  try {
    const querySnapshot = await getDocs(collection(db, "clients"));
    const fetched: Client[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetched.push({
        id: docSnap.id,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        type: data.type || "buyer",
        propertyId: data.propertyId || "",
        buyerStatus: data.buyerStatus || "",
        createdAt: data.createdAt || "",
        cpf: data.cpf || "",
        address: data.address || "",
        spouseName: data.spouseName || "",
      });
    });
    return fetched;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "clients");
    return [];
  }
}

/**
 * Salva ou atualiza um cliente no Firestore.
 */
export async function saveClientToFirebase(
  client: Client,
): Promise<Client | null> {
  if (!isConfigured || !db) {
    console.warn("Firebase não configurado. Salvando cliente localmente.");
    return {
      ...client,
      id: client.id || `client_${Date.now()}`,
    };
  }

  const clientId = client.id || `client_${Date.now()}`;
  try {
    const cleanClient = {
      id: clientId,
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      type: client.type || "buyer",
      propertyId: client.propertyId || "",
      buyerStatus: client.buyerStatus || "",
      createdAt: client.createdAt || new Date().toISOString(),
      cpf: client.cpf || "",
      address: client.address || "",
      spouseName: client.spouseName || "",
    };

    await setDoc(doc(db, "clients", clientId), cleanClient);
    console.log("Cliente salvo com sucesso no Firestore!", cleanClient);
    return cleanClient as Client;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `clients/${clientId}`);
    return null;
  }
}

/**
 * Remove um cliente do Firestore.
 */
export async function deleteClientFromFirebase(id: string): Promise<boolean> {
  if (!isConfigured || !db) {
    console.warn(
      "Firebase não configurado. Não é possível deletar remotamente.",
    );
    return true;
  }

  try {
    await deleteDoc(doc(db, "clients", id));
    console.log("Cliente removido com sucesso do Firestore!");
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    return false;
  }
}

/**
 * Busca todos os usuários administradores do Firestore.
 */
export async function fetchAdminUsersFromFirebase(): Promise<AdminUser[]> {
  if (!isConfigured || !db) {
    console.log(
      "Retornando usuários administradores vazios (Firebase offline/não configurado)",
    );
    return [];
  }

  try {
    const querySnapshot = await getDocs(collection(db, "admin_users"));
    const fetched: AdminUser[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetched.push({
        id: docSnap.id,
        name: data.name || "",
        email: data.email || "",
        password: data.password || "",
        role: data.role || "admin",
        createdAt: data.createdAt || "",
      });
    });
    return fetched;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "admin_users");
    return [];
  }
}

/**
 * Salva ou atualiza um usuário administrador no Firestore.
 */
export async function saveAdminUserToFirebase(
  user: AdminUser,
): Promise<AdminUser | null> {
  if (!isConfigured || !db) {
    console.warn(
      "Firebase não configurado. Salvando usuário administrador localmente.",
    );
    return {
      ...user,
      id: user.id || `user_${Date.now()}`,
    };
  }

  const userId = user.id || `user_${Date.now()}`;
  try {
    const cleanUser = {
      id: userId,
      name: user.name || "",
      email: user.email || "",
      password: user.password || "",
      role: user.role || "admin",
      createdAt: user.createdAt || new Date().toISOString(),
    };

    await setDoc(doc(db, "admin_users", userId), cleanUser);
    console.log(
      "Usuário administrador salvo com sucesso no Firestore!",
      cleanUser,
    );
    return cleanUser as AdminUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admin_users/${userId}`);
    return null;
  }
}

/**
 * Remove um usuário administrador do Firestore.
 */
export async function deleteAdminUserFromFirebase(
  id: string,
): Promise<boolean> {
  if (!isConfigured || !db) {
    console.warn(
      "Firebase não configurado. Não é possível deletar remotamente.",
    );
    return true;
  }

  try {
    await deleteDoc(doc(db, "admin_users", id));
    console.log("Usuário administrador removido com sucesso do Firestore!");
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admin_users/${id}`);
    return false;
  }
}

/**
 * Busca a configuração da página "Sobre Nós" no Firestore.
 * Se o Firebase não estiver configurado ou ocorrer algum erro, retorna as configurações padrão (DEFAULT_ABOUT_US) como fallback.
 */
export async function fetchAboutUsFromFirebase(): Promise<AboutUsConfig> {
  if (!isConfigured || !db) {
    return DEFAULT_ABOUT_US;
  }

  try {
    const docSnap = await getDoc(doc(db, "settings", "about_us"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        heroSubtitlePt: data.heroSubtitlePt ?? DEFAULT_ABOUT_US.heroSubtitlePt,
        heroSubtitleEn: data.heroSubtitleEn ?? DEFAULT_ABOUT_US.heroSubtitleEn,
        heroTitlePt: data.heroTitlePt ?? DEFAULT_ABOUT_US.heroTitlePt,
        heroTitleEn: data.heroTitleEn ?? DEFAULT_ABOUT_US.heroTitleEn,
        heroDescriptionPt:
          data.heroDescriptionPt ?? DEFAULT_ABOUT_US.heroDescriptionPt,
        heroDescriptionEn:
          data.heroDescriptionEn ?? DEFAULT_ABOUT_US.heroDescriptionEn,

        officeImage: data.officeImage ?? DEFAULT_ABOUT_US.officeImage,
        officeImageBadgePt:
          data.officeImageBadgePt ?? DEFAULT_ABOUT_US.officeImageBadgePt,
        officeImageBadgeEn:
          data.officeImageBadgeEn ?? DEFAULT_ABOUT_US.officeImageBadgeEn,
        officeAddress: data.officeAddress ?? DEFAULT_ABOUT_US.officeAddress,

        stat1Value: data.stat1Value ?? DEFAULT_ABOUT_US.stat1Value,
        stat1LabelPt: data.stat1LabelPt ?? DEFAULT_ABOUT_US.stat1LabelPt,
        stat1LabelEn: data.stat1LabelEn ?? DEFAULT_ABOUT_US.stat1LabelEn,
        stat2Value: data.stat2Value ?? DEFAULT_ABOUT_US.stat2Value,
        stat2LabelPt: data.stat2LabelPt ?? DEFAULT_ABOUT_US.stat2LabelPt,
        stat2LabelEn: data.stat2LabelEn ?? DEFAULT_ABOUT_US.stat2LabelEn,

        contentTitlePt: data.contentTitlePt ?? DEFAULT_ABOUT_US.contentTitlePt,
        contentTitleEn: data.contentTitleEn ?? DEFAULT_ABOUT_US.contentTitleEn,

        contentParagraphsPt:
          data.contentParagraphsPt ?? DEFAULT_ABOUT_US.contentParagraphsPt,
        contentParagraphsEn:
          data.contentParagraphsEn ?? DEFAULT_ABOUT_US.contentParagraphsEn,

        pillar1TitlePt: data.pillar1TitlePt ?? DEFAULT_ABOUT_US.pillar1TitlePt,
        pillar1TitleEn: data.pillar1TitleEn ?? DEFAULT_ABOUT_US.pillar1TitleEn,
        pillar1DescPt: data.pillar1DescPt ?? DEFAULT_ABOUT_US.pillar1DescPt,
        pillar1DescEn: data.pillar1DescEn ?? DEFAULT_ABOUT_US.pillar1DescEn,

        pillar2TitlePt: data.pillar2TitlePt ?? DEFAULT_ABOUT_US.pillar2TitlePt,
        pillar2TitleEn: data.pillar2TitleEn ?? DEFAULT_ABOUT_US.pillar2TitleEn,
        pillar2DescPt: data.pillar2DescPt ?? DEFAULT_ABOUT_US.pillar2DescPt,
        pillar2DescEn: data.pillar2DescEn ?? DEFAULT_ABOUT_US.pillar2DescEn,

        pillar3TitlePt: data.pillar3TitlePt ?? DEFAULT_ABOUT_US.pillar3TitlePt,
        pillar3TitleEn: data.pillar3TitleEn ?? DEFAULT_ABOUT_US.pillar3TitleEn,
        pillar3DescPt: data.pillar3DescPt ?? DEFAULT_ABOUT_US.pillar3DescPt,
        pillar3DescEn: data.pillar3DescEn ?? DEFAULT_ABOUT_US.pillar3DescEn,
      };
    }
    return DEFAULT_ABOUT_US;
  } catch (error) {
    console.error(
      "Erro ao buscar configurações do Sobre Nós no Firestore, usando padrão:",
      error,
    );
    return DEFAULT_ABOUT_US;
  }
}

/**
 * Salva a configuração da página "Sobre Nós" no Firestore.
 */
export async function saveAboutUsToFirebase(
  config: AboutUsConfig,
): Promise<boolean> {
  if (!isConfigured || !db) {
    console.warn("Firebase não configurado. Salvando localmente.");
    return true;
  }

  try {
    await setDoc(doc(db, "settings", "about_us"), { ...config });
    console.log("Configuração do Sobre Nós salva com sucesso no Firestore!");
    return true;
  } catch (error) {
    console.error("Erro ao salvar Sobre Nós no Firestore:", error);
    return false;
  }
}
