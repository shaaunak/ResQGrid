import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Package,
  PlusCircle,
  AlertTriangle,
  Warehouse,
  History,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Depot, InventoryStock, Shelter, StockMovement } from '../types';

export const InventoryPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDepotFilter, setSelectedDepotFilter] = useState<string>('ALL');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);

  // Intake modal state
  const [showIntakeModal, setShowIntakeModal] = useState<boolean>(false);
  const [intakeDepotId, setIntakeDepotId] = useState<string>('');
  const [intakeItemId, setIntakeItemId] = useState<string>('');
  const [intakeQty, setIntakeQty] = useState<number>(50);
  const [intakeNotes, setIntakeNotes] = useState<string>('Simulated NGO disaster relief donation intake');

  // Fetch stocks
  const { data: stocks = [], isLoading: loadingStocks } = useQuery<InventoryStock[]>({
    queryKey: ['stocks', selectedDepotFilter, lowStockFilter],
    queryFn: () => {
      let params = [];
      if (selectedDepotFilter !== 'ALL') params.push(`depot_id=${selectedDepotFilter}`);
      if (lowStockFilter) params.push('low_stock_only=true');
      const qs = params.length ? `?${params.join('&')}` : '';
      return apiRequest<InventoryStock[]>(`/inventory/stocks${qs}`);
    },
    refetchInterval: 5000,
  });

  // Fetch Depots
  const { data: depots = [] } = useQuery<Depot[]>({
    queryKey: ['depots'],
    queryFn: () => apiRequest<Depot[]>('/inventory/depots'),
  });

  // Fetch Shelters
  const { data: shelters = [] } = useQuery<Shelter[]>({
    queryKey: ['shelters'],
    queryFn: () => apiRequest<Shelter[]>('/inventory/shelters'),
  });

  // Fetch Movements
  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['movements'],
    queryFn: () => apiRequest<StockMovement[]>('/inventory/movements'),
  });

  const intakeMutation = useMutation({
    mutationFn: () =>
      apiRequest('/inventory/intake', {
        method: 'POST',
        body: JSON.stringify({
          depot_id: intakeDepotId,
          item_id: intakeItemId,
          quantity: intakeQty,
          notes: intakeNotes,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      setShowIntakeModal(false);
    },
  });

  const lowStockCount = stocks.filter((s) => s.is_low_stock).length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-command-border gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span>Relief Logistics & Inventory Operations</span>
          </h1>
          <p className="text-xs text-command-muted font-mono mt-0.5">
            Depot stockpiles, atomic reservations, and shelter distribution monitoring across Mumbai.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (depots.length && stocks.length) {
                setIntakeDepotId(depots[0].id);
                setIntakeItemId(stocks[0].item_id);
              }
              setShowIntakeModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-medium shadow transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Donation Intake</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Active Depots</div>
          <div className="text-2xl font-bold text-white mt-1">{depots.length}</div>
          <div className="text-[10px] text-command-teal mt-1">Dadar, Kurla, Andheri</div>
        </div>
        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Emergency Shelters</div>
          <div className="text-2xl font-bold text-white mt-1">{shelters.length}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Dharavi, Sion, Parel</div>
        </div>
        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Stock Line Items</div>
          <div className="text-2xl font-bold text-white mt-1">{stocks.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Water, Rations, Lifejackets</div>
        </div>
        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Deficit Alerts (SNS)</div>
          <div className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-command-red' : 'text-emerald-400'}`}>
            {lowStockCount}
          </div>
          <div className="text-[10px] text-command-muted mt-1">Threshold breaches</div>
        </div>
      </div>

      {/* Inventory Stock Table */}
      <div className="bg-command-surface border border-command-border rounded-lg shadow-xl overflow-hidden text-xs">
        {/* Table Filters */}
        <div className="p-3 bg-command-darkest/60 border-b border-command-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
              Stock Reserves
            </span>
            <select
              value={selectedDepotFilter}
              onChange={(e) => setSelectedDepotFilter(e.target.value)}
              className="px-2 py-1 bg-command-card border border-command-border rounded text-white text-[11px] focus:outline-none font-mono"
            >
              <option value="ALL">All Mumbai Depots</option>
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center space-x-2 text-slate-300 font-mono text-[11px] cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="accent-command-red rounded"
            />
            <span className="text-red-300">Show Low Stock Only ({lowStockCount})</span>
          </label>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-command-card/50 text-[10px] uppercase text-command-muted border-b border-command-border/60">
              <tr>
                <th className="p-3">Supply Item</th>
                <th className="p-3">Depot Location</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Available</th>
                <th className="p-3 text-right">Reserved</th>
                <th className="p-3 text-right">Total Stock</th>
                <th className="p-3 text-center">Deficit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-command-border/40">
              {loadingStocks ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-command-muted">
                    Loading inventory telemetry...
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-command-muted">
                    No inventory records match filters.
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-command-card/30 transition">
                    <td className="p-3 font-medium text-white">
                      <div>{stock.item?.name}</div>
                      <div className="text-[10px] text-command-muted">{stock.item?.sku}</div>
                    </td>
                    <td className="p-3 text-slate-300">{stock.depot?.name}</td>
                    <td className="p-3 text-command-muted">{stock.item?.category}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {stock.quantity_available} {stock.item?.unit}
                    </td>
                    <td className="p-3 text-right text-purple-300">
                      {stock.quantity_reserved} {stock.item?.unit}
                    </td>
                    <td className="p-3 text-right text-slate-200">
                      {stock.quantity_total} {stock.item?.unit}
                    </td>
                    <td className="p-3 text-center">
                      {stock.is_low_stock ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-command-red/20 text-red-400 border border-command-red/40 text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>LOW STOCK</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                          <span>ADEQUATE</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shelters & Movement Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Shelters */}
        <div className="bg-command-surface border border-command-border rounded-lg p-4 shadow-xl space-y-3 text-xs">
          <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider block pb-2 border-b border-command-border/60">
            Emergency Shelters ({shelters.length})
          </span>
          <div className="space-y-2">
            {shelters.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded bg-command-card/60 border border-command-border/50 flex items-center justify-between font-mono"
              >
                <div>
                  <div className="font-semibold text-white">{s.name}</div>
                  <div className="text-[10px] text-command-muted">{s.location_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">
                    {s.current_occupancy} / {s.capacity_people}
                  </div>
                  <div className="text-[9px] text-command-muted">
                    {Math.round((s.current_occupancy / s.capacity_people) * 100)}% capacity
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Movement Audit Log */}
        <div className="bg-command-surface border border-command-border rounded-lg p-4 shadow-xl space-y-3 text-xs">
          <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider block pb-2 border-b border-command-border/60">
            Stock Movement Audit Trail
          </span>
          <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[11px]">
            {movements.slice(0, 15).map((m) => (
              <div key={m.id} className="p-2 rounded bg-command-darkest/50 border border-command-border/40">
                <div className="flex justify-between text-command-muted text-[10px]">
                  <span className="text-command-teal font-semibold">{m.movement_type}</span>
                  <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-200 mt-0.5 font-medium">
                  Quantity: {m.quantity} units
                </div>
                <div className="text-slate-400 text-[10px]">{m.notes}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intake Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-command-surface border border-command-border rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-mono">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Simulate Relief Supply Intake
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-command-muted mb-1">Destination Depot</label>
                <select
                  value={intakeDepotId}
                  onChange={(e) => setIntakeDepotId(e.target.value)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-command-muted mb-1">Select Supply Item</label>
                <select
                  value={intakeItemId}
                  onChange={(e) => setIntakeItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                >
                  {stocks.map((s) => (
                    <option key={s.item_id} value={s.item_id}>
                      {s.item?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-command-muted mb-1">Quantity Received</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={intakeQty}
                  onChange={(e) => setIntakeQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-command-muted mb-1">Source / Donation Notes</label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => intakeMutation.mutate()}
                disabled={intakeMutation.isPending}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition"
              >
                Log Stock Intake
              </button>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="px-4 py-2 bg-command-card text-slate-300 rounded hover:bg-command-border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

