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
  buildings,
  getLevelFromXP,
  ARTIFACT_FRAGMENT_COSTS,

} from './data';
import {
  MuseumState,
  MuseumUpgradeState,
  museumUpgrades,
  museumCollections,
  initialMuseumState,
  calculateMuseumIncome,
  calculateDailyVisitors,
  getUpgradeCost,
  MUSEUM_ACHIEVEMENTS,
  calculateCollectionProgress,
  isCollectionComplete,
  calcTotalMuseumBonus,
} from './museumData';
import {
  StoryProgress,
  initialStoryProgress,
  storyQuests,
  storyNpcs,
  RelationshipLevel,
  RELATIONSHIP_REWARDS,
  TRUST_THRESHOLDS,
  STORY_ARCS,
  checkArcRequirements,
  calcNpcTrustBonuses,
} from './storyData';
import {
  QUEST_REWARD_MULTIPLIER,
  EXPEDITION_REWARD_MULTIPLIER,
  BUILDING_COST_MULTIPLIER,
  ARTIFACT_PRESTIGE_MULTIPLIER,
} from './balanceConfig';
import { academySync } from './expeditionSync';

const rarityRank: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

/** Real expedition timer (seconds) — SPEEDED UP for first prestige */
export function expeditionSeconds(region: Region): number {
  // Faster for P0: 10 + difficulty * 5 (was 15 + difficulty * 10)
  return 10 + region.difficulty * 5;
}

/** Real restoration timer (seconds) — derived from rarity. */
export function restorationSeconds(artifact: Artifact): number {
  // Faster restoration: 8 + rarity * 6 (was 12 + rarity * 9)
  return 8 + rarityRank[artifact.rarity] * 6;
}

