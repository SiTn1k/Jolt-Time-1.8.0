import { useState, useEffect } from 'react';
import { useExpeditionStore } from '../store';
import { Landmark, Settings } from 'lucide-react';
import { Card } from '../ui';
import { MuseumSystem } from '../components/MuseumSystem';
import { useTranslation } from '../../i18n';
import { getReputationLevel, museumCollections } from '../museumData';

export function Museum() {
  const { t } = useTranslation();
  const [showFullMuseum, setShowFullMuseum] = useState(false);

  const artifacts = useExpeditionStore((s) => s.artifacts);
  const museumState = useExpeditionStore((s) => s.museumState);
  const checkCollectionCompletion = useExpeditionStore((s) => s.checkCollectionCompletion);

  const museumArtifacts = artifacts.filter((a) => a.status === 'museum');
  const totalValue = museumArtifacts.reduce((sum, a) => sum + a.value, 0);
  const exhibitedCount = museumState.exhibitions.filter((ex) => ex.artifactId).length;
  const repLevel = getReputationLevel(museumState.reputation);
  const completedCount = museumState.completedCollections?.length || 0;
  const totalCollections = museumCollections.length;

  // Check collection completion on mount
  useEffect(() => {
    checkCollectionCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount

  return (
    <>
      <div className="min-h-full bg-[#0D1117] p-4 pb-20">
        {/* Header with Full System Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#9747FF20', border: '1px solid #9747FF' }}>
              <Landmark className="w-6 h-6" style={{ color: '#9747FF' }} />
            </div>
            <div>
              <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('museum.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('museum.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowFullMuseum(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ backgroundColor: '#9747FF20', border: '1px solid #9747FF' }}
          >
            <Settings className="w-4 h-4" style={{ color: '#9747FF' }} />
            <span className="text-sm" style={{ color: '#9747FF' }}>{t('museum.open_system')}</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('museum.exhibits')}</div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>
              {exhibitedCount} / {museumState.exhibitions.length}
            </div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('museum.reputation_level')}</div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {repLevel.level}
            </div>
          </Card>
        </div>

        {/* Collection Progress */}
        <Card className="border-white/10 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">{t('museum.collections')}</span>
            <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {completedCount} / {totalCollections}
            </span>
          </div>
          <div className="flex gap-1">
            {museumCollections.slice(0, 8).map((col) => {
              const isComplete = museumState.completedCollections?.includes(col.id);
              return (
                <div
                  key={col.id}
                  className="flex-1 h-2 rounded"
                  style={{
                    backgroundColor: isComplete ? '#FFC72C' : 'rgba(255,255,255,0.1)',
                  }}
                  title={`${col.icon} ${col.era}: ${isComplete ? 'Завершено' : 'Не завершено'}`}
                />
              );
            })}
          </div>
        </Card>

        {/* Museum Value */}
        {museumArtifacts.length > 0 ? (
          <Card className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border-white/10 p-4 mb-4">
            <div className="text-center">
              <div className="text-3xl mb-1" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
                {totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{t('museum.total_collection_value')}</p>
            </div>
          </Card>
        ) : (
          <Card className="bg-white/[0.04] border-white/[0.08] rounded-2xl p-6 mb-4 text-center">
            <Landmark className="w-8 h-8 mx-auto mb-2" style={{ color: '#9747FF' }} />
            <p className="text-sm text-[#E6EDF3]">{t('objective.empty_museum')}</p>
            <p className="text-xs text-[#8B949E] mt-1">{t('objective.empty_museum_hint')}</p>
          </Card>
        )}

        {/* Quick Actions */}
        <button
          onClick={() => setShowFullMuseum(true)}
          className="w-full py-4 rounded-xl font-bold text-lg"
          style={{ backgroundColor: '#9747FF', color: '#fff' }}
        >
          🏛️ {t('museum.open_museum_system')}
        </button>

        {/* Open Full Museum System Modal */}
        <MuseumSystem isOpen={showFullMuseum} onClose={() => setShowFullMuseum(false)} />
      </div>
    </>
  );
}
