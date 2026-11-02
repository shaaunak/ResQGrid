import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Truck,
  AlertTriangle,
  History,
  Plus,
  ArrowRight,
  TrendingDown,
  CheckCircle,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Depot, InventoryStock, StockMovement } from '../types';

export const InventoryPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDepotId, setSelectedDepotId] = useState<string>('ALL');
  const [showIntakeModal, setShowIntakeModal] = useState<boolean>(false);

  // Form states for donation intake
  const [intakeDepot, setIntakeDepot] = useState<string>('');
  const [intakeItem, setIntakeItem] = useState<string>('');
  const [intakeQty, setIntakeQty] = useState<number>(50);
  const [donorSource, setDonorSource] = useState<string>('Red Cross Mumbai Relief Fund');

  // Fetch Depots
  const { data: depots = [] } = useQuery<Depot[]>({
    queryKey: ['depots'],
    queryFn: () => apiRequest<Depot[]>('/inventory/depots'),
  });

  // Fetch Stocks
  const { data: stocks = [], isLoading } = useQuery<any[]>({
    queryKey: ['inventory-stocks'],
    queryFn: () => apiRequest<any[]>('/inventory/stocks'),
  });

  // Donation intake mutation
  const intakeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/inventory/intake', {
        method: 'POST',
        body: JSON.stringify({
          depot_id: intakeDepot || depots[0]?.id,
          item_id: intakeItem || stocks[0]?.item_id,
          quantity: intakeQty,
          donor_source: donorSource,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stocks'] });
      setShowIntakeModal(false);
    },
  });

  // Filter stocks by depot
  const filteredStocks = stocks.filter((s) => {
    if (selectedDepotId === 'ALL') return true;
    return s.depot_id === selectedDepotId;
  });

  const lowStockAlerts = stocks.filter(
    (s) => s.quantity_available <= s.minimum_threshold
  );

  return (
    <div className="min-h-full bg-rq-bg py-8 px-4 lg:px-8 font-sans pb-16">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-rq-ink">Relief Logistics & Depot Inventory</h1>
            <p className="text-xs text-rq-muted">
              Live multi-echelon stock levels, reservations, and audit movements across Mumbai hubs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowIntakeModal(true)}
              className="px-3.5 py-2 bg-rq-navy hover:bg-[#0E1D36] text-white text-xs font-semibold rounded-md shadow-subtle flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Donation Intake</span>
            </button>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockAlerts.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-card border border-amber-300 dark:border-amber-900 flex items-center justify-between shadow-subtle">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-[#E27D14] flex-shrink-0" />
              <div>
                <div className="font-semibold text-xs text-amber-900 dark:text-amber-200">
                  Critical Inventory Shortage Alert ({lowStockAlerts.length} items below minimum threshold)
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Frontline Kurla basin cache is running dangerously low on thermal blankets and portable gas generators.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDepotId('ALL')}
              className="px-3 py-1 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 rounded text-xs font-semibold"
            >
              View Shortages
            </button>
          </div>
        )}

        {/* Depot Coverage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {depots.map((depot) => (
            <div
              key={depot.id}
              onClick={() => setSelectedDepotId(depot.id)}
              className={`p-4 rounded-card border transition cursor-pointer ${
                selectedDepotId === depot.id
                  ? 'bg-blue-50/60 dark:bg-slate-800 border-rq-navy shadow-subtle'
                  : 'bg-rq-surface border-rq-border hover:bg-rq-surface-2'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-rq-ink">{depot.name}</span>
                <span className="font-mono text-xs text-rq-muted">{depot.depot_type}</span>
              </div>
              <div className="text-xs text-rq-muted mb-3">{depot.location_name}</div>

              {/* Coverage mini bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-rq-muted">
                  <span>Stock Availability</span>
                  <span className="font-mono text-rq-ink font-semibold">82%</span>
                </div>
                <div className="w-full bg-rq-surface-2 h-1.5 rounded-full overflow-hidden border border-rq-border">
                  <div className="bg-[#2E7D5B] h-full" style={{ width: '82%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stock Catalog Table with Density Toggle */}
        <div className="bg-rq-surface border border-rq-border rounded-card overflow-hidden shadow-floating">
          <div className="p-4 border-b border-rq-border bg-rq-surface-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-rq-ink">Depot Inventory Ledger</span>
              <span className="px-2 py-0.5 rounded-pill bg-rq-surface text-rq-muted font-mono text-xs border border-rq-border">
                {filteredStocks.length} records
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedDepotId('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  selectedDepotId === 'ALL'
                    ? 'bg-rq-navy text-white font-semibold'
                    : 'text-rq-muted hover:text-rq-ink'
                }`}
              >
                All Depots
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rq-surface-2 border-b border-rq-border text-rq-muted uppercase font-mono text-xs tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">SKU / Item</th>
                  <th className="py-2.5 px-4 font-semibold">Depot Location</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Available</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Reserved</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rq-border font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-rq-muted">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-rq-muted">
                      No stock records found.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((s, idx) => {
                    const isLow = s.quantity_available <= s.minimum_threshold;
                    return (
                      <tr key={idx} className="hover:bg-rq-surface-2 transition">
                        <td className="py-3 px-4 font-medium text-rq-ink">
                          <div>{s.item?.name || 'Emergency Relief Supplies'}</div>
                          <div className="font-mono text-xs text-rq-muted">{s.item?.sku || 'SKU-GEN'}</div>
                        </td>
                        <td className="py-3 px-4 text-rq-muted">
                          {s.depot?.name || 'Central Relief Hub'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rq-ink tabular-nums">
                          {s.quantity_available}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rq-muted tabular-nums">
                          {s.quantity_reserved}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rq-ink tabular-nums">
                          {s.quantity_total}
                        </td>
                        <td className="py-3 px-4">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-[#E27D14] border border-amber-200 text-xs font-semibold">
                              Low Stock ({s.minimum_threshold} min)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-pill bg-emerald-50 text-[#2E7D5B] border border-emerald-200 text-xs font-semibold">
                              Optimal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donation Intake Modal */}
        {showIntakeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="max-w-md w-full bg-rq-surface border border-rq-border rounded-card p-6 shadow-floating space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-rq-border pb-3">
                <span className="font-semibold text-sm text-rq-ink">Log Relief Donation Intake</span>
                <button
                  onClick={() => setShowIntakeModal(false)}
                  className="text-rq-muted hover:text-rq-ink"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-rq-ink block mb-1">Receiving Depot</label>
                  <select
                    value={intakeDepot}
                    onChange={(e) => setIntakeDepot(e.target.value)}
                    className="w-full p-2 bg-rq-surface border border-rq-border rounded text-xs"
                  >
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-rq-ink block mb-1">Item Category</label>
                  <select
                    value={intakeItem}
                    onChange={(e) => setIntakeItem(e.target.value)}
                    className="w-full p-2 bg-rq-surface border border-rq-border rounded text-xs"
                  >
                    {stocks.slice(0, 6).map((s) => (
                      <option key={s.item_id} value={s.item_id}>
                        {s.item?.name || 'Water / Food Rations'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-rq-ink block mb-1">Quantity Received</label>
                  <input
                    type="number"
                    value={intakeQty}
                    onChange={(e) => setIntakeQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2 bg-rq-surface border border-rq-border rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-rq-ink block mb-1">Donor / Agency Source</label>
                  <input
                    type="text"
                    value={donorSource}
                    onChange={(e) => setDonorSource(e.target.value)}
                    className="w-full p-2 bg-rq-surface border border-rq-border rounded text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-rq-border flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowIntakeModal(false)}
                  className="px-3 py-1.5 bg-rq-surface-2 border border-rq-border rounded text-xs text-rq-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => intakeMutation.mutate()}
                  className="px-4 py-1.5 bg-rq-navy hover:bg-[#0E1D36] text-white rounded text-xs font-semibold transition"
                >
                  Confirm Intake
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
