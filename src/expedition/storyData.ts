import { Rarity } from './data';

// NPC Roles for Story System
export type StoryNpcRole = 'knyaz' | 'hetman' | 'researcher' | 'archaeologist' | 'historian' | 'guard';

// NPC Relationship Level
export type RelationshipLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Relationship Level Names
export const RELATIONSHIP_NAMES: Record<RelationshipLevel, string> = {
  1: 'Незнайомець',
  2: 'Знайомий',
  3: 'Друг',
  4: 'Довірений',
  5: 'Близький союзник',
  6: 'Легендарний союзник',
};

// Trust points needed for each level
export const TRUST_THRESHOLDS: Record<RelationshipLevel, number> = {
  1: 0,
  2: 30,
  3: 80,
  4: 150,
  5: 300,
  6: 500,
};

// Relationship rewards at each level
export interface RelationshipReward {
  karbovanets?: number;
  reputation?: number;
  heroFragment?: { heroId: string; amount: number };
  artifactFragment?: { rarity: string; amount: number };
  // Bonus system per trust level
  xpBonus?: number;                 // +% XP bonus (Level 1+)
  museumIncomeBonus?: number;        // +% museum income (Level 2+)
  expeditionSpeedBonus?: number;    // -% expedition time (Level 3+)
  artifactChanceBonus?: number;     // +% artifact chance (Level 4+)
  heroUnlock?: string;              // Hero ID to unlock (Level 5+)
  collectionUnlock?: string;         // Collection ID to unlock (Level 5+)
}

export const RELATIONSHIP_REWARDS: Record<RelationshipLevel, RelationshipReward> = {
  1: { xpBonus: 5 },                              // +5% XP
  2: { xpBonus: 5, museumIncomeBonus: 5 },         // +5% XP, +5% museum income
  3: { xpBonus: 5, museumIncomeBonus: 5, expeditionSpeedBonus: 10 }, // +5% XP, +5% income, -10% time
  4: { xpBonus: 5, museumIncomeBonus: 5, expeditionSpeedBonus: 10, artifactChanceBonus: 10 }, // +10% artifacts
  5: { karbovanets: 500, reputation: 50, artifactFragment: { rarity: 'rare', amount: 3 }, heroUnlock: 'auto', collectionUnlock: 'auto' }, // Unlock hero/collection
  6: { karbovanets: 1000, reputation: 100, artifactFragment: { rarity: 'epic', amount: 2 }, heroFragment: { heroId: 'any', amount: 5 } }, // Awarded to random locked hero (store handles selection)
};

/**
 * Calculate total NPC trust bonuses based on all NPC relationships
 * Returns aggregated bonuses from all NPCs at various trust levels
 */
