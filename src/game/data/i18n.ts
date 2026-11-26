import type { LanguageCode } from '../types';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  rtl?: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polski' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'fa', label: 'فارسی', rtl: true },
  { code: 'elvish', label: 'Quenya (Elvish)' },
  { code: 'orcish', label: 'Orkish (Black Speech)' },
];

export interface UiStrings {
  gameTitle: string;
  subtitle: string;
  newGame: string;
  continueGame: string;
  chapterSelect: string;
  garage: string;
  settings: string;
  fullscreen: string;
  exitFullscreen: string;
  difficulty: string;
  diffStory: string;
  diffClassic: string;
  diffApex: string;
  graphics: string;
  gfxLow: string;
  gfxMedium: string;
  gfxHigh: string;
  gfxUltra: string;
  language: string;
  controls: string;
  audio: string;
  volume: string;
  play: string;
  pause: string;
  nextTrack: string;
  resume: string;
  restartStage: string;
  returnMenu: string;
  confirmChapterLeave: string;
  confirmYes: string;
  confirmNo: string;
  startRace: string;
  nextStage: string;
  back: string;
  close: string;
  speed: string;
  lap: string;
  position: string;
  hull: string;
  dose: string;
  fluxite: string;
  reputation: string;
  traits: string;
  mutations: string;
  modules: string;
  engine: string;
  chassis: string;
  grip: string;
  armor: string;
  steering: string;
  suspension: string;
  upgrade: string;
  maxLevel: string;
  excise: string;
  locked: string;
  completed: string;
  available: string;
  freeSeason: string;
  act1: string;
  act2: string;
  act3: string;
  victory: string;
  dnfTitle: string;
  stageReward: string;
  placementReward: string;
  doseReward: string;
  totalEarned: string;
  fixatedTraits: string;
  resetCamera: string;
  drift: string;
  hop: string;
  fluxSurge: string;
  rebindHint: string;
  resetDefaults: string;
  controlHintLine: string;
  offTrackWarning: string;
  releaseVoice: string;
  activateSilencer: string;
  codex: string;
  fieldQuest: string;
  questBonus: string;
  loreWorld: string;
  biomesTab: string;
  racersTab: string;
  heraldTab: string;
  whisperRadar: string;
  memoryBeacons: string;
  speedStep: string;
  nearMisses: string;
  segment: string;
  routePointToPoint: string;
  routeQualifier: string;
  sponsorContract: string;
  artifactsShelf: string;
  etaLabel: string;
  cursorDriveActive: string;
}

