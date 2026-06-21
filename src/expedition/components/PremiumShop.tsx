// ═══════════════════════════════════════════════════════════════════════
// PREMIUM SHOP COMPONENT
// Telegram Stars shop for Academy
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star, Gift, Zap, Sparkles, Package, Lock, Check, ShoppingBag } from 'lucide-react';
import { Card, Badge } from '../ui';
import { 
  PREMIUM_SHOP_ITEMS, 
  getShopItemsByType, 
  type ShopItem,
  type ShopItemType 
} from '../premiumEconomyData';

interface PremiumShopProps {
  starsBalance?: number;
  onPurchase?: (itemId: string, cost: number) => void;
  ownedCosmetics?: string[];
  ownedBadges?: string[];
}

function ShopItemCard({ 
  item, 
  onPurchase, 
  canAfford,
  isOwned,
}: { 
  item: ShopItem; 
  onPurchase: () => void;
  canAfford: boolean;
  isOwned: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: canAfford && !isOwned ? 1.02 : 1 }}
      whileTap={{ scale: canAfford && !isOwned ? 0.98 : 1 }}
      className="relative"
    >
      <Card 
        className={`bg-[#161B22] border-white/5 p-4 ${
          isOwned ? 'opacity-60' : ''
        } ${!canAfford && !isOwned ? 'opacity-40' : ''}`}
        style={{ borderLeft: `3px solid ${item.color}` }}
      >
        {/* Icon & Name */}
        <div className="flex items-start gap-3 mb-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${item.color}20` }}
          >
            {item.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-[#E6EDF3]">
              {item.nameKey.replace('shop.', '').replace(/_/g, ' ')}
            </h4>
            <p className="text-xs text-[#8B949E] mt-0.5">
              {item.descriptionKey.replace('shop.', '').replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Contents */}
        {item.contents && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.contents.premiumTickets && (
              <Badge className="bg-[#FF6B6B]/20 text-[#FF6B6B] text-[10px]">
                🎰 {item.contents.premiumTickets} spins
              </Badge>
            )}
            {item.contents.expeditionBoosts && (
              <Badge className="bg-[#00E5FF]/20 text-[#00E5FF] text-[10px]">
                ⚡ {item.contents.expeditionBoosts} boosts
              </Badge>
            )}
            {item.contents.xpBoosts && (
              <Badge className="bg-[#10B981]/20 text-[#10B981] text-[10px]">
                📈 {item.contents.xpBoosts} XP boost{item.contents.xpBoosts > 1 ? 's' : ''}
              </Badge>
            )}
            {item.contents.incomeBoosts && (
              <Badge className="bg-[#A855F7]/20 text-[#A855F7] text-[10px]">
                💰 {item.contents.incomeBoosts} income boost{item.contents.incomeBoosts > 1 ? 's' : ''}
              </Badge>
            )}
            {item.contents.duration && (
              <Badge className="bg-[#F59E0B]/20 text-[#F59E0B] text-[10px]">
                ⏱️ {item.contents.duration} days
              </Badge>
            )}
            {item.contents.cosmeticFrame && (
              <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
                🖼️ Frame
              </Badge>
            )}
            {item.contents.chatBadge && (
              <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
                🏅 Badge
              </Badge>
            )}
          </div>
        )}

        {/* Price & Buy */}
        <div className="flex items-center justify-between">
          {isOwned ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Own
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
              <span className={`text-sm font-bold ${canAfford ? 'text-[#FFD700]' : 'text-[#8B949E]'}`}>
                {item.cost}
              </span>
            </div>
          )}
          
          {item.limited && !isOwned && (
            <Badge className="bg-red-500/20 text-red-400 text-[10px]">
              Limited ({item.limitedQuantity})
            </Badge>
          )}

          {!isOwned && (
            <motion.button
              whileHover={{ scale: canAfford ? 1.05 : 1 }}
              whileTap={{ scale: canAfford ? 0.95 : 1 }}
              onClick={onPurchase}
              disabled={!canAfford}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                canAfford
                  ? 'bg-[#FFD700] text-black hover:bg-[#FFC72C]'
                  : 'bg-white/10 text-[#8B949E] cursor-not-allowed'
              }`}
            >
              {canAfford ? 'Buy' : <Lock className="w-3 h-3" />}
            </motion.button>
          )}
        </div>

        {/* Featured Badge */}
        {item.featured && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-[#FF6B6B] text-white text-[10px] animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              HOT
            </Badge>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export function PremiumShop({ 
  starsBalance = 0, 
  onPurchase,
  ownedCosmetics = [],
  ownedBadges = [],
}: PremiumShopProps) {
  const [activeTab, setActiveTab] = useState<ShopItemType | 'all'>('all');
  
  const tabs: { id: ShopItemType | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Всі', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'pack', label: 'Паки', icon: <Package className="w-4 h-4" /> },
    { id: 'boost', label: 'Бусти', icon: <Zap className="w-4 h-4" /> },
    { id: 'spin', label: 'Спіни', icon: <Gift className="w-4 h-4" /> },
    { id: 'cosmetic_frame', label: 'Рамки', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const filteredItems = activeTab === 'all' 
    ? PREMIUM_SHOP_ITEMS 
    : getShopItemsByType(activeTab);

  const isOwned = (item: ShopItem): boolean => {
    if (item.contents?.cosmeticFrame && ownedCosmetics.includes(item.contents.cosmeticFrame)) {
      return true;
    }
    if (item.contents?.chatBadge && ownedBadges.includes(item.contents.chatBadge)) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#FFD700]/20 to-[#FF8C00]/20 border-[#FFD700]/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/30 flex items-center justify-center">
              <Star className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#FFD700]">
                Telegram Stars
              </h3>
              <p className="text-xs text-[#E6EDF3]/80">
                Підтримайте розробників гри
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
              <span className="text-2xl font-bold text-[#FFD700]">{starsBalance}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#FFD700]/20 text-[#FFD700]'
                : 'bg-white/5 text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ShopItemCard
              item={item}
              onPurchase={() => onPurchase?.(item.id, item.cost)}
              canAfford={starsBalance >= item.cost}
              isOwned={isOwned(item)}
            />
          </motion.div>
        ))}
      </div>

      {/* Info Note */}
      <Card className="bg-[#161B22] border-white/5 p-3 text-center">
        <p className="text-xs text-[#8B949E]">
          💡 Усі покупки прискорюють прогрес. Гра залишається проходимою без покупок.
        </p>
      </Card>
    </div>
  );
}
