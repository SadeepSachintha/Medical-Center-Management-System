import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  CreditCard, 
  DollarSign, 
  Printer, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle,
  FileText 
} from 'lucide-react';

export function BillingDesk() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Insurance' | 'QR Code'>('Cash');
  const [printInvoice, setPrintInvoice] = useState<any | null>(null);

  // Query: get all invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoicesList'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      return res.json();
    },
    refetchInterval: 5000 // Poll invoices status
  });

  // Mutation: Pay invoice
  const payInvoiceMutation = useMutation({
    mutationFn: async ({ invId, method }: { invId: string, method: string }) => {
      const res = await fetch(`/api/invoices/${invId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: method,
          auditUser: user?.username,
          auditRole: user?.role
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoicesList'] });
      // Map data with patient lookup detail for printing
      const detailed = invoices.find((i: any) => i.id === data.id);
      setPrintInvoice({ ...detailed, ...data });
      setActiveInvoice(null);
    }
  });

  const handleCheckout = (inv: any) => {
    setActiveInvoice(inv);
  };

  const handleFinalizePay = () => {
    if (!activeInvoice) return;
    payInvoiceMutation.mutate({ invId: activeInvoice.id, method: paymentMethod });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in-up no-print">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invoices List Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 p-5" hoverEffect={false}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-slate-455" />
                Patient Billing Registers
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-350 px-2 py-0.5 rounded">
                Active Ledger
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5">Invoice ID</th>
                    <th className="py-2.5">Patient Profile</th>
                    <th className="py-2.5">Billing Charges Summary</th>
                    <th className="py-2.5 text-right">Total Invoice</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Checkout Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/80">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">Loading ledger files...</td>
                    </tr>
                  ) : invoices.length > 0 ? (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-400">{inv.id}</td>
                        <td className="py-3">
                          <p className="font-bold text-white">{inv.patientName}</p>
                          <p className="text-[10px] text-slate-500">{inv.patientPhone || 'Walk-in sale'}</p>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {inv.items.map((item: any, idx: number) => (
                              <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 truncate">
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-right font-bold text-white">LKR {inv.total.toFixed(2)}</td>
                        <td className="py-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-950/60 border-emerald-900 text-emerald-400' 
                              : 'bg-rose-950/60 border-rose-900 text-rose-455 animate-pulse'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {inv.status === 'unpaid' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-[9px] px-2 py-1 bg-gradient-to-r from-medical-600 to-medical-500"
                              onClick={() => handleCheckout(inv)}
                            >
                              Collect Fee
                            </Button>
                          ) : (
                            <Button
                              variant="glass"
                              size="sm"
                              className="text-[9px] px-2 py-1 border border-slate-800"
                              onClick={() => setPrintInvoice(inv)}
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Receipt
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">No invoice records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Printable/Print Preview Receipt panel */}
        <div className="lg:col-span-1 space-y-6">
          {printInvoice ? (
            <Card glowColor="emerald" className="border-emerald-500/20 bg-slate-900/60 p-5 relative" hoverEffect={false}>
              <button 
                onClick={() => setPrintInvoice(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div id="printable-receipt-area" className="space-y-4 text-slate-300 font-sans text-xs">
                {/* Clinic Header */}
                <div className="text-center pb-3 border-b border-slate-850">
                  <h4 className="text-sm font-bold text-white">AURA MEDICAL CENTER</h4>
                  <p className="text-[10px] text-slate-400">12 Medical Plaza, Boulevard suite</p>
                  <p className="text-[9px] text-slate-500 font-mono">Invoice Date: {new Date(printInvoice.date).toLocaleString()}</p>
                </div>

                {/* Patient Record */}
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient Summary</p>
                  <p className="text-white font-bold">{printInvoice.patientName}</p>
                  <p className="text-[10px] text-slate-455">ID: {printInvoice.patientPhone || 'Walk-in Cash Customer'}</p>
                </div>

                <div className="h-px bg-slate-850" />

                {/* Items */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dispensed Charges</p>
                  <div className="space-y-1.5">
                    {printInvoice.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-slate-350">{item.name}</span>
                        <span className="font-mono text-white">LKR {item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-850" />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-white font-bold text-sm">
                    <span>Total Amount Paid</span>
                    <span className="font-mono">LKR {printInvoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Method: {printInvoice.paymentMethod}</span>
                    <span className="text-emerald-450 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> PAID
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handlePrintReceipt}
                  className="w-full text-xs py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 mt-4 text-white"
                >
                  <Printer className="h-4 w-4" /> Print Medical Invoice
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900/20 p-5 text-center text-xs text-slate-500" hoverEffect={false}>
              <Printer className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p>Select a paid invoice to compile the receipt discharge summary.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Processing Modal Overlay */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900 animate-fade-in-up" hoverEffect={false}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-medical-400" />
                Select Payment Mode
              </h3>
              <button 
                onClick={() => setActiveInvoice(null)}
                className="text-slate-455 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Aggregated charge sum list */}
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-850 space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Aggregated Charges</p>
                <div className="space-y-1.5 divide-y divide-slate-900/60 max-h-40 overflow-y-auto no-scrollbar">
                  {activeInvoice.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs pt-1.5 first:pt-0">
                      <span className="text-slate-400 truncate max-w-[200px]">{item.name}</span>
                      <span className="font-mono text-slate-200">LKR {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-slate-850 mt-2" />
                <div className="flex justify-between text-sm font-bold text-white mt-1">
                  <span>Grand Total due</span>
                  <span className="font-mono text-medical-400">LKR {activeInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment selection grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Choose Checkout Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash', 'Card', 'Insurance', 'QR Code'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                        paymentMethod === method
                          ? 'border-medical-500 bg-medical-950/40 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  onClick={handleFinalizePay}
                  className="flex-1 text-xs py-2"
                  loading={payInvoiceMutation.isPending}
                >
                  <DollarSign className="h-4 w-4" /> Finalize Checkout
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs py-2"
                  onClick={() => setActiveInvoice(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>

    {printInvoice && (
      <div className="print-container hidden text-black bg-white p-4 font-mono text-center">
        <h2 className="text-xs font-bold border-b border-black pb-1 mb-1 uppercase tracking-wide">Aura Medical Center</h2>
        <p className="text-[9px] text-slate-750">12 Medical Plaza, Suite 400</p>
        <p className="text-[9px] text-slate-750 font-mono">Receipt Reference: {printInvoice.id}</p>
        <p className="text-[9px] text-slate-750 font-mono">Date: {new Date(printInvoice.date).toLocaleString()}</p>
        
        <div className="h-px border-t border-dashed border-black my-2" />
        
        <div className="text-left text-[9px] space-y-1 mb-2">
          <p><strong>PATIENT:</strong> {printInvoice.patientName}</p>
          <p><strong>OPERATOR:</strong> Receptionist Sarah</p>
        </div>
        
        <div className="h-px border-t border-dashed border-black my-2" />
        
        <div className="text-left text-[9px] space-y-1.5 mb-2">
          <div className="flex justify-between font-bold">
            <span>CHARGES DESCRIPTION</span>
            <span>PRICE</span>
          </div>
          {printInvoice.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span className="truncate max-w-[200px]">{item.name}</span>
              <span>LKR {item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="h-px border-t border-dashed border-black my-2" />
        
        <div className="text-right text-[10px] space-y-1 font-bold">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>LKR {printInvoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL PAID:</span>
            <span>LKR {printInvoice.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="h-px border-t border-dashed border-black my-2" />
        
        <p className="text-[9px] text-left"><strong>METHOD:</strong> {printInvoice.paymentMethod}</p>
        <p className="text-[9px] text-left text-emerald-800 font-bold">SETTLEMENT: COMPLETED (PAID)</p>
        
        {/* Simulated Barcode */}
        <div className="mt-4 flex flex-col items-center justify-center space-y-1 font-mono">
          <div className="h-6 w-44 bg-slate-200 border-l border-r border-black flex items-center justify-between px-2 text-[6px] tracking-[3px] text-black overflow-hidden font-bold leading-none select-none">
            ||||| | |||| ||| |||| | ||| || |||| ||| ||| | ||
          </div>
          <p className="text-[7px] text-slate-700 tracking-widest">{printInvoice.id}</p>
        </div>

        <p className="text-[8px] text-slate-800 mt-4 leading-normal">
          Thank you for choosing Aura Medical!<br />
          * Clinic Copy & Patient Claim Slip *
        </p>
      </div>
    )}
  </>
  );
}
export default BillingDesk;
