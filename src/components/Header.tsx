import { useState } from 'react';
import { Globe, Heart, Mail, Phone, Menu, X, MessageSquare } from 'lucide-react';
import { ActiveView } from '../types';
import { DICTIONARY } from '../data';

interface HeaderProps {
  currentView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  language: 'pt' | 'en';
  onLanguageToggle: () => void;
  favoritesCount: number;
  messagesCount: number;
}

export default function Header({
  currentView,
  onViewChange,
  language,
  onLanguageToggle,
  favoritesCount,
  messagesCount
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dict = DICTIONARY[language];

  const navItems = [
    { label: dict.properties, view: 'home' as ActiveView },
    { label: dict.favorites, view: 'favorites' as ActiveView },
    { label: dict.aboutUs, view: 'about' as ActiveView }
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        {/* Logo */}
        <button
          onClick={() => {
            onViewChange('home');
            setMobileMenuOpen(false);
          }}
          className="font-serif text-2xl font-bold tracking-tight text-black hover:opacity-80 transition-opacity cursor-pointer"
        >
          {dict.appName}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onViewChange(item.view)}
              className={`font-sans text-sm font-medium tracking-wide transition-colors cursor-pointer relative py-2 ${
                currentView === item.view
                  ? 'text-yellow-600'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {item.label}
              {item.view === 'favorites' && favoritesCount > 0 && (
                <span className="absolute -top-1 -right-4 bg-yellow-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {favoritesCount}
                </span>
              )}
              {item.view === 'messages' && messagesCount > 0 && (
                <span className="absolute -top-1 -right-4 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {messagesCount}
                </span>
              )}
              {currentView === item.view && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-yellow-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Utilitários */}
        <div className="hidden md:flex items-center gap-4">
          {/* Favoritos */}
          <button
            onClick={() => onViewChange('favorites')}
            className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${currentView === 'favorites' ? 'fill-yellow-600 text-yellow-600' : ''}`} />
            {favoritesCount > 0 && (
              <span className="absolute top-1 right-1 bg-yellow-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Botão de Contato */}
          <button
            onClick={() => {
              const contactSection = document.getElementById('contato-secao');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              } else {
                onViewChange('home');
                setTimeout(() => {
                  document.getElementById('contato-secao')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="bg-black text-white font-sans text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded-lg hover:bg-yellow-600 transition-colors duration-300 shadow-sm cursor-pointer"
          >
            {dict.contact}
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => onViewChange('favorites')}
            className="relative p-2 text-gray-600"
          >
            <Heart className={`w-5 h-5 ${currentView === 'favorites' ? 'fill-yellow-600 text-yellow-600' : ''}`} />
            {favoritesCount > 0 && (
              <span className="absolute top-0 right-0 bg-yellow-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-black cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-6 space-y-4 absolute top-20 left-0 w-full shadow-lg transition-all duration-300">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  onViewChange(item.view);
                  setMobileMenuOpen(false);
                }}
                className={`text-left font-sans text-base font-semibold py-2 flex items-center justify-between ${
                  currentView === item.view ? 'text-yellow-600' : 'text-gray-700'
                }`}
              >
                <span>{item.label}</span>
                {item.view === 'favorites' && favoritesCount > 0 && (
                  <span className="bg-yellow-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {favoritesCount}
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const contactSection = document.getElementById('contato-secao');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onViewChange('home');
                  setTimeout(() => {
                    document.getElementById('contato-secao')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="w-full bg-black text-white text-center font-sans text-xs font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              {dict.contact}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
