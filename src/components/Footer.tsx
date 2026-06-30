import { Mail, Phone, Globe, Instagram, Linkedin, MapPin } from 'lucide-react';
import { DICTIONARY } from '../data';
import { ActiveView } from '../types';

interface FooterProps {
  language: 'pt' | 'en';
  onViewChange: (view: ActiveView) => void;
}

export default function Footer({ language, onViewChange }: FooterProps) {
  const dict = DICTIONARY[language];

  return (
    <footer className="bg-black text-white border-t border-gray-900 pt-16 pb-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-6">
            <button
              onClick={() => onViewChange('home')}
              className="font-serif text-3xl font-bold tracking-tight text-white hover:opacity-85 transition-opacity text-left cursor-pointer"
            >
              {dict.appName}
            </button>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {language === 'pt'
                ? 'Excelência imobiliária focada no mercado de alto padrão. Oferecemos uma experiência completa de consultoria e curadoria para quem busca o extraordinário.'
                : 'Real estate excellence focused on the high-end market. We offer a full-service consultancy and curation experience for those seeking the extraordinary.'}
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 border border-gray-800 rounded-full text-gray-400 hover:text-white hover:border-white hover:bg-gray-900 transition-all"
                title="Website"
              >
                <Globe className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-800 rounded-full text-gray-400 hover:text-white hover:border-white hover:bg-gray-900 transition-all"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-800 rounded-full text-gray-400 hover:text-white hover:border-white hover:bg-gray-900 transition-all"
                title="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-sans text-xs font-bold text-yellow-600 uppercase tracking-widest mb-6">
              {language === 'pt' ? 'Navegação' : 'Navigation'}
            </h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li>
                <button onClick={() => onViewChange('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                  {dict.properties}
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('favorites')} className="hover:text-white transition-colors cursor-pointer text-left">
                  {dict.favorites}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onViewChange('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {dict.aboutUs}
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors text-left block">
                  {language === 'pt' ? 'Política de Privacidade' : 'Privacy Policy'}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Map / Contact Summary */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-sans text-xs font-bold text-yellow-600 uppercase tracking-widest mb-2">
              {language === 'pt' ? 'Localização' : 'Location'}
            </h4>
            <div className="rounded-xl overflow-hidden shadow-xl border border-gray-800 h-44 relative group">
              <iframe
                src="https://maps.google.com/maps?width=100%25&amp;height=200&amp;hl=pt&amp;q=Rua%20S%C3%A3o%20Pedro%20263,%20Centro,%20Caxias%20-%20MA&amp;t=&amp;z=16&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen={false}
                aria-hidden="false"
                tabIndex={0}
                title="FA Imóveis Location"
                className="grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
              />
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">FA Imóveis Luxury Estate</p>
              <p>Rua São Pedro, 263 - Centro</p>
              <p>Caxias - MA, CEP: 65600-000</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
          <p>© 2026 {dict.appName}. {language === 'pt' ? 'Exclusive Real Estate Excellence. Todos os direitos reservados.' : 'Exclusive Real Estate Excellence. All rights reserved.'}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center justify-center md:justify-end">
            <span>CRECI: 123.456-J</span>
            <span className="text-gray-600">|</span>
            <span>CNPJ: 12.345.678/0001-99</span>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => onViewChange('admin')}
              className="hover:text-yellow-600 transition-colors cursor-pointer text-gray-500 font-medium"
            >
              {language === 'pt' ? 'Área Restrita' : 'Restricted Area'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
