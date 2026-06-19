import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Hero,
  Artifact,
  Expedition,
  Region,
  Npc,
  Rarity,
  initialHeroes,
  initialArtifacts,
  initialRegions,
  initialNpcs,
} from './data';

const rarityRank: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

/** Real expedition timer (seconds) — compressed from the lore duration. */
export function expeditionSeconds(region: Region): number {
  return 15 + region.difficulty * 10;
}

/** Real restoration timer (seconds) — derived from rarity. */
export function restorationSeconds(artifact: Artifact): number {
  return 12 + rarityRank[artifact.rarity] * 9;
}

function nextArtifactId(): string {
  return `artifact-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function pickArtifact(region: Region): { name: string; rarity: Rarity } {
  const name = region.artifacts[Math.floor(Math.random() * region.artifacts.length)];
  const roll = Math.random();
  let rarity: Rarity = 'common';
  const diff = region.difficulty;
  if (roll > 0.92) rarity = 'legendary';
  else if (roll > 0.72) rarity = 'epic';
  else if (roll > 0.4) rarity = 'rare';
  // Harder regions skew rarer
  if (diff >= 5 && rarity === 'common') rarity = 'rare';
  if (diff >= 7 && rarity === 'rare') rarity = 'epic';
  return { name, rarity };
}

const rarityValue: Record<Rarity, number> = {
  common: 800,
  rare: 1500,
  epic: 3800,
  legendary: 8000,
};
const rarityPrestige: Record<Rarity, number> = {
  common: 8,
  rare: 18,
  epic: 40,
  legendary: 80,
};

export interface Toast {
  id: number;
  message: string;
  color: string;
}

interface GameState {
  academyLevel: number;
  reputation: number;
  karbovanets: number;
  museumVisitors: number;
  historicalPrestige: number;

  heroes: Hero[];
  artifacts: Artifact[];
  regions: Region[];
  expeditions: Expedition[];
  npcs: Npc[];

  expeditionSlots: number;
  lastTick: number;
  incomeBuffer: number;
  toasts: Toast[];

  // expeditions
  startExpedition: (regionId: string, heroIds: string[]) => boolean;
  collectExpedition: (expeditionId: string) => void;

  // lab
  beginRestoration: (artifactId: string) => void;
  sendToMuseum: (artifactId: string) => void;

  // npc
  toggleNpcWork: (npcId: string) => void;
  collectNpc: (npcId: string) => void;

  // economy helpers
  addKarbovanets: (amount: number) => void;
  spendKarbovanets: (amount: number) => boolean;
  pushToast: (message: string, color?: string) => void;
  dismissToast: (id: number) => void;

  tick: () => void;
}

let toastSeq = 1;

export const useExpeditionStore = create<GameState>()(
  persist(
    (set, get) => ({
      academyLevel: 3,
      reputation: 1250,
      karbovanets: 8500,
      museumVisitors: 342,
      historicalPrestige: 2840,

      heroes: initialHeroes,
      artifacts: initialArtifacts,
      regions: initialRegions,
      expeditions: [],
      npcs: initialNpcs,

      expeditionSlots: 3,
      lastTick: Date.now(),
      incomeBuffer: 0,
      toasts: [],

      pushToast: (message, color = '#FFC72C') =>
        set((s) => ({
          toasts: [...s.toasts, { id: toastSeq++, message, color }].slice(-4),
        })),
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      addKarbovanets: (amount) =>
        set((s) => ({ karbovanets: s.karbovanets + amount })),
      spendKarbovanets: (amount) => {
        if (get().karbovanets >= amount) {
          set((s) => ({ karbovanets: s.karbovanets - amount }));
          return true;
        }
        return false;
      },

      startExpedition: (regionId, heroIds) => {
        const s = get();
        const region = s.regions.find((r) => r.id === regionId);
        if (!region || !region.unlocked) return false;
        const activeCount = s.expeditions.filter((e) => !e.collected).length;
        if (activeCount >= s.expeditionSlots) {
          s.pushToast('Немає вільних слотів для експедиції', '#FF2A5F');
          return false;
        }
        if (heroIds.length === 0) {
          s.pushToast('Оберіть хоча б одного героя', '#FF2A5F');
          return false;
        }
        const teamHeroes = s.heroes.filter((h) => heroIds.includes(h.id));
        // Bonus to success based on team attributes
        const teamBonus = Math.min(
          25,
          Math.round(
            teamHeroes.reduce(
              (sum, h) => sum + (h.exploration + h.leadership) / 40,
              0,
            ),
          ),
        );
        const successChance = Math.min(98, region.successChance + teamBonus);
        const dur = expeditionSeconds(region);
        const now = Date.now();
        const { name, rarity } = pickArtifact(region);
        const reward = Math.round(
          (region.difficulty * 600 + 400) * (0.8 + Math.random() * 0.6),
        );
        const expedition: Expedition = {
          id: `exp-${now}-${Math.floor(Math.random() * 1000)}`,
          regionId,
          region: region.name,
          heroes: heroIds,
          startTime: now,
          endsAt: now + dur * 1000,
          duration: dur,
          successChance,
          status: 'traveling',
          rewardKarbovanets: reward,
          rewardReputation: region.difficulty * 30,
          artifactName: name,
          artifactRarity: rarity,
          collected: false,
        };
        set((st) => ({
          expeditions: [...st.expeditions, expedition],
          heroes: st.heroes.map((h) =>
            heroIds.includes(h.id)
              ? { ...h, assigned: true, assignedTo: region.name }
              : h,
          ),
        }));
        s.pushToast(`Експедицію до «${region.name}» розпочато`, '#00E5FF');
        return true;
      },

      collectExpedition: (expeditionId) => {
        const s = get();
        const exp = s.expeditions.find((e) => e.id === expeditionId);
        if (!exp || exp.collected || Date.now() < exp.endsAt) return;

        const success = Math.random() * 100 <= exp.successChance;
        const updates: Partial<GameState> = {};

        set((st) => {
          // free heroes + grant xp
          const heroes = st.heroes.map((h) => {
            if (!exp.heroes.includes(h.id)) return h;
            const gainedXp = success ? 200 + exp.successChance : 80;
            let level = h.level;
            let experience = h.experience + gainedXp;
            const need = (level + 1) * 200;
            if (experience >= need) {
              level += 1;
              experience -= need;
            }
            return { ...h, assigned: false, assignedTo: undefined, level, experience };
          });

          // unlock next region on success
          let regions = st.regions;
          if (success) {
            const idx = st.regions.findIndex((r) => r.id === exp.regionId);
            if (idx >= 0 && idx + 1 < st.regions.length && !st.regions[idx + 1].unlocked) {
              regions = st.regions.map((r, i) =>
                i === idx + 1 ? { ...r, unlocked: true } : r,
              );
            }
          }

          let artifacts = st.artifacts;
          if (success) {
            const newArtifact: Artifact = {
              id: nextArtifactId(),
              name: exp.artifactName,
              era: exp.region,
              rarity: exp.artifactRarity,
              status: 'damaged',
              description: `Знахідка з експедиції до регіону «${exp.region}». Потребує реставрації.`,
              restoreTime: 60 + rarityRank[exp.artifactRarity] * 60,
              value: rarityValue[exp.artifactRarity],
              prestigeBonus: rarityPrestige[exp.artifactRarity],
            };
            artifacts = [...st.artifacts, newArtifact];
          }

          return {
            heroes,
            regions,
            artifacts,
            karbovanets: st.karbovanets + (success ? exp.rewardKarbovanets : Math.round(exp.rewardKarbovanets * 0.2)),
            reputation: st.reputation + (success ? exp.rewardReputation : 0),
            expeditions: st.expeditions.map((e) =>
              e.id === expeditionId ? { ...e, collected: true, status: 'completed' } : e,
            ),
            ...updates,
          };
        });

        if (success) {
          s.pushToast(
            `Успіх! +${exp.rewardKarbovanets} карб., знайдено «${exp.artifactName}»`,
            '#FFC72C',
          );
        } else {
          s.pushToast('Експедиція зазнала невдачі. Героїв повернуто.', '#FF2A5F');
        }
      },

      beginRestoration: (artifactId) => {
        const s = get();
        const art = s.artifacts.find((a) => a.id === artifactId);
        if (!art || art.status !== 'damaged') return;
        const now = Date.now();
        const dur = restorationSeconds(art);
        set((st) => ({
          artifacts: st.artifacts.map((a) =>
            a.id === artifactId
              ? {
                  ...a,
                  status: 'restoring',
                  restoredBy: 'Команда лабораторії',
                  restoreStartedAt: now,
                  restoreEndsAt: now + dur * 1000,
                }
              : a,
          ),
        }));
        s.pushToast(`Реставрацію «${art.name}» розпочато`, '#FFC72C');
      },

      sendToMuseum: (artifactId) => {
        const s = get();
        const art = s.artifacts.find((a) => a.id === artifactId);
        if (!art || art.status !== 'restored') return;
        set((st) => ({
          artifacts: st.artifacts.map((a) =>
            a.id === artifactId ? { ...a, status: 'museum' } : a,
          ),
          historicalPrestige: st.historicalPrestige + art.prestigeBonus,
          reputation: st.reputation + Math.round(art.prestigeBonus / 2),
        }));
        s.pushToast(`«${art.name}» виставлено в музеї (+${art.prestigeBonus} престижу)`, '#9747FF');
      },

      toggleNpcWork: (npcId) => {
        const now = Date.now();
        set((st) => ({
          npcs: st.npcs.map((n) =>
            n.id === npcId
              ? { ...n, working: !n.working, lastCollectedAt: now }
              : n,
          ),
        }));
        const npc = get().npcs.find((n) => n.id === npcId);
        if (npc) {
          get().pushToast(
            npc.working ? `${npc.name} став(ла) до роботи` : `${npc.name} відпочиває`,
            '#00E5FF',
          );
        }
      },

      collectNpc: (npcId) => {
        const s = get();
        const npc = s.npcs.find((n) => n.id === npcId);
        if (!npc || !npc.working) return;
        const now = Date.now();
        const minutes = (now - npc.lastCollectedAt) / 60000;
        const karb = Math.floor(minutes * npc.ratePerMin);
        const rep = Math.floor(minutes * npc.repPerMin);
        if (karb <= 0 && rep <= 0) {
          s.pushToast('Поки нічого збирати', '#8B949E');
          return;
        }
        set((st) => ({
          karbovanets: st.karbovanets + karb,
          reputation: st.reputation + rep,
          npcs: st.npcs.map((n) =>
            n.id === npcId ? { ...n, lastCollectedAt: now } : n,
          ),
        }));
        s.pushToast(`${npc.name}: +${karb} карб., +${rep} репутації`, '#FFC72C');
      },

      tick: () => {
        const now = Date.now();
        set((st) => {
          const dt = Math.min(60, (now - st.lastTick) / 1000);

          // Museum passive income
          const museumArtifacts = st.artifacts.filter((a) => a.status === 'museum');
          const hourly = museumArtifacts.reduce((sum, a) => sum + a.value, 0) / 10;
          let incomeBuffer = st.incomeBuffer + (hourly / 3600) * dt;
          let karbovanets = st.karbovanets;
          if (incomeBuffer >= 1) {
            const whole = Math.floor(incomeBuffer);
            karbovanets += whole;
            incomeBuffer -= whole;
          }

          // Auto-complete restorations
          const artifacts = st.artifacts.map((a) =>
            a.status === 'restoring' && a.restoreEndsAt && now >= a.restoreEndsAt
              ? { ...a, status: 'restored' as const }
              : a,
          );

          // Update expedition statuses (visual phases)
          const expeditions = st.expeditions.map((e) => {
            if (e.collected) return e;
            const elapsed = (now - e.startTime) / 1000;
            const ratio = elapsed / e.duration;
            let status: Expedition['status'] = 'traveling';
            if (now >= e.endsAt) status = 'completed';
            else if (ratio > 0.66) status = 'returning';
            else if (ratio > 0.25) status = 'excavating';
            return { ...e, status };
          });

          // Animate NPC positions
          const npcs = st.npcs.map((n) => {
            let x = n.x + n.direction * 0.4;
            let direction = n.direction;
            if (x > 90) {
              x = 90;
              direction = -1;
            } else if (x < 10) {
              x = 10;
              direction = 1;
            }
            return { ...n, x, direction };
          });

          return {
            lastTick: now,
            incomeBuffer,
            karbovanets,
            artifacts,
            expeditions,
            npcs,
          };
        });
      },
    }),
    {
      name: 'expedition_state',
      version: 1,
      partialize: (s) => ({
        academyLevel: s.academyLevel,
        reputation: s.reputation,
        karbovanets: s.karbovanets,
        museumVisitors: s.museumVisitors,
        historicalPrestige: s.historicalPrestige,
        heroes: s.heroes,
        artifacts: s.artifacts,
        regions: s.regions,
        expeditions: s.expeditions,
        npcs: s.npcs,
        expeditionSlots: s.expeditionSlots,
        lastTick: s.lastTick,
        incomeBuffer: s.incomeBuffer,
      }),
    },
  ),
);
