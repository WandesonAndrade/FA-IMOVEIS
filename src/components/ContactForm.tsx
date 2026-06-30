import React, { useState } from 'react';
import { Send, CheckCircle, ShieldCheck } from 'lucide-react';
import { DICTIONARY, BROKERS } from '../data';
import { ContactMessage } from '../types';

interface ContactFormProps {
  language: 'pt' | 'en';
  brokerName?: string;
  propertyTitle?: string;
  onMessageSubmit: (msg: Omit<ContactMessage, 'id' | 'date'>) => void;
  type: 'general' | 'visit' | 'broker';
}

export default function ContactForm({
  language,
  brokerName,
  propertyTitle,
  onMessageSubmit,
  type
}: ContactFormProps) {
  const dict = DICTIONARY[language];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('Comprar um Imóvel');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setErrorMsg(language === 'pt' ? 'Por favor, preencha todos os campos obrigatórios.' : 'Please fill out all required fields.');
      return;
    }

    onMessageSubmit({
      name,
      email,
      phone,
      interest,
      message,
      propertyTitle,
      brokerName,
      type
    });

    // Find broker phone number if brokerName is passed, else use a default one (Ricardo Fontes)
    let targetPhone = '5599991234567'; // Default central phone for FA Imóveis in Caxias MA
    if (brokerName) {
      const foundBroker = BROKERS.find(b => b.name.toLowerCase() === brokerName.toLowerCase());
      if (foundBroker) {
        targetPhone = foundBroker.phone.replace(/\D/g, '');
      }
    }

    // Format WhatsApp message
    const formattedText = `Olá! Gostaria de enviar uma mensagem de contato:
*Nome*: ${name}
*E-mail*: ${email}
*Telefone*: ${phone}
*Interesse*: ${interest}
${propertyTitle ? `*Imóvel*: ${propertyTitle}\n` : ''}${brokerName ? `*Especialista*: ${brokerName}\n` : ''}
*Mensagem*:
${message}`;

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(formattedText)}`;
    window.open(whatsappUrl, '_blank');

    setIsSubmitted(true);
    
    // Clear Form
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-xl border border-gray-100 shadow-xl text-center space-y-6 transition-all duration-500 animate-fade-in">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-bold text-gray-900">{dict.successTitle}</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            {dict.successMessage}
          </p>
        </div>
        {brokerName && (
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 max-w-xs mx-auto">
            {language === 'pt' ? 'Atendimento designado a:' : 'Assigned specialist:'}{' '}
            <span className="font-bold text-gray-900">{brokerName}</span>
          </div>
        )}
        <button
          onClick={() => setIsSubmitted(false)}
          className="bg-black text-white px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-yellow-600 transition-colors cursor-pointer"
        >
          {language === 'pt' ? 'Enviar outra mensagem' : 'Send another inquiry'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-xl border border-gray-100 shadow-xl relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-bl-full pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="font-serif text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">
          {type === 'visit'
            ? (language === 'pt' ? 'Agendar uma Visita Privada' : 'Schedule Private Viewing')
            : (language === 'pt' ? 'Formulário de Contato Seguro' : 'Secure Inquiry Form')}
        </h3>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {dict.fullName} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
              placeholder={language === 'pt' ? 'Seu nome completo' : 'Your full name'}
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <label className="font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {dict.email} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
              placeholder="exemplo@email.com"
            />
          </div>
        </div>

        {/* Telefone */}
        <div className="space-y-1.5">
          <label className="font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {dict.phone} *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none"
            placeholder="+55 (11) 99999-9999"
          />
        </div>

        {/* Interesse */}
        <div className="space-y-1.5">
          <label className="font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {dict.interestLabel}
          </label>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none cursor-pointer"
          >
            <option value="Comprar um Imóvel">
              {language === 'pt' ? 'Comprar um Imóvel' : 'Buy a Property'}
            </option>
            <option value="Vender meu Imóvel">
              {language === 'pt' ? 'Vender meu Imóvel' : 'Sell my Property'}
            </option>
            <option value="Consultoria de Investimento">
              {language === 'pt' ? 'Consultoria de Investimento' : 'Investment Consultancy'}
            </option>
            <option value="Agendar Visita">
              {language === 'pt' ? 'Agendar Visita de Avaliação' : 'Schedule a Property Inspection'}
            </option>
          </select>
        </div>

        {/* Mensagem */}
        <div className="space-y-1.5">
          <label className="font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {dict.messageLabel} *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-yellow-600 focus:ring-0 px-0 py-2 transition-all font-sans text-sm text-gray-900 outline-none resize-none"
            placeholder={
              propertyTitle
                ? (language === 'pt'
                    ? `Tenho interesse na propriedade "${propertyTitle}". Por favor, envie-me mais informações.`
                    : `I am interested in "${propertyTitle}". Please send me more details.`)
                : (language === 'pt' ? 'Como podemos ajudar você?' : 'How can we assist you?')
            }
          />
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-gray-400 text-[10px] bg-gray-50 p-2.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span>
            {language === 'pt'
              ? 'Seus dados estão protegidos sob nossa Política de Privacidade rígida e criptografia ponta a ponta.'
              : 'Your data is secured under our strict Privacy Policy and end-to-end encryption.'}
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-black hover:bg-yellow-600 text-white font-sans text-xs font-bold uppercase tracking-widest py-4 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          {dict.sendBtn}
        </button>
      </form>
    </div>
  );
}
