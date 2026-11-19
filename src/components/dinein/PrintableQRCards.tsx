import { QRCodeSVG } from "qrcode.react";
import type { RestaurantTable } from "../../lib/supabase";
import { Printer, X } from "lucide-react";

interface PrintableQRCardsProps {
  tables: RestaurantTable[];
  baseUrl: string;
  onClose: () => void;
}

export function PrintableQRCards({ tables, baseUrl, onClose }: PrintableQRCardsProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#10110F] text-[#FFF9F1] overflow-y-auto">
      {/* Non-printed Controls bar */}
      <div className="print:hidden sticky top-0 z-50 bg-[#12352B] border-b border-[#D9B780] p-4 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="font-display text-xl text-[#D9B780]">Printable Table QR Cards (A4 / Letter)</h2>
          <p className="text-xs text-[#FFF9F1]/80">
            High-resolution printable cards for acrylic table tents or wooden dining stands.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase tracking-widest font-semibold flex items-center gap-2 text-[#FFF9F1] shadow-lg"
          >
            <Printer className="w-4 h-4 text-[#D9B780]" />
            <span>Print Cards</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border border-[#D9B780]/40 text-[#D9B780] hover:text-[#FFF9F1]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="p-8 max-w-5xl mx-auto print:p-0 print:m-0 print:max-w-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background-color: #FFFFFF !important;
              color: #10110F !important;
            }
            .print-card {
              break-inside: avoid;
              page-break-inside: avoid;
              border: 2px solid #12352B !important;
              background-color: #FFFFFF !important;
              color: #10110F !important;
            }
          }
        `}} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
          {tables.map((table) => {
            const orderUrl = `${baseUrl.replace(/\/$/, "")}/order?t=${table.token}`;

            return (
              <div
                key={table.id}
                className="print-card bg-[#12352B]/20 border-2 border-[#D9B780] p-6 rounded-none flex flex-col items-center text-center relative shadow-xl print:shadow-none"
              >
                {/* Brand Crest */}
                <div className="mb-3">
                  <div className="inline-block px-3 py-0.5 border border-[#D9B780] text-[0.65rem] tracking-[0.25em] uppercase font-bold text-[#D9B780] print:text-[#12352B] print:border-[#12352B]">
                    Deccan Spice Pompano
                  </div>
                  <h3 className="font-display text-2xl print:text-black font-semibold mt-1">
                    Table {table.number}
                  </h3>
                  <p className="text-[0.72rem] text-[#D9B780] print:text-stone-700 tracking-wider uppercase font-medium">
                    {table.section} {table.label ? `• ${table.label}` : ""}
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white border border-[#D9B780] shadow-md my-2">
                  <QRCodeSVG
                    value={orderUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    fgColor="#10110F"
                    bgColor="#FFFFFF"
                  />
                </div>

                {/* Instructions */}
                <div className="mt-3 space-y-1">
                  <p className="font-display text-base text-[#D9B780] print:text-[#12352B] font-semibold tracking-wide">
                    Scan with Phone Camera to Order
                  </p>
                  <p className="text-[0.68rem] text-[#F7F2E9]/75 print:text-stone-600 max-w-xs leading-tight">
                    Browse authentic Hyderabadi specialties, place your order directly to the kitchen, and call your server anytime.
                  </p>
                  <p className="text-[0.62rem] text-[#D9B780]/80 print:text-stone-500 font-mono pt-1">
                    {orderUrl}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
