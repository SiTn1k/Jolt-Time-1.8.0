// ═══════════════════════════════════════════════════════════════════════
// PREMIUM SCREEN
// Telegram Stars shop and premium features
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star, Sparkles, Zap } from 'lucide-react';
import { PremiumShop } from '../components/PremiumShop';
import { useExpeditionStore } from '../store';

export function Premium() {
  const starsBalance = useExpeditionStore(s => s.starsBalance || 0);
  const pushToast = useExpeditionStore(s => s.pushToast);

  const handlePurchase = (itemId: string, cost: number) => {
    // TODO: Integrate with Telegram Stars API
    // For now, just show a message
    pushToast(`Купівля: ${itemId} за ${cost} ⭐`, '#FFD700');
    
    // In real implementation:
    // 1. Call Telegram SDK to process payment
    // 2. On success, update starsBalance and grant items
    // 3. Sync to server
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FF8C00]/20 rounded-2xl p-4 border border-[#FFD700]/30">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#FFD700]/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FFD700]">
                Premium Shop
              </h2>
              <p className="text-sm text-[#E6EDF3]/80">
                Підтримайте розробників та прискорте прогрес
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Shop */}
      <PremiumShop
        starsBalance={starsBalance}
        onPurchase={handlePurchase}
        ownedCosmetics={[]}
        ownedBadges={[]}
      />
    </div>
  );
}
