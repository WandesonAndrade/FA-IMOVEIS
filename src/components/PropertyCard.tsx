import React from 'react';
import { Heart, Maximize2, BedDouble } from 'lucide-react';
import { Property } from '../types';
import { DICTIONARY } from '../data';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
  onDetailsClick: () => void;
  language: 'pt' | 'en';
  key?: string;
}

export default function PropertyCard({
  property,
  isFavorite,
  onFavoriteToggle,
  onDetailsClick,
  language
}: PropertyCardProps) {
  const dict = DICTIONARY[language];

  // Formatter for currency
  const formatPrice = (value: number) => {
    if (value === 0 || property.isSobConsulta) {
      return dict.sobConsulta;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div
      onClick={onDetailsClick}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500 flex flex-col h-full cursor-pointer"
    >
      {/* Property Image Container */}
      <div className="relative h-72 overflow-hidden bg-gray-50">
        <img
          src={property.images[0]}
          alt={property.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Transparent Overlay on Hover */}
        <div className="absolute inset-0 bg-black/5 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none" />

        {/* Status Badge */}
        {property.status && property.status !== 'available' && (
          <div className={`absolute top-4 left-4 text-[10px] font-sans font-extrabold uppercase px-3 py-1.5 rounded-full tracking-wider shadow-sm z-10 ${
            property.status === 'interested'
              ? 'bg-amber-500 text-black font-bold'
              : 'bg-red-600 text-white font-black'
          }`}>
            {property.status === 'interested' ? '🟡 Reservado' : '🔴 Vendido'}
          </div>
        )}

        {/* Badge */}
        {(!property.status || property.status === 'available') && property.badge && (
          <div className={`absolute top-4 left-4 text-[10px] font-sans font-extrabold uppercase px-3 py-1.5 rounded-full tracking-wider shadow-sm z-10 ${
            property.badge === 'Novo'
              ? 'bg-black text-white'
              : property.badge === 'Exclusivo'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {property.badge}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(e);
          }}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-md text-gray-700 hover:text-red-500 hover:bg-white transition-all cursor-pointer transform hover:scale-110 active:scale-95"
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>

        {/* Floating Area tag */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-sans font-semibold px-2.5 py-1 rounded-md">
          {property.area} m²
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-[11px] font-bold text-yellow-600 uppercase tracking-widest block mb-1">
            {property.location}
          </span>
          <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300 leading-tight mb-2">
            {property.title}
          </h3>
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4">
            {property.description}
          </p>

          {/* Key Specs Icons */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-50 mb-6 text-gray-600">
            <div className="flex flex-col items-center justify-center text-center p-1.5 rounded-lg bg-gray-50">
              <BedDouble className="w-4 h-4 text-yellow-600 mb-1" />
              <span className="text-[10px] font-bold font-sans text-gray-900">{property.suites} {dict.suites}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1.5 rounded-lg bg-gray-50">
              <Maximize2 className="w-4 h-4 text-yellow-600 mb-1" />
              <span className="text-[10px] font-bold font-sans text-gray-900">{property.area} m²</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1.5 rounded-lg bg-gray-50">
              <span className="text-[11px] font-bold font-sans text-yellow-600 mb-1">🚙</span>
              <span className="text-[10px] font-bold font-sans text-gray-900">{property.vagas} {dict.vagas}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{language === 'pt' ? 'Valor' : 'Price'}</span>
            <span className="text-lg font-serif font-bold text-gray-950">
              {formatPrice(property.price)}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetailsClick();
            }}
            className="border border-black hover:bg-black hover:text-white text-black font-sans text-xs font-bold px-4 py-2.5 rounded-lg transition-all duration-300 cursor-pointer text-center"
          >
            {dict.detailsBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
