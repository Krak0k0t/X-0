import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from './game/audio/AudioEngine';
import {
  CAMPAIGN_STAGES,
  EPILOGUE_ASLEEP_LINES,
  EPILOGUE_AWAKE_LINES,
  FINALE_PROMPT_LINES,
  getStageById,
  resolveStageEffectiveConfig,
} from './game/data/campaign';
import { getUiStrings, isRtlLanguage, pickLoc } from './game/data/i18n';
import { getPlanetaryLegMeta, isPointToPointStage } from './game/data/planetaryRoutes';
import {
  calculateRaceRewards,
  completeChapterProgression,
  createInitialSaveState,
  discoverMutation,
  evaluateSponsorContract,
  exciseTrait,
  getNextStageId,
  loadSaveState,
  persistSaveState,
  prepareChapterEntryState,
  rollPermanentTraits,
  upgradeModule,
} from './game/rules';
import { RaceEngine3D } from './game/scene/RaceEngine3D';
import type {
  AppScreen,
  ControlBindings,
  DifficultyLevel,
  GraphicsLevel,
  LanguageCode,
  MutationId,
  RaceFinishResult,
  RaceHudSnapshot,
  SaveState,
  SponsorId,
  StageChoiceOption,
  StageConfig,
  UpgradeModules,
} from './game/types';
import { ChapterSelectModal } from './components/ChapterSelectModal';
import { CodexModal } from './components/CodexModal';
import { DialogueOverlay } from './components/DialogueOverlay';
import { GaragePanel } from './components/GaragePanel';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { RaceHUD } from './components/RaceHUD';
import { RaceResultsModal } from './components/RaceResultsModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [save, setSave] = useState<SaveState>(() => loadSaveState());
  const [screen, setScreen] = useState<AppScreen>('title');
  const [activeStageId, setActiveStageId] = useState<string>('1_1');
  const [paused, setPaused] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTrackIndex, setAudioTrackIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [finaleChoice, setFinaleChoice] = useState<'awake' | 'asleep' | null>(null);
  const [hud, setHud] = useState<RaceHudSnapshot | null>(null);
  const [raceResult, setRaceResult] = useState<RaceFinishResult | null>(null);

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RaceEngine3D | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const activeStageIdRef = useRef(activeStageId);
  activeStageIdRef.current = activeStageId;

  const strings = useMemo(() => getUiStrings(save.language), [save.language]);

  const activeStage: StageConfig = useMemo(() => {
    const raw = getStageById(activeStageId, save.freeSeasonWins);
    return resolveStageEffectiveConfig(raw, save.storyFlags);
  }, [activeStageId, save.freeSeasonWins, save.storyFlags]);

  // Persist save changes & sync RTL / graphics body attributes
  useEffect(() => {
    persistSaveState(save);
    document.documentElement.dir = isRtlLanguage(save.language) ? 'rtl' : 'ltr';
    document.documentElement.lang = save.language;
    document.body.dataset.graphics = save.graphics;
  }, [save]);

  // Mirror game state machine to document.body.dataset.state
  useEffect(() => {
    if (screen === 'race') {
      if (raceResult) {
        document.body.dataset.state = 'gameover';
      } else if (paused) {
        document.body.dataset.state = 'paused';
      } else {
        document.body.dataset.state = 'playing';
      }
    } else if (screen === 'title') {
      document.body.dataset.state = 'title';
    } else {
      document.body.dataset.state = screen;
    }
  }, [screen, paused, raceResult]);

  // Fullscreen listener
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    audioRef.current?.playUiClick(1.1);
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Initialize AudioEngine & RaceEngine3D ONCE
  useEffect(() => {
    const audio = new AudioEngine();
    audio.setVolume(saveRef.current.audioVolume);
    audio.setMuted(saveRef.current.audioMuted);
    audioRef.current = audio;

    if (!canvasMountRef.current) return;

    const engine = new RaceEngine3D(
      canvasMountRef.current,
      audio,
      saveRef.current.bindings,
      saveRef.current.graphics,
      {
        onHudUpdate: (snapshot) => {
          setHud(snapshot);
        },
        onMutationDiscovered: (mutId) => {
          setSave((prev) => discoverMutation(prev, mutId));
        },
        onPauseRequested: () => {
          setPaused((prev) => {
            const next = !prev;
            engineRef.current?.setPaused(next);
            return next;
          });
        },
        onRaceFinish: (rawResult) => {
          const curSave = saveRef.current;
          const stage = resolveStageEffectiveConfig(
            getStageById(activeStageIdRef.current, curSave.freeSeasonWins),
            curSave.storyFlags,
          );
          const rewards = calculateRaceRewards({
            stageBaseReward: stage.baseReward,
            placement: rawResult.placement,
            dose: rawResult.totalDose,
            doubleDoseBonus: stage.doubleDoseBonus,
            dnf: rawResult.dnf,
            difficulty: curSave.difficulty,
          });

          const forceStage2Chromo = stage.id === '1_2';
          const traitRoll = rawResult.dnf
            ? { nextTraits: curSave.permanentTraits, newlyFixated: [], displaced: [] }
            : rollPermanentTraits(
                rawResult.sessionBoons,
                curSave.permanentTraits,
                forceStage2Chromo,
              );

          const hullPct =
            (rawResult.damageReport.engine +
              rawResult.damageReport.steering +
              rawResult.damageReport.suspension +
              rawResult.damageReport.armor) /
            4;
          const sponsorEval = evaluateSponsorContract(curSave.activeSponsor, {
            dnf: rawResult.dnf,
            placement: rawResult.placement,
            ramsCommitted: rawResult.ramsCommitted,
            totalDose: rawResult.totalDose,
            beaconsCollected: rawResult.beaconsCollected ?? 0,
            hullPercent: hullPct,
            nearMissCount: rawResult.nearMissCount ?? 0,
          });

          const fullResult: RaceFinishResult = {
            ...rawResult,
            ...rewards,
            sponsorId: curSave.activeSponsor ?? null,
            sponsorCompleted: sponsorEval.completed,
            sponsorBonusFluxite: sponsorEval.bonusFluxite,
            sponsorBonusReputation: sponsorEval.bonusReputation,
            totalFluxiteEarned:
              rewards.totalFluxiteEarned +
              rawResult.questBonusFluxite +
              (rawResult.beaconBonusFluxite ?? 0) +
              (rawResult.nearMissBonusFluxite ?? 0) +
              sponsorEval.bonusFluxite,
            reputationDelta:
              rawResult.reputationDelta +
              rewards.reputationDelta +
              sponsorEval.bonusReputation,
            newlyFixatedTraits: traitRoll.newlyFixated,
            displacedTraits: traitRoll.displaced,
          };

          setRaceResult(fullResult);

          if (!rawResult.dnf) {
            setSave((prev) => {
              const nextStageId = getNextStageId(stage.id);
              let updated = completeChapterProgression(
                prev,
                stage.id,
                nextStageId,
                stage.artifactId,
              );
              const nextStageNum =
                stage.id === 'free_season'
                  ? 16
                  : Math.min(16, stage.stageNumber + 1);
              const prevBestTime = prev.bestRunTimes?.[stage.id];
              const isNewBest =
                prevBestTime === undefined || rawResult.elapsedSec < prevBestTime;
              const bestRunTimes = isNewBest
                ? {
                    ...(prev.bestRunTimes ?? {}),
                    [stage.id]: Number(rawResult.elapsedSec.toFixed(2)),
                  }
                : prev.bestRunTimes;
              const bestRunGhosts =
                isNewBest && rawResult.recordedGhost && rawResult.recordedGhost.length >= 2
                  ? {
                      ...(prev.bestRunGhosts ?? {}),
                      [stage.id]: rawResult.recordedGhost,
                    }
                  : prev.bestRunGhosts;

              updated = {
                ...updated,
                fluxite: updated.fluxite + fullResult.totalFluxiteEarned,
                reputation: Math.max(
                  0,
                  Math.min(100, updated.reputation + fullResult.reputationDelta),
                ),
                permanentTraits: traitRoll.nextTraits,
                totalDose: updated.totalDose + fullResult.totalDose,
                currentStageNumber: Math.max(updated.currentStageNumber, nextStageNum),
                freeSeasonWins:
                  stage.id === 'free_season' ? updated.freeSeasonWins + 1 : updated.freeSeasonWins,
                bestRunTimes,
                bestRunGhosts,
              };
              return updated;
            });
          }
        },
      },
    );

    engine.updateShowcaseTraits(saveRef.current.permanentTraits);
    engineRef.current = engine;

    // Support ?autostart=1(&stage=1_3) for automated test / direct play launch
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const requestedId = params.get('stage') || '1_1';
      const stage = resolveStageEffectiveConfig(
        getStageById(requestedId, saveRef.current.freeSeasonWins),
        saveRef.current.storyFlags,
      );
      setActiveStageId(stage.id);
      setScreen('race');
      setPaused(false);
      setRaceResult(null);
      document.body.dataset.state = 'playing';
      engine.startRace({
        stage,
        modules: saveRef.current.modules,
        permanentTraits: saveRef.current.permanentTraits,
        difficulty: saveRef.current.difficulty,
        bestRunGhost: saveRef.current.bestRunGhosts?.[stage.id],
      });
    }

    return () => {
      engine.dispose();
      audio.dispose();
    };
  }, []);

  const launchRace = useCallback(
    (stageToRun: StageConfig) => {
      audioRef.current?.unlockAndPlayMenu();
      setAudioPlaying(true);
      audioRef.current?.playStartResonance();
      setRaceResult(null);
      setPaused(false);
      setScreen('race');
      document.body.dataset.state = 'playing';
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      engineRef.current?.startRace({
        stage: stageToRun,
        modules: saveRef.current.modules,
        permanentTraits: saveRef.current.permanentTraits,
        difficulty: saveRef.current.difficulty,
        bestRunGhost: saveRef.current.bestRunGhosts?.[stageToRun.id],
      });
    },
    [],
  );

  const openStageDialogue = useCallback((stageId: string) => {
    audioRef.current?.unlockAndPlayMenu();
    setAudioPlaying(true);
    audioRef.current?.playUiClick();
    setSave((prev) => prepareChapterEntryState(prev, stageId));
    setActiveStageId(stageId);
    setSelectedChoiceId(null);
    setRaceResult(null);
    setShowChapters(false);
    setScreen('pre_dialogue');
  }, []);

  const handleStartNewGame = useCallback(() => {
    const fresh = {
      ...createInitialSaveState(),
      language: saveRef.current.language,
      graphics: saveRef.current.graphics,
      difficulty: saveRef.current.difficulty,
      bindings: saveRef.current.bindings,
      audioMuted: saveRef.current.audioMuted,
      audioVolume: saveRef.current.audioVolume,
    };
    setSave(fresh);
    saveRef.current = fresh;
    openStageDialogue('1_1');
  }, [openStageDialogue]);

  const handleContinueGame = useCallback(() => {
    const num = saveRef.current.currentStageNumber;
    const stageId = num > 15 ? 'free_season' : `1_${Math.max(1, Math.min(15, num))}`;
    openStageDialogue(stageId);
  }, [openStageDialogue]);

  // Enter / Space on Title triggers primary CTA; Escape closes open modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (showCodex) {
          setShowCodex(false);
          return;
        }
        if (showSettings) {
          setShowSettings(false);
          return;
        }
        if (showChapters) {
          setShowChapters(false);
          return;
        }
        if (screen === 'garage') {
          setScreen('title');
          return;
        }
      }
      if (screen === 'title' && !showChapters && !showSettings && !showCodex) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          if (saveRef.current.completedChapters.length > 0 || saveRef.current.currentStageNumber > 1) {
            handleContinueGame();
          } else {
            handleStartNewGame();
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, showChapters, showSettings, showCodex, handleContinueGame, handleStartNewGame]);

  const handleSelectPreChoice = (opt: StageChoiceOption) => {
    audioRef.current?.playUiClick(1.15);
    setSelectedChoiceId(opt.id);
    setSave((prev) => ({
      ...prev,
      fluxite: Math.max(0, prev.fluxite + opt.fluxiteDelta),
      reputation: Math.max(0, Math.min(100, prev.reputation + opt.reputationDelta)),
      storyFlags: {
        ...prev.storyFlags,
        [opt.setsFlag.key]: opt.setsFlag.value,
      },
    }));
  };

  const handleChangeDifficulty = (d: DifficultyLevel) => {
    audioRef.current?.playUiClick(0.95);
    setSave((prev) => ({ ...prev, difficulty: d }));
    engineRef.current?.setDifficulty(d);
  };

  const handleChangeGraphics = (g: GraphicsLevel) => {
    audioRef.current?.playUiClick(1.05);
    setSave((prev) => ({ ...prev, graphics: g }));
    engineRef.current?.setGraphicsLevel(g);
  };

  const handleChangeLanguage = (l: LanguageCode) => {
    audioRef.current?.playUiClick(1.0);
    setSave((prev) => ({ ...prev, language: l }));
  };

  const handleUpdateBindings = (b: ControlBindings) => {
    setSave((prev) => ({ ...prev, bindings: b }));
    engineRef.current?.setBindings(b);
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    const playing = audioRef.current.togglePlay();
    setAudioPlaying(playing);
  };

  const handleNextTrack = () => {
    if (!audioRef.current) return;
    const info = audioRef.current.nextTrack();
    setAudioTrackIndex(info.index);
  };

  const handleVolumeChange = (v: number) => {
    audioRef.current?.setVolume(v, true);
    setSave((prev) => ({ ...prev, audioVolume: v }));
  };

  const handleToggleMute = () => {
    const nextMuted = !save.audioMuted;
    audioRef.current?.setMuted(nextMuted);
    setSave((prev) => ({ ...prev, audioMuted: nextMuted }));
  };

  const returnToMenu = () => {
    setPaused(false);
    setRaceResult(null);
    setScreen('title');
    audioRef.current?.setContext('menu');
    engineRef.current?.enterShowcaseMode(save.permanentTraits);
  };

  const handlePostRaceContinue = () => {
    setRaceResult(null);
    setScreen('post_dialogue');
    audioRef.current?.setContext('menu');
    engineRef.current?.enterShowcaseMode(save.permanentTraits);
  };

  const handlePostDialogueFinish = () => {
    if (activeStage.id === '1_15') {
      setFinaleChoice(null);
      setScreen('finale_choice');
      return;
    }
    setScreen('garage');
  };

  const handleUpgrade = (key: keyof UpgradeModules) => {
    audioRef.current?.playUiClick(1.2);
    setSave((prev) => upgradeModule(prev, key).nextState);
  };

  const handleExcise = (idx: number) => {
    audioRef.current?.playUiClick(0.85);
    setSave((prev) => {
      const res = exciseTrait(prev, idx).nextState;
      engineRef.current?.updateShowcaseTraits(res.permanentTraits);
      return res;
    });
  };

  const finaleOptions: StageChoiceOption[] = [
    {
      id: 'awake',
      labelEn: strings.releaseVoice,
      labelRu: 'Отпустить Голос',
      descEn: 'Open the Needle spire and let the planetary mind speak.',
      descRu: 'Раскрыть Иглу и позволить планетарному разуму заговорить.',
      fluxiteDelta: 0,
      reputationDelta: 10,
      setsFlag: { key: 'ending', value: 'awake' },
    },
    {
      id: 'asleep',
      labelEn: strings.activateSilencer,
      labelRu: 'Активировать глушитель',
      descEn: 'Seal the Root permanently. Forty seasons of radiation end in silence.',
      descRu: 'Усыпить планету навсегда. Сорок сезонов излучения уходят в тишину.',
      fluxiteDelta: 500,
      reputationDelta: 0,
      setsFlag: { key: 'ending', value: 'asleep' },
    },
  ];

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#090b12]">
      {/* Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        data-testid="flux-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

      {/* Screen: Title / Main Menu */}
      {screen === 'title' && (
        <MainMenu
          save={save}
          strings={strings}
          audio={audioRef.current!}
          audioPlaying={audioPlaying}
          audioTrackIndex={audioTrackIndex}
          isFullscreen={isFullscreen}
          onStartNewGame={handleStartNewGame}
          onContinueGame={handleContinueGame}
          onOpenChapters={() => {
            audioRef.current?.playUiClick();
            setShowChapters(true);
          }}
          onOpenGarage={() => {
            audioRef.current?.playUiClick();
            setScreen('garage');
          }}
          onOpenCodex={() => {
            audioRef.current?.playUiClick();
            setShowCodex(true);
          }}
          onOpenSettings={() => {
            audioRef.current?.playUiClick();
            setShowSettings(true);
          }}
          onChangeDifficulty={handleChangeDifficulty}
          onChangeGraphics={handleChangeGraphics}
          onChangeLanguage={handleChangeLanguage}
          onToggleFullscreen={toggleFullscreen}
          onTogglePlay={handleTogglePlay}
          onNextTrack={handleNextTrack}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Screen: Pre-Race Dialogue & Choice */}
      {screen === 'pre_dialogue' && (
        <DialogueOverlay
          title={pickLoc(save.language, activeStage.titleEn, activeStage.titleRu)}
          subtitle={(() => {
            const p2p = isPointToPointStage(activeStage.id, activeStage.stageNumber);
            const leg = getPlanetaryLegMeta(activeStage.stageNumber, activeStage.biome);
            return p2p
              ? `Stage ${activeStage.stageNumber} · ×${activeStage.intensity.toFixed(1)} · ${leg.distanceKm} km · ${strings.routePointToPoint}`
              : `Stage ${activeStage.stageNumber} · ×${activeStage.intensity.toFixed(1)} · ${activeStage.laps} Laps · ${strings.routeQualifier}`;
          })()}
          lines={activeStage.preDialogue}
          language={save.language}
          flags={save.storyFlags}
          strings={strings}
          isFullscreen={isFullscreen}
          routeContext={{
            stageNumber: activeStage.stageNumber,
            biome: activeStage.biome,
            unlockedChapters: save.unlockedChapters,
            completedChapters: save.completedChapters,
          }}
          choicePrompt={
            activeStage.preChoice
              ? pickLoc(save.language, activeStage.preChoice.promptEn, activeStage.preChoice.promptRu)
              : undefined
          }
          choiceOptions={activeStage.preChoice?.options}
          selectedChoiceId={selectedChoiceId}
          activeSponsor={save.activeSponsor ?? null}
          onSelectSponsor={(sid: SponsorId | null) => {
            audioRef.current?.playUiClick(1.05);
            setSave((prev) => ({ ...prev, activeSponsor: sid }));
          }}
          primaryActionLabel={strings.startRace}
          onSelectChoice={handleSelectPreChoice}
          onPrimaryAction={() => launchRace(activeStage)}
          onBack={returnToMenu}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Screen: Active 3D Race HUD */}
      {screen === 'race' && hud && (
        <RaceHUD
          stage={activeStage}
          hud={hud}
          activeSponsor={save.activeSponsor ?? null}
          language={save.language}
          strings={strings}
          muted={save.audioMuted}
          isFullscreen={isFullscreen}
          onPause={() => {
            setPaused(true);
            engineRef.current?.setPaused(true);
          }}
          onToggleMute={handleToggleMute}
          onToggleFullscreen={toggleFullscreen}
          onResetCamera={() => engineRef.current?.resetCamera()}
          onToggleRadar={() => engineRef.current?.toggleRadar()}
          onTouchSteer={(s) => engineRef.current?.setTouchSteer(s)}
          onTouchThrottle={(t) => engineRef.current?.setTouchThrottle(t)}
          onTouchDrift={(d) => engineRef.current?.setTouchDrift(d)}
          onTouchHop={() => engineRef.current?.triggerTouchHop()}
          onTouchAbility={() => engineRef.current?.triggerTouchAbility()}
        />
      )}

      {/* Pause Modal during Race */}
      {screen === 'race' && paused && !raceResult && (
        <PauseModal
          strings={strings}
          isFullscreen={isFullscreen}
          onResume={() => {
            setPaused(false);
            engineRef.current?.setPaused(false);
          }}
          onRestart={() => launchRace(activeStage)}
          onOpenSettings={() => setShowSettings(true)}
          onConfirmChapterSelect={() => {
            setPaused(false);
            returnToMenu();
            setShowChapters(true);
          }}
          onReturnMenu={returnToMenu}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Race Results Modal */}
      {screen === 'race' && raceResult && (
        <RaceResultsModal
          result={raceResult}
          language={save.language}
          strings={strings}
          onRetry={() => launchRace(activeStage)}
          onContinue={handlePostRaceContinue}
        />
      )}

      {/* Screen: Post-Race Dialogue */}
      {screen === 'post_dialogue' && (
        <DialogueOverlay
          title={pickLoc(save.language, activeStage.titleEn, activeStage.titleRu)}
          subtitle={`Stage ${activeStage.stageNumber} · Debrief`}
          lines={activeStage.postDialogue}
          language={save.language}
          flags={save.storyFlags}
          strings={strings}
          isFullscreen={isFullscreen}
          primaryActionLabel={activeStage.id === '1_15' ? 'Approach the Root' : strings.garage}
          onPrimaryAction={handlePostDialogueFinish}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Screen: Stage 15 Finale Choice */}
      {screen === 'finale_choice' && (
        <DialogueOverlay
          title="The Root of the Needle"
          subtitle="Finale · Choice"
          lines={FINALE_PROMPT_LINES(save.storyFlags)}
          language={save.language}
          flags={save.storyFlags}
          strings={strings}
          isFullscreen={isFullscreen}
          choicePrompt="Choose the fate of Planet Flux:"
          choiceOptions={finaleOptions}
          selectedChoiceId={finaleChoice}
          primaryActionLabel={strings.continueGame}
          onSelectChoice={(opt) => {
            const endingVal = opt.setsFlag.value as 'awake' | 'asleep';
            setFinaleChoice(endingVal);
            setSave((prev) => ({
              ...prev,
              fluxite: prev.fluxite + opt.fluxiteDelta,
              reputation: Math.min(100, prev.reputation + opt.reputationDelta),
              storyFlags: { ...prev.storyFlags, ending: endingVal },
              unlockedChapters: Array.from(new Set([...prev.unlockedChapters, 'free_season'])),
            }));
          }}
          onPrimaryAction={() => setScreen('epilogue')}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Screen: Finale Epilogue & Free Season Unlock */}
      {screen === 'epilogue' && (
        <DialogueOverlay
          title={
            save.storyFlags.ending === 'asleep'
              ? 'Ending B · Silenced World'
              : 'Ending A · The Conversation'
          }
          subtitle={`Campaign Complete · ${save.completedChapters.length}/15 Stages · ◆ ${save.fluxite} · ${save.permanentTraits.length} Traits`}
          lines={
            save.storyFlags.ending === 'asleep' ? EPILOGUE_ASLEEP_LINES : EPILOGUE_AWAKE_LINES
          }
          language={save.language}
          flags={save.storyFlags}
          strings={strings}
          isFullscreen={isFullscreen}
          primaryActionLabel={strings.freeSeason}
          onPrimaryAction={() => openStageDialogue('free_season')}
          onBack={returnToMenu}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Screen: Garage & Upgrades */}
      {screen === 'garage' && (
        <GaragePanel
          save={save}
          strings={strings}
          isFullscreen={isFullscreen}
          onUpgradeModule={handleUpgrade}
          onExciseTrait={handleExcise}
          onContinueCampaign={handleContinueGame}
          onOpenCodex={() => {
            audioRef.current?.playUiClick();
            setShowCodex(true);
          }}
          onClose={() => setScreen('title')}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Modal: Chapter Select */}
      {showChapters && (
        <ChapterSelectModal
          save={save}
          strings={strings}
          isFullscreen={isFullscreen}
          onSelectChapter={openStageDialogue}
          onClose={() => setShowChapters(false)}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Modal: Settings & Rebinding */}
      {showSettings && (
        <SettingsModal
          save={save}
          strings={strings}
          audio={audioRef.current!}
          audioPlaying={audioPlaying}
          audioTrackIndex={audioTrackIndex}
          isFullscreen={isFullscreen}
          onChangeGraphics={handleChangeGraphics}
          onChangeDifficulty={handleChangeDifficulty}
          onChangeLanguage={handleChangeLanguage}
          onUpdateBindings={handleUpdateBindings}
          onTogglePlay={handleTogglePlay}
          onNextTrack={handleNextTrack}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleFullscreen={toggleFullscreen}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Modal: Flux Codex */}
      {showCodex && (
        <CodexModal
          save={save}
          strings={strings}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onClose={() => setShowCodex(false)}
        />
      )}
    </main>
  );
}