export function calcNpcTrustBonuses(npcRelationships: Record<string, { relationshipLevel: RelationshipLevel }>): {
  totalXpBonus: number;
  totalMuseumIncomeBonus: number;
  totalExpeditionSpeedBonus: number;
  totalArtifactChanceBonus: number;
} {
  let totalXpBonus = 0;
  let totalMuseumIncomeBonus = 0;
  let totalExpeditionSpeedBonus = 0;
  let totalArtifactChanceBonus = 0;

  for (const npcId in npcRelationships) {
    const level = npcRelationships[npcId].relationshipLevel;
    const rewards = RELATIONSHIP_REWARDS[level];
    if (rewards.xpBonus) totalXpBonus += rewards.xpBonus;
    if (rewards.museumIncomeBonus) totalMuseumIncomeBonus += rewards.museumIncomeBonus;
    if (rewards.expeditionSpeedBonus) totalExpeditionSpeedBonus += rewards.expeditionSpeedBonus;
    if (rewards.artifactChanceBonus) totalArtifactChanceBonus += rewards.artifactChanceBonus;
  }

  // Cap each bonus at 25% max
  return {
    totalXpBonus: Math.min(totalXpBonus, 25),
    totalMuseumIncomeBonus: Math.min(totalMuseumIncomeBonus, 25),
    totalExpeditionSpeedBonus: Math.min(totalExpeditionSpeedBonus, 25),
    totalArtifactChanceBonus: Math.min(totalArtifactChanceBonus, 25),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// STORY ARC SYSTEM - For long-term content (up to 20 arcs)
// ═══════════════════════════════════════════════════════════════════════

export interface ArcRequirements {
  reputation?: number;
  prestige?: number;
  completedQuests?: string[];      // Quest IDs that must be completed
  completedArcs?: number[];         // Arc numbers that must be completed
  relationshipLevel?: Record<string, RelationshipLevel>; // NPC ID -> required level
  museumCollections?: number;      // Number of completed museum collections
  artifacts?: number;              // Total artifacts collected
}

// Helper to check if arc requirements are met
export function checkArcRequirements(
  arc: ArcMetadata,
  state: {
    reputation: number;
    historicalPrestige: number;
    completedQuests: string[];
    completedArcs: number[];
    npcRelationships: Record<string, { relationshipLevel: RelationshipLevel }>;
    museumCompletedCollections: number;
    totalArtifacts: number;
  }
): { met: boolean; missing: string[] } {
  const missing: string[] = [];
  const req = arc.requirements;
  
  if (req.reputation && state.reputation < req.reputation) {
    missing.push(`Репутація: потрібно ${req.reputation}`);
  }
  
  if (req.prestige && state.historicalPrestige < req.prestige) {
    missing.push(`Престиж: потрібно ${req.prestige}`);
  }
  
  if (req.completedQuests) {
    for (const questId of req.completedQuests) {
      if (!state.completedQuests.includes(questId)) {
        missing.push(`Квест: ${questId}`);
      }
    }
  }
  
  if (req.completedArcs) {
    for (const arcNum of req.completedArcs) {
      if (!state.completedArcs.includes(arcNum)) {
        missing.push(`Арк ${arcNum} завершено`);
      }
    }
  }
  
  if (req.relationshipLevel) {
    for (const [npcId, requiredLevel] of Object.entries(req.relationshipLevel)) {
      const npcRel = state.npcRelationships[npcId];
      if (!npcRel || npcRel.relationshipLevel < (requiredLevel as RelationshipLevel)) {
        missing.push(`NPC довіра: рівень ${requiredLevel}`);
      }
    }
  }
  
  if (req.museumCollections && state.museumCompletedCollections < req.museumCollections) {
    missing.push(`Колекції: ${req.museumCollections}`);
  }
  
  if (req.artifacts && state.totalArtifacts < req.artifacts) {
    missing.push(`Артефакти: ${req.artifacts}`);
  }
  
  return { met: missing.length === 0, missing };
}

export interface ArcMetadata {
  arcNumber: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirements: ArcRequirements;
  npcIds: string[];                // NPCs involved in this arc
  regionIds: string[];             // Regions involved
  estimatedDuration: string;        // e.g., "1-2 weeks"
}

export const STORY_ARCS: ArcMetadata[] = [
  // ========== ARC 1: Трипільська культура ==========
  {
    arcNumber: 1,
    name: 'Трипільська культура',
    description: 'Початок археологічної подорожі',
    icon: '🏺',
    color: '#FFC72C',
    requirements: {},
    npcIds: ['story-archaeologist-academy'],
    regionIds: ['region-1'],
    estimatedDuration: '1-2 days',
  },
  // ========== ARC 2: Скіфія ==========
  {
    arcNumber: 2,
    name: 'Скіфія',
    description: 'Воїни степів',
    icon: '⚔️',
    color: '#3B82F6',
    requirements: {
      completedArcs: [1],
      reputation: 100,
    },
    npcIds: ['story-archaeologist-academy'],
    regionIds: ['region-2'],
    estimatedDuration: '3-5 days',
  },
  // ========== ARC 3: Київська Русь ==========
  {
    arcNumber: 3,
    name: 'Київська Русь',
    description: 'Епоха князів',
    icon: '⛪',
    color: '#A855F7',
    requirements: {
      completedArcs: [2],
      reputation: 500,
      relationshipLevel: { 'story-knyaz-vladimir': 2 },
    },
    npcIds: ['story-knyaz-vladimir'],
    regionIds: ['region-3'],
    estimatedDuration: '1 week',
  },
  // ========== ARC 4: Козаччина ==========
  {
    arcNumber: 4,
    name: 'Козаччина',
    description: 'Лицарі вольності',
    icon: '🗡️',
    color: '#F59E0B',
    requirements: {
      completedArcs: [3],
      reputation: 1000,
      relationshipLevel: { 'story-hetman-khmelnytsky': 3 },
    },
    npcIds: ['story-hetman-khmelnytsky'],
    regionIds: ['region-4'],
    estimatedDuration: '1-2 weeks',
  },
  // ========== ARC 5: Незалежність ==========
  {
    arcNumber: 5,
    name: 'Незалежність',
    description: 'Сучасна історія',
    icon: '🏴',
    color: '#00E5FF',
    requirements: {
      completedArcs: [4],
      reputation: 2000,
      museumCollections: 3,
    },
    npcIds: ['story-knyaz-vladimir', 'story-monk-pereyaslav', 'story-museum-curator'],
    regionIds: ['region-5'],
    estimatedDuration: '1-2 weeks',
  },
  // ========== ARC 6: Галицько-Волинське князівство ==========
  {
    arcNumber: 6,
    name: 'Галицько-Волинське князівство',
    description: 'Західні землі та коронація',
    icon: '🦁',
    color: '#EF4444',
    requirements: {
      completedArcs: [5],
      reputation: 5000,
      artifacts: 30,
      museumCollections: 4,
    },
    npcIds: ['story-danylo-romanovich'],
    regionIds: ['region-halych', 'region-kamianets'],
    estimatedDuration: '2-3 weeks',
  },
  // ========== ARC 7: Українське бароко ==========
  {
    arcNumber: 7,
    name: 'Українське бароко',
    description: 'Культурний розквіт XVII-XVIII ст.',
    icon: '🎨',
    color: '#EC4899',
    requirements: {
      completedArcs: [6],
      reputation: 10000,
      artifacts: 50,
      relationshipLevel: { 'story-kobzar': 2 },
    },
    npcIds: ['story-kobzar'],
    regionIds: ['region-chyhyryn', 'region-baturyn'],
    estimatedDuration: '2-3 weeks',
  },
  // ========== ARC 8: Культурне відродження ==========
  {
    arcNumber: 8,
    name: 'Культурне відродження',
    description: 'Український національний рух XIX ст.',
    icon: '✒️',
    color: '#2E8B57',
    requirements: {
      completedArcs: [7],
      reputation: 15000,
      artifacts: 70,
      museumCollections: 5,
    },
    npcIds: ['story-shevchenko'],
    regionIds: ['region-kyiv-rus-extended', 'region-lviv'],
    estimatedDuration: '2-4 weeks',
  },
  // ========== ARC 9: Українська революція ==========
  {
    arcNumber: 9,
    name: 'Українська революція',
    description: '1917-1921 роки боротьби',
    icon: '⚔️',
    color: '#000080',
    requirements: {
      completedArcs: [8],
      reputation: 20000,
      artifacts: 100,
      relationshipLevel: { 'story-petrykura': 2 },
    },
    npcIds: ['story-petrykura'],
    regionIds: ['region-kyiv-1918', 'region-zaporizhia-extended'],
    estimatedDuration: '3-4 weeks',
  },
  // ========== ARC 10: Друга світова війна ==========
  {
    arcNumber: 10,
    name: 'Друга світова війна',
    description: '1939-1945 роки випробувань',
    icon: '🎖️',
    color: '#4A4A4A',
    requirements: {
      completedArcs: [9],
      reputation: 25000,
      artifacts: 120,
      museumCollections: 6,
    },
    npcIds: ['story-ww2-researcher'],
    regionIds: ['region-babi-yar', 'region-kyiv-ww2'],
    estimatedDuration: '3-4 weeks',
  },
  // ========== ARC 11: Шістдесятники ==========
  {
    arcNumber: 11,
    name: 'Шістдесятники',
    description: 'Дисидентський рух та культурне відродження',
    icon: '📚',
    color: '#FF6347',
    requirements: {
      completedArcs: [10],
      reputation: 30000,
      artifacts: 150,
      relationshipLevel: { 'story-dziuba': 2 },
    },
    npcIds: ['story-dziuba'],
    regionIds: ['region-kyiv-60s', 'region-lviv-intellectual'],
    estimatedDuration: '3-4 weeks',
  },
  // ========== ARC 12: Сучасна Україна ==========
  {
    arcNumber: 12,
    name: 'Сучасна Україна',
    description: 'Незалежність та європейський вибір',
    icon: '⭐',
    color: '#FFD700',
    requirements: {
      completedArcs: [11],
      reputation: 40000,
      artifacts: 200,
      museumCollections: 8,
      relationshipLevel: { 'story-modern-historian': 2 },
    },
    npcIds: ['story-modern-historian'],
    regionIds: ['region-maidan', 'region-kyiv-modern'],
    estimatedDuration: '4+ weeks',
  },
];

// NPC Relationship Interface
export interface NpcRelationship {
  npcId: string;
  relationshipLevel: RelationshipLevel;
  trustPoints: number;
  completedQuests: string[];
  lastInteraction: number;
}

// Quest Type
export type QuestType = 'story' | 'daily' | 'expedition' | 'museum' | 'research';

// Quest Status
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'rewarded';

// Quest Reward
export interface QuestReward {
  type: 'karbovanets' | 'xp' | 'reputation' | 'hero_fragment' | 'artifact' | 'academy_xp';
  amount: number;
  itemId?: string;
}

// Quest Objective
export interface QuestObjective {
  type: 'expedition' | 'visit' | 'prestige' | 'speak' | 'build' | 'collect';
  target: string;
  count: number;
  current: number;
}

// Story Quest
export interface StoryQuest {
  id: string;
  npcId: string;
  titleKey: string;
  descriptionKey: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  status: QuestStatus;
  dialogue: {
    start: string;
    progress: string;
    complete: string;
  };
  requiredRelationshipLevel: RelationshipLevel;
}

// Story NPC with full data
export interface StoryNpc {
  id: string;
  nameKey: string;
  role: StoryNpcRole;
  roleKey: string;
  portrait: string;
  backgroundColor: string;
  rarity: Rarity;
  biographyKey: string;
  dialogues: {
    greeting: string[];
    relationship: Record<RelationshipLevel, string[]>;
  };
  questIds: string[];
  unlocksAtRelationship: Record<RelationshipLevel, string | null>;
}

// Quest progress tracking
export interface QuestProgress {
  questId: string;
  objectives: Record<string, number>; // objective type -> current progress
  startedAt: number;
  updatedAt: number;
}

// Story Progress
export interface StoryProgress {
  currentChapter: number;
  completedChapters: number[];
  activeQuests: QuestProgress[]; // Track progress for each active quest
  completedQuests: string[];
  npcRelationships: Record<string, NpcRelationship>;
  // Arc system
  currentArc: number;
  unlockedArcs: number[];
  completedArcs: number[];
}

// NPC Story Data - Extended for Long-term Content (12 NPCs for 12 arcs)
export const storyNpcs: StoryNpc[] = [
  // ========== ARC 1-3 NPC: Князь Володимир ==========
  {
    id: 'story-knyaz-vladimir',
    nameKey: 'npc.knyaz_vladimir.name',
    role: 'knyaz',
    roleKey: 'npc.knyaz_vladimir.role',
    portrait: '👑',
    backgroundColor: '#FFC72C',
    rarity: 'legendary',
    biographyKey: 'npc.knyaz_vladimir.biography',
    dialogues: {
      greeting: [
        'Слава Русі!',
        'Вітаю володарю часу!',
        'Хай буде слава Києву!',
      ],
      relationship: {
        1: ['Ти цікавий мандрівник. Чув про Академію? Там зберігаються найбільші скарби!'],
        2: ['Твоя старанність не пройде непоміченою. Академія стежить за тобою!'],
        3: ['Я радий бачити друга в моїх палатах. Продовжуй збирати артефакти!'],
        4: ['Ти показав себе гідним довіри! Академія може запросити тебе скоро.'],
        5: ['Разом ми відкриємо таємниці Русі! Академія пишатиметься тобою!'],
        6: ['Легендарний союзнику! Твоє ім\'я впишуть у літописи!'],
      },
    },
    questIds: ['quest-vladimir-1', 'quest-vladimir-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_1',
      3: 'quest-vladimir-1',
      4: 'hero-olga-unlock',
      5: 'artifact-rus-weapon',
      6: 'artifact-byzantine-treasures',
    },
  },
  {
    id: 'story-monk-pereyaslav',
    nameKey: 'npc.monk_pereyaslav.name',
    role: 'historian',
    roleKey: 'npc.monk_pereyaslav.role',
    portrait: '📜',
    backgroundColor: '#9747FF',
    rarity: 'epic',
    biographyKey: 'npc.monk_pereyaslav.biography',
    dialogues: {
      greeting: [
        'Бог благословить твої починання...',
        'Вітаю в монастирі.',
        'Хай Господь веде тебе, мандрівнику.',
      ],
      relationship: {
        1: ['Розкажи, що привело тебе сюди? Знайдені артефакти вражають!'],
        2: ['Твоя цікавість до історії радує. Так тримай — до Академії недалеко!'],
        3: ['Я задоволений твоєю працею. Монастир пишається тобою!'],
        4: ['Монастирські таємниці відкриються тобі. Академія зацікавлена в тобі!'],
        5: ['Ти став частиною нашої спільноти! Академія скоро відкриє тобі двері!'],
      },
    },
    questIds: ['quest-monk-1', 'quest-monk-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_2',
      3: 'quest-monk-1',
      4: 'region-kyiv-hills-unlock',
      5: 'artifact-byzantine-icon',
      6: 'artifact-medieval-manuscript',
    },
  },
  {
    id: 'story-hetman-khmelnytsky',
    nameKey: 'npc.hetman_khmelnytsky.name',
    role: 'hetman',
    roleKey: 'npc.hetman_khmelnytsky.role',
    portrait: '⚔️',
    backgroundColor: '#FF2A5F',
    rarity: 'legendary',
    biographyKey: 'npc.hetman_khmelnytsky.biography',
    dialogues: {
      greeting: [
        'Слава козакам!',
        'Гей, побратиме!',
        'Вітаю воїна!',
      ],
      relationship: {
        1: ['Що привело тебе на Січ?'],
        2: ['Ти маєш козацьку вдачу!'],
        3: ['Рахую тебе серед побратимів!'],
        4: ['Січ відкрита для тебе!'],
        5: ['Разом ми будемо вільними!'],
      },
    },
    questIds: ['quest-khmelnytsky-1', 'quest-khmelnytsky-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_3',
      3: 'quest-khmelnytsky-1',
      4: 'region-zaporizhia-unlock',
      5: 'hero-cossack-scout',
    },
  },
  {
    id: 'story-archaeologist-academy',
    nameKey: 'npc.archaeologist_academy.name',
    role: 'archaeologist',
    roleKey: 'npc.archaeologist_academy.role',
    portrait: '🔍',
    backgroundColor: '#00E5FF',
    rarity: 'rare',
    biographyKey: 'npc.archaeologist_academy.biography',
    dialogues: {
      greeting: [
        'Що нового в розкопках?',
        'Привіт колего!',
        'Маєш знахідки для каталогізації?',
      ],
      relationship: {
        1: ['Розкажи про свої дослідження.'],
        2: ['Твоя методика вражає.'],
        3: ['Разом ми зробимо відкриття!'],
        4: ['Академія пишається тобою!'],
        5: ['Найкращі артефакти чекають на тебе!'],
      },
    },
    questIds: ['quest-archaeologist-1'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_4',
      3: 'quest-archaeologist-1',
      4: 'expedition-speed-bonus',
      5: 'artifact-trypillia-ceramics',
    },
  },
  {
    id: 'story-museum-curator',
    nameKey: 'npc.museum_curator.name',
    role: 'researcher',
    roleKey: 'npc.museum_curator.role',
    portrait: '🏛️',
    backgroundColor: '#8B949E',
    rarity: 'rare',
    biographyKey: 'npc.museum_curator.biography',
    dialogues: {
      greeting: [
        'Ласкаво просимо до музею!',
        'Привіт шанувальнику історії!',
        'Розкажи, що тебе цікавить?',
      ],
      relationship: {
        1: ['Яка епоха тебе цікавить найбільше?'],
        2: ['Твоя колекція вражає!'],
        3: ['Музей процвітає завдяки тобі!'],
        4: ['Відвідувачі в захваті від експонатів!'],
        5: ['Разом ми створимо найкращий музей!'],
      },
    },
    questIds: ['quest-curator-1', 'quest-curator-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_5',
      3: 'quest-curator-1',
      4: 'museum-visitor-bonus',
      5: 'artifact-premium-display',
      6: 'artifact-legendary-exhibit',
    },
  },

  // ========== ARC 6 NPC: Літописець Данило ==========
  {
    id: 'story-danylo-romanovich',
    nameKey: 'npc.danylo_romanovich.name',
    role: 'knyaz',
    roleKey: 'npc.danylo_romanovich.role',
    portrait: '🦁',
    backgroundColor: '#8B0000',
    rarity: 'legendary',
    biographyKey: 'npc.danylo_romanovich.biography',
    dialogues: {
      greeting: [
        'Вітаю у Холмі!',
        'Галицько-Волинська земля кличе!',
        'Слава королівству!',
      ],
      relationship: {
        1: ['Ти прийшов з далекого Києва?'],
        2: ['Твоя відвага вражає!'],
        3: ['Разом ми збудуємо сильну державу!'],
        4: ['Допоможи мені об\'єднати західні землі!'],
        5: ['Ти став частиною нашої родини!'],
        6: ['Коронаційні дари чекають на тебе!'],
      },
    },
    questIds: ['quest-danylo-1', 'quest-danylo-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_galych_1',
      3: 'quest-danylo-1',
      4: 'region-halych-unlock',
      5: 'hero-vasylkiv-rostyslav',
      6: 'artifact-korona',
    },
  },

  // ========== ARC 7 NPC: Кобзар Тарас ==========
  {
    id: 'story-kobzar',
    nameKey: 'npc.kobzar.name',
    role: 'guard',
    roleKey: 'npc.kobzar.role',
    portrait: '🎸',
    backgroundColor: '#6B4423',
    rarity: 'epic',
    biographyKey: 'npc.kobzar.biography',
    dialogues: {
      greeting: [
        'Слухаю тебе, синку...',
        'Гей, козаче!',
        'Розкажи про свої мандри!',
      ],
      relationship: {
        1: ['Чуєш, що співає вітер?'],
        2: ['Твоя історія заслуговує на пісню!'],
        3: ['Кобза пам\'ятає всі битви!'],
        4: ['Сліпий кобзар — то жива історія!'],
        5: ['Разом ми збережемо пам\'ять!'],
        6: ['Легенди оживають у твоїх справах!'],
      },
    },
    questIds: ['quest-kobzar-1', 'quest-kobzar-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_baroque_1',
      3: 'quest-kobzar-1',
      4: 'hero-kobzar-legends',
      5: 'artifact-kobza-rare',
      6: 'bonus-legend-songs',
    },
  },

  // ========== ARC 8 NPC: Історик Шевченко ==========
  {
    id: 'story-shevchenko',
    nameKey: 'npc.shevchenko.name',
    role: 'researcher',
    roleKey: 'npc.shevchenko.role',
    portrait: '✒️',
    backgroundColor: '#2E8B57',
    rarity: 'legendary',
    biographyKey: 'npc.shevchenko.biography',
    dialogues: {
      greeting: [
        'Браття мої, любі!',
        'Вітаю, земляче!',
        'Як справи у рідного краю?',
      ],
      relationship: {
        1: ['Слово — то кров, то сльози...'],
        2: ['Рідний край кличе нас!'],
        3: ['Україна понад усе!'],
        4: ['Разом ми відродимо культуру!'],
        5: ['Кобзарями не народжуються!'],
        6: ['Твоє ім\'я впишуть у нові Кобзарі!'],
      },
    },
    questIds: ['quest-shevschenko-1', 'quest-shevschenko-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_rennaissance_1',
      3: 'quest-shevschenko-1',
      4: 'hero-poet-national',
      5: 'artifact-kobzar_manuscripts',
      6: 'bonus-national-awakening',
    },
  },

  // ========== ARC 9 NPC: Гетьман Петлюра ==========
  {
    id: 'story-petrykura',
    nameKey: 'npc.petrykura.name',
    role: 'hetman',
    roleKey: 'npc.petrykura.role',
    portrait: '⚔️',
    backgroundColor: '#000080',
    rarity: 'epic',
    biographyKey: 'npc.petrykura.biography',
    dialogues: {
      greeting: [
        'Слава Україні!',
        'Вітаю, воїне!',
        'Боротьба триває!',
      ],
      relationship: {
        1: ['Українська Народна Республіка — кожен крок до волі'],
        2: ['Ми боремося за незалежність!'],
        3: ['Кожен день — це подвиг!'],
        4: ['Разом до перемоги!'],
        5: ['Історія оцінить наші зусилля!'],
        6: ['Незалежність — наше право!'],
      },
    },
    questIds: ['quest-petrykura-1', 'quest-petrykura-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_revolution_1',
      3: 'quest-petrykura-1',
      4: 'region-kyiv-1918-unlock',
      5: 'artifact-uanr-documents',
      6: 'bonus-revolution-spirit',
    },
  },

  // ========== ARC 10 NPC: Дослідник Другої Світової ==========
  {
    id: 'story-ww2-researcher',
    nameKey: 'npc.ww2_researcher.name',
    role: 'researcher',
    roleKey: 'npc.ww2_researcher.role',
    portrait: '🎖️',
    backgroundColor: '#4A4A4A',
    rarity: 'rare',
    biographyKey: 'npc.ww2_researcher.biography',
    dialogues: {
      greeting: [
        'Історію не можна забувати...',
        'Вітаю, досліднику!',
        'Пам\'ятаємо всіх загиблих!',
      ],
      relationship: {
        1: ['Ці артефакти розповідають історію...'],
        2: ['Свідчення очевидців — безцінні!'],
        3: ['Воїнів-героїв треба вшановувати!'],
        4: ['Відбудова — то теж подвиг!'],
        5: ['Разом збережемо пам\'ять!'],
        6: ['Герої ВВВ живуть у наших серцях!'],
      },
    },
    questIds: ['quest-ww2-1', 'quest-ww2-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_ww2_1',
      3: 'quest-ww2-1',
      4: 'region-babi_yar-unlock',
      5: 'artifact-ww2-medals',
      6: 'bonus-memorial-protection',
    },
  },

  // ========== ARC 11 NPC: Шістдесятник Дзюба ==========
  {
    id: 'story-dziuba',
    nameKey: 'npc.dziuba.name',
    role: 'researcher',
    roleKey: 'npc.dziuba.role',
    portrait: '📚',
    backgroundColor: '#FF6347',
    rarity: 'epic',
    biographyKey: 'npc.dziuba.biography',
    dialogues: {
      greeting: [
        'Вітаю, шукачу правди!',
        'Дисиденти — то совість нації!',
        'Шістдесятники змінили Україну!',
      ],
      relationship: {
        1: ['Інтелігенція — рушій змін!'],
        2: ['Віриш у майбутнє України?'],
        3: ['Разом за українську культуру!'],
        4: ['Дисидентський рух — то мужність!'],
        5: ['Пам\'ять про шістдесятників жива!'],
        6: ['Ти — частина нової хвилі!'],
      },
    },
    questIds: ['quest-dziuba-1', 'quest-dziuba-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_sixtiers_1',
      3: 'quest-dziuba-1',
      4: 'hero-dissident-poet',
      5: 'artifact-samvydav',
      6: 'bonus-cultural-awakening',
    },
  },

  // ========== ARC 12 NPC: Сучасний історик ==========
  {
    id: 'story-modern-historian',
    nameKey: 'npc.modern_historian.name',
    role: 'researcher',
    roleKey: 'npc.modern_historian.role',
    portrait: '🔬',
    backgroundColor: '#4169E1',
    rarity: 'legendary',
    biographyKey: 'npc.modern_historian.biography',
    dialogues: {
      greeting: [
        'Історія пишеться сьогодні!',
        'Вітаю, колего!',
        'Кожен день — то історична мить!',
      ],
      relationship: {
        1: ['Сучасна Україна — то окрема епоха!'],
        2: ['Незалежність 1991 — переломний момент!'],
        3: ['Революція Гідності — то наша гордість!'],
        4: ['Разом до європейського майбутнього!'],
        5: ['Історія Євромайдану — то жива пам\'ять!'],
        6: ['Ти — історик нової доби!'],
      },
    },
    questIds: ['quest-modern-1', 'quest-modern-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_modern_1',
      3: 'quest-modern-1',
      4: 'region-maidan-unlock',
      5: 'artifact-modern-documents',
      6: 'bonus-historical-legacy',
    },
  },
];

// Story Quests - 100+ quests across 12 story arcs
export const storyQuests: StoryQuest[] = [
  // ========== ARC 1: TRYPILLIA ==========
  {
    id: 'arc1-quest-1',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.arc1_1.title',
    descriptionKey: 'quest.arc1_1.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 200 },
      { type: 'xp', amount: 50 },
    ],
    status: 'available',
    dialogue: {
      start: 'Трипільська культура — найдавніша цивілізація Європи! Почни дослідження!',
      progress: 'Розкопки просуваються...',
      complete: 'Перші знахідки надихають!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'arc1-quest-2',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.arc1_2.title',
    descriptionKey: 'quest.arc1_2.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 400 },
      { type: 'xp', amount: 100 },
    ],
    status: 'available',
    dialogue: {
      start: 'Знайди перші артефакти трипільської культури!',
      progress: 'Кераміка та статуетки розкривають таємниці...',
      complete: 'Чудово! Ти відкрив перші секрети!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc1-quest-3',
    npcId: 'story-museum-curator',
    titleKey: 'quest.arc1_3.title',
    descriptionKey: 'quest.arc1_3.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 3, current: 0 },
      { type: 'visit', target: 'museum', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 500 },
      { type: 'reputation', amount: 50 },
    ],
    status: 'available',
    dialogue: {
      start: 'Принеси трипільські артефакти до музею!',
      progress: 'Колекція зростає...',
      complete: 'Музей поповнився чудовими експонатами!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc1-quest-4',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.arc1_4.title',
    descriptionKey: 'quest.arc1_4.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 8, current: 0 },
      { type: 'collect', target: 'artifact', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 800 },
      { type: 'xp', amount: 200 },
      { type: 'academy_xp', amount: 30 },
    ],
    status: 'available',
    dialogue: {
      start: 'Продовжи дослідження трипільських поселень!',
      progress: 'Глибші шари історії розкриваються...',
      complete: 'Ти став справжнім дослідником Трипілля!',
    },
    requiredRelationshipLevel: 3,
  },

  // ========== ARC 2: SCYTHIA ==========
  {
    id: 'arc2-quest-1',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc2_1.title',
    descriptionKey: 'quest.arc2_1.description',
    objectives: [
      { type: 'expedition', target: 'region-2', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 350 },
      { type: 'xp', amount: 80 },
    ],
    status: 'available',
    dialogue: {
      start: 'Скіфи залишили скарби в степах! Шукай!',
      progress: 'Золото скіфів чекає на тебе...',
      complete: 'Чудова знахідка!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'arc2-quest-2',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc2_2.title',
    descriptionKey: 'quest.arc2_2.description',
    objectives: [
      { type: 'expedition', target: 'region-2', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 600 },
      { type: 'reputation', amount: 80 },
    ],
    status: 'available',
    dialogue: {
      start: 'Скіфське золото — ключ до розуміння минулого!',
      progress: 'Акінак та золоті прикраси...',
      complete: 'Скіфська спадщина розкрита!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc2-quest-3',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc2_3.title',
    descriptionKey: 'quest.arc2_3.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 4, current: 0 },
      { type: 'visit', target: 'museum', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 700 },
      { type: 'xp', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Документуй скіфські знахідки для нащадків!',
      progress: 'Літописи поповнюються...',
      complete: 'Історія збережена!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc2-quest-4',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc2_4.title',
    descriptionKey: 'quest.arc2_4.description',
    objectives: [
      { type: 'expedition', target: 'region-2', count: 8, current: 0 },
      { type: 'collect', target: 'artifact', count: 6, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1000 },
      { type: 'reputation', amount: 150 },
      { type: 'hero_fragment', amount: 5, itemId: 'hero-cossack-scout' },
    ],
    status: 'available',
    dialogue: {
      start: 'Збери унікальну колекцію скіфських артефактів!',
      progress: 'Кургани розкривають свої таємниці...',
      complete: 'Ти відкрив скарбницю скіфів!',
    },
    requiredRelationshipLevel: 3,
  },

  // ========== ARC 3: KYIV RUS ==========
  {
    id: 'arc3-quest-1',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc3_1.title',
    descriptionKey: 'quest.arc3_1.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 3, current: 0 },
      { type: 'speak', target: 'story-knyaz-vladimir', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 500 },
      { type: 'xp', amount: 120 },
    ],
    status: 'available',
    dialogue: {
      start: 'Слава Русі! Час дослідити князівські землі!',
      progress: 'Київські пагорби приховують багато таємниць...',
      complete: 'Ти гідний син Русі!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc3-quest-2',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc3_2.title',
    descriptionKey: 'quest.arc3_2.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 800 },
      { type: 'reputation', amount: 120 },
    ],
    status: 'available',
    dialogue: {
      start: 'Печерські монахи чекають на твою допомогу!',
      progress: 'Стародавні рукописи розкриваються...',
      complete: 'Печерська таємниця відкрита!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc3-quest-3',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc3_3.title',
    descriptionKey: 'quest.arc3_3.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 7, current: 0 },
      { type: 'collect', target: 'artifact', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1200 },
      { type: 'reputation', amount: 200 },
      { type: 'xp', amount: 300 },
    ],
    status: 'available',
    dialogue: {
      start: 'Київ — серце Русі! Збери його скарби!',
      progress: 'Кожен артефакт — це сторінка історії...',
      complete: 'Великі князі пишалися б тобою!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc3-quest-4',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc3_4.title',
    descriptionKey: 'quest.arc3_4.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 8, current: 0 },
      { type: 'visit', target: 'museum', count: 10, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1500 },
      { type: 'academy_xp', amount: 100 },
      { type: 'hero_fragment', amount: 10, itemId: 'hero-olga' },
    ],
    status: 'available',
    dialogue: {
      start: 'Створи експозицію Київської Русі!',
      progress: 'Музей перетворюється на скарбницю...',
      complete: 'Історія Русі ожила в музеї!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc3-quest-5',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc3_5.title',
    descriptionKey: 'quest.arc3_5.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 10, current: 0 },
      { type: 'collect', target: 'artifact', count: 10, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2000 },
      { type: 'reputation', amount: 500 },
      { type: 'artifact', amount: 1, itemId: 'artifact-rus-weapon' },
    ],
    status: 'available',
    dialogue: {
      start: 'Останнє завдання арки Русі!',
      progress: 'Великі часи Русі настають...',
      complete: 'Ти зберіг спадщину Київської Русі!',
    },
    requiredRelationshipLevel: 5,
  },

  // ========== ARC 4: COSSACKS ==========
  {
    id: 'arc4-quest-1',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_1.title',
    descriptionKey: 'quest.arc4_1.description',
    objectives: [
      { type: 'expedition', target: 'region-4', count: 3, current: 0 },
      { type: 'speak', target: 'story-hetman-khmelnytsky', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 600 },
      { type: 'xp', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Слава козакам! Дике Поле кличе героїв!',
      progress: 'Січ готується до походу...',
      complete: 'Ти справжній козак!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc4-quest-2',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_2.title',
    descriptionKey: 'quest.arc4_2.description',
    objectives: [
      { type: 'expedition', target: 'region-4', count: 5, current: 0 },
      { type: 'expedition', target: 'region-5', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 900 },
      { type: 'reputation', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Розшир козацькі дослідження на Запоріжжя!',
      progress: 'Запорозька Січ відкриває ворота...',
      complete: 'Козацька слава зростає!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc4-quest-3',
    npcId: 'story-museum-curator',
    titleKey: 'quest.arc4_3.title',
    descriptionKey: 'quest.arc4_3.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 6, current: 0 },
      { type: 'visit', target: 'museum', count: 8, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1000 },
      { type: 'xp', amount: 200 },
    ],
    status: 'available',
    dialogue: {
      start: 'Створи козацьку колекцію в музеї!',
      progress: 'Козацькі артефакти займають почесне місце...',
      complete: 'Козацька спадщина врятована!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc4-quest-4',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_4.title',
    descriptionKey: 'quest.arc4_4.description',
    objectives: [
      { type: 'expedition', target: 'region-4', count: 6, current: 0 },
      { type: 'expedition', target: 'region-5', count: 4, current: 0 },
      { type: 'collect', target: 'artifact', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1500 },
      { type: 'reputation', amount: 300 },
      { type: 'hero_fragment', amount: 15, itemId: 'hero-cossack-scout' },
    ],
    status: 'available',
    dialogue: {
      start: 'Час великих походів!',
      progress: 'Козаки здобувають перемоги...',
      complete: 'Січ пишається тобою, побратиме!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc4-quest-5',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_5.title',
    descriptionKey: 'quest.arc4_5.description',
    objectives: [
      { type: 'expedition', target: 'region-5', count: 8, current: 0 },
      { type: 'collect', target: 'artifact', count: 8, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2000 },
      { type: 'reputation', amount: 400 },
      { type: 'xp', amount: 500 },
    ],
    status: 'available',
    dialogue: {
      start: 'Останній похід козацької епохи!',
      progress: 'Дике Поле підкоряється тобі...',
      complete: 'Козацька доба увічнена!',
    },
    requiredRelationshipLevel: 5,
  },

  // ========== ARC 5: INDEPENDENCE ==========
  {
    id: 'arc5-quest-1',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc5_1.title',
    descriptionKey: 'quest.arc5_1.description',
    objectives: [
      { type: 'expedition', target: 'region-5', count: 5, current: 0 },
      { type: 'speak', target: 'story-knyaz-vladimir', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1000 },
      { type: 'xp', amount: 300 },
    ],
    status: 'available',
    dialogue: {
      start: 'Час об\'єднати всі знання про українські землі!',
      progress: 'Кожна епоха — це частина нашої історії...',
      complete: 'Ти об\'єднав історію України!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc5-quest-2',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc5_2.title',
    descriptionKey: 'quest.arc5_2.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 10, current: 0 },
      { type: 'visit', target: 'museum', count: 15, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1500 },
      { type: 'academy_xp', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Створи найбільшу колекцію української історії!',
      progress: 'Музей стає унікальним...',
      complete: 'Скарбниця України створена!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc5-quest-3',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc5_3.title',
    descriptionKey: 'quest.arc5_3.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 5, current: 0 },
      { type: 'expedition', target: 'region-2', count: 5, current: 0 },
      { type: 'expedition', target: 'region-3', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2000 },
      { type: 'reputation', amount: 400 },
    ],
    status: 'available',
    dialogue: {
      start: 'Експедиція через всі епохи української історії!',
      progress: 'Ти подорожуєш через тисячоліття...',
      complete: 'Кожна епоха розкрита!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc5-quest-4',
    npcId: 'story-museum-curator',
    titleKey: 'quest.arc5_4.title',
    descriptionKey: 'quest.arc5_4.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 15, current: 0 },
      { type: 'visit', target: 'museum', count: 20, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2500 },
      { type: 'xp', amount: 600 },
      { type: 'hero_fragment', amount: 20, itemId: 'hero-olga' },
    ],
    status: 'available',
    dialogue: {
      start: 'Фінальне завдання: створи музей історії України!',
      progress: 'Експонати з усіх епох збираються...',
      complete: 'Музей історії України — гордість нації!',
    },
    requiredRelationshipLevel: 5,
  },
  {
    id: 'arc5-finale',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc5_finale.title',
    descriptionKey: 'quest.arc5_finale.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 10, current: 0 },
      { type: 'expedition', target: 'region-2', count: 10, current: 0 },
      { type: 'expedition', target: 'region-3', count: 10, current: 0 },
      { type: 'expedition', target: 'region-4', count: 10, current: 0 },
      { type: 'expedition', target: 'region-5', count: 10, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 5000 },
      { type: 'reputation', amount: 1000 },
      { type: 'xp', amount: 1000 },
      { type: 'academy_xp', amount: 500 },
    ],
    status: 'available',
    dialogue: {
      start: 'Ти пройшов весь шлях через історію України! Фінальне випробування!',
      progress: 'Кожен регіон розкриває свої таємниці...',
      complete: 'Ти став справжнім Вартовим Часу!',
    },
    requiredRelationshipLevel: 5,
  },

  // ========== DAILY QUESTS ==========
  {
    id: 'daily-expedition-1',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.daily_expedition.title',
    descriptionKey: 'quest.daily_expedition.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 100 },
      { type: 'xp', amount: 30 },
    ],
    status: 'available',
    dialogue: {
      start: 'Щоденна експедиція чекає!',
      progress: 'Розкопки тривають...',
      complete: 'Добрий результат!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'daily-museum-1',
    npcId: 'story-museum-curator',
    titleKey: 'quest.daily_museum.title',
    descriptionKey: 'quest.daily_museum.description',
    objectives: [
      { type: 'visit', target: 'museum', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 50 },
      { type: 'reputation', amount: 10 },
    ],
    status: 'available',
    dialogue: {
      start: 'Відвідай музей сьогодні!',
      progress: 'Відвідувачі задоволені...',
      complete: 'Дякуємо за підтримку!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'daily-artifact-1',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.daily_artifact.title',
    descriptionKey: 'quest.daily_artifact.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 1, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 150 },
      { type: 'xp', amount: 50 },
    ],
    status: 'available',
    dialogue: {
      start: 'Знайди артефакт сьогодні!',
      progress: 'Пошук триває...',
      complete: 'Чудова знахідка!',
    },
    requiredRelationshipLevel: 1,
  },
];

// Initial story progress
export const initialStoryProgress: StoryProgress = {
  currentChapter: 1,
  completedChapters: [],
  activeQuests: [],
  completedQuests: [],
  npcRelationships: {},
  // Arc system - Arc 1 unlocked by default
  currentArc: 1,
  unlockedArcs: [1],
  completedArcs: [],
};

// Role colors for Story NPCs
export const storyNpcColors: Record<StoryNpcRole, string> = {
  knyaz: '#FFC72C',
  hetman: '#FF2A5F',
  researcher: '#00E5FF',
  archaeologist: '#00E5FF',
  historian: '#9747FF',
  guard: '#8B949E',
};
