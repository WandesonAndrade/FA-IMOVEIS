import { useState } from "react";
import { X, DollarSign, Calendar, Percent, ShieldCheck } from "lucide-react";

interface FinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyPrice: number;
  language: "pt";
}

export default function FinancingModal({
  isOpen,
  onClose,
  propertyTitle,
  propertyPrice,
  language,
}: FinancingModalProps) {
  const [downPaymentPct, setDownPaymentPct] = useState(20); // 20% down
  const [years, setYears] = useState(20); // 20 years term
  const [interestRate, setInterestRate] = useState(9.5); // 9.5% p.a.

  if (!isOpen) return null;

  // Calculations
  const totalPrice = propertyPrice > 0 ? propertyPrice : 15000000; // fallback if Sob Consulta
  const downPayment = (totalPrice * downPaymentPct) / 100;
  const financedAmount = totalPrice - downPayment;

  // Monthly interest rate calculation (Compounded)
  const monthlyRate = Math.pow(1 + interestRate / 100, 1 / 12) - 1;
  const totalMonths = years * 12;

  // Price Amortization formula (PRICE Table)
  const monthlyInstallment =
    monthlyRate > 0
      ? (financedAmount *
          monthlyRate *
          Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : financedAmount / totalMonths;

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-950 text-white flex justify-between items-center border-b border-gray-800">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-yellow-500 font-extrabold block">
              {language === "pt"
                ? "Simulador de Crédito Imobiliário"
                : "Mortgage Credit Simulator"}
            </span>
            <h3 className="font-serif text-lg font-bold">{propertyTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-gray-500 text-xs leading-relaxed">
            {language === "pt"
              ? "Abaixo, simule as condições para a aquisição dessa residência premium. Esta simulação é baseada na tabela PRICE e serve como referência consultiva."
              : "Below, simulate your payment conditions for this premium residence. This calculation is based on standard formulas and is for reference."}
          </p>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                {language === "pt" ? "Valor do Imóvel" : "Property Value"}
              </span>
              <span className="text-lg font-serif font-bold text-gray-950">
                {formatBRL(totalPrice)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                {language === "pt"
                  ? "Entrada Necessária"
                  : "Down Payment Required"}
              </span>
              <span className="text-lg font-serif font-bold text-yellow-600">
                {formatBRL(downPayment)} ({downPaymentPct}%)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                {language === "pt" ? "Valor Financiado" : "Financed Amount"}
              </span>
              <span className="text-lg font-serif font-bold text-gray-750">
                {formatBRL(financedAmount)}
              </span>
            </div>
          </div>

          {/* Controls Sliders */}
          <div className="space-y-5">
            {/* Slider 1: Entrada % */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">
                  {language === "pt"
                    ? "Percentual de Entrada"
                    : "Down Payment Percentage"}
                </span>
                <span className="font-bold text-yellow-600">
                  {downPaymentPct}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={downPaymentPct}
                onChange={(e) =>
                  setDownPaymentPct(parseInt(e.target.value, 10))
                }
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>20% ({formatBRL(totalPrice * 0.2)})</span>
                <span>80% ({formatBRL(totalPrice * 0.8)})</span>
              </div>
            </div>

            {/* Slider 2: Anos */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">
                  {language === "pt"
                    ? "Prazo de Financiamento"
                    : "Financing Term"}
                </span>
                <span className="font-bold text-yellow-600">
                  {years} {language === "pt" ? "anos" : "years"} ({totalMonths}{" "}
                  {language === "pt" ? "meses" : "months"})
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="5"
                value={years}
                onChange={(e) => setYears(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>5 {language === "pt" ? "anos" : "years"}</span>
                <span>35 {language === "pt" ? "anos" : "years"}</span>
              </div>
            </div>

            {/* Slider 3: Taxa de Juros */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">
                  {language === "pt"
                    ? "Taxa Anual Estimada (Juros)"
                    : "Estimated Annual Interest"}
                </span>
                <span className="font-bold text-yellow-600">
                  {interestRate}% a.a.
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="15"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>5% a.a.</span>
                <span>15% a.a.</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-yellow-600/5 p-6 rounded-xl border border-yellow-600/10 text-center space-y-2">
            <span className="text-[10px] text-yellow-700 uppercase tracking-widest font-extrabold block">
              {language === "pt"
                ? "Parcela Mensal Estimada (PRICE)"
                : "Estimated Monthly Installment (PRICE)"}
            </span>
            <div className="text-3xl md:text-4xl font-serif font-black text-gray-950">
              {formatBRL(monthlyInstallment)}
            </div>
            <p className="text-[11px] text-gray-500">
              {language === "pt"
                ? "*Sujeito a análise cadastral de crédito por instituições bancárias conveniadas."
                : "*Subject to credit analysis by partnering financial institutions."}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>
              {language === "pt"
                ? "Simulação segura e sigilosa"
                : "Secure and confidential"}
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              const contactSection = document.getElementById("contato-secao");
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="w-full sm:w-auto bg-black hover:bg-yellow-600 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all cursor-pointer text-center"
          >
            {language === "pt"
              ? "Falar com Especialista Financeiro"
              : "Speak to Mortgage Specialist"}
          </button>
        </div>
      </div>
    </div>
  );
}