const EN: UiStrings = {
  gameTitle: 'FLUX GP',
  subtitle: 'Metamorph Racers on a Living Planet',
  newGame: 'New Game',
  continueGame: 'Continue',
  chapterSelect: 'Chapter Select',
  garage: 'Garage',
  settings: 'Settings',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit Fullscreen',
  difficulty: 'Difficulty',
  diffStory: 'Narrative',
  diffClassic: 'Classic',
  diffApex: 'Apex Hazard',
  graphics: 'Graphics',
  gfxLow: 'Low',
  gfxMedium: 'Medium',
  gfxHigh: 'High',
  gfxUltra: 'Ultra',
  language: 'Language',
  controls: 'Controls',
  audio: 'Audio',
  volume: 'Volume',
  play: 'Play',
  pause: 'Pause',
  nextTrack: 'Next Track',
  resume: 'Resume',
  restartStage: 'Restart Heat',
  returnMenu: 'Main Menu',
  confirmChapterLeave: 'Current progress in this chapter will be lost. Proceed to Chapter Select?',
  confirmYes: 'Leave Race',
  confirmNo: 'Cancel',
  startRace: 'Start Race',
  nextStage: 'Next Stage',
  back: 'Back',
  close: 'Close',
  speed: 'KM/H',
  lap: 'LAP',
  position: 'POS',
  hull: 'HULL',
  dose: 'DOSE',
  fluxite: 'Fluxite',
  reputation: 'Reputation',
  traits: 'Permanent Traits',
  mutations: 'Mutation Codex',
  modules: 'Chassis Modules',
  engine: 'Engine',
  chassis: 'Chassis',
  grip: 'Traction',
  armor: 'Armor',
  steering: 'Steering',
  suspension: 'Suspension',
  upgrade: 'Upgrade',
  maxLevel: 'MAX',
  excise: 'Excise (150)',
  locked: 'Locked',
  completed: 'Completed',
  available: 'Available',
  freeSeason: 'Free Season',
  act1: 'Act I · Dust & Glory',
  act2: 'Act II · The Incident',
  act3: 'Act III · The Root',
  victory: 'Heat Complete',
  dnfTitle: 'Chassis Destroyed',
  stageReward: 'Stage Purse',
  placementReward: 'Placement Bonus',
  doseReward: 'Radiation Dose Bonus',
  totalEarned: 'Total Earned',
  fixatedTraits: 'Fixated Permanent Traits',
  resetCamera: 'Reset Camera',
  drift: 'Drift',
  hop: 'Jump / Hop',
  fluxSurge: 'Flux Surge',
  rebindHint: 'Click an action, then press any key or mouse button',
  resetDefaults: 'Reset Defaults',
  controlHintLine: 'W/S Throttle · A/D Steer · LMB+RMB Cursor Drive · Space Drift · RMB Hop · E Surge · C Cam · Esc Pause',
  offTrackWarning: 'OFF-TRACK DRAG',
  releaseVoice: 'Release the Voice',
  activateSilencer: 'Activate Silencer',
  codex: 'Flux Codex',
  fieldQuest: 'Field Quest',
  questBonus: 'Field Quest Bonus',
  loreWorld: 'Planet Flux',
  biomesTab: 'Biomes',
  racersTab: 'Racers',
  heraldTab: 'Herald',
  whisperRadar: 'Whisper Radar',
  memoryBeacons: 'Bolt Memorials',
  speedStep: 'STEP',
  nearMisses: 'Near-Misses',
  segment: 'SEG',
  routePointToPoint: 'Overland Route',
  routeQualifier: 'Qualifier Circuit',
  sponsorContract: 'Sponsor Contract',
  artifactsShelf: 'Artifacts & Trophy Shelf',
  etaLabel: 'ETA',
  cursorDriveActive: 'CURSOR DRIVE [LMB+RMB]',
};

const RU: UiStrings = {
  gameTitle: 'FLUX GP',
  subtitle: 'Гонки на машинках-метаморфах',
  newGame: 'Новая игра',
  continueGame: 'Продолжить',
  chapterSelect: 'Выбор главы',
  garage: 'Гараж',
  settings: 'Настройки',
  fullscreen: 'Полный экран',
  exitFullscreen: 'Оконный режим',
  difficulty: 'Сложность',
  diffStory: 'История',
  diffClassic: 'Классика',
  diffApex: 'Апекс-риск',
  graphics: 'Графика',
  gfxLow: 'Low',
  gfxMedium: 'Medium',
  gfxHigh: 'High',
  gfxUltra: 'Ultra',
  language: 'Язык',
  controls: 'Управление',
  audio: 'Аудио',
  volume: 'Громкость',
  play: 'Играть',
  pause: 'Пауза',
  nextTrack: 'Следующий трек',
  resume: 'Продолжить',
  restartStage: 'Перезапустить заезд',
  returnMenu: 'Главное меню',
  confirmChapterLeave: 'Текущий прогресс в этой главе будет потерян. Перейти к выбору главы?',
  confirmYes: 'Перейти',
  confirmNo: 'Отмена',
  startRace: 'Начать заезд',
  nextStage: 'Следующий этап',
  back: 'Назад',
  close: 'Закрыть',
  speed: 'КМ/Ч',
  lap: 'КРУГ',
  position: 'МЕСТО',
  hull: 'КОРПУС',
  dose: 'ДОЗА',
  fluxite: 'Флюксит',
  reputation: 'Репутация',
  traits: 'Закреплённые черты',
  mutations: 'Каталог мутаций',
  modules: 'Модули болида',
  engine: 'Двигатель',
  chassis: 'Шасси',
  grip: 'Сцепка',
  armor: 'Обвес',
  steering: 'Рулевая',
  suspension: 'Подвеска',
  upgrade: 'Улучшить',
  maxLevel: 'МАКС',
  excise: 'Вырезать (150)',
  locked: 'Закрыто',
  completed: 'Пройдено',
  available: 'Доступно',
  freeSeason: 'Вольный сезон',
  act1: 'Акт I · Пыль и слава',
  act2: 'Акт II · Инцидент',
  act3: 'Акт III · Корень',
  victory: 'Финиш принят',
  dnfTitle: 'Сход с трассы',
  stageReward: 'Этапная ставка',
  placementReward: 'Награда за место',
  doseReward: 'Премия за дозу',
  totalEarned: 'Итого получено',
  fixatedTraits: 'Закрепившиеся черты',
  resetCamera: 'Сброс камеры',
  drift: 'Дрифт',
  hop: 'Прыжок',
  fluxSurge: 'Рывок Флукса',
  rebindHint: 'Нажмите на действие, затем клавишу или кнопку мыши',
  resetDefaults: 'Сбросить по умолчанию',
  controlHintLine: 'W/S Газ · A/D Руль · ЛКМ+ПКМ Курсор · Пробел Дрифт · ПКМ Прыжок · E Рывок · C Камера · Esc Пауза',
  offTrackWarning: 'ОБОЧИНА · ТОРМОЖЕНИЕ',
  releaseVoice: 'Отпустить Голос',
  activateSilencer: 'Активировать глушитель',
  codex: 'Кодекс Флукса',
  fieldQuest: 'Задание этапа',
  questBonus: 'Премия за задание',
  loreWorld: 'Планета Флукс',
  biomesTab: 'Биомы',
  racersTab: 'Пилоты',
  heraldTab: 'Вестник',
  whisperRadar: 'Радар Шёпота',
  memoryBeacons: 'Имена на болтах',
  speedStep: 'СТУПЕНЬ',
  nearMisses: 'Опасные обгоны',
  segment: 'УЧ.',
  routePointToPoint: 'Перегон А → Б',
  routeQualifier: 'Квалификация',
  sponsorContract: 'Контракт спонсора',
  artifactsShelf: 'Полка артефактов и трофеев',
  etaLabel: 'ОСТ',
  cursorDriveActive: 'ВЕДЕНИЕ КУРСОРОМ [ЛКМ+ПКМ]',
};

