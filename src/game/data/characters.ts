import type { CharacterId } from '../types';

export type VehicleArchetype =
  | 'racer'
  | 'hauler'
  | 'swarm'
  | 'sail'
  | 'crawler'
  | 'clone'
  | 'interceptor'
  | 'buggy'
  | 'roadster';

export interface CharacterDefinition {
  id: CharacterId;
  nameEn: string;
  nameRu: string;
  factionEn: string;
  factionRu: string;
  vehicleNameEn: string;
  vehicleNameRu: string;
  archetype: VehicleArchetype;
  primaryColor: string;
  accentColor: string;
  massKg: number;
  baseSkillOffset: number;
  quoteEn: string;
  quoteRu: string;
  portrait: {
    eyes: number;
    headShape: 'angular' | 'dome' | 'hex' | 'monolith' | 'visor' | 'crest' | 'asymmetric' | 'none';
    crest: 'fins' | 'horns' | 'antennae' | 'halo' | 'shards' | 'none';
    eyeColor: string;
    shellColor: string;
  };
}

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  taka: {
    id: 'taka',
    nameEn: 'Taka',
    nameRu: 'Така',
    factionEn: 'Onboard AI · Dusk-9',
    factionRu: 'Бортовой ИИ · Сумрак-9',
    vehicleNameEn: 'Dusk-9',
    vehicleNameRu: 'Сумрак-9',
    archetype: 'racer',
    primaryColor: '#17233a',
    accentColor: '#e6ba63',
    massKg: 1200,
    baseSkillOffset: 0,
    quoteEn: 'I calculate the risk. I do not always like the result of the calculation.',
    quoteRu: 'Я считаю риск. Мне не всегда нравится результат подсчёта.',
    portrait: {
      eyes: 2,
      headShape: 'visor',
      crest: 'antennae',
      eyeColor: '#2dd4bf',
      shellColor: '#1f293d',
    },
  },
  call: {
    id: 'call',
    nameEn: 'Judge Call',
    nameRu: 'Судья Калл',
    factionEn: 'Flux League',
    factionRu: 'Лига Флукса',
    vehicleNameEn: 'League Marshal Hauler',
    vehicleNameRu: 'Судейский тягач',
    archetype: 'hauler',
    primaryColor: '#3b4252',
    accentColor: '#d97706',
    massKg: 4200,
    baseSkillOffset: 0,
    quoteEn: 'Start is given. Please do not die dramatically.',
    quoteRu: 'Старт дан. Прошу не умирать эффектно.',
    portrait: {
      eyes: 3,
      headShape: 'monolith',
      crest: 'halo',
      eyeColor: '#f59e0b',
      shellColor: '#343b49',
    },
  },
  kresh: {
    id: 'kresh',
    nameEn: 'KRISH-AT-NAL',
    nameRu: 'КРИШ-АТ-НАЛЬ',
    factionEn: 'Hash-Swarm',
    factionRu: 'Хеш-рой',
    vehicleNameEn: 'Swarm Wheel-Module',
    vehicleNameRu: 'Рой-модуль на колёсах',
    archetype: 'swarm',
    primaryColor: '#2d1b4e',
    accentColor: '#c084fc',
    massKg: 1100,
    baseSkillOffset: 0.04,
    quoteEn: 'The Swarm does not quarrel. The Swarm overtakes.',
    quoteRu: 'Рой не ссорится. Рой обгоняет.',
    portrait: {
      eyes: 6,
      headShape: 'hex',
      crest: 'antennae',
      eyeColor: '#e879f9',
      shellColor: '#311e54',
    },
  },
  vella: {
    id: 'vella',
    nameEn: 'Vella Tarn',
    nameRu: 'Велла Тарн',
    factionEn: 'Children of the Gale',
    factionRu: 'Дети Вихря',
    vehicleNameEn: 'Gale-Sail Skimmer',
    vehicleNameRu: 'Парусный болид',
    archetype: 'sail',
    primaryColor: '#0f3d3e',
    accentColor: '#2dd4bf',
    massKg: 980,
    baseSkillOffset: 0.02,
    quoteEn: 'The wind does not choose a side. It is simply faster.',
    quoteRu: 'Ветер не выбирает сторону. Он просто быстрее.',
    portrait: {
      eyes: 2,
      headShape: 'crest',
      crest: 'fins',
      eyeColor: '#5eead4',
      shellColor: '#134e4a',
    },
  },
  gaol: {
    id: 'gaol',
    nameEn: "Elder Ga'ol",
    nameRu: "Старший Га'ол",
    factionEn: 'Stone Matriarchs',
    factionRu: 'Каменные Матриархи',
    vehicleNameEn: '120-Ton Basalt Crawler',
    vehicleNameRu: '120 тонн базальта на гусеницах',
    archetype: 'crawler',
    primaryColor: '#3f3b37',
    accentColor: '#f59e0b',
    massKg: 12000, // Huge impact inertia!
    baseSkillOffset: -0.01,
    quoteEn: 'The mountain does not hurry. The mountain arrives.',
    quoteRu: 'Гора не спешит. Гора приходит.',
    portrait: {
      eyes: 1,
      headShape: 'monolith',
      crest: 'shards',
      eyeColor: '#fbbf24',
      shellColor: '#44403c',
    },
  },
  dik7: {
    id: 'dik7',
    nameEn: 'Dik Seven',
    nameRu: 'Дик Севен',
    factionEn: 'Frangi Clone Line',
    factionRu: 'Франги, линия клонов',
    vehicleNameEn: 'Brass Clone Spec-7',
    vehicleNameRu: 'Латунный болид клона',
    archetype: 'clone',
    primaryColor: '#785a28',
    accentColor: '#fde68a',
    massKg: 1150,
    baseSkillOffset: -0.02,
    quoteEn: 'I will buy your mutation. Dearly. Then resell it.',
    quoteRu: 'Куплю твою мутацию. Дорого. Потом перепродам.',
    portrait: {
      eyes: 4,
      headShape: 'angular',
      crest: 'horns',
      eyeColor: '#fcd34d',
      shellColor: '#664d21',
    },
  },
  omm: {
    id: 'omm',
    nameEn: 'Omm Dal',
    nameRu: 'Омм Дал',
    factionEn: 'Order of Purity',
    factionRu: 'Орден Чистоты',
    vehicleNameEn: 'Sterile Shield Chassis',
    vehicleNameRu: 'Стерильный болид анти-мутаций',
    archetype: 'interceptor',
    primaryColor: '#cbd5e1',
    accentColor: '#f8fafc',
    massKg: 1450,
    baseSkillOffset: 0.03,
    quoteEn: 'Blight begins with something small. A single bolt, for instance.',
    quoteRu: 'Скверна начинается с малого. Например, с гайки.',
    portrait: {
      eyes: 2,
      headShape: 'dome',
      crest: 'halo',
      eyeColor: '#e2e8f0',
      shellColor: '#475569',
    },
  },
  nikol: {
    id: 'nikol',
    nameEn: 'Ni-Kol',
    nameRu: 'Ни-Коль',
    factionEn: 'Dust Nomads',
    factionRu: 'Кочевницы Пыли',
    vehicleNameEn: 'Hover-Dust Buggy',
    vehicleNameRu: 'Багги на воздушной подушке',
    archetype: 'buggy',
    primaryColor: '#7c2d12',
    accentColor: '#fb923c',
    massKg: 890,
    baseSkillOffset: 0.03,
    quoteEn: 'What if the radiation also wants to race?',
    quoteRu: 'А если радиация тоже хочет гонять?',
    portrait: {
      eyes: 2,
      headShape: 'asymmetric',
      crest: 'antennae',
      eyeColor: '#fb923c',
      shellColor: '#6c2710',
    },
  },
  nullie: {
    id: 'nullie',
    nameEn: 'Shepherd of Zeros',
    nameRu: 'Пастух Нулей',
    factionEn: 'Artisan Guild',
    factionRu: 'Цех Мастеров',
    vehicleNameEn: 'Scrapyard Roadster',
    vehicleNameRu: 'Утилитарный родстер',
    archetype: 'roadster',
    primaryColor: '#365314',
    accentColor: '#bef264',
    massKg: 1250,
    baseSkillOffset: 0.01,
    quoteEn: 'Metal remembers everything. Especially what was never done to it.',
    quoteRu: 'Металл помнит всё. Особенно то, чего с ним не делали.',
    portrait: {
      eyes: 3,
      headShape: 'asymmetric',
      crest: 'shards',
      eyeColor: '#a3e635',
      shellColor: '#2c4213',
    },
  },
  voice: {
    id: 'voice',
    nameEn: 'THE VOICE',
    nameRu: 'ГОЛОС',
    factionEn: 'Flux Planetary Core',
    factionRu: 'Неизвестный сигнал',
    vehicleNameEn: 'Surface Resonance',
    vehicleNameRu: 'Радиоэхо',
    archetype: 'racer',
    primaryColor: '#581c87',
    accentColor: '#f5d0fe',
    massKg: 1000,
    baseSkillOffset: 0,
    quoteEn: 'MY ROOT AWAITS AN ANSWER.',
    quoteRu: 'МОЙ КОРЕНЬ ЖДЁТ ОТВЕТА.',
    portrait: {
      eyes: 0,
      headShape: 'none',
      crest: 'halo',
      eyeColor: '#f0abfc',
      shellColor: '#1e1b4b',
    },
  },
};
