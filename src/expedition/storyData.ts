import { Rarity } from './data';

// NPC Roles for Story System
export type StoryNpcRole = 'knyaz' | 'hetman' | 'researcher' | 'archaeologist' | 'historian' | 'guard';

// NPC Relationship Level
export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

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
}

// NPC Story Data for MVP (5 NPCs)
export const storyNpcs: StoryNpc[] = [
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
        1: ['Ти цікавий мандрівник. Розкажи про себе.'],
        2: ['Твоя старанність не пройде непоміченою.'],
        3: ['Я радий бачити друга в моїх палатах.'],
        4: ['Ти показав себе гідним довіри!'],
        5: ['Разом ми відкриємо таємниці Русі!'],
      },
    },
    questIds: ['quest-vladimir-1', 'quest-vladimir-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_1',
      3: 'quest-vladimir-1',
      4: 'hero-olga-unlock',
      5: 'artifact-rus-weapon',
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
        1: ['Розкажи, що привело тебе сюди?'],
        2: ['Твоя цікавість до історії радує.'],
        3: ['Я задоволений твоєю працею.'],
        4: ['Монастирські таємниці відкриються тобі.'],
        5: ['Ти став частиною нашої спільноти!'],
      },
    },
    questIds: ['quest-monk-1', 'quest-monk-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_2',
      3: 'quest-monk-1',
      4: 'region-kyiv-hills-unlock',
      5: 'artifact-byzantine-icon',
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
    },
  },
];

// Story Quests
export const storyQuests: StoryQuest[] = [
  {
    id: 'quest-vladimir-1',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.vladimir_1.title',
    descriptionKey: 'quest.vladimir_1.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 3, current: 0 },
      { type: 'speak', target: 'story-knyaz-vladimir', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 500 },
      { type: 'reputation', amount: 100 },
      { type: 'academy_xp', amount: 50 },
    ],
    status: 'available',
    dialogue: {
      start: 'Мандрівнику, Русь потребує твоєї допомоги!',
      progress: 'Продовжуй дослідження, я спостерігаю за твоїми успіхами.',
      complete: 'Ти справжній син Русі! Прийми винагороду.',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'quest-vladimir-2',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.vladimir_2.title',
    descriptionKey: 'quest.vladimir_2.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'reputation', amount: 250 },
      { type: 'hero_fragment', amount: 10, itemId: 'hero-olga' },
    ],
    status: 'available',
    dialogue: {
      start: 'Час для великих свершінь!',
      progress: 'Кожна знахідка наближає нас до величі.',
      complete: 'Княгиня Ольга буде радима новим дослідженням!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'quest-monk-1',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.monk_1.title',
    descriptionKey: 'quest.monk_1.description',
    objectives: [
      { type: 'visit', target: 'museum', count: 5, current: 0 },
      { type: 'speak', target: 'story-monk-pereyaslav', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 300 },
      { type: 'reputation', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Бог требує служителів історії...',
      progress: 'Твоя відданість справі вселяє надію.',
      complete: 'Печерські таємниці відкриються для тебе.',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'quest-monk-2',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.monk_2.title',
    descriptionKey: 'quest.monk_2.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 4, current: 0 },
      { type: 'collect', target: 'artifact', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'reputation', amount: 300 },
      { type: 'artifact', amount: 1, itemId: 'artifact-byzantine-icon' },
    ],
    status: 'available',
    dialogue: {
      start: 'Знайди візантійські артефакти...',
      progress: 'Кожен документ — це ключ до минулого.',
      complete: 'Ці артефакти прикрасять наші книги!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'quest-khmelnytsky-1',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.khmelnytsky_1.title',
    descriptionKey: 'quest.khmelnytsky_1.description',
    objectives: [
      { type: 'expedition', target: 'region-4', count: 3, current: 0 },
      { type: 'expedition', target: 'region-5', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 800 },
      { type: 'reputation', amount: 200 },
    ],
    status: 'available',
    dialogue: {
      start: 'Козаки! Час показати світові нашу силу!',
      progress: 'Січ пишається твоїми перемогами!',
      complete: 'Гей, побратиме! Ти справжній козак!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'quest-khmelnytsky-2',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.khmelnytsky_2.title',
    descriptionKey: 'quest.khmelnytsky_2.description',
    objectives: [
      { type: 'expedition', target: 'region-5', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 4, current: 0 },
    ],
    rewards: [
      { type: 'hero_fragment', amount: 15, itemId: 'hero-cossack-scout' },
      { type: 'reputation', amount: 400 },
    ],
    status: 'available',
    dialogue: {
      start: 'Дике Поле кличе!',
      progress: 'Кожен похід — це слава козацтва!',
      complete: 'Разом ми будемо вільними!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'quest-archaeologist-1',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.archaeologist_1.title',
    descriptionKey: 'quest.archaeologist_1.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 600 },
      { type: 'reputation', amount: 120 },
      { type: 'academy_xp', amount: 100 },
    ],
    status: 'available',
    dialogue: {
      start: 'Трипільська культура — колиска Європи!',
      progress: 'Кожна знахідка розкриває таємниці!',
      complete: 'Твої дослідження внесуть внесок в науку!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'quest-curator-1',
    npcId: 'story-museum-curator',
    titleKey: 'quest.curator_1.title',
    descriptionKey: 'quest.curator_1.description',
    objectives: [
      { type: 'visit', target: 'museum', count: 10, current: 0 },
      { type: 'collect', target: 'artifact', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 400 },
      { type: 'reputation', amount: 180 },
    ],
    status: 'available',
    dialogue: {
      start: 'Музей потребує нових експонатів!',
      progress: 'Відвідувачі задоволені!',
      complete: 'Колекція розширюється!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'quest-curator-2',
    npcId: 'story-museum-curator',
    titleKey: 'quest.curator_2.title',
    descriptionKey: 'quest.curator_2.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 10, current: 0 },
      { type: 'visit', target: 'museum', count: 20, current: 0 },
    ],
    rewards: [
      { type: 'reputation', amount: 500 },
      { type: 'academy_xp', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Час для великої виставки!',
      progress: 'Експонати в безпеці під нашою опікою.',
      complete: 'Музей стане легендою!',
    },
    requiredRelationshipLevel: 4,
  },
];

// Initial story progress
export const initialStoryProgress: StoryProgress = {
  currentChapter: 1,
  completedChapters: [],
  activeQuests: [],
  completedQuests: [],
  npcRelationships: {},
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
