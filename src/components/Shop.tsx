import React, { useState } from 'react';
import { Coins, X, Palette, Zap, ArrowUpCircle } from 'lucide-react';

export const SHOP_ITEMS = [
  { id: 'trail_cyan', type: 'trail', name: 'Cyan Trail', cost: 1, color: '#00f2ff' },
  { id: 'trail_red', type: 'trail', name: 'Crimson Trail', cost: 1, color: '#ff003c' },
  { id: 'transform_burst', type: 'transform', name: 'Plasma Burst', cost: 1 },
  { id: 'transform_digital', type: 'transform', name: 'Digital Glitch', cost: 1 },
  { id: 'dino_stego', type: 'dino', name: 'Stegosaurus', cost: 999, comingSoon: true },
  { id: 'dino_brach', type: 'dino', name: 'Brachiosaurus', cost: 999, comingSoon: true },
  { id: 'dino_ptero', type: 'dino', name: 'Pterodactyl', cost: 999, comingSoon: true },
];

export function Shop({ 
  totalCoins, 
  onPurchase, 
  onClose,
  unlockedItems,
  activeTrail,
  activeTransform,
  onEquip,
  upgrades,
  onPurchaseUpgrade
}: { 
  totalCoins: number, 
  onPurchase: (cost: number, id: string) => void,
  onClose: () => void,
  unlockedItems: string[],
  activeTrail: string | null,
  activeTransform: string | null,
  onEquip: (type: 'trail'|'transform', id: string) => void,
  upgrades: { speed: number, doubleJump: boolean, magnetize: boolean, maxHealth: number, fuelCan: number },
  onPurchaseUpgrade: (cost: number, upgradeId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'trail' | 'transform' | 'dino' | 'passives'>('trail');

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#050a05] border-4 border-yellow-500 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col max-h-full">
        {/* Header */}
        <div className="p-6 border-b-4 border-yellow-500/30 flex items-center justify-between bg-black/50">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-yellow-500 transform -skew-x-12" style={{ fontFamily: 'monospace' }}>UPGRADES</h2>
            <p className="text-[10px] uppercase tracking-widest text-yellow-500/70 font-bold mt-1">Change up your dinos visual aesthetic.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Vault Balance</p>
              <p className="text-2xl font-black italic tracking-tighter text-yellow-400 flex items-center justify-end gap-2">
                 <Coins className="w-5 h-5"/> {totalCoins}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-800 bg-gray-900/40">
           {(['trail', 'transform', 'dino', 'passives'] as any[]).map(tab => (
              <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex-1 py-3 px-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-4 ${activeTab === tab ? 'bg-gray-800/80 text-yellow-500 border-yellow-500' : 'text-gray-500 border-transparent hover:bg-gray-800/50 hover:text-gray-300'}`}
              >
                 {tab === 'trail' ? 'Trails' : tab === 'transform' ? 'Overdrives' : tab === 'dino' ? 'Characters' : 'Stats & Passives'}
              </button>
           ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
          {activeTab === 'passives' ? (
             [
               { id: 'speed', name: 'Speed Boost', desc: 'Increases base speed.', max: 5, price: (lvl: number) => 50 * (lvl + 1) },
               { id: 'doubleJump', name: 'Double Jump', desc: 'Allows jumping again in mid-air.', max: 1, price: () => 500 },
               { id: 'magnetize', name: 'Coin Magnet', desc: 'Attracts nearby coins automatically.', max: 1, price: () => 750 },
               { id: 'maxHealth', name: 'Extra Health', desc: 'Increases maximum health cap.', max: 2, price: (lvl: number) => 300 * (lvl + 1) },
               { id: 'fuelCan', name: 'Fuel Canister', desc: 'Increases fuel gained from items.', max: 5, price: (lvl: number) => 100 * (lvl + 1) },
             ].map(upg => {
                 const currentLevel = upgrades[upg.id as keyof typeof upgrades] as number | boolean;
                 let lvlNum = 0;
                 if (typeof currentLevel === 'boolean') lvlNum = currentLevel ? 1 : 0;
                 else lvlNum = currentLevel || 0;
                 
                 const isMaxed = lvlNum >= upg.max;
                 const cost = upg.price(lvlNum);
                 const canAfford = totalCoins >= cost;
                 return (
                    <div key={upg.id} className="border-2 border-gray-800 bg-gray-900/50 p-4 rounded-lg flex flex-col h-full min-h-[160px]">
                       <div className="flex items-center gap-3 mb-2">
                          <ArrowUpCircle className="w-5 h-5 text-green-400 shrink-0" />
                          <h3 className="text-lg font-bold uppercase tracking-wider text-white leading-tight" style={{ fontFamily: 'monospace' }}>{upg.name}</h3>
                          <div className="ml-auto flex gap-1">
                              {[...Array(upg.max)].map((_, i) => (
                                 <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${i < lvlNum ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]' : 'bg-gray-700'}`} />
                              ))}
                          </div>
                       </div>
                       <p className="text-xs text-gray-400 font-mono mb-4 flex-1">
                          {upg.desc}
                       </p>
                       <div className="mt-auto">
                          {isMaxed ? (
                             <button disabled className="w-full py-2 font-bold uppercase tracking-widest text-xs transition-colors border-2 bg-green-900/30 text-green-500 border-green-500 opacity-100 cursor-not-allowed">
                                MAX LEVEL
                             </button>
                          ) : (
                             <button
                               onClick={() => onPurchaseUpgrade(cost, upg.id)}
                               disabled={!canAfford}
                               className={`w-full py-2 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 border-2 ${canAfford ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 hover:bg-yellow-500/30 cursor-pointer' : 'bg-gray-800 text-gray-500 border-gray-700 opacity-50 cursor-not-allowed'}`}
                             >
                               <Coins className="w-4 h-4"/> PURCHASE FOR {cost}
                             </button>
                          )}
                       </div>
                    </div>
                 );
             })
          ) : SHOP_ITEMS.filter(item => item.type === activeTab).map(item => {
             const isUnlocked = unlockedItems.includes(item.id);
             const isEquipped = activeTrail === item.id || activeTransform === item.id;
             const canAfford = totalCoins >= item.cost;

             return (
               <div key={item.id} className="border-2 border-gray-800 bg-gray-900/50 p-4 rounded-lg flex flex-col h-full min-h-[160px]">
                  <div className="flex items-center gap-3 mb-2">
                     {item.type === 'trail' ? <Palette className="w-5 h-5 text-cyan-400 shrink-0" /> : item.type === 'transform' ? <Zap className="w-5 h-5 text-red-400 shrink-0" /> : <div className="w-5 h-5 bg-gray-500 rounded-sm shrink-0" />}
                     <h3 className="text-lg font-bold uppercase tracking-wider text-white leading-tight" style={{ fontFamily: 'monospace' }}>{item.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mb-4 flex-1">
                     {item.type === 'trail' ? 'Replaces default hover trail VFX.' : item.type === 'transform' ? 'Replaces manual OVERDRIVE transformation visual effect.' : 'Unlocks a new playable dinosaur.'}
                  </p>

                  <div className="mt-auto">
                    {item.comingSoon ? (
                       <button
                         disabled
                         className={`w-full py-2 font-bold uppercase tracking-widest text-xs transition-colors border-2 bg-gray-900 border-gray-700 text-gray-500 opacity-80 cursor-not-allowed`}
                       >
                         COMING SOON
                       </button>
                    ) : isUnlocked ? (
                       <button
                         onClick={() => onEquip(item.type as 'trail'|'transform', item.id)}
                         className={`w-full py-2 font-bold uppercase tracking-widest text-xs transition-colors border-2 ${isEquipped ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400' : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}`}
                       >
                         {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                       </button>
                    ) : (
                       <button
                         onClick={() => onPurchase(item.cost, item.id)}
                         disabled={!canAfford}
                         className={`w-full py-2 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 border-2 ${canAfford ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 hover:bg-yellow-500/30 cursor-pointer' : 'bg-gray-800 text-gray-500 border-gray-700 opacity-50 cursor-not-allowed'}`}
                       >
                         <Coins className="w-4 h-4"/> PURCHASE FOR {item.cost}
                       </button>
                    )}
                  </div>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}
