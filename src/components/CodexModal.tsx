import React, { useState } from 'react';
import { BookOpen, Globe2, MapPin, Maximize2, Minimize2, Newspaper, Sparkles, Users, X } from 'lucide-react';
import { CHARACTERS } from '../game/data/characters';
import { pickLoc, type UiStrings } from '../game/data/i18n';
import { ALL_MUTATION_IDS, MUTATIONS } from '../game/data/mutations';
import { buildHeraldDispatches } from '../game/rules';
import type { BiomeId, CharacterId, SaveState } from '../game/types';
import { RacePortrait } from './RacePortrait';

interface CodexModalProps {
  save: SaveState;
  strings: UiStrings;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

type CodexTab = 'lore' | 'herald' | 'biomes' | 'racers' | 'mutations';

interface BiomeDossier {
  id: BiomeId;
  color: string;
  nameEn: string;
  nameRu: string;
  hazardEn: string;
  hazardRu: string;
  descEn: string;
  descRu: string;
}

const BIOME_DOSSIERS: BiomeDossier[] = [
  {
    id: 'crystal',
    color: '#38bdf8',
    nameEn: 'Crystal Basin',
    nameRu: 'Кристальный бассейн',
    hazardEn: 'Intensity ×1.0 · Piezo Reflections',
    hazardRu: 'Интенсивность ×1.0 · Пьезо-отражения',
    descEn: 'Glassy basalt salt flats pierced by resonant quartz spires. Where League Marshals hold opening qualifiers.',
    descRu: 'Стеклянные базальтовые плато с резонансными шпилями кварца. Место проведения стартовых заездов Лиги.',
  },
  {
    id: 'canyon',
    color: '#f59e0b',
    nameEn: 'Red Rust Canyons',
    nameRu: 'Каньоны красной ржавчины',
    hazardEn: 'Intensity ×1.2 · Thermal Updrafts',
    hazardRu: 'Интенсивность ×1.2 · Термальные потоки',
    descEn: 'Iron-rich gorges carved by oxidized rivers. Dust Nomads weave around jagged monoliths at redline.',
    descRu: 'Железистые ущелья, прорезанные реками оксида. Кочевницы Пыли лавируют между базальтовыми столбами.',
  },
  {
    id: 'spore',
    color: '#34d399',
    nameEn: 'Spore Gardens',
    nameRu: 'Сады спор',
    hazardEn: 'Intensity ×1.5 · Bio-Luminescent Flux',
    hazardRu: 'Интенсивность ×1.5 · Биолюминесцентный Флукс',
    descEn: 'Humid canyons overgrown with radiant silicon flora. Alloy hulls metabolize mutations twice as fast here.',
    descRu: 'Влажные каньоны с кремниевой флорой. Живой сплав машин мутирует здесь с удвоенной скоростью.',
  },
  {
    id: 'storm',
    color: '#818cf8',
    nameEn: 'Ionic Stormfront',
    nameRu: 'Полоса ионного шторма',
    hazardEn: 'Intensity ×1.8 · Arc Discharges & Fog',
    hazardRu: 'Интенсивность ×1.8 · Грозовые дуги и туман',
    descEn: 'Static lightning blankets oxidized dunes while Order of Purity drones patrol the outer perimeter.',
    descRu: 'Статические разряды накрывают дюны, а дроны Ордена Чистоты патрулируют внешний периметр.',
  },
  {
    id: 'needle',
    color: '#e6ba63',
    nameEn: 'The Needle Approach',
    nameRu: 'Подступы к Игле',
    hazardEn: 'Intensity ×2.1 · Harmonic Resonance',
    hazardRu: 'Интенсивность ×2.1 · Гармонический резонанс',
    descEn: 'Concentric obsidian rings encircling the planetary antenna. Every telemetry channel echoes with the Voice.',
    descRu: 'Концентрические обсидиановые кольца вокруг планетарной антенны. Каждый канал связи отзывается Голосом.',
  },
  {
    id: 'epicenter',
    color: '#f0abfc',
    nameEn: 'The Root Epicenter',
    nameRu: 'Эпицентр Корня',
    hazardEn: 'Intensity ×2.5 · Direct Core Field',
    hazardRu: 'Интенсивность ×2.5 · Прямое поле Ядра',
    descEn: 'Beneath the shattered crust where the planet dreams in molten fluxite and living metal.',
    descRu: 'Глубинный разлом под корой, где планета видит сны в расплавленном флуксите и живом металле.',
  },
];

const ALL_CHARACTER_IDS: CharacterId[] = [
  'taka',
  'call',
  'kresh',
  'vella',
  'gaol',
  'dik7',
  'omm',
  'nikol',
  'nullie',
  'voice',
];

export const CodexModal: React.FC<CodexModalProps> = ({
  save,
  strings,
  isFullscreen,
  onToggleFullscreen,
  onClose,
}) => {
  const [tab, setTab] = useState<CodexTab>('lore');

  const tabs: Array<{ id: CodexTab; label: string; icon: React.ReactNode }> = [
    { id: 'lore', label: strings.loreWorld, icon: <Globe2 className="w-3.5 h-3.5" /> },
    { id: 'herald', label: strings.heraldTab, icon: <Newspaper className="w-3.5 h-3.5" /> },
    { id: 'biomes', label: strings.biomesTab, icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'racers', label: strings.racersTab, icon: <Users className="w-3.5 h-3.5" /> },
    {
      id: 'mutations',
      label: `${strings.mutations} (${save.discoveredMutations.length}/13)`,
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-black/75">
      <div className="flux-panel rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-amber-500/25">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <h2 className="text-xl font-display text-amber-100">{strings.codex}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
              className="flux-btn w-9 h-9 rounded flex items-center justify-center"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={strings.close}
              className="flux-btn w-9 h-9 rounded flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 px-6 pt-3 pb-2 border-b border-amber-500/15 bg-[#0c101a]">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded text-xs font-display flex items-center gap-1.5 border transition-colors ${
                  active
                    ? 'bg-amber-600/30 border-amber-400 text-amber-50'
                    : 'bg-[#111624] border-amber-500/20 text-amber-100/70 hover:text-amber-100'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flux-scroll p-6 space-y-5">
          {tab === 'lore' && (
            <div className="space-y-4 text-sm text-amber-100/85 leading-relaxed">
              <div className="bg-[#111624] border border-amber-500/25 rounded-md p-4 space-y-2">
                <h3 className="font-display text-base text-amber-300">
                  {pickLoc(save.language, 'Planet Flux & The Living Alloy', 'Планета Флукс и Живой Сплав')}
                </h3>
                <p>
                  {pickLoc(
                    save.language,
                    'Forty solar cycles ago, the outer crust of Planet Flux fractured, releasing ionized Fluxite dust and resonant magnetic tides. Every metallic vehicle forged on its surface gradually awakens—rewiring engines, growing aerodynamic fins, and shedding oxidized armor under radiation dose.',
                    'Сорок солнечных циклов назад кора планеты Флукс дала трещину, высвободив ионизированную пыль флуксита и резонансные магнитные приливы. Любой металлический болид, собранный на поверхности, постепенно пробуждается: перестраивает двигатель, отращивает аэродинамические плавники и сбрасывает повреждённую броню.',
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#111624] border border-teal-500/25 rounded-md p-4 space-y-1.5">
                  <div className="font-display text-xs text-teal-300 tracking-wider uppercase">
                    {pickLoc(save.language, 'Chassis Dusk-9 & Taka', 'Шасси Сумрак-9 и Така')}
                  </div>
                  <p className="text-xs text-amber-100/80">
                    {pickLoc(
                      save.language,
                      'Forged by the Artisan Guild and piloted alongside Taka—an adaptive telemetry mind who measures radiation risk to the third decimal yet still refuses to lift off the throttle.',
                      'Созданный в Цехе Мастеров болид Сумрак-9 под управлением бортового ИИ Таки. Он рассчитывает радиационный риск с точностью до тысячных долей, но не сбрасывает газ на входе в поворот.',
                    )}
                  </p>
                </div>

                <div className="bg-[#111624] border border-fuchsia-500/25 rounded-md p-4 space-y-1.5">
                  <div className="font-display text-xs text-fuchsia-300 tracking-wider uppercase">
                    {pickLoc(save.language, 'The Needle & The Voice', 'Игла и Голос')}
                  </div>
                  <p className="text-xs text-amber-100/80">
                    {pickLoc(
                      save.language,
                      'At the center of the Grand Circuit stands the Needle Spire. The Order of Purity seeks to silence its core forever, while Nomads believe the planet uses the Grand Prix to speak.',
                      'В центре Большого Кольца возвышается шпиль Иглы. Орден Чистоты стремится заглушить ядро навеки, тогда как Кочевницы верят, что сама планета разговаривает с миром через Гран-при.',
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-[#0d121c] border border-amber-500/20 rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
                <span>
                  {strings.reputation}: <strong className="text-amber-300">{save.reputation}/100</strong>
                </span>
                <span>
                  {strings.completed}: <strong className="text-teal-300">{save.completedChapters.length}/15</strong>
                </span>
                <span>
                  {strings.traits}: <strong className="text-amber-200">{save.permanentTraits.length}/6</strong>
                </span>
                <span>
                  Artifacts: <strong className="text-fuchsia-300">{save.artifacts.length}</strong>
                </span>
              </div>
            </div>
          )}

          {tab === 'herald' && (
            <div className="space-y-3">
              {buildHeraldDispatches(
                save.completedChapters,
                save.reputation,
                save.storyFlags,
              ).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#111624] border border-amber-500/25 rounded-md p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs sm:text-sm font-bold text-amber-200">
                      {pickLoc(save.language, item.headlineEn, item.headlineRu)}
                    </span>
                    <span
                      className={`text-[10px] font-display uppercase px-2 py-0.5 rounded border ${
                        item.tag === 'anomaly'
                          ? 'bg-teal-950/60 border-teal-500/40 text-teal-200'
                          : item.tag === 'rumor'
                            ? 'bg-fuchsia-950/50 border-fuchsia-400/40 text-fuchsia-200'
                            : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/80 leading-relaxed">
                    {pickLoc(save.language, item.bodyEn, item.bodyRu)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'biomes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {BIOME_DOSSIERS.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#111624] border border-amber-500/25 rounded-md p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold" style={{ color: b.color }}>
                      {pickLoc(save.language, b.nameEn, b.nameRu)}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                  </div>
                  <div className="text-[11px] font-display text-amber-200/75">
                    {pickLoc(save.language, b.hazardEn, b.hazardRu)}
                  </div>
                  <p className="text-xs text-amber-100/75 leading-relaxed">
                    {pickLoc(save.language, b.descEn, b.descRu)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'racers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {ALL_CHARACTER_IDS.map((cid) => {
                const c = CHARACTERS[cid];
                return (
                  <div
                    key={cid}
                    className="bg-[#111624] border border-amber-500/25 rounded-md p-3.5 flex items-start gap-3"
                  >
                    <RacePortrait characterId={cid} size={52} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-sm font-bold text-amber-100">
                          {pickLoc(save.language, c.nameEn, c.nameRu)}
                        </span>
                        <span className="text-[10px] text-amber-200/65 tabular-nums">
                          {c.massKg} kg
                        </span>
                      </div>
                      <div className="text-[11px] font-display text-teal-300/85">
                        {pickLoc(save.language, c.factionEn, c.factionRu)} ·{' '}
                        {pickLoc(save.language, c.vehicleNameEn, c.vehicleNameRu)}
                      </div>
                      <p className="text-xs text-amber-100/70 italic mt-1">
                        “{pickLoc(save.language, c.quoteEn, c.quoteRu)}”
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'mutations' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_MUTATION_IDS.map((mId) => {
                const m = MUTATIONS[mId];
                const found = save.discoveredMutations.includes(mId);
                return (
                  <div
                    key={mId}
                    className={`p-3 rounded-md border text-xs ${
                      found
                        ? 'bg-[#121725] border-amber-500/30'
                        : 'bg-[#0b0e17] border-slate-800/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-display font-bold"
                        style={{ color: found ? m.colorHex : '#64748b' }}
                      >
                        {found ? pickLoc(save.language, m.nameEn, m.nameRu) : '???'}
                      </span>
                      <span className="text-[10px] font-display uppercase px-1.5 py-0.5 rounded bg-black/35 text-amber-200/75">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-amber-100/70 mt-1">
                      {found
                        ? pickLoc(save.language, m.descEn, m.descRu)
                        : pickLoc(
                            save.language,
                            'Drive through ionized Flux zones to isolate this strain.',
                            'Проедьте через ионизированные зоны Флукса, чтобы зафиксировать мутацию.',
                          )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
