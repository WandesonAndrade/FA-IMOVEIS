import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Copy, Check, FileText } from 'lucide-react';
import { Property, Client } from '../types';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  buyer: Client;
  owner?: Client;
}

export default function ContractModal({
  isOpen,
  onClose,
  property,
  buyer,
  owner
}: ContractModalProps) {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Format currency helpers
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Convert number to words (Portuguese) for real estate contract fidelity
  const valorPorExtenso = (value: number): string => {
    // Simple helper for realistic display numbers
    if (value === 0) return "zero reais";
    
    const BRLFormat = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

    return `${BRLFormat} (valor por extenso correspondente)`;
  };

  const sellerName = owner?.name || "______________________________________";
  const sellerCpf = owner?.cpf || "___.___.___-__";
  const sellerAddress = owner?.address || "______________________________________________________";
  const sellerSpouse = owner?.spouseName ? `, casado(a) sob regime de bens com ${owner.spouseName}` : ", no estado civil de solteiro(a)";

  const buyerName = buyer.name || "______________________________________";
  const buyerCpf = buyer.cpf || "___.___.___-__";
  const buyerAddress = buyer.address || "______________________________________________________";
  const buyerSpouse = buyer.spouseName ? `, casado(a) sob regime de bens com ${buyer.spouseName}` : ", no estado civil de solteiro(a)";

  const propertyAddress = property.address || `Bairro ${property.neighborhood}, na cidade de ${property.location.split(',')[0]}/SP`;
  const propertyPriceStr = formatBRL(property.price);
  const propertyPriceExtenso = valorPorExtenso(property.price);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const contractText = `INSTRUMENTO PARTICULAR DE COMPROMISSO DE COMPRA E VENDA DE IMÓVEL

Pelo presente instrumento particular, as partes abaixo qualificadas têm, entre si, justo e contratado o que segue:

1. PROMITENTE VENDEDOR:
Nome: ${sellerName}${sellerSpouse}, portador(a) do CPF sob nº ${sellerCpf}, residente e domiciliado(a) no endereço: ${sellerAddress}.

2. PROMITENTE COMPRADOR:
Nome: ${buyerName}${buyerSpouse}, portador(a) do CPF sob nº ${buyerCpf}, residente e domiciliado(a) no endereço: ${buyerAddress}.

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Compromisso de Compra e Venda de Imóvel, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.

CLÁUSULA PRIMEIRA - DO OBJETO DO CONTRATO
O objeto deste contrato é a venda e compra do imóvel de alto padrão caracterizado por:
Imóvel: ${property.title}
Tipo: ${property.type}
Localização: ${propertyAddress}
Área Útil: ${property.area} m²
Características adicionais: ${property.suites} Suítes, ${property.bathrooms} Banheiros, ${property.vagas} Vagas de Garagem.

CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO
O preço total ajustado para a venda e compra do imóvel descrito na Cláusula Primeira é de ${propertyPriceStr} (${propertyPriceExtenso}), a ser pago pelo PROMITENTE COMPRADOR ao PROMITENTE VENDEDOR da seguinte forma:
- O valor integral será quitado no ato da assinatura da Escritura Pública de Compra e Venda definitiva, livre e desembaraçado de quaisquer ônus, tributos ou gravames.
- Eventuais débitos de IPTU, taxa condominial e despesas correlatas até a data da imissão na posse (entrega das chaves) são de total responsabilidade do PROMITENTE VENDEDOR.

CLÁUSULA TERCEIRA - DA POSSE E DA ESCRITURA
A imissão do PROMITENTE COMPRADOR na posse do imóvel ocorrerá na data da outorga da Escritura Pública Definitiva de Compra e Venda. 
Parágrafo único: O PROMITENTE VENDEDOR se obriga a apresentar todas as certidões negativas de ônus, tributos, certidões cíveis e trabalhistas necessárias para a transferência segura da propriedade.

CLÁUSULA QUARTA - DA IRREVOGABILIDADE E IRRETRATABILIDADE
O presente contrato é celebrado sob a cláusula de irrevogabilidade e irretratabilidade, obrigando não só os contratantes, como também seus herdeiros e sucessores, a qualquer título.

CLÁUSULA QUINTA - DO FORO
Fica eleito o Foro da Comarca de ${property.location.split(',')[0]} para dirimir toda e qualquer dúvida ou controvérsia decorrente do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

E por estarem assim justos e contratados, assinam o presente instrumento em 02 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.

Local e Data: ________________________, ${currentDate}.


_______________________________________________________
PROMITENTE VENDEDOR: ${sellerName}


_______________________________________________________
PROMITENTE COMPRADOR: ${buyerName}

${owner?.spouseName ? `
_______________________________________________________
CÔNJUGE DO VENDEDOR: ${owner.spouseName}` : ''}

${buyer.spouseName ? `
_______________________________________________________
CÔNJUGE DO COMPRADOR: ${buyer.spouseName}` : ''}


Testemunhas:

1. _________________________________      2. _________________________________
Nome:                                     Nome:
CPF:                                      CPF:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(contractText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Contrato de Venda e Compra</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
          body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.6; padding: 2cm; color: #000; }
          h1, h2, h3 { text-align: center; font-weight: bold; margin-bottom: 20px; }
          p { margin-bottom: 1.5em; text-align: justify; text-indent: 1.5cm; }
          .section { margin-top: 30px; }
          .signatures { margin-top: 50px; }
          .signature-line { margin-top: 50px; border-top: 1px solid #000; width: 80%; margin-left: auto; margin-right: auto; text-align: center; padding-top: 5px; page-break-inside: avoid; }
          .witness-block { display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }
          .witness-line { border-top: 1px solid #000; width: 45%; text-align: center; padding-top: 5px; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden text-left border border-gray-100"
        >
          {/* Header */}
          <div className="bg-gray-950 p-6 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-yellow-500 uppercase tracking-widest block">Minuta de Contrato</span>
                <h3 className="font-serif text-lg font-bold text-white">Contrato de Compra e Venda</h3>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex flex-wrap justify-between items-center gap-4 shrink-0">
            <p className="text-xs text-gray-500">
              Contrato gerado automaticamente para o imóvel <strong className="text-gray-900">{property.title}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
              
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-yellow-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="flex-1 overflow-y-auto bg-gray-100/60 p-6 md:p-12 flex justify-center">
            {/* Paper Container */}
            <div 
              className="bg-white border border-gray-200 shadow-lg w-full max-w-2xl p-8 md:p-16 text-gray-900 font-serif leading-relaxed text-sm shadow-xl select-text"
              style={{ minHeight: '29.7cm' }}
            >
              {/* Actual Printable content */}
              <div ref={printRef} className="space-y-6">
                <h1 className="text-center font-bold text-lg md:text-xl uppercase border-b-2 border-black pb-4 mb-8 tracking-wide">
                  INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL DE ALTO PADRÃO
                </h1>

                <section className="space-y-4 text-justify">
                  <p>
                    Pelo presente instrumento particular de promessa de compra e venda, de um lado como <strong>PROMITENTE VENDEDOR</strong>: 
                    <strong> {sellerName}</strong>{sellerSpouse}, inscrito(a) no CPF sob o nº <strong>{sellerCpf}</strong>, residente e domiciliado(a) em: {sellerAddress}.
                  </p>
                  <p>
                    De outro lado, como <strong>PROMITENTE COMPRADOR</strong>: 
                    <strong> {buyerName}</strong>{buyerSpouse}, inscrito(a) no CPF sob o nº <strong>{buyerCpf}</strong>, residente e domiciliado(a) em: {buyerAddress}.
                  </p>
                  <p>
                    As partes acima qualificadas, que têm entre si justo e acordado o presente Instrumento Particular de Promessa de Compra e Venda de Imóvel, o qual se regerá pelas cláusulas e condições seguintes:
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-bold uppercase tracking-wide border-b border-gray-200 pb-1 text-sm mt-6">
                    CLÁUSULA PRIMEIRA - DO OBJETO
                  </h2>
                  <p className="text-justify">
                    O objeto do presente contrato é o imóvel de alto padrão residencial designado como <strong>{property.title}</strong>, de tipo {property.type}, localizado no endereço: {propertyAddress}, com área total privativa de {property.area} m², contendo {property.suites} suíte(s), {property.bathrooms} banheiro(s) e {property.vagas} vaga(s) de garagem, em perfeito estado de conservação.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-bold uppercase tracking-wide border-b border-gray-200 pb-1 text-sm mt-6">
                    CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO
                  </h2>
                  <p className="text-justify">
                    O preço certo e ajustado para a presente transação é de <strong>{propertyPriceStr} ({propertyPriceExtenso})</strong>, montante este que será pago pelo PROMITENTE COMPRADOR diretamente ao PROMITENTE VENDEDOR sob as seguintes condições acordadas:
                  </p>
                  <p className="text-justify pl-4 italic">
                    O montante integral será transferido por meio eletrônico bancário de fundos (TED/PIX) ou cheque administrativo quitado integralmente na data da outorga da Escritura Pública de Compra e Venda definitiva junto ao tabelionato competente.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-bold uppercase tracking-wide border-b border-gray-200 pb-1 text-sm mt-6">
                    CLÁUSULA TERCEIRA - DA IMISSÃO NA POSSE E CERTIDÕES
                  </h2>
                  <p className="text-justify">
                    A posse precária do imóvel, consubstanciada pela entrega das chaves e livre trânsito, será outorgada ao PROMITENTE COMPRADOR na mesma data de quitação do valor total acordado e assinatura da escritura definitiva.
                  </p>
                  <p className="text-justify">
                    Parágrafo Único: O PROMITENTE VENDEDOR declara sob as penas da lei que o imóvel encontra-se totalmente livre e desembaraçado de quaisquer ônus reais, hipotecas, penhoras, ações reipersecutórias, tributos ou taxas condominiais atrasadas até a presente data, responsabilizando-se civilmente por quaisquer omissões.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-bold uppercase tracking-wide border-b border-gray-200 pb-1 text-sm mt-6">
                    CLÁUSULA QUARTA - REGIME DE IRREVOGABILIDADE
                  </h2>
                  <p className="text-justify">
                    Este compromisso é firmado com caráter de irrevogabilidade e irretratabilidade, obrigando não só as partes contratantes, mas também todos os seus herdeiros e sucessores legais, a qualquer título.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-bold uppercase tracking-wide border-b border-gray-200 pb-1 text-sm mt-6">
                    CLÁUSULA QUINTA - ELEIÇÃO DE FORO
                  </h2>
                  <p className="text-justify">
                    Para dirimir quaisquer controvérsias oriundas do presente instrumento, as partes elegem, de comum acordo, o Foro da Comarca de <strong>{property.location.split(',')[0]}</strong>, com expressa renúncia a qualquer outro foro, por mais privilegiado que venha a ser.
                  </p>
                </section>

                <section className="space-y-2 pt-6">
                  <p className="text-right">
                    Localidade de {property.location.split(',')[0]}, {currentDate}.
                  </p>
                </section>

                {/* Signatures block for clean printing */}
                <div className="pt-12 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="border-t border-black pt-2 text-center text-xs">
                      <strong className="block">{sellerName}</strong>
                      PROMITENTE VENDEDOR
                    </div>
                    <div className="border-t border-black pt-2 text-center text-xs">
                      <strong className="block">{buyerName}</strong>
                      PROMITENTE COMPRADOR
                    </div>
                  </div>

                  {(owner?.spouseName || buyer.spouseName) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                      {owner?.spouseName ? (
                        <div className="border-t border-black pt-2 text-center text-xs">
                          <strong className="block">{owner.spouseName}</strong>
                          CÔNJUGE DO VENDEDOR
                        </div>
                      ) : <div />}
                      {buyer.spouseName ? (
                        <div className="border-t border-black pt-2 text-center text-xs">
                          <strong className="block">{buyer.spouseName}</strong>
                          CÔNJUGE DO COMPRADOR
                        </div>
                      ) : <div />}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                    <div className="border-t border-gray-300 pt-2 text-left text-xs text-gray-500">
                      Testemunha 1:
                      <div className="mt-1">CPF:</div>
                    </div>
                    <div className="border-t border-gray-300 pt-2 text-left text-xs text-gray-500">
                      Testemunha 2:
                      <div className="mt-1">CPF:</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