const PARTIAL_TRANSLATIONS: Record<Exclude<LanguageCode, 'en' | 'ru'>, Partial<UiStrings>> = {
  uk: {
    subtitle: 'Перегони на машинах-метаморфах',
    newGame: 'Нова гра',
    continueGame: 'Продовжити',
    chapterSelect: 'Вибір глави',
    garage: 'Гараж',
    settings: 'Налаштування',
    fullscreen: 'На весь екран',
    difficulty: 'Складність',
    diffClassic: 'Класика',
    graphics: 'Графіка',
    language: 'Мова',
    controls: 'Керування',
    resume: 'Продовжити',
    startRace: 'Старт заїзду',
    returnMenu: 'Головне меню',
    confirmChapterLeave: 'Поточний прогрес у цій главі буде втрачено. Перейти до вибору глави?',
    confirmYes: 'Перейти',
    confirmNo: 'Скасувати',
    speed: 'КМ/Г',
    lap: 'КОЛО',
    position: 'ПОЗ',
    hull: 'КОРПУС',
    dose: 'ДОЗА',
    fluxite: 'Флюксит',
    reputation: 'Репутація',
  },
  fr: {
    subtitle: 'Courses métamorphes sur une planète vivante',
    newGame: 'Nouvelle partie',
    continueGame: 'Continuer',
    chapterSelect: 'Chapitres',
    garage: 'Garage',
    settings: 'Paramètres',
    fullscreen: 'Plein écran',
    difficulty: 'Difficulté',
    diffClassic: 'Classique',
    graphics: 'Graphismes',
    language: 'Langue',
    controls: 'Contrôles',
    resume: 'Reprendre',
    startRace: 'Départ',
    returnMenu: 'Menu principal',
    confirmChapterLeave: 'La progression actuelle sera perdue. Aller au choix du chapitre ?',
    confirmYes: 'Quitter',
    confirmNo: 'Annuler',
    speed: 'KM/H',
    lap: 'TOUR',
    position: 'POS',
    hull: 'COQUE',
    dose: 'DOSE',
  },
  de: {
    subtitle: 'Metamorph-Rennen auf einem lebenden Planeten',
    newGame: 'Neues Spiel',
    continueGame: 'Fortsetzen',
    chapterSelect: 'Kapitelwahl',
    garage: 'Werkstatt',
    settings: 'Einstellungen',
    fullscreen: 'Vollbild',
    difficulty: 'Schwierigkeit',
    diffClassic: 'Klassisch',
    graphics: 'Grafik',
    language: 'Sprache',
    controls: 'Steuerung',
    resume: 'Fortsetzen',
    startRace: 'Rennen starten',
    returnMenu: 'Hauptmenü',
    confirmChapterLeave: 'Der aktuelle Fortschritt geht verloren. Zur Kapitelwahl wechseln?',
    confirmYes: 'Verlassen',
    confirmNo: 'Abbrechen',
    speed: 'KM/H',
    lap: 'RUNDE',
    position: 'POS',
    hull: 'HÜLLE',
    dose: 'DOSIS',
  },
  es: {
    subtitle: 'Carreras metamórficas en un planeta vivo',
    newGame: 'Nueva partida',
    continueGame: 'Continuar',
    chapterSelect: 'Capítulos',
    garage: 'Garaje',
    settings: 'Ajustes',
    fullscreen: 'Pantalla completa',
    difficulty: 'Dificultad',
    diffClassic: 'Clásico',
    graphics: 'Gráficos',
    language: 'Idioma',
    controls: 'Controles',
    resume: 'Reanudar',
    startRace: 'Iniciar carrera',
    returnMenu: 'Menú principal',
    confirmChapterLeave: 'Se perderá el progreso actual del capítulo. ¿Ir a selección de capítulos?',
    confirmYes: 'Salir',
    confirmNo: 'Cancelar',
  },
  pt: {
    subtitle: 'Corridas metamórficas num planeta vivo',
    newGame: 'Novo Jogo',
    continueGame: 'Continuar',
    chapterSelect: 'Capítulos',
    garage: 'Garagem',
    settings: 'Definições',
    fullscreen: 'Ecrã inteiro',
    difficulty: 'Dificuldade',
    diffClassic: 'Clássico',
    graphics: 'Gráficos',
    language: 'Idioma',
    controls: 'Controlos',
    resume: 'Retomar',
    startRace: 'Iniciar Corrida',
    returnMenu: 'Menu Principal',
  },
  it: {
    subtitle: 'Corse metamorfiche su un pianeta vivente',
    newGame: 'Nuova partita',
    continueGame: 'Continua',
    chapterSelect: 'Capitoli',
    garage: 'Garage',
    settings: 'Impostazioni',
    fullscreen: 'Schermo intero',
    difficulty: 'Difficoltà',
    diffClassic: 'Classica',
    graphics: 'Grafica',
    language: 'Lingua',
    controls: 'Comandi',
    resume: 'Riprendi',
    startRace: 'Avvia gara',
    returnMenu: 'Menu principale',
  },
  pl: {
    subtitle: 'Wyścigi metamorficzne na żywej planecie',
    newGame: 'Nowa gra',
    continueGame: 'Kontynuuj',
    chapterSelect: 'Wybór rozdziału',
    garage: 'Garaż',
    settings: 'Ustawienia',
    fullscreen: 'Pełny ekran',
    difficulty: 'Poziom trudności',
    diffClassic: 'Klasyczny',
    graphics: 'Grafika',
    language: 'Język',
    controls: 'Sterowanie',
    resume: 'Wznów',
    startRace: 'Start wyścigu',
    returnMenu: 'Menu główne',
  },
  zh: {
    subtitle: '活体行星上的异变赛车',
    newGame: '新游戏',
    continueGame: '继续',
    chapterSelect: '章节选择',
    garage: '车库',
    settings: '设置',
    fullscreen: '全屏',
    difficulty: '难度',
    diffClassic: '经典',
    graphics: '画质',
    language: '语言',
    controls: '控制',
    resume: '继续游戏',
    startRace: '开始比赛',
    returnMenu: '主菜单',
    speed: 'KM/H',
    lap: '圈数',
    position: '名次',
    hull: '耐久',
    dose: '辐射值',
  },
  ja: {
    subtitle: '生ける惑星での変異マシンレース',
    newGame: 'ニューゲーム',
    continueGame: 'コンティニュー',
    chapterSelect: 'チャプター選択',
    garage: 'ガレージ',
    settings: '設定',
    fullscreen: 'フルスクリーン',
    difficulty: '難易度',
    diffClassic: 'クラシック',
    graphics: 'グラフィック',
    language: '言語',
    controls: '操作',
    resume: '再開',
    startRace: 'レース開始',
    returnMenu: 'メインメニュー',
    speed: 'KM/H',
    lap: '周回',
    position: '順位',
    hull: '耐久',
    dose: '線量',
  },
  vi: {
    subtitle: 'Đua xe biến dị trên hành tinh sống',
    newGame: 'Trò chơi mới',
    continueGame: 'Tiếp tục',
    chapterSelect: 'Chọn chương',
    garage: 'Nhà xe',
    settings: 'Cài đặt',
    fullscreen: 'Toàn màn hình',
    difficulty: 'Độ khó',
    diffClassic: 'Cổ điển',
    graphics: 'Đồ họa',
    language: 'Ngôn ngữ',
    controls: 'Điều khiển',
    resume: 'Tiếp tục',
    startRace: 'Bắt đầu đua',
    returnMenu: 'Menu chính',
  },
  ar: {
    subtitle: 'سباقات التحول على كوكب حي',
    newGame: 'لعبة جديدة',
    continueGame: 'متابعة',
    chapterSelect: 'اختيار الفصل',
    garage: 'المرآب',
    settings: 'الإعدادات',
    fullscreen: 'ملء الشاشة',
    difficulty: 'الصعوبة',
    diffClassic: 'كلاسيكي',
    graphics: 'الرسوميات',
    language: 'اللغة',
    controls: 'التحكم',
    resume: 'استئناف',
    startRace: 'بدء السباق',
    returnMenu: 'القائمة الرئيسية',
    confirmChapterLeave: 'سيتم فقدان التقدم الحالي في هذا الفصل. هل تريد الانتقال إلى اختيار الفصول؟',
    confirmYes: 'مغادرة',
    confirmNo: 'إلغاء',
  },
  fa: {
    subtitle: 'مسابقات دگرگونی بر سیاره زنده',
    newGame: 'بازی جدید',
    continueGame: 'ادامه',
    chapterSelect: 'انتخاب فصل',
    garage: 'گاراژ',
    settings: 'تنظیمات',
    fullscreen: 'تمام صفحه',
    difficulty: 'سختی',
    diffClassic: 'کلاسیک',
    graphics: 'گرافیک',
    language: 'زبان',
    controls: 'کنترل‌ها',
    resume: 'ادامه',
    startRace: 'شروع مسابقه',
    returnMenu: 'منوی اصلی',
  },
  elvish: {
    subtitle: 'Nornë Rámar Arda Cuilë',
    newGame: 'Vanya Tyalië',
    continueGame: 'Vorima',
    chapterSelect: 'Quenta Corma',
    garage: 'Tano-mar',
    settings: 'Panyë',
    fullscreen: 'Ilqua Ceno',
    difficulty: 'Nwalmë',
    diffClassic: 'Yára',
    graphics: 'Alcar',
    language: 'Lambë',
    controls: 'Mahta',
    resume: 'Nórië',
    startRace: 'Áva Tyalë!',
    returnMenu: 'Mettalë',
    speed: 'LIN',
    lap: 'COR',
    position: 'MIN',
    hull: 'ANGWË',
    dose: 'SILMË',
  },
  orcish: {
    subtitle: 'Goth-Kart Blood & Rust Run',
    newGame: 'Fresh Smash',
    continueGame: 'Keep Krumpin',
    chapterSelect: 'War Trails',
    garage: 'Scrap Pit',
    settings: 'Gear Rig',
    fullscreen: 'Big Eye',
    difficulty: 'Brutality',
    diffClassic: 'Proper Scrap',
    graphics: 'Shine',
    language: 'Tongue',
    controls: 'Binds',
    resume: 'Back to Scrap',
    startRace: 'WAAAGH! Drive!',
    returnMenu: 'Boss Tent',
    speed: 'ZOOM',
    lap: 'ROUND',
    position: 'RANK',
    hull: 'PLATE',
    dose: 'GLOW',
  },
};

export function getUiStrings(lang: LanguageCode): UiStrings {
  if (lang === 'en') return EN;
  if (lang === 'ru') return RU;
  return { ...EN, ...(PARTIAL_TRANSLATIONS[lang] ?? {}) };
}

export function isRtlLanguage(lang: LanguageCode): boolean {
  return lang === 'ar' || lang === 'fa';
}

export function pickLoc(lang: LanguageCode, en: string, ru: string): string {
  if (lang === 'ru' || lang === 'uk') return ru;
  return en;
}
