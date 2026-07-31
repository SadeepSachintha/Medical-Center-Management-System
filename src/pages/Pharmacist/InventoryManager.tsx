import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Package, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  AlertTriangle, 
  AlertOctagon, 
  PlusCircle, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export function InventoryManager() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Query: Inventory list
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventoryList'],
    queryFn: async () => {
      const res = await fetch('/api/inventory');
      return res.json();
    }
  });

  // Add Item States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    qty: '',
    price: '',
    batchNumber: '',
    expiryDate: '',
    minStockLevel: '15'
  });

  // OTC Shop states
  const [cart, setCart] = useState<any[]>([]); // [{ id, name, price, qty }]
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'QR Code'>('Cash');
  const [otcSuccess, setOtcSuccess] = useState(false);

  // Barcode scanner keyboard-wedge listener
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // If speed of typing is fast (< 45ms), buffer it as a barcode scan
      if (currentTime - lastKeyTime.current > 45) {
        barcodeBuffer.current = ''; // reset buffer
      }
      lastKeyTime.current = currentTime;

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      } else if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 2) {
          const barcode = barcodeBuffer.current;
          barcodeBuffer.current = '';
          handleBarcodeScan(barcode);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [inventory, cart]);

  const handleBarcodeScan = (barcode: string) => {
    const code = barcode.trim().toUpperCase();
    const matched = inventory.find((item: any) => 
      item.batchNumber.toUpperCase() === code || 
      item.name.toUpperCase().includes(code)
    );

    if (matched) {
      handleAddToCart(matched);
      setOtcSuccess(false);
    }
  };



  // Mutation: Add new drug item
  const addItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          auditUser: user?.username,
          auditRole: user?.role
        })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowAddForm(false);
      setNewItem({ name: '', qty: '', price: '', batchNumber: '', expiryDate: '', minStockLevel: '15' });
    }
  });

  // Mutation: Process OTC sale
  const otcSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await fetch('/api/inventory/otc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['invoicesList'] });
      setCart([]);
      setOtcSuccess(true);
      setTimeout(() => setOtcSuccess(false), 4000);
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.qty || !newItem.price) return;
    addItemMutation.mutate(newItem);
  };

  const handleAddToCart = (drug: any) => {
    const existing = cart.find(c => c.id === drug.id);
    if (existing) {
      setCart(cart.map(c => c.id === drug.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: drug.id, name: drug.name, price: drug.price, qty: 1 }]);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const handleOtcCheckout = () => {
    if (cart.length === 0) return;
    otcSaleMutation.mutate({
      items: cart.map(c => ({ id: c.id, qty: c.qty })),
      paymentMethod,
      auditUser: user?.username,
      auditRole: user?.role
    });
  };

  const getCartTotal = () => cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

  // Expiry check logic (30 days limit)
  const isExpiringSoon = (dateStr: string) => {
    const expMs = new Date(dateStr).getTime();
    const todayMs = new Date().getTime();
    const rangeMs = 30 * 24 * 60 * 60 * 1000;
    return expMs > todayMs && expMs <= todayMs + rangeMs;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Inventory Register (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <Card className="border-slate-800 bg-slate-900/60 p-5" hoverEffect={false}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-slate-455" />
                Medication Stock Ledger
              </h3>
              
              <div className="flex gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  className="text-[10px] py-1 border border-slate-800"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <PlusCircle className="h-4 w-4 text-medical-400" />
                  Add Medication
                </Button>
              </div>
            </div>

            {/* Add stock Form */}
            {showAddForm && (
              <form onSubmit={handleAddSubmit} className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Medication Name</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full px-2 py-1.5 text-xs glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Quantity In Stock</label>
                  <input
                    type="number"
                    required
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full px-2 py-1.5 text-xs glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Price per unit</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="e.g. 5.50"
                    className="w-full px-2 py-1.5 text-xs glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Batch Lot Code</label>
                  <input
                    type="text"
                    value={newItem.batchNumber}
                    onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                    placeholder="e.g. B-9983"
                    className="w-full px-2 py-1.5 text-xs glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Expiry Date</label>
                  <input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Low Stock Limit</label>
                  <input
                    type="number"
                    value={newItem.minStockLevel}
                    onChange={(e) => setNewItem({ ...newItem, minStockLevel: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs glass-input"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                  <Button type="submit" size="sm" className="text-xs">
                    Commit to Stockroom
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Inventory table */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5">Medication Name</th>
                    <th className="py-2.5">Batch</th>
                    <th className="py-2.5">Expiry Date</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">In Stock</th>
                    <th className="py-2.5 text-center">Alert Checks</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/80">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">Retrieving inventory...</td>
                    </tr>
                  ) : inventory.length > 0 ? (
                    inventory.map((item: any) => {
                      const isLowStock = item.qty <= item.minStockLevel;
                      const isExpiring = isExpiringSoon(item.expiryDate);
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 font-bold text-white">{item.name}</td>
                          <td className="py-3 text-slate-400 font-mono">{item.batchNumber}</td>
                          <td className="py-3 text-slate-350">{new Date(item.expiryDate).toLocaleDateString()}</td>
                          <td className="py-3 text-right font-mono">LKR {item.price.toFixed(2)}</td>
                          <td className="py-3 text-right font-bold font-mono">{item.qty} units</td>
                          <td className="py-3 text-center">
                            <div className="flex justify-center gap-1.5">
                              {isLowStock && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-900 text-rose-455 animate-pulse flex items-center gap-1">
                                  <AlertOctagon className="h-3 w-3" /> Low Stock
                                </span>
                              )}
                              {isExpiring && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-900 text-amber-400 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Expiring Soon
                                </span>
                              )}
                              {!isLowStock && !isExpiring && (
                                <span className="text-[9px] font-semibold text-slate-500">Good</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variant="glass"
                              size="sm"
                              className="text-[9px] px-2 py-1 border border-slate-800"
                              onClick={() => handleAddToCart(item)}
                              disabled={item.qty === 0}
                            >
                              Add to Sales
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">Stockroom register is empty.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* OTC Shopping Cart (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card glowColor={cart.length > 0 ? "cyan" : "none"} className="border-slate-800 bg-slate-900/60 p-5 h-[538px] flex flex-col justify-between" hoverEffect={false}>
            <div>
              <div className="pb-3 border-b border-slate-800 mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart className="h-4.5 w-4.5 text-medical-400" />
                  Direct Counter Sales (OTC)
                </h3>
                <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2 py-0.5 rounded">
                  Cart
                </span>
              </div>

              {otcSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-450 text-xs flex items-center gap-2 mb-4 animate-fade-in-up">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                  <span>Direct counter sale completed. Inventory levels updated.</span>
                </div>
              )}

              {/* Cart List */}
              <div className="space-y-2 overflow-y-auto max-h-56 pr-1 no-scrollbar">
                {cart.length > 0 ? (
                  cart.map((c) => (
                    <div 
                      key={c.id}
                      className="p-3 rounded-lg border border-slate-850 bg-slate-950/40 flex items-center justify-between text-xs text-slate-300"
                    >
                      <div>
                        <h4 className="font-bold text-white truncate max-w-[120px]">{c.name}</h4>
                        <p className="text-[9px] text-slate-550 font-mono">LKR {c.price.toFixed(2)} x{c.qty}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-200">LKR {(c.price * c.qty).toFixed(2)}</span>
                        <button onClick={() => handleRemoveFromCart(c.id)} className="text-rose-455 hover:text-rose-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-xs text-slate-550">
                    OTC Sales cart is empty. Click "Add to Sales" on any stockroom item to build a direct sale.
                  </div>
                )}
              </div>
              {/* Keyboard Wedge Barcode simulator for testing */}
              <div className="mt-4 p-3 bg-slate-950/60 border border-slate-850 rounded-lg">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Wedge Barcode Simulation</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                  {inventory.slice(0, 4).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => handleBarcodeScan(item.batchNumber)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-left truncate"
                      title={`Scan batch code: ${item.batchNumber}`}
                    >
                      Scan {item.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-slate-500 mt-1.5 text-center font-mono">Simulates USB barcode scan event</p>
              </div>
            </div>

            {/* Checkout parameters */}
            {cart.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-sm font-bold text-white">
                  <span>Grand Total due</span>
                  <span className="font-mono text-medical-400">LKR {getCartTotal().toFixed(2)}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Checkout mode</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Cash', 'Card', 'QR Code'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-1.5 rounded border text-[10px] font-bold text-center transition-all ${
                          paymentMethod === method
                            ? 'border-medical-500 bg-medical-950/40 text-white shadow-md'
                            : 'border-slate-800 bg-slate-950/40 text-slate-550'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleOtcCheckout}
                  className="w-full text-xs py-2 bg-gradient-to-r from-medical-600 to-medical-500"
                  loading={otcSaleMutation.isPending}
                >
                  Process OTC Checkout
                </Button>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
export default InventoryManager;