function pickArtifact(region: Region, artifactBonus: number = 0): { name: string; rarity: Rarity } {
  const name = region.artifacts[Math.floor(Math.random() * region.artifacts.length)];
  // Apply artifact bonus to rarity chance (each % shifts the roll threshold)
  const bonusShift = artifactBonus / 100;
  const roll = Math.random() - bonusShift;
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

// Tutorial state interface
export interface TutorialState {
  completed: boolean;
  skipped: boolean;
  currentStep: number;
}

interface GameState {
  academyLevel: number;
  academyXp: number;
  reputation: number;
  karbovanets: number;
  museumVisitors: number;
  historicalPrestige: number;

  // Premium currency (Telegram Stars)
  starsBalance: number;
  expeditionBoosts: number;
  premiumTickets: number;
  ownedCosmetics: string[];
  ownedBadges: string[];
  activeEffects: {
    xpBoostEnd: number;
    incomeBoostEnd: number;
    reputationBoostEnd: number;
  };
  adsWatched: number;
  totalStarsSpent: number;

  heroes: Hero[];
  artifacts: Artifact[];
  regions: Region[];
  expeditions: Expedition[];
  npcs: Npc[];

  // Building state
  buildingLevels: Record<string, number>;
  buildingUpgradeEndTimes: Record<string, number>;

  expeditionSlots: number;
  lastTick: number;
  incomeBuffer: number;
  toasts: Toast[];

  // Museum state
  museumState: MuseumState;
  
  // Story/Quest state
  storyState: StoryProgress;

  // Fragment inventory state
  heroFragments: Record<string, number>;  // heroId -> fragment count
  artifactFragments: Record<string, number>;  // rarity -> fragment count

  // Tutorial state
  tutorialState: TutorialState;
  nextTutorialStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  startTutorial: () => void;

  // expeditions
  startExpedition: (regionId: string, heroIds: string[]) => boolean;
  speedUpExpedition: (expeditionId: string) => void;
  collectExpedition: (expeditionId: string) => void;

  // lab
  beginRestoration: (artifactId: string) => void;
  sendToMuseum: (artifactId: string) => void;

  // npc
  toggleNpcWork: (npcId: string) => void;
  collectNpc: (npcId: string) => void;

  // museum
  placeArtifactInExhibition: (artifactId: string, slotIndex: number) => boolean;
  removeArtifactFromExhibition: (slotIndex: number) => void;
  collectMuseumIncome: () => void;
  purchaseMuseumUpgrade: (upgradeId: string) => boolean;
  expandExhibitionSlots: () => boolean;
  checkAndUnlockAchievements: (context: { visitors?: number; artifacts?: number; collections?: number; exhibitions?: number; events?: number }) => void;
  joinEvent: (eventId: string) => void;

  // buildings
  upgradeBuilding: (buildingId: string) => boolean;
  collectBuildingUpgrade: (buildingId: string) => void;
  getBuildingBonus: (buildingId: string) => number;

  // story/quests
  interactWithNpc: (npcId: string) => void;
  startQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  updateQuestObjective: (objectiveKey: string, increment: number) => void;
  isQuestComplete: (questId: string) => boolean;
  claimNpcReward: (npcId: string, rewardKey: string) => void;
  checkArcRequirements: () => void;
  unlockArc: (arcNumber: number) => boolean;

  // economy helpers
  addKarbovanets: (amount: number) => void;
  spendKarbovanets: (amount: number) => boolean;
  addHeroXP: (heroId: string, amount: number) => boolean;
  addHeroFragment: (heroId: string, amount: number) => void;
  addArtifactFragment: (rarity: string, amount: number) => void;
  getHeroFragmentCount: (heroId: string) => number;
  checkHeroUnlockable: (heroId: string) => boolean;
  assembleArtifact: (rarity: Rarity) => { success: boolean; message: string; artifactId?: string };
  checkCollectionCompletion: () => { completed: string[]; updated: boolean };
  pushToast: (message: string, color?: string) => void;
  dismissToast: (id: number) => void;

  tick: () => void;
}

let toastSeq = 1;

export const useExpeditionStore = create<GameState>()(
  persist(
    (set, get) => ({
      academyLevel: 3,
      academyXp: 0,
      reputation: 1250,
      karbovanets: 8500,
      museumVisitors: 342,
      historicalPrestige: 2840,

      heroes: initialHeroes,
      artifacts: initialArtifacts,
      regions: initialRegions,
      expeditions: [],
      npcs: initialNpcs,

      // Building state
      buildingLevels: buildings.reduce((acc, b) => ({ ...acc, [b.id]: b.level }), {}),
      buildingUpgradeEndTimes: {},

      expeditionSlots: 3,
      lastTick: Date.now(),
      incomeBuffer: 0,
      toasts: [],

      // Museum state
      museumState: initialMuseumState,
      
      // Story/Quest state
      storyState: initialStoryProgress,

      // Fragment inventory state
      heroFragments: {},
      artifactFragments: { common: 0, rare: 0, epic: 0, legendary: 0 },

      // Anti-spam tracking for quest actions
      _lastQuestAction: 0,
      _lastObjectiveKey: '',

      // Tutorial state
      tutorialState: {
        completed: false,
        skipped: false,
        currentStep: 0,
      },

      nextTutorialStep: () =>
        set((state) => {
          const nextStep = state.tutorialState.currentStep + 1;
          // 9 steps total (0-8), after step 8, mark as completed
          if (nextStep >= 9) {
            return {
              tutorialState: {
                completed: true,
                skipped: false,
                currentStep: 9,
              },
            };
          }
          return {
            tutorialState: {
              ...state.tutorialState,
              currentStep: nextStep,
            },
          };
        }),

      skipTutorial: () =>
        set(() => ({
          tutorialState: {
            completed: true,
            skipped: true,
            currentStep: 9,
          },
        })),

      completeTutorial: () =>
        set(() => ({
          tutorialState: {
            completed: true,
            skipped: false,
            currentStep: 9,
          },
        })),

      startTutorial: () =>
        set(() => ({
          tutorialState: {
            completed: false,
            skipped: false,
            currentStep: 0,
          },
        })),

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
      
      // Hero XP action
      addHeroXP: (heroId, amount) => {
        if (amount <= 0) return false;
        
        set((state) => {
          const heroIndex = state.heroes.findIndex((h) => h.id === heroId);
          if (heroIndex < 0) return state;
          
          const hero = state.heroes[heroIndex];
          const newXP = hero.experience + amount;
          const newLevel = getLevelFromXP(newXP);
          
          // Check if leveled up
          if (newLevel > hero.level) {
            const toastMessage = ` Герой ${hero.name} досяг рівня ${newLevel}!`;
            setTimeout(() => get().pushToast(toastMessage, '#FFC72C'), 100);
          }
          
          const updatedHeroes = [...state.heroes];
          updatedHeroes[heroIndex] = {
            ...hero,
            experience: newXP,
            level: newLevel,
          };
          
          return { heroes: updatedHeroes };
        });
        
        return true;
      },
      
      // Hero fragment actions
      addHeroFragment: (heroId, amount) => {
        if (amount <= 0) return;
        
        set((state) => {
          const currentCount = state.heroFragments[heroId] || 0;
          const newCount = currentCount + amount;
          
          // Check if hero becomes unlockable (need 50 fragments for now)
          const HERO_FRAGMENT_THRESHOLD = 50;
          if (newCount >= HERO_FRAGMENT_THRESHOLD) {
            const hero = state.heroes.find(h => h.id === heroId);
            if (hero && !hero.unlocked && hero.unlockCondition?.type === 'level') {
              // Unlock the hero
              const updatedHeroes = state.heroes.map(h => 
                h.id === heroId ? { ...h, unlocked: true } : h
              );
              setTimeout(() => get().pushToast(`Герой ${hero.name} розблоковано!`, '#FFC72C'), 100);
              return { 
                heroes: updatedHeroes,
                heroFragments: { ...state.heroFragments, [heroId]: newCount - HERO_FRAGMENT_THRESHOLD }
              };
            }
          }
          
          return { heroFragments: { ...state.heroFragments, [heroId]: newCount } };
        });
      },
      
      addArtifactFragment: (rarity, amount) => {
        if (amount <= 0) return;
        
        set((state) => {
          const currentCount = state.artifactFragments[rarity] || 0;
          return { artifactFragments: { ...state.artifactFragments, [rarity]: currentCount + amount } };
        });
      },
      
      getHeroFragmentCount: (heroId) => {
        return get().heroFragments[heroId] || 0;
      },
      
      checkHeroUnlockable: (heroId) => {
        const state = get();
        const hero = state.heroes.find(h => h.id === heroId);
        if (!hero) return false;
        if (hero.unlocked) return false;
        
        const fragmentCount = state.heroFragments[heroId] || 0;
        const HERO_FRAGMENT_THRESHOLD = 50;
        
        return fragmentCount >= HERO_FRAGMENT_THRESHOLD;
      },
      
      // Artifact Assembly
      assembleArtifact: (rarity) => {
        const state = get();
        const cost = ARTIFACT_FRAGMENT_COSTS[rarity];
        const currentFragments = state.artifactFragments[rarity] || 0;
        
        // Check if enough fragments
        if (currentFragments < cost) {
          return { 
            success: false, 
            message: `Потрібно ${cost} фрагментів (є ${currentFragments})` 
          };
        }
        
        // Find available artifacts of this rarity
        // Generate from artifact pools based on era/region
        const artifactPools: Record<Rarity, Array<{ name: string; era: string }>> = {
          common: [
            { name: 'Кам\'яна знаряддя', era: 'Кам\'яна доба' },
            { name: 'Глиняний посуд', era: 'Неоліт' },
            { name: 'Бронзовий наконечник', era: 'Бронзова доба' },
            { name: 'Керамічний уламок', era: 'Трипільська культура' },
            { name: 'Кремнієвий скребок', era: 'Палеоліт' },
          ],
          rare: [
            { name: 'Трипільська кераміка', era: 'Трипільська культура' },
            { name: 'Скіфський меч', era: 'Скіфія' },
            { name: 'Галоцький хрест', era: 'Галицьке князівство' },
            { name: 'Руська пектораль', era: 'Київська Русь' },
          ],
          epic: [
            { name: 'Грецька амфора', era: 'Грецькі колонії' },
            { name: 'Козацька булава', era: 'Запорозька Січ' },
            { name: 'Золота підвіска', era: 'Чернігівська земля' },
          ],
          legendary: [
            { name: 'Печатка Київської Русі', era: 'Київська Русь' },
            { name: 'Корона Данила Галицького', era: 'Галицько-Волинське князівство' },
            { name: 'Меч Івана Мазепи', era: 'Козацька доба' },
          ],
        };
        
        const pool = artifactPools[rarity];
        if (!pool || pool.length === 0) {
          return { success: false, message: 'Помилка вибору артефакту' };
        }
        
        // Get names of non-museum artifacts already owned
        const ownedNames = state.artifacts
          .filter(a => a.status !== 'museum')
          .map(a => a.name);
        
        // Filter pool to only unowned artifacts
        const availableArtifacts = pool.filter(a => !ownedNames.includes(a.name));
        
        // If all artifacts of this rarity are owned, give bonus fragments
        if (availableArtifacts.length === 0) {
          const bonus = Math.floor(cost * 0.3);
          set((st) => ({
            artifactFragments: { 
              ...st.artifactFragments, 
              [rarity]: st.artifactFragments[rarity] - cost + bonus 
            },
          }));
          return { 
            success: true, 
            message: `Всі ${rarity} артефакти вже є! +${bonus} фрагментів` 
          };
        }
        
        // Pick random artifact from available pool
        const template = availableArtifacts[Math.floor(Math.random() * availableArtifacts.length)];
        
        // Generate unique ID
        const artifactId = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create new artifact
        const newArtifact: Artifact = {
          id: artifactId,
          name: template.name,
          era: template.era,
          rarity: rarity,
          status: 'damaged',
          description: `Артефакт з епохи ${template.era}. Потребує реставрації.`,
          restoreTime: 60 + rarityRank[rarity] * 60,
          value: rarityValue[rarity],
          prestigeBonus: rarityPrestige[rarity],
        };
        
        // Deduct fragments
        const newFragments = currentFragments - cost;
        
        set((st) => ({
          artifacts: [...st.artifacts, newArtifact],
          artifactFragments: { ...st.artifactFragments, [rarity]: newFragments },
        }));
        
        return { 
          success: true, 
          message: `Створено "${template.name}"!`,
          artifactId: artifactId
        };
      },
      
      // Collection Completion Check
      checkCollectionCompletion: () => {
        const state = get();
        const museumState = state.museumState;
        const completed: string[] = [...(museumState.completedCollections || [])];
        let updated = false;
        
        // Get all artifacts (both in museum and in inventory)
        const allArtifacts = state.artifacts;
        const museumArtifacts = allArtifacts.filter(a => a.status === 'museum');
        
        // Collect rewards to apply
        let repReward = 0;
        let carbReward = 0;
        
        // Check each collection
        for (const collection of museumCollections) {
          // Skip if already completed
          if (completed.includes(collection.id)) continue;
          
          // Calculate progress using era matching
          const progress = calculateCollectionProgress(collection, museumArtifacts);
          
          if (isCollectionComplete(collection, progress)) {
            // Mark as completed
            completed.push(collection.id);
            updated = true;
            
            // Accumulate collection rewards
            repReward += collection.bonus.reputationBonus || 0;
            carbReward += collection.bonus.karbovanetsBonus || 0;
            
            // Show toast for collection completion
            setTimeout(() => {
              get().pushToast(
                `🏛️ Колекція "${collection.icon} ${collection.era}" завершена!`,
                '#FFC72C'
              );
            }, 100);
          }
        }
        
        // Apply all rewards in a single set() call
        if (updated) {
          // Recalculate progress for all collections
          const newProgress: Record<string, number> = {};
          for (const collection of museumCollections) {
            newProgress[collection.id] = calculateCollectionProgress(collection, museumArtifacts);
          }
          
          set((st) => ({
            reputation: st.reputation + repReward,
            karbovanets: st.karbovanets + carbReward,
            museumState: {
              ...st.museumState,
              completedCollections: completed,
              collectionProgress: newProgress,
            },
          }));
        }
        
        // If collections were completed, check if any arcs are now available
        if (updated && completed.length > 0) {
          get().checkArcRequirements();
        }
        
        return { completed, updated };
      },
      
      // Story/Quest actions
      interactWithNpc: (npcId) => {
        const state = get();
        const current = state.storyState.npcRelationships[npcId] || {
          npcId,
          relationshipLevel: 1 as RelationshipLevel,
          trustPoints: 0,
          completedQuests: [],
          lastInteraction: Date.now(),
        };
        
        // Daily interaction limit check (24 hours cooldown)
        const DAY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        if (current.lastInteraction > 0 && (now - current.lastInteraction) < DAY_MS) {
          const timeLeft = Math.ceil((DAY_MS - (now - current.lastInteraction)) / (60 * 60 * 1000));
          get().pushToast(`Занадто часто! Почекайте ${timeLeft} год.`, '#FF2A5F');
          return;
        }
        
        const oldLevel = current.relationshipLevel;
        const newTrust = Math.min(500, current.trustPoints + 5);
        
        // Calculate new level using TRUST_THRESHOLDS
        let newLevel: RelationshipLevel = 1;
        if (newTrust >= TRUST_THRESHOLDS[6]) newLevel = 6;
        else if (newTrust >= TRUST_THRESHOLDS[5]) newLevel = 5;
        else if (newTrust >= TRUST_THRESHOLDS[4]) newLevel = 4;
        else if (newTrust >= TRUST_THRESHOLDS[3]) newLevel = 3;
        else if (newTrust >= TRUST_THRESHOLDS[2]) newLevel = 2;
        
        // Collect rewards for level up
        let repReward = 0;
        let carbReward = 0;
        const fragReward: { rarity: string; amount: number }[] = [];
        let heroFragReward: { heroId: string; amount: number } | null = null;
        
        if (newLevel > oldLevel) {
          for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
            const reward = RELATIONSHIP_REWARDS[lvl as RelationshipLevel];
            if (!reward) continue;
            if (reward.karbovanets) carbReward += reward.karbovanets;
            if (reward.reputation) repReward += reward.reputation;
            if (reward.artifactFragment) fragReward.push(reward.artifactFragment);
            if (reward.heroFragment) heroFragReward = reward.heroFragment;
          }
        }
        
        // Apply all changes in single atomic set()
        set((st) => {
          const newFragments = { ...st.artifactFragments };
          for (const frag of fragReward) {
            const key = frag.rarity as keyof typeof st.artifactFragments;
            newFragments[key] = (newFragments[key] || 0) + frag.amount;
          }
          
          // Handle hero fragment reward - award to random locked hero
          const newHeroes = [...st.heroes];
          if (heroFragReward) {
            const lockedHeroes = newHeroes.filter(h => !h.unlocked);
            const targetHeroes = lockedHeroes.length > 0 ? lockedHeroes : newHeroes;
            if (targetHeroes.length > 0) {
              const randomHero = targetHeroes[Math.floor(Math.random() * targetHeroes.length)];
              randomHero.fragments = (randomHero.fragments || 0) + heroFragReward.amount;
            }
          }
          
          return {
            storyState: {
              ...st.storyState,
              npcRelationships: {
                ...st.storyState.npcRelationships,
                [npcId]: {
                  ...current,
                  trustPoints: newTrust,
                  relationshipLevel: newLevel,
                  lastInteraction: now,
                },
              },
            },
            karbovanets: st.karbovanets + carbReward,
            reputation: st.reputation + repReward,
            artifactFragments: newFragments,
            heroes: newHeroes,
          };
        });
        
        if (newLevel > oldLevel) {
          get().pushToast(`Рівень довіри: ${newLevel}!`, '#FFC72C');
          // Check if any arcs are now available after relationship level up
          get().checkArcRequirements();
        }
        
        // Track NPC interaction quest objective
        get().updateQuestObjective(`speak_${npcId}`, 1);
      },
      
      startQuest: (questId) => {
        set((state) => {
          // Check if already active
          if (state.storyState.activeQuests.some(qp => qp.questId === questId)) return state;
          
          // Create new quest progress
          const questProgress = {
            questId,
            objectives: {} as Record<string, number>,
            startedAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          return {
            storyState: {
              ...state.storyState,
              activeQuests: [...state.storyState.activeQuests, questProgress],
            },
          };
        });
      },
      
      completeQuest: (questId) => {
        const state = get();
        
        // Anti-spam: prevent duplicate completion within 1 second
        const now = Date.now();
        if (now - state._lastQuestAction < 1000) {
          console.warn('Quest completion spam detected, ignoring');
          return;
        }
        if (state.storyState.completedQuests.includes(questId)) {
          console.warn('Quest already completed:', questId);
          return;
        }

        // Find quest data to get rewards
        const quest = storyQuests.find(q => q.id === questId);
        if (!quest) return;

        // Grant rewards with QUEST_REWARD_MULTIPLIER applied
        quest.rewards.forEach(reward => {
          const amount = Math.floor(reward.amount * QUEST_REWARD_MULTIPLIER);
          switch (reward.type) {
            case 'karbovanets':
              get().addKarbovanets(amount);
              break;
            case 'xp':
              // Grant XP to first available hero (lowest level if multiple available)
              {
                const heroes = get().heroes;
                if (heroes.length > 0) {
                  // Find first unassigned hero, or just use first hero
                  const activeHero = heroes.find(h => !h.assigned) || heroes[0];
                  get().addHeroXP(activeHero.id, amount);
                }
              }
              break;
            case 'academy_xp':
              // Grant Academy XP - contributes to Academy level progression
              set(st => ({ academyXp: (st.academyXp || 0) + amount }));
              get().pushToast(`+${amount} досвіду академії`, '#FFC72C');
              break;
            case 'reputation':
              set(st => ({ reputation: st.reputation + amount }));
              // Check if any arcs are now available
              get().checkArcRequirements();
              break;
            case 'artifact':
              // Grant artifact by itemId - find in initial artifacts and add to inventory
              {
                const artifactId = reward.itemId;
                if (artifactId) {
                  const artifactTemplates = initialArtifacts;
                  const template = artifactTemplates.find(a => a.id === artifactId);
                  if (template) {
                    // Create a new artifact instance with 'damaged' status
                    const newArtifact: Artifact = {
                      ...template,
                      id: `${artifactId}-${Date.now()}`,
                      status: 'damaged',
                    };
                    set(st => ({ artifacts: [...st.artifacts, newArtifact] }));
                    get().pushToast(`Артефакт "${template.name}" отримано!`, '#9747FF');
                  } else {
                    console.warn('Artifact template not found:', artifactId);
                  }
                }
              }
              break;
            case 'hero_fragment':
              // Grant hero fragment to the specified hero
              if (reward.itemId) {
                get().addHeroFragment(reward.itemId, amount);
                get().pushToast(`+${amount} фрагмент героя`, '#FFC72C');
              }
              break;
          }
        });

        // Remove from active and add to completed
        set((st) => {
          const questProgress = st.storyState.activeQuests.find(qp => qp.questId === questId);
          if (!questProgress) return st;
          
          return {
            ...st,
            _lastQuestAction: now,
            storyState: {
              ...st.storyState,
              activeQuests: st.storyState.activeQuests.filter(qp => qp.questId !== questId),
              completedQuests: [...st.storyState.completedQuests, questId],
            },
          };
        });

        // Show completion toast
        get().pushToast(`Квест "${quest.titleKey}" виконано!`, '#10B981');
        
        // Check if any arcs are now available
        get().checkArcRequirements();
      },

      updateQuestObjective: (objectiveKey, increment) => {
        const state = get();
        
        // Anti-spam: prevent duplicate calls for same objective within 500ms
        const now = Date.now();
        if (now - state._lastQuestAction < 500 && state._lastObjectiveKey === objectiveKey) {
          return;
        }
        
        set((st) => {
          // Update objective progress in all active quests
          const updatedActiveQuests = st.storyState.activeQuests.map(qp => ({
            ...qp,
            objectives: {
              ...qp.objectives,
              [objectiveKey]: (qp.objectives[objectiveKey] || 0) + increment,
            },
            updatedAt: now,
          }));
          
          return {
            ...st,
            _lastQuestAction: now,
            _lastObjectiveKey: objectiveKey,
            storyState: {
              ...st.storyState,
              activeQuests: updatedActiveQuests,
            },
          };
        });
      },

      isQuestComplete: (questId) => {
        const state = get();
        const quest = storyQuests.find((q) => q.id === questId);
        if (!quest) return false;
        
        const questProgress = state.storyState.activeQuests.find(qp => qp.questId === questId);
        if (!questProgress) return false;
        
        return quest.objectives.every((obj) => {
          const key = `${obj.type}_${obj.target}`;
          const current = questProgress.objectives[key] || 0;
          return current >= obj.count;
        });
      },

      claimNpcReward: (npcId, rewardKey) => {
        const state = get();
        const relationship = state.storyState.npcRelationships[npcId];
        if (!relationship) return;

        const npc = storyNpcs.find(n => n.id === npcId);
        if (!npc) return;

        const reward = npc.unlocksAtRelationship[relationship.relationshipLevel as RelationshipLevel];
        if (reward !== rewardKey) return;

        // Parse reward and grant it
        if (rewardKey.startsWith('dialogue_')) {
          // Dialogue unlocked - just show toast
          state.pushToast(`Новий діалог відкрито!`, '#00E5FF');
        } else if (rewardKey.startsWith('quest-')) {
          // Quest unlocked - start it
          state.startQuest(rewardKey);
          state.pushToast(`Новий квест доступний!`, '#10B981');
        } else if (rewardKey.startsWith('hero-')) {
          // Hero unlock - grant hero XP to unlock
          const heroId = rewardKey.replace('hero-', '');
          state.pushToast(`Герой ${heroId} розблоковано!`, '#FFC72C');
        } else if (rewardKey.startsWith('artifact-')) {
          // Artifact unlock - add to inventory
          state.pushToast(`Артефакт ${rewardKey.replace('artifact-', '')} відкрито!`, '#9747FF');
        } else if (rewardKey.startsWith('region-')) {
          // Region unlock - unlock in game
          state.pushToast(`Новий регіон ${rewardKey.replace('region-', '')} відкрито!`, '#FF2A5F');
        }
      },

      // Arc system
      checkArcRequirements: () => {
        const state = get();
        const { unlockedArcs, completedArcs, completedQuests, npcRelationships } = state.storyState;
        
        // Build current state for requirement checking
        const currentState = {
          reputation: state.reputation,
          historicalPrestige: state.historicalPrestige,
          completedQuests,
          completedArcs,
          npcRelationships,
          museumCompletedCollections: state.museumState.completedCollections?.length || 0,
          totalArtifacts: state.artifacts.length,
        };
        
        // Check each arc that's not yet unlocked
        let newlyUnlocked = false;
        for (const arc of STORY_ARCS) {
          if (unlockedArcs.includes(arc.arcNumber)) continue;
          
          const { met } = checkArcRequirements(arc, currentState);
          if (met) {
            // Unlock this arc
            set((st) => ({
              storyState: {
                ...st.storyState,
                unlockedArcs: [...st.storyState.unlockedArcs, arc.arcNumber],
                currentArc: arc.arcNumber,
              },
            }));
            state.pushToast(`Нова сюжетна арка відкрита: ${arc.icon} ${arc.name}!`, '#FFC72C');
            newlyUnlocked = true;
          }
        }
        
        // If we unlocked something, check again for cascading unlocks
        if (newlyUnlocked) {
          // Use setTimeout to avoid potential infinite loops
          setTimeout(() => get().checkArcRequirements(), 100);
        }
      },

      unlockArc: (arcNumber) => {
        const state = get();
        
        // Check if already unlocked
        if (state.storyState.unlockedArcs.includes(arcNumber)) {
          console.warn('Arc already unlocked:', arcNumber);
          return false;
        }
        
        // Find arc metadata
        const arc = STORY_ARCS.find(a => a.arcNumber === arcNumber);
        if (!arc) {
          console.warn('Arc not found:', arcNumber);
          return false;
        }
        
        // Build current state for requirement checking
        const currentState = {
          reputation: state.reputation,
          historicalPrestige: state.historicalPrestige,
          completedQuests: state.storyState.completedQuests,
          completedArcs: state.storyState.completedArcs,
          npcRelationships: state.storyState.npcRelationships,
          museumCompletedCollections: state.museumState.completedCollections?.length || 0,
          totalArtifacts: state.artifacts.length,
        };
        
        // Check requirements
        const { met, missing } = checkArcRequirements(arc, currentState);
        if (!met) {
          console.warn('Arc requirements not met:', missing);
          return false;
        }
        
        // Unlock the arc
        set((st) => ({
          storyState: {
            ...st.storyState,
            unlockedArcs: [...st.storyState.unlockedArcs, arcNumber],
            currentArc: arcNumber,
          },
        }));
        
        state.pushToast(`Нова сюжетна арка відкрита: ${arc.icon} ${arc.name}!`, '#FFC72C');
        return true;
      },

      // Museum actions
      // Reset museum state on prestige - keeps artifacts but resets all museum progress
      resetMuseumState: () => {
        set({
          museumState: {
            ...initialMuseumState,
            // Reset all museum progress to starting state
            exhibitions: Array.from({ length: 2 }, (_, i) => ({ slotIndex: i, artifactId: null, placedAt: 0 })),
            maxExhibitionSlots: 2,
            upgrades: { marketing: 0, security: 0, exhibition_hall: 0, restoration_wing: 0 },
            completedCollections: [],
            collectionProgress: {},
            achievements: [],
            legendaryExhibitions: [],
            eventParticipation: [],
          },
          // Reset expeditions on prestige
          expeditions: [],
          expeditionSlots: 1,
          // Keep heroes but reset their expedition assignment
          heroes: get().heroes.map(h => ({ ...h, expeditionId: undefined, status: 'idle' as const })),
          // Reset building progress
          buildingLevels: buildings.reduce((acc, b) => ({ ...acc, [b.id]: 0 }), {}),
          buildingUpgradeEndTimes: {},
          // Reset income
          incomeBuffer: 0,
          // Reset museum visitors
          museumVisitors: 0,
        });
      },

      placeArtifactInExhibition: (artifactId, slotIndex) => {
        const s = get();
        const museumState = s.museumState;
        
        // Check if slot exists
        if (slotIndex < 0 || slotIndex >= museumState.exhibitions.length) {
          s.pushToast('Невірний слот', '#FF2A5F');
          return false;
        }
        
        // Check if slot is empty
        const slot = museumState.exhibitions[slotIndex];
        if (slot.artifactId) {
          s.pushToast('Слот вже зайнятий', '#FF2A5F');
          return false;
        }
        
        // Find the artifact
        const artifact = s.artifacts.find(a => a.id === artifactId);
        if (!artifact) {
          s.pushToast('Артефакт не знайдено', '#FF2A5F');
          return false;
        }
        
        // Check artifact is restored and in museum
        if (artifact.status !== 'museum') {
          s.pushToast('Артефакт повинен бути в музеї', '#FF2A5F');
          return false;
        }
        
        // Place artifact
        set((state) => ({
          museumState: {
            ...state.museumState,
            exhibitions: state.museumState.exhibitions.map((ex, idx) =>
              idx === slotIndex
                ? { ...ex, artifactId, placedAt: Date.now() }
                : ex
            ),
          },
        }));
        
        s.pushToast('Артефакт виставлено!', '#FFC72C');
        return true;
      },

      removeArtifactFromExhibition: (slotIndex) => {
        const s = get();
        const museumState = s.museumState;
        
        if (slotIndex < 0 || slotIndex >= museumState.exhibitions.length) {
          return;
        }
        
        const slot = museumState.exhibitions[slotIndex];
        if (!slot.artifactId) return;
        
        set((state) => ({
          museumState: {
            ...state.museumState,
            exhibitions: state.museumState.exhibitions.map((ex, idx) =>
              idx === slotIndex
                ? { ...ex, artifactId: null, placedAt: 0 }
                : ex
            ),
          },
        }));
        
        s.pushToast('Артефакт прибрано', '#FFC72C');
      },

      collectMuseumIncome: () => {
        const s = get();
        const museumState = s.museumState;
        
        // Get exhibited artifacts
        const museumArtifacts = s.artifacts.filter(a => a.status === 'museum');
        const exhibitedArtifactIds = museumState.exhibitions
          .filter(ex => ex.artifactId)
          .map(ex => ex.artifactId);
        const exhibitedArtifacts = museumArtifacts.filter(a => exhibitedArtifactIds.includes(a.id));
        const totalValue = exhibitedArtifacts.reduce((sum, a) => sum + a.value, 0);
        
        // Get NPC trust bonus for museum income
        const npcBonuses = calcNpcTrustBonuses(s.npcRelationships || {});
        
        // Calculate income with NPC bonus
        const income = calculateMuseumIncome(museumState, totalValue, npcBonuses.totalMuseumIncomeBonus);
        
        if (income > 0) {
          set((state) => ({
            karbovanets: state.karbovanets + income,
            museumState: {
              ...state.museumState,
              totalIncomeAllTime: state.museumState.totalIncomeAllTime + income,
              lastIncomeCollected: Date.now(),
            },
          }));
          
          s.pushToast(`+${income.toLocaleString()} 💰`, '#FFC72C');
        }
      },

      purchaseMuseumUpgrade: (upgradeId) => {
        const s = get();
        const museumState = s.museumState;
        
        // Find upgrade
        const upgrade = museumUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
          s.pushToast('Невідоме покращення', '#FF2A5F');
          return false;
        }
        
        // Get current level
        const currentLevel = museumState.upgrades[upgradeId as keyof MuseumUpgradeState] || 0;
        if (currentLevel >= upgrade.maxLevel) {
          s.pushToast('Максимальний рівень досягнуто', '#FF2A5F');
          return false;
        }
        
        // Calculate cost
        const cost = getUpgradeCost(upgrade, currentLevel);
        if (s.karbovanets < cost) {
          s.pushToast('Недостатньо карбованців', '#FF2A5F');
          return false;
        }
        
        // Purchase upgrade
        set((state) => ({
          karbovanets: state.karbovanets - cost,
          museumState: {
            ...state.museumState,
            upgrades: {
              ...state.museumState.upgrades,
              [upgradeId]: currentLevel + 1,
            },
          },
        }));
        
        s.pushToast(`${upgrade.icon} ${upgrade.nameKey} оновлено!`, '#FFC72C');
        return true;
      },

      expandExhibitionSlots: () => {
        const s = get();
        const museumState = s.museumState;
        
        const maxSlots = 12; // Final max
        if (museumState.exhibitions.length >= maxSlots) {
          s.pushToast('Всі слоти відкрито', '#FF2A5F');
          return false;
        }
        
        // Cost increases for each expansion
        const expansionsCount = museumState.exhibitions.length - 3; // Base is 3
        const cost = 5000 * Math.pow(2, expansionsCount);
        
        if (s.karbovanets < cost) {
          s.pushToast('Недостатньо карбованців', '#FF2A5F');
          return false;
        }
        
        const newSlotIndex = museumState.exhibitions.length;
        set((state) => ({
          karbovanets: state.karbovanets - cost,
          museumState: {
            ...state.museumState,
            exhibitions: [
              ...state.museumState.exhibitions,
              { slotIndex: newSlotIndex, artifactId: null, placedAt: 0 },
            ],
          },
        }));
        
        s.pushToast(`📍 Новий слот відкрито!`, '#FFC72C');
        return true;
      },

      // ─── Achievement System ───────────────────────────────────────────────
      checkAndUnlockAchievements: (
        context: {
          visitors?: number;
          artifacts?: number;
          collections?: number;
          exhibitions?: number;
          events?: number;
        }
      ) => {
        const s = get();
        const museumState = s.museumState;
        const unlocked = museumState.achievements || [];
        const newlyUnlocked: string[] = [];

        for (const achievement of MUSEUM_ACHIEVEMENTS) {
          if (unlocked.includes(achievement.id)) continue;
          if (achievement.secret && !context.visitors && !context.artifacts) continue;

          let current = 0;
          switch (achievement.requirement.type) {
            case 'visitors':
              current = context.visitors ?? museumState.totalVisitorsAllTime;
              break;
            case 'artifacts':
              current = context.artifacts ?? 0;
              break;
            case 'collections':
              current = context.collections ?? (museumState.completedCollections?.length ?? 0);
              break;
            case 'reputation':
              current = museumState.reputation;
              break;
            case 'exhibitions':
              current = context.exhibitions ?? museumState.exhibitions.filter(e => e.artifactId).length;
              break;
            case 'events':
              current = context.events ?? (museumState.eventParticipation?.length ?? 0);
              break;
            default:
              continue;
          }

          const req = achievement.requirement;
          let unlockedNow = false;
          if (req.comparison === '>=') unlockedNow = current >= req.value;
          else if (req.comparison === '==') unlockedNow = current === req.value;

          if (unlockedNow) {
            newlyUnlocked.push(achievement.id);
          }
        }

        if (newlyUnlocked.length > 0) {
          set((state) => {
            const reward = newlyUnlocked.reduce((acc, id) => {
              const ach = MUSEUM_ACHIEVEMENTS.find(a => a.id === id);
              return ach ? acc + ach.reward.amount : acc;
            }, 0);

            if (reward > 0) {
              return {
                karbovanets: state.karbovanets + reward,
                museumState: {
                  ...state.museumState,
                  achievements: [...(state.museumState.achievements || []), ...newlyUnlocked],
                },
              };
            }
            return {
              museumState: {
                ...state.museumState,
                achievements: [...(state.museumState.achievements || []), ...newlyUnlocked],
              },
            };
          });

          if (reward > 0) {
            s.pushToast(`🏆 +${reward} карбованців за досягнення!`, '#FFC72C');
          } else {
            s.pushToast(`🏆 Нові досягнення відкрито!`, '#FFC72C');
          }
        }
      },

      // ─── Event System ────────────────────────────────────────────────────
      joinEvent: (eventId: string) => {
        const s = get();
        const museumState = s.museumState;
        const participated = museumState.eventParticipation || [];

        if (participated.includes(eventId)) {
          s.pushToast('Ви вже берете участь у цій події', '#FF2A5F');
          return;
        }

        set((state) => ({
          museumState: {
            ...state.museumState,
            eventParticipation: [...participated, eventId],
          },
        }));

        s.pushToast('🎉 Ви приєдналися до події!', '#9747FF');

        // Check achievements after joining event
        s.checkAndUnlockAchievements({
          events: (museumState.eventParticipation?.length ?? 0) + 1,
        });
      },

      // Building actions
      upgradeBuilding: (buildingId) => {
        const s = get();
        const building = buildings.find(b => b.id === buildingId);
        if (!building) return false;
        
        const currentLevel = s.buildingLevels[buildingId] || 1;
        // Apply BUILDING_COST_MULTIPLIER (0.8 = 20% discount)
        const baseCost = Math.round(building.upgradeCost * Math.pow(1.5, currentLevel));
        const cost = Math.round(baseCost * BUILDING_COST_MULTIPLIER);
        const upgradeTime = Math.round(building.upgradeTime * Math.pow(1.3, currentLevel) * 1000);
        
        if (!s.spendKarbovanets(cost)) {
          s.pushToast('Недостатньо карбованців', '#FF2A5F');
          return false;
        }
        
        set((state) => ({
          buildingUpgradeEndTimes: {
            ...state.buildingUpgradeEndTimes,
            [buildingId]: Date.now() + upgradeTime,
          },
        }));
        
        s.pushToast(`Building ${building.name} upgrading...`, '#FFC72C');
        return true;
      },

      collectBuildingUpgrade: (buildingId) => {
        const s = get();
        const building = buildings.find(b => b.id === buildingId);
        if (!building) return;
        
        const endTime = s.buildingUpgradeEndTimes[buildingId];
        if (!endTime || Date.now() < endTime) return;
        
        set((state) => {
          const newLevels = { ...state.buildingLevels };
          newLevels[buildingId] = (newLevels[buildingId] || 1) + 1;
          
          const newEndTimes = { ...state.buildingUpgradeEndTimes };
          delete newEndTimes[buildingId];
          
          return {
            buildingLevels: newLevels,
            buildingUpgradeEndTimes: newEndTimes,
          };
        });
        
        s.pushToast(`Building ${building.name} upgraded!`, '#10B981');
      },

      getBuildingBonus: (buildingId) => {
        const s = get();
        const level = s.buildingLevels[buildingId] || 1;
        switch (buildingId) {
          case 'building-1': return 1 + (level - 1) * 0.1;
          case 'building-2': return level;
          case 'building-3': return 1 - (level - 1) * 0.1;
          case 'building-4': return level * 50;
          case 'building-5': return 1 + (level - 1) * 0.15;
          case 'building-6': return level * 1000;
          default: return 1;
        }
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

        // ====== HERO BONUSES ======
        // Hero success bonus based on exploration + leadership (max 15%)
        const heroSuccessBonus = Math.min(
          15,
          Math.round(
            teamHeroes.reduce(
              (sum, h) => sum + (h.exploration + h.leadership) / 50,
              0,
            ),
          ),
        );
        // Hero speed bonus (sum of hero.speedBonus, max 20%)
        const heroSpeedBonus = Math.min(
          20,
          teamHeroes.reduce((sum, h) => sum + h.speedBonus, 0),
        );
        // Hero artifact chance bonus (max 15%)
        const heroArtifactBonus = Math.min(
          15,
          teamHeroes.reduce((sum, h) => sum + h.artifactBonus, 0),
        );

        // ====== NPC TRUST BONUSES ======
        const npcBonuses = calcNpcTrustBonuses(s.npcRelationships || {});

        // ====== MUSEUM BONUSES ======
        const museumBonuses = calcTotalMuseumBonus(
          s.museumState.completedCollections || [],
        );

        // ====== TOTAL EXPEDITION CALCULATIONS ======
        // Success chance: region base + hero + NPC (cap at 98%)
        const successChance = Math.min(
          98,
          region.successChance + heroSuccessBonus,
        );

        // Duration: reduced by hero speed + NPC speed + museum speed (max 40% reduction)
        const baseDuration = expeditionSeconds(region);
        const totalSpeedReduction = Math.min(
          40,
          heroSpeedBonus + npcBonuses.totalExpeditionSpeedBonus + (museumBonuses.expeditionSpeedBonus || 0),
        );
        const dur = Math.max(1, Math.floor(baseDuration * (1 - totalSpeedReduction / 100)));

        // Artifact rarity bonus
        const totalArtifactChanceBonus =
          heroArtifactBonus + npcBonuses.totalArtifactChanceBonus;

        const now = Date.now();
        const { name, rarity } = pickArtifact(region, totalArtifactChanceBonus);
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

      speedUpExpedition: (expeditionId: string) => {
        const exp = get().expeditions.find((e) => e.id === expeditionId);
        if (!exp || exp.collected || exp.status === 'collecting') return;
        
        const remainingTime = exp.endsAt - Date.now();
        if (remainingTime <= 0) return;
        
        // Reduce remaining time by 50%
        const newEndsAt = exp.endsAt - Math.floor(remainingTime * 0.5);
        
        set((st) => ({
          expeditions: st.expeditions.map((e) =>
            e.id === expeditionId ? { ...e, endsAt: Math.max(Date.now(), newEndsAt) } : e,
          ),
        }));
        
        get().pushToast('Експедицію прискорено на 50%!', '#10B981');
      },
      collectExpedition: (expeditionId) => {
        const s = get();
        const exp = s.expeditions.find((e) => e.id === expeditionId);


        if (!exp || exp.collected) {
          return;
        }
        
        if (Date.now() < exp.endsAt) {
          return;
        }
        
        if (exp.status === 'collecting') {
          s.pushToast('Експедиція вже збирається...', '#FFC72C');
          return;
        }

        // Mark as 'collecting' (NOT collected) to prevent double-calling
        set((st) => ({
          expeditions: st.expeditions.map((e) =>
            e.id === expeditionId ? { ...e, status: 'collecting' } : e,
          ),
        }));

        // Use server-side validation for expedition completion
        const heroId = exp.heroes[0];

        academySync.completeExpeditionServerValidated(expeditionId, heroId).then((result) => {
          // Handle already claimed (idempotency)
          if ((result as Record<string, unknown>).alreadyClaimed) {
            set((st) => ({
              expeditions: st.expeditions.map((e) =>
                e.id === expeditionId ? { ...e, collected: true, status: 'completed' } : e,
              ),
            }));
            s.pushToast('Нагорода вже отримана', '#FFC72C');
            return;
          }

          if (!result.ok) {
            console.error('[expedition] Server error for', expeditionId, result);
            set((st) => ({
              expeditions: st.expeditions.map((e) =>
                e.id === expeditionId ? { ...e, status: 'returning' } : e,
              ),
            }));
            // Show actual error message
            const errorMsg = result.error || 'Помилка завершення експедиції';
            s.pushToast(`Помилка: ${errorMsg}`, '#FF2A5F');
            return;
          }

          const { success, rewards } = result as { success?: boolean; rewards?: Record<string, unknown> };

          if (success && rewards) {
            const serverKarbovanets = (rewards.karbovanets as number) || 0;
            const serverPrestige = (rewards.prestigeGained as number) || 0;
            const artifactId = rewards.artifactId as string | null;

            set((st) => {
              // Calculate XP with hero level bonuses
              const baseXp = (rewards.xp as number) || 100;
              const levelBonuses = exp.heroes.map(hId => {
                const hero = st.heroes.find(h => h.id === hId);
                if (!hero) return { xpBonus: 0, successBonus: 0 };
                return getLevelBonus(hero.level);
              });
              const xpMultiplier = 1 + (levelBonuses.reduce((sum, b) => sum + b.xpBonus, 0) / 100);
              const gainedXp = Math.floor(baseXp * xpMultiplier);
              
              const heroes = st.heroes.map((h) => {
                if (!exp.heroes.includes(h.id)) return h;
                const newXP = h.experience + gainedXp;
                const newLevel = getLevelFromXP(newXP);
                return { ...h, assigned: false, assignedTo: undefined, experience: newXP, level: newLevel };
              });

              const idx = st.regions.findIndex((r) => r.id === exp.regionId);
              const regions = idx >= 0 && idx + 1 < st.regions.length && !st.regions[idx + 1].unlocked
                ? st.regions.map((r, i) => i === idx + 1 ? { ...r, unlocked: true } : r)
                : st.regions;

              let artifacts = st.artifacts;
              if (artifactId) {
                const newArtifact: Artifact = {
                  id: artifactId,
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

              // Mark as collected AFTER successful server response
              return {
                heroes,
                regions,
                artifacts,
                karbovanets: st.karbovanets + serverKarbovanets,
                historicalPrestige: st.historicalPrestige + serverPrestige,
                reputation: st.reputation + Math.floor(serverPrestige / 2),
                expeditions: st.expeditions.map((e) =>
                  e.id === expeditionId ? { ...e, collected: true, status: 'completed' } : e,
                ),
              };
            });

            s.pushToast(
              artifactId
                ? `Успіх! +${serverKarbovanets} карб., знайдено «${exp.artifactName}»`
                : `Успіх! +${serverKarbovanets} карб.`,
              '#FFC72C',
            );
            s.updateQuestObjective(`expedition_${exp.regionId}`, 1);
          } else {
            const failureReward = Math.floor(exp.rewardKarbovanets * EXPEDITION_REWARD_MULTIPLIER * 0.2);
            set((st) => ({
              karbovanets: st.karbovanets + failureReward,
              expeditions: st.expeditions.map((e) =>
                e.id === expeditionId ? { ...e, status: 'returning' } : e,
              ),
            }));
            s.pushToast(`Експедиція невдала. +${failureReward} карб.`, '#FF2A5F');
          }
        }).catch((err) => {
          console.error('[expedition] Network error for', expeditionId, err);
          set((st) => ({
            expeditions: st.expeditions.map((e) =>
              e.id === expeditionId ? { ...e, status: 'returning' } : e,
            ),
          }));
          s.pushToast('Помилка мережі', '#FF2A5F');
        });
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
        
        // Apply ARTIFACT_PRESTIGE_MULTIPLIER for faster first prestige
        const prestigeGain = Math.floor(art.prestigeBonus * ARTIFACT_PRESTIGE_MULTIPLIER);
        const reputationGain = Math.round(prestigeGain / 2);
        
        set((st) => ({
          artifacts: st.artifacts.map((a) =>
            a.id === artifactId ? { ...a, status: 'museum' } : a,
          ),
          historicalPrestige: st.historicalPrestige + prestigeGain,
          reputation: st.reputation + reputationGain,
        }));
        s.pushToast(`«${art.name}» виставлено в музеї (+${prestigeGain} престижу)`, '#9747FF');
        
        // Check achievements for artifacts and reputation
        const museumArtifacts = s.artifacts.filter(a => a.status === 'museum');
        s.checkAndUnlockAchievements({ artifacts: museumArtifacts.length });
        
        // Check collection completion after sending to museum
        s.checkCollectionCompletion();
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
        
        // Check if any arcs are now available after reputation gain
        if (rep > 0) {
          s.checkArcRequirements();
        }
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

          // Track museum visitors (daily accumulation into totalVisitorsAllTime)
          const exhibitedCount = museumArtifacts.length;
          const dailyVisitors = calculateDailyVisitors(st.museumState, exhibitedCount, 0);
          const visitorsPerSecond = dailyVisitors / 86400;
          const newVisitors = Math.floor(visitorsPerSecond * dt);
          const updatedMuseumState = newVisitors > 0 ? {
            ...st.museumState,
            totalVisitorsAllTime: st.museumState.totalVisitorsAllTime + newVisitors,
          } : st.museumState;

          return {
            lastTick: now,
            incomeBuffer,
            karbovanets,
            artifacts,
            expeditions,
            npcs,
            museumState: updatedMuseumState,
          };
        });

        // Check visitor achievements after tick (every ~10 ticks to avoid performance issues)
        const state = get();
        if (Math.random() < 0.1) {
          const museumArtifacts = state.artifacts.filter((a) => a.status === 'museum');
          state.checkAndUnlockAchievements({
            visitors: state.museumState.totalVisitorsAllTime,
            artifacts: museumArtifacts.length,
          });
        }
      },
    }),
    {
      name: 'expedition_state',
      version: 3,
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
        museumState: s.museumState,
        storyState: s.storyState,
        buildingLevels: s.buildingLevels,
        buildingUpgradeEndTimes: s.buildingUpgradeEndTimes,
        heroFragments: s.heroFragments,
        artifactFragments: s.artifactFragments,
        tutorialState: s.tutorialState,
      }),
      // Crash recovery: fix stuck expeditions on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Fix expeditions stuck in 'collecting' status (crash during collection)
          const fixedExpeditions = state.expeditions.map((e) => {
            if (e.status === 'collecting' && !e.collected) {
              console.warn('[expedition] Crash recovery: fixing stuck expedition', e.id);
              return { ...e, status: 'returning' as const };
            }
            return e;
          });
          if (fixedExpeditions.some((e, i) => e.status !== state.expeditions[i]?.status)) {
            state.expeditions = fixedExpeditions;
          }
        }
      },
    },
  ),
);

