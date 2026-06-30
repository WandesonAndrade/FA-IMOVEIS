import React, { useState } from 'react';
import { Search, MapPin, Home, DollarSign, RotateCcw } from 'lucide-react';
import { DICTIONARY } from '../data';
import { Property } from '../types';

interface SearchFilterProps {
  onSearch: (filters: { location: string; type: string; maxPrice: number }) => void;
  onReset: () => void;
  language: 'pt' | 'en';
  isFiltered: boolean;
  properties: Property[];
}

export default function SearchFilter({ onSearch, onReset, language, isFiltered, properties }: SearchFilterProps) {
  const dict = DICTIONARY[language];
  const [location, setLocation] = useState('Todos');
  const [type, setType] = useState('Todos');
  const [priceInput, setPriceInput] = useState('');

  // Dynamically extract unique locations from properties
  const uniqueLocations = Array.from(new Set(properties.map(p => p.location))).filter(Boolean);
  const locations = [
    { value: 'Todos', label: language === 'pt' ? 'Todas Localizações' : 'All Locations' },
    ...uniqueLocations.map(loc => ({ value: loc, label: loc }))
  ];

  // Dynamically extract unique types from properties
  const uniqueTypes = Array.from(new Set(properties.map(p => p.type))).filter(Boolean);
  const types = [
    { value: 'Todos', label: language === 'pt' ? 'Todos os Tipos' : 'All Types' },
    ...uniqueTypes.map(t => ({ value: t, label: t }))
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice = priceInput.replace(/[^0-9]/g, '');
    const priceNum = cleanPrice ? parseInt(cleanPrice, 10) : 0;
    onSearch({ location, type, maxPrice: priceNum });
  };

  const handleResetClick = () => {
    setLocation('Todos');
    setType('Todos');
    setPriceInput('');
    onReset();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl md:rounded-2xl shadow-2xl transition-all duration-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          
          {/* Location Select */}
          <div className="flex flex-col text-left px-4 py-2 border-b md:border-b-0 md:border-r border-white/25">
            <label className="text-[10px] uppercase tracking-widest text-white/70 font-bold flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-yellow-500" />
              {dict.locationLabel}
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm focus:ring-0 p-0 w-full cursor-pointer focus:outline-none appearance-none [&>option]:text-black"
            >
              {locations.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Property Type Select */}
          <div className="flex flex-col text-left px-4 py-2 border-b md:border-b-0 md:border-r border-white/25">
            <label className="text-[10px] uppercase tracking-widest text-white/70 font-bold flex items-center gap-1 mb-1">
              <Home className="w-3.5 h-3.5 text-yellow-500" />
              {dict.typeLabel}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm focus:ring-0 p-0 w-full cursor-pointer focus:outline-none appearance-none [&>option]:text-black"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Input */}
          <div className="flex flex-col text-left px-4 py-2 border-b md:border-b-0 md:border-r border-white/25">
            <label className="text-[10px] uppercase tracking-widest text-white/70 font-bold flex items-center gap-1 mb-1">
              <span className="text-yellow-500 font-serif">R$</span>
              {dict.priceLabel}
            </label>
            <input
              type="text"
              value={priceInput}
              onChange={(e) => {
                // Keep only numbers
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val) {
                  setPriceInput(new Intl.NumberFormat('pt-BR').format(parseInt(val, 10)));
                } else {
                  setPriceInput('');
                }
              }}
              placeholder={dict.searchPlaceholder}
              className="bg-transparent border-none text-white font-medium text-sm focus:ring-0 p-0 w-full placeholder:text-white/40 focus:outline-none"
            />
          </div>

          {/* Action Button Container */}
          <div className="flex gap-2 w-full">
            <button
              type="submit"
              className="flex-grow bg-white text-black hover:bg-yellow-600 hover:text-white h-12 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer text-sm font-sans uppercase tracking-wider shadow-md active:scale-95"
            >
              <Search className="w-4 h-4" />
              {dict.searchBtn}
            </button>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetClick}
                className="p-3 bg-white/10 hover:bg-white/25 text-white rounded-lg transition-all cursor-pointer"
                title={language === 'pt' ? 'Limpar filtros' : 'Clear filters'}
              >
                <RotateCcw className="w-5 h-5 animate-spin-reverse" />
              </button>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}
