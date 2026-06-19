import { useExpeditionStore } from '../store';
import { buildings } from '../data';
import { motion } from 'motion/react';
import { TrendingUp, Coins, Eye, Send, Award } from 'lucide-react';
import { Card, Badge, Progress } from '../ui';
import { NPCSystem } from '../components/NPCSystem';
import { UkrainianPattern } from '../components/UkrainianPattern';

export function Academy() {
  const academyLevel = useExpeditionStore((s) => s.academyLevel);
  const reputation = useExpeditionStore((s) => s.reputation);
  const karbovanets = useExpeditionStore((s) => s.karbovanets);
  const museumVisitors = useExpeditionStore((s) => s.museumVisitors);
  const historicalPrestige = useExpeditionStore((s) => s.historicalPrestige);
  const expeditions = useExpeditionStore((s) => s.expeditions);

  const activeExpeditions = expeditions.filter((e) => !e.collected).length;

  return (
    <div className="min-h-full bg-[#0D1117] p-4 pb-20 relative overflow-hidden">
      <UkrainianPattern />

      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              Археологічна Академія
            </h1>
            <p className="text-sm text-muted-foreground">України</p>
          </div>
          <Badge
            className="px-3 py-1"
            style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontFamily: "'Exo 2', sans-serif" }}
          >
            Рівень {academyLevel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">Репутація</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(reputation).toLocaleString()}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">Карбованці</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(karbovanets).toLocaleString()}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" style={{ color: '#00E5FF' }} />
              <span className="text-xs text-muted-foreground">Відвідувачі</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
              {museumVisitors}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4" style={{ color: '#9747FF' }} />
              <span className="text-xs text-muted-foreground">Експедиції</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>
              {activeExpeditions}
            </div>
          </Card>
        </div>

        <Card className="border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" style={{ color: '#FF2A5F' }} />
              <span className="text-sm">Історичний престиж</span>
            </div>
            <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FF2A5F' }}>
              {Math.round(historicalPrestige)} / 5000
            </span>
          </div>
          <Progress value={(historicalPrestige / 5000) * 100} className="h-2" />
        </Card>
      </div>

      <div className="relative z-10">
        <h2 className="text-lg mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Будівлі кампусу
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {buildings.map((building, index) => (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="border-white/10 p-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm flex-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {building.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#FFC72C', color: '#FFC72C' }}>
                    Рів {building.level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{building.description}</p>
                <div className="text-xs px-2 py-1 rounded bg-primary/10" style={{ color: '#FFC72C' }}>
                  {building.bonus}
                </div>
                {(building.id === 'building-2' && activeExpeditions > 0) || building.id === 'building-3' ? (
                  <div className="mt-2 flex items-center gap-1">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#00E5FF' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className="text-[10px]" style={{ color: '#00E5FF' }}>Активна</span>
                  </div>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Натисніть на NPC на території, щоб поговорити, призначити на роботу та зібрати дохід.
        </p>
      </div>

      <NPCSystem />
    </div>
  );
}