// Separate reset function for prestige - call this after performPrestige
export function resetExpeditionOnPrestige() {
  const currentState = useExpeditionStore.getState();
  
  useExpeditionStore.setState({
    // Reset museum state completely
    museumState: {
      ...initialMuseumState,
      // Start with 2 exhibition slots
      exhibitions: Array.from({ length: 2 }, (_, i) => ({ slotIndex: i, artifactId: null, placedAt: 0 })),
      maxExhibitionSlots: 2,
      upgrades: { marketing: 0, security: 0, exhibition_hall: 0, restoration_wing: 0 },
      completedCollections: [],
      collectionProgress: {},
      achievements: [],
      legendaryExhibitions: [],
      eventParticipation: [],
    },
    // Reset story state - start Academy from scratch on new prestige
    // Keep completedQuests as reference but reset active quests and relationships
    storyState: {
      ...initialStoryProgress,
      // Archive completed quests from previous prestige
      completedQuests: [],
    },
    // Reset expeditions
    expeditions: [],
    expeditionSlots: 1, // Start with 1 slot, can unlock more with prestige research
    // Keep heroes but reset to idle
    heroes: currentState.heroes.map(h => ({
      ...h,
      level: 1,
      expeditionId: undefined,
      status: 'idle' as const,
    })),
    // Reset buildings
    buildingLevels: buildings.reduce((acc, b) => ({ ...acc, [b.id]: 0 }), {}),
    buildingUpgradeEndTimes: {},
    // Reset income
    incomeBuffer: 0,
    // Reset museum visitors
    museumVisitors: 0,
    // Reset Academy XP on prestige
    academyXp: 0,
    // Keep karbovanets (they reset with the game)
    // Keep reputation (may want to preserve or reset based on design)
    // Keep academy level (prestige bonus)
  });
}
