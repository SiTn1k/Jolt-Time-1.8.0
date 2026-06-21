import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import {
  FlaskConical,
  Shield,
  BookOpen,
  Hammer,
  User,
  Sword,
  GraduationCap,
  X,
  MessageCircle,
  Coins,
  Briefcase,
  Pause,
  Users,
} from 'lucide-react';
import { useExpeditionStore } from '../store';
import { npcColors, type Npc, type NpcRole } from '../data';
import { Button } from '../ui';
import { useTranslation } from '../../i18n';

const roleIcons: Record<NpcRole, typeof Shield> = {
  researcher: FlaskConical,
  guard: GraduationCap,
  archivist: BookOpen,
  restorer: Hammer,
  visitor: User,
  cossack: Sword,
};

function NpcAvatar({ npc, onClick }: { npc: Npc; onClick: () => void }) {
  const Icon = roleIcons[npc.role];
  const color = npcColors[npc.role];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
      style={{ 
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center relative"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
        {npc.working && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#161B22]"
          />
        )}
      </span>
      <span
        className="text-xs font-medium truncate max-w-[70px] text-center"
        style={{ color: '#E6EDF3' }}
      >
        {npc.name.split(' ')[0]}
      </span>
    </button>
  );
}

export function NPCSystem() {
  const { t } = useTranslation();
  const npcs = useExpeditionStore((s) => s.npcs);
  const toggleNpcWork = useExpeditionStore((s) => s.toggleNpcWork);
  const collectNpc = useExpeditionStore((s) => s.collectNpc);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [line, setLine] = useState<string>('');

  const selected = npcs.find((n) => n.id === selectedId) || null;
  const color = selected ? npcColors[selected.role] : '#FFC72C';
  const Icon = selected ? roleIcons[selected.role] : User;

  const workingCount = npcs.filter(n => n.working).length;
  const totalCount = npcs.length;

  const open = (npc: Npc) => {
    setSelectedId(npc.id);
    setLine(npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)]);
  };

  const talk = () => {
    if (!selected) return;
    const others = selected.dialogues.filter((d) => d !== line);
    const pool = others.length ? others : selected.dialogues;
    setLine(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div className="mt-4">
      {/* Header Stats */}
      <div 
        className="rounded-2xl p-4 mb-4"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,199,44,0.15)' }}
          >
            <Users className="w-5 h-5" style={{ color: '#FFC72C' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: '#E6EDF3' }}>
              {t('expedition.npc_title')}
            </div>
            <div className="text-xs text-[#8B949E]">
              {t('npc.staff')}: {totalCount} · {t('npc.working')}: {workingCount} · {t('npc.free')}: {totalCount - workingCount}
            </div>
          </div>
        </div>
      </div>

      {/* NPC Avatars Grid - Instagram Stories style */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {npcs.map((npc) => (
          <NpcAvatar key={npc.id} npc={npc} onClick={() => open(npc)} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              className="w-full max-w-md bg-[#161B22] rounded-[28px] p-5"
              style={{ borderTop: `3px solid ${color}40` }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-[#30363D] mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate" style={{ color: '#E6EDF3' }}>
                    {selected.name}
                  </h3>
                  <p className="text-sm text-[#8B949E]">{selected.roleLabel}</p>
                </div>
                <button 
                  onClick={() => setSelectedId(null)} 
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-[#21262D]" aria-label="Close"
                >
                  <X className="w-4 h-4 text-[#8B949E]" />
                </button>
              </div>

              {/* Dialogue */}
              <div 
                className="rounded-2xl p-4 mb-5"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-sm leading-relaxed text-[#E6EDF3]">
                  «{line}»
                </p>
              </div>

              {/* Stats */}
              <div 
                className="rounded-2xl p-4 mb-5 grid grid-cols-2 gap-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#FFC72C]" />
                  <span className="text-sm text-[#8B949E]">{t('npc.income')}</span>
                  <span className="text-sm font-medium text-[#FFC72C]">+{selected.ratePerMin}/хв</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF2A5F]" />
                  <span className="text-sm text-[#8B949E]">{t('npc.reputation')}</span>
                  <span className="text-sm font-medium text-[#FF2A5F]">+{selected.repPerMin}/хв</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={talk}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  style={{ 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: '#E6EDF3',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('expedition.npc_talk')}
                </Button>
                <Button
                  onClick={() => toggleNpcWork(selected.id)}
                  className="flex-1 h-12 rounded-xl"
                  style={{
                    backgroundColor: selected.working ? '#21262D' : '#10B981',
                    color: selected.working ? '#E6EDF3' : '#fff',
                  }}
                >
                  {selected.working ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      {t('expedition.npc_stop')}
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-4 h-4 mr-2" />
                      {t('expedition.npc_assign')}
                    </>
                  )}
                </Button>
              </div>

              {selected.working && (
                <Button
                  onClick={() => collectNpc(selected.id)}
                  className="w-full h-12 rounded-xl mt-3"
                  style={{ backgroundColor: '#FFC72C', color: '#0D1117' }}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  {t('expedition.npc_collect')}
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
