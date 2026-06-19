import { useExpeditionStore } from '../store';
import { motion } from 'motion/react';
import { Landmark, Users, TrendingUp, Award, Sparkles, Eye } from 'lucide-react';
import { Card, Badge, Progress } from '../ui';
import type { Artifact, Rarity } from '../data';

const rarityConfig: Record<Rarity, { color: string; label: string }> = {
  common: { color: '#8B949E', label: 'Звичайний' },
  rare: { color: '#00E5FF', label: 'Рідкісний' },
  epic: { color: '#9747FF', label: 'Епічний' },
  legendary: { color: '#FF2A5F', label: 'Легендарний' },
};

const eraColors = ['#FFC72C', '#00E5FF', '#9747FF', '#FF2A5F', '#10B981'];

/** Stable pseudo-random visitor count per artifact (no per-render flicker). */
function visitorsFor(a: Artifact): number {
  let h = 0;
  for (let i = 0; i < a.id.length; i++) h = (h * 31 + a.id.charCodeAt(i)) % 1000;
  return 10 + (h % 50);
}

export function Museum() {
  const artifacts = useExpeditionStore((s) => s.artifacts);
  const museumVisitors = useExpeditionStore((s) => s.museumVisitors);
  const reputation = useExpeditionStore((s) => s.reputation);

  const museumArtifacts = artifacts.filter((a) => a.status === 'museum');
  const totalValue = museumArtifacts.reduce((sum, a) => sum + a.value, 0);
  const totalPrestige = museumArtifacts.reduce((sum, a) => sum + a.prestigeBonus, 0);
  const hourlyIncome = Math.floor(totalValue / 10);

  const eras = Array.from(new Set(museumArtifacts.map((a) => a.era)));

  return (
    <div className="min-h-full bg-[#0D1117] p-4 pb-20">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#9747FF20', border: '1px solid #9747FF' }}>
            <Landmark className="w-6 h-6" style={{ color: '#9747FF' }} />
          </div>
          <div>
            <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif" }}>Національний музей</h1>
            <p className="text-xs text-muted-foreground">історії України</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" style={{ color: '#9747FF' }} />
              <span className="text-xs text-muted-foreground">Експонати</span>
            </div>
            <div className="text-2xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>{museumArtifacts.length}</div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" style={{ color: '#00E5FF' }} />
              <span className="text-xs text-muted-foreground">Відвідувачі</span>
            </div>
            <div className="text-2xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>{museumVisitors}</div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">Дохід/год</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>+{hourlyIncome}</div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4" style={{ color: '#FF2A5F' }} />
              <span className="text-xs text-muted-foreground">Бонус престижу</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FF2A5F' }}>+{totalPrestige}</div>
          </Card>
        </div>

        <Card className="border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Репутація музею</span>
            <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{Math.round(reputation)} / 2000</span>
          </div>
          <Progress value={(reputation / 2000) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">Наступна віха: міжнародне визнання</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>Виставкові зали</h2>

        {museumArtifacts.length === 0 && (
          <Card className="border-white/10 p-8 text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Музей поки порожній</p>
            <p className="text-xs text-muted-foreground mt-1">Реставруйте артефакти та передавайте їх сюди</p>
          </Card>
        )}

        {eras.map((era, index) => {
          const eraArtifacts = museumArtifacts.filter((a) => a.era === era);
          const color = eraColors[index % eraColors.length];
          return (
            <motion.div key={era} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <Card className="border-2 p-4" style={{ borderColor: `${color}40` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <h3 className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>{era}</h3>
                  </div>
                  <Badge variant="outline" style={{ borderColor: color, color }}>{eraArtifacts.length} експ.</Badge>
                </div>
                <div className="space-y-2">
                  {eraArtifacts.map((artifact, artifactIndex) => (
                    <motion.div key={artifact.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: artifactIndex * 0.05 }} className="bg-[#0D1117] rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3" style={{ color: rarityConfig[artifact.rarity].color }} />
                            <h4 className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>{artifact.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{artifact.description}</p>
                        </div>
                        <Badge className="ml-2" style={{ backgroundColor: rarityConfig[artifact.rarity].color, color: '#0D1117', fontSize: '9px' }}>
                          {rarityConfig[artifact.rarity].label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Цінність: </span>
                            <span style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{artifact.value.toLocaleString()}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Престиж: </span>
                            <span style={{ fontFamily: "'Exo 2', sans-serif", color: '#FF2A5F' }}>+{artifact.prestigeBonus}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" style={{ color: '#00E5FF' }} />
                          <span className="text-xs" style={{ color: '#00E5FF' }}>{visitorsFor(artifact)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border-white/10 p-4 mt-4">
        <div className="text-center">
          <div className="text-3xl mb-2" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{totalValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Загальна цінність колекції</p>
        </div>
      </Card>
    </div>
  );
}
