import { useState } from 'react';
import { useExpeditionStore } from '../store';
import { museumCollections, museumUpgrades, getReputationLevel } from '../museumData';
import { motion } from 'motion/react';
import { 
  Landmark, TrendingUp, Award, Sparkles, Eye, 
  Plus, Minus, Star, Gift, 
  X, Settings
} from 'lucide-react';
import { Card, Badge, Progress } from '../ui';
import type { Artifact, Rarity } from '../data';
import { useTranslation } from '../../i18n';

type TabType = 'exhibitions' | 'collections' | 'upgrades' | 'stats';

const rarityConfig: Record<Rarity, { color: string; labelKey: string }> = {
  common: { color: '#8B949E', labelKey: 'artifacts.rarity_common' },
  rare: { color: '#00E5FF', labelKey: 'artifacts.rarity_rare' },
  epic: { color: '#9747FF', labelKey: 'artifacts.rarity_epic' },
  legendary: { color: '#FF2A5F', labelKey: 'artifacts.rarity_legendary' },
};

interface MuseumSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MuseumSystem({ isOpen, onClose }: MuseumSystemProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('exhibitions');

  // Store state
  const museumState = useExpeditionStore((s) => s.museumState);
  const artifacts = useExpeditionStore((s) => s.artifacts);
  const karbovanets = useExpeditionStore((s) => s.karbovanets);
  const placeArtifactInExhibition = useExpeditionStore((s) => s.placeArtifactInExhibition);
  const removeArtifactFromExhibition = useExpeditionStore((s) => s.removeArtifactFromExhibition);
  const collectMuseumIncome = useExpeditionStore((s) => s.collectMuseumIncome);
  const purchaseMuseumUpgrade = useExpeditionStore((s) => s.purchaseMuseumUpgrade);
  const expandExhibitionSlots = useExpeditionStore((s) => s.expandExhibitionSlots);

  // Get displayed artifacts
  const museumArtifacts = artifacts.filter((a) => a.status === 'museum');
  const exhibitedArtifactIds = museumState.exhibitions
    .filter((ex) => ex.artifactId)
    .map((ex) => ex.artifactId);
  const exhibitedArtifacts = museumArtifacts.filter((a) => exhibitedArtifactIds.includes(a.id));
  const totalExhibitedValue = exhibitedArtifacts.reduce((sum, a) => sum + a.value, 0);

  // Calculate daily visitors
  const collectionBonus = museumState.completedCollections.length * 10;
  const dailyVisitors = museumState.exhibitions.filter((ex) => ex.artifactId).length * 25;
  const repLevel = getReputationLevel(museumState.reputation);
  const marketingBonus = 1 + (museumState.upgrades.marketing * 0.15);
  const finalDailyVisitors = Math.floor(dailyVisitors * repLevel.visitorMultiplier * marketingBonus * (1 + collectionBonus / 100));

  // Calculate hourly income
  const restorationBonus = 1 + (museumState.upgrades.restoration_wing * 0.05);
  const hourlyIncome = Math.floor((totalExhibitedValue / 100) * repLevel.incomeMultiplier * restorationBonus * (1 + museumState.completedCollections.length * 0.05));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen p-4 pb-20" style={{ maxWidth: '430px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#9747FF20', border: '1px solid #9747FF' }}
            >
              <Landmark className="w-6 h-6" style={{ color: '#9747FF' }} />
            </div>
            <div>
              <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {t('museum.title')}
              </h1>
              <p className="text-xs text-muted-foreground">{t('museum.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">{t('museum.reputation_level')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {repLevel.level} - {t(repLevel.nameKey)}
            </div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" style={{ color: '#00E5FF' }} />
              <span className="text-xs text-muted-foreground">{t('museum.visitors_today')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
              {finalDailyVisitors.toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Reputation Progress */}
        <Card className="border-white/10 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">{t('museum.museum_reputation')}</span>
            <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(museumState.reputation).toLocaleString()} / {repLevel.requiredReputation.toLocaleString()}
            </span>
          </div>
          <Progress value={(museumState.reputation / Math.max(1, repLevel.requiredReputation)) * 100} className="h-2" />
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'exhibitions' as TabType, icon: Sparkles, label: t('museum.tab_exhibitions') },
            { id: 'collections' as TabType, icon: Gift, label: t('museum.tab_collections') },
            { id: 'upgrades' as TabType, icon: Settings, label: t('museum.tab_upgrades') },
            { id: 'stats' as TabType, icon: TrendingUp, label: t('museum.tab_stats') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#9747FF] text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'exhibitions' && (
          <ExhibitionsTab
            museumState={museumState}
            artifacts={artifacts}
            hourlyIncome={hourlyIncome}
            placeArtifactInExhibition={placeArtifactInExhibition}
            removeArtifactFromExhibition={removeArtifactFromExhibition}
            expandExhibitionSlots={expandExhibitionSlots}
            karbovanets={karbovanets}
          />
        )}

        {activeTab === 'collections' && (
          <CollectionsTab
            museumState={museumState}
            museumArtifacts={museumArtifacts}
          />
        )}

        {activeTab === 'upgrades' && (
          <UpgradesTab
            museumState={museumState}
            karbovanets={karbovanets}
            purchaseMuseumUpgrade={purchaseMuseumUpgrade}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            museumState={museumState}
            hourlyIncome={hourlyIncome}
            exhibitedArtifacts={exhibitedArtifacts}
          />
        )}

        {/* Collect Income Button */}
        {hourlyIncome > 0 && (
          <motion.button
            onClick={collectMuseumIncome}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-bold text-lg shadow-lg"
            style={{ 
              backgroundColor: '#FFC72C', 
              color: '#0D1117',
              maxWidth: '400px',
              width: 'calc(100% - 32px)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            💰 {t('museum.collect_income')}: +{hourlyIncome.toLocaleString()}/год
          </motion.button>
        )}
      </div>
    </div>
  );
}

// Exhibitions Tab Component
function ExhibitionsTab({
  museumState,
  artifacts,
  hourlyIncome,
  placeArtifactInExhibition,
  removeArtifactFromExhibition,
  expandExhibitionSlots,
  karbovanets,
}: {
  museumState: any;
  artifacts: Artifact[];
  hourlyIncome: number;
  placeArtifactInExhibition: (artifactId: string, slotIndex: number) => boolean;
  removeArtifactFromExhibition: (slotIndex: number) => void;
  expandExhibitionSlots: () => boolean;
  karbovanets: number;
}) {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const museumArtifacts = artifacts.filter((a) => a.status === 'museum');
  const exhibitedIds = museumState.exhibitions.map((ex: any) => ex.artifactId).filter(Boolean);
  const availableArtifacts = museumArtifacts.filter((a) => !exhibitedIds.includes(a.id));

  const expansionsCount = museumState.exhibitions.length - 3;
  const expansionCost = expansionsCount >= 9 ? Infinity : 5000 * Math.pow(2, expansionsCount);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card className="border-white/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: '#9747FF' }} />
            <span className="text-sm">{t('museum.exhibition_slots')}</span>
          </div>
          <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>
            {museumState.exhibitions.filter((ex: any) => ex.artifactId).length} / {museumState.exhibitions.length}
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {museumState.exhibitions.map((exhibition: any, index: number) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded ${
                exhibition.artifactId ? 'bg-[#9747FF]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </Card>

      {/* Exhibition Slots */}
      <div className="grid grid-cols-3 gap-3">
        {museumState.exhibitions.map((exhibition: any, index: number) => {
          const artifact = artifacts.find((a) => a.id === exhibition.artifactId);
          const isEmpty = !exhibition.artifactId;
          const isSelected = selectedSlot === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`relative aspect-square rounded-xl border-2 p-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#FFC72C] bg-[#FFC72C]/10'
                  : isEmpty
                  ? 'border-dashed border-white/20 hover:border-white/40'
                  : 'border-[#9747FF]/50 bg-[#9747FF]/10'
              }`}
              onClick={() => {
                if (isEmpty) {
                  setSelectedSlot(index);
                } else {
                  removeArtifactFromExhibition(index);
                }
              }}
            >
              {artifact ? (
                <>
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg mb-1"
                      style={{ backgroundColor: `${rarityConfig[artifact.rarity].color}30` }}
                    >
                      ✨
                    </div>
                    <span className="text-[10px] text-center line-clamp-2" style={{ color: rarityConfig[artifact.rarity].color }}>
                      {artifact.name.substring(0, 20)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeArtifactFromExhibition(index);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white/30" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Expand Slots Button */}
      {museumState.exhibitions.length < 12 && (
        <button
          onClick={() => expandExhibitionSlots()}
          disabled={karbovanets < expansionCost}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            karbovanets >= expansionCost
              ? 'bg-[#9747FF]/20 text-[#9747FF] hover:bg-[#9747FF]/30'
              : 'bg-white/5 text-gray-500'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            {t('museum.expand_slots')}: {expansionCost.toLocaleString()} 💰
          </div>
        </button>
      )}

      {/* Artifact Picker */}
      {selectedSlot !== null && availableArtifacts.length > 0 && (
        <Card className="border-white/10 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{t('museum.select_artifact')}</span>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableArtifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => {
                  placeArtifactInExhibition(artifact.id, selectedSlot);
                  setSelectedSlot(null);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${rarityConfig[artifact.rarity].color}30` }}
                >
                  ✨
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm">{artifact.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('museum.value')}: {artifact.value.toLocaleString()}
                  </div>
                </div>
                <Badge style={{ backgroundColor: rarityConfig[artifact.rarity].color, color: '#0D1117', fontSize: '9px' }}>
                  {t(rarityConfig[artifact.rarity].labelKey)}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Income Preview */}
      {hourlyIncome > 0 && (
        <Card className="border-[#FFC72C]/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('museum.hourly_income')}</span>
            <span className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              +{hourlyIncome.toLocaleString()}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

// Collections Tab Component
function CollectionsTab({
  museumState,
  museumArtifacts,
}: {
  museumState: any;
  museumArtifacts: Artifact[];
}) {
  const { t } = useTranslation();

  // Calculate collection progress
  const collectionsWithProgress = museumCollections.map((collection) => {
    const matchingArtifacts = museumArtifacts.filter((a) => {
      const eraMatch = a.era === collection.era;
      const nameMatch = collection.artifacts.some((keyword) =>
        a.name.toLowerCase().includes(keyword.toLowerCase())
      );
      return eraMatch && nameMatch;
    }).length;

    const isComplete = museumState.completedCollections.includes(collection.id);

    return {
      ...collection,
      progress: matchingArtifacts,
      isComplete,
    };
  });

  const completedCount = collectionsWithProgress.filter((c) => c.isComplete).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-white/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" style={{ color: '#FFC72C' }} />
            <span className="text-sm">{t('museum.collections_completed')}</span>
          </div>
          <span className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
            {completedCount} / {museumCollections.length}
          </span>
        </div>
        <Progress value={(completedCount / museumCollections.length) * 100} className="h-2 mt-2" />
      </Card>

      {/* Collection Cards */}
      {collectionsWithProgress.map((collection) => (
        <Card
          key={collection.id}
          className={`border-white/10 p-4 ${collection.isComplete ? 'border-[#FFC72C]/50 bg-[#FFC72C]/5' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: collection.isComplete ? '#FFC72C30' : '#ffffff10' }}>
                {collection.isComplete ? <Star className="w-6 h-6 text-[#FFC72C]" /> : collection.icon}
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {t(collection.nameKey)}
                </h3>
                <p className="text-xs text-muted-foreground">{collection.era}</p>
              </div>
            </div>
            {collection.isComplete && (
              <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117' }}>
                ✓ {t('museum.complete')}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{t('museum.progress')}</span>
              <span style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
                {collection.progress} / {collection.requiredCount}
              </span>
            </div>
            <Progress 
              value={(collection.progress / collection.requiredCount) * 100} 
              className="h-2"
            />
          </div>

          {/* Bonuses */}
          {collection.isComplete && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.reputationBonus} {t('museum.rep')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.visitorBonus}% {t('museum.visitors')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.incomeBonus}% {t('museum.income')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.karbovanetsBonus} 💰</span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// Upgrades Tab Component
function UpgradesTab({
  museumState,
  karbovanets,
  purchaseMuseumUpgrade,
}: {
  museumState: any;
  karbovanets: number;
  purchaseMuseumUpgrade: (upgradeId: string) => boolean;
}) {
  const { t } = useTranslation();

  const upgradesWithInfo = museumUpgrades.map((upgrade) => {
    const currentLevel = museumState.upgrades[upgrade.id] || 0;
    const cost = currentLevel >= upgrade.maxLevel 
      ? Infinity 
      : Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    const isMaxed = currentLevel >= upgrade.maxLevel;
    const canAfford = karbovanets >= cost;

    return {
      ...upgrade,
      currentLevel,
      cost,
      isMaxed,
      canAfford,
    };
  });

  return (
    <div className="space-y-4">
      {upgradesWithInfo.map((upgrade) => (
        <Card
          key={upgrade.id}
          className={`border-white/10 p-4 ${upgrade.isMaxed ? 'border-[#FFC72C]/30 bg-[#FFC72C]/5' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10">
              {upgrade.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {t(upgrade.nameKey)}
                </h3>
                <Badge variant="outline" style={{ borderColor: '#FFC72C', color: '#FFC72C' }}>
                  {upgrade.currentLevel} / {upgrade.maxLevel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{t(upgrade.descriptionKey)}</p>

              {/* Effect */}
              <div className="text-xs mb-3">
                {upgrade.effects.map((effect, i) => (
                  <div key={i} className="text-[#00E5FF]">
                    +{effect.value * (upgrade.currentLevel + 1)} {effect.type === 'visitors' ? '%' : ''} {t(`museum.effect_${effect.type}`)}
                  </div>
                ))}
              </div>

              {/* Upgrade Button */}
              {upgrade.isMaxed ? (
                <div className="text-center py-2 text-sm text-[#FFC72C]">
                  ✓ {t('museum.max_level')}
                </div>
              ) : (
                <button
                  onClick={() => purchaseMuseumUpgrade(upgrade.id)}
                  disabled={!upgrade.canAfford}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    upgrade.canAfford
                      ? 'bg-[#FFC72C] text-[#0D1117] hover:bg-[#FFC72C]/90'
                      : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {upgrade.cost.toLocaleString()} 💰
                </button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Stats Tab Component
function StatsTab({
  museumState,
  hourlyIncome,
  exhibitedArtifacts,
}: {
  museumState: any;
  hourlyIncome: number;
  exhibitedArtifacts: Artifact[];
}) {
  const { t } = useTranslation();
  const repLevel = getReputationLevel(museumState.reputation);

  const totalArtifactValue = exhibitedArtifacts.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-white/10 p-3">
          <div className="text-xs text-muted-foreground mb-1">{t('museum.total_visitors')}</div>
          <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
            {museumState.totalVisitorsAllTime.toLocaleString()}
          </div>
        </Card>
        <Card className="border-white/10 p-3">
          <div className="text-xs text-muted-foreground mb-1">{t('museum.total_income')}</div>
          <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
            {museumState.totalIncomeAllTime.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Current Status */}
      <Card className="border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {t('museum.current_status')}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.reputation_level')}</span>
            <span style={{ color: '#FFC72C' }}>{repLevel.level} ({t(repLevel.nameKey)})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.exhibits_count')}</span>
            <span style={{ color: '#9747FF' }}>{exhibitedArtifacts.length} / {museumState.exhibitions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.collections')}</span>
            <span style={{ color: '#FFC72C' }}>{museumState.completedCollections.length} / 5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.hourly_income')}</span>
            <span style={{ color: '#FFC72C' }}>+{hourlyIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.total_value')}</span>
            <span style={{ color: '#FFC72C' }}>{totalArtifactValue.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Upgrade Levels */}
      <Card className="border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {t('museum.upgrade_levels')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {museumUpgrades.map((upgrade) => {
            const level = museumState.upgrades[upgrade.id] || 0;
            return (
              <div key={upgrade.id} className="flex items-center gap-2 text-sm">
                <span>{upgrade.icon}</span>
                <span className="text-muted-foreground">{t(upgrade.nameKey)}:</span>
                <span style={{ color: '#FFC72C' }}>{level}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
