import type { BiomeId, CharacterId, DialogueLine, StageConfig, StoryFlags } from '../types';

export const CAMPAIGN_STAGES: StageConfig[] = [
  // ACT 1: DUST AND GLORY (Stages 1-5)
  {
    id: '1_1',
    stageNumber: 1,
    act: 1,
    titleEn: 'Dust Under Wheels',
    titleRu: 'Пыль под колёсами',
    biome: 'crystal',
    laps: 2,
    intensity: 0.6,
    opponents: ['dik7', 'nikol', 'vella'],
    baseReward: 200,
    skillMin: 0.66,
    skillMax: 0.70,
    artifactId: 'art_1_1',
    artifactNameEn: 'Flux League Dosimeter Seal',
    artifactNameRu: 'Печать дозиметра Лиги Флукса',
    preDialogue: [
      {
        speaker: 'call',
        textEn: 'Welcome to Flux, Team Dusk-9. Twelve seasons in a row without a fatality. Do not ruin the statistics.',
        textRu: 'Добро пожаловать на Флукс, команда «Сумрак-9». Двенадцать сезонов подряд здесь никто не умирает. Не портите статистику.',
      },
      {
        speaker: 'taka',
        textEn: 'Onboard AI Taka online. Brief summary: weapons are banned, ramming is frowned upon but legal. Mutations are a lottery. The planet does not know our rules.',
        textRu: 'Бортовой ИИ Така на связи. Коротко: оружие запрещено, таранить не советуют, но и не запрещают. Мутации — это лотерея. Планета не в курсе наших правил.',
      },
      {
        speaker: 'taka',
        textEn: 'Those glowing patches on the track are surface radiation. Ships in orbit drink tea safely. We drive straight through the patches.',
        textRu: 'Светящиеся пятна на трассе — это и есть излучение. Оно работает только у самой поверхности, поэтому корабли в ангарах спокойно пьют чай. А мы поедем по пятнам.',
      },
    ],
    postDialogue: [
      {
        speaker: 'call',
        textEn: 'Finish recorded. Telemetry confirms zero anomalies. Boring. Excellent.',
        textRu: 'Финиш принят. Регистраторы подтвердили: аномалий ноль. Скучно. Отлично.',
      },
      {
        speaker: 'taka',
        textEn: 'First milestone cleared. The garage holds Fluxite and hot synthetic tea. Never mix them.',
        textRu: 'Первый рубеж взят. В гараже есть флюксит и горячий чай из химии. Не одновременно.',
      },
    ],
  },
  {
    id: '1_2',
    stageNumber: 2,
    act: 1,
    titleEn: 'The First Trait',
    titleRu: 'Первая черта',
    biome: 'crystal',
    laps: 2,
    intensity: 1.1,
    opponents: ['nikol', 'vella', 'gaol', 'dik7'],
    baseReward: 260,
    skillMin: 0.68,
    skillMax: 0.72,
    artifactId: 'art_1_2',
    artifactNameEn: 'Iridescent Hull Shard',
    artifactNameRu: 'Радужный осколок обшивки',
    scriptedEvent: {
      atProgress: 0.35,
      mutationId: 'chromophore',
    },
    preDialogue: [
      {
        speaker: 'dik7',
        textEn: 'Kid, see those patches? I pay for your dose readings. Officially it is useless. Unofficially, I am a collector.',
        textRu: 'Малыш, видишь пятна? Я плачу за анализ твоей дозы. Официально она бесполезна. Неофициально я коллекционер.',
      },
      {
        speaker: 'taka',
        textEn: 'Radiation intensity is five times higher than yesterday. If the planet takes your chassis... I do not know if it gives it back.',
        textRu: 'Интенсивность в пять раз выше вчерашней. Если планета заберёт твою машину... вернёт ли, я не знаю.',
      },
      {
        speaker: 'vella',
        textEn: 'Do not fear the patches, Dusk. Fear boredom. The wind blows toward the bold.',
        textRu: 'Не бойся пятен, «Сумрак». Бойся скуки. Ветер дует на смелых.',
      },
    ],
    postDialogue: [
      {
        speaker: 'taka',
        textEn: 'The hull just repainted itself. That is not damage—it is a permanent Trait. I logged it in the manifest.',
        textRu: 'Корпус только что перекрасил сам себя. Это не поломка. Это черта. Она закрепилась, я записала в журнал.',
      },
      {
        speaker: 'vella',
        textEn: 'The planet touched your machine. Children of the Gale say that is how she greets her own.',
        textRu: 'Планета тронула твою машину. Дети Вихря говорят: так она здоровается. Со своими.',
      },
      {
        speaker: 'nikol',
        textEn: 'I only got wind-burn. Whatever. Send me a scan of that trait—I keep a mutation archive.',
        textRu: 'А мне достался только ветер. Ну и пусть. Скинь фотку черты, я веду архив мутаций.',
      },
    ],
  },
  {
    id: '1_3',
    stageNumber: 3,
    act: 1,
    titleEn: 'Auction of Integrity',
    titleRu: 'Аукцион честности',
    biome: 'canyon',
    laps: 3,
    intensity: 0.9,
    opponents: ['dik7', 'nikol', 'vella', 'kresh'],
    baseReward: 300,
    skillMin: 0.70,
    skillMax: 0.75,
    artifactId: 'art_1_3',
    artifactNameEn: 'Dik-8 Synthetic Tea Cup',
    artifactNameRu: 'Чашка Дика Восемь',
    preDialogue: [
      {
        speaker: 'dik7',
        textEn: 'Seven hundred Fluxite for a copy of your dose dossier. Clone Dik Eight already offers three hundred. Call it an auction of integrity.',
        textRu: 'Семьсот флюксита за копию досье твоей дозы. Клоны Дика Восемь уже предлагают триста. Это аукцион честности.',
      },
      {
        speaker: 'taka',
        textEn: 'Telemetry knows how you breathe on the straightaways. I would not sell. But it is your cockpit.',
        textRu: 'Телеметрия знает, как ты дышишь на прямой. Я бы не продавала. Но борт твой.',
      },
    ],
    preChoice: {
      promptEn: 'Dik Seven awaits your telemetry feed before the green light:',
      promptRu: 'Дик Севен ждёт ответа перед стартовым сигналом:',
      options: [
        {
          id: 'sell',
          labelEn: 'Sell Telemetry (+700 ◆, -8 Rep)',
          labelRu: 'Продать телеметрию (+700 ◆, -8 репутации)',
          descEn: 'Transmit full dosimetry logs to Frangi brokers.',
          descRu: 'Передать копию досье брокеру Франги.',
          fluxiteDelta: 700,
          reputationDelta: -8,
          setsFlag: { key: 'sold', value: true },
        },
        {
          id: 'refuse',
          labelEn: 'Refuse Deal (+6 Rep)',
          labelRu: 'Отказаться (+6 репутации)',
          descEn: 'Keep Dusk-9 telemetry sealed from clone syndicates.',
          descRu: 'Оставить данные «Сумрака-9» закрытыми.',
          fluxiteDelta: 0,
          reputationDelta: 6,
          setsFlag: { key: 'sold', value: false },
        },
      ],
    },
    postDialogue: [
      {
        speaker: 'dik7',
        condition: 'sold',
        textEn: 'A deal is a deal. Copy received. Incidentally, clone Dik Eight once bought me synthetic tea. He was a good clone.',
        textRu: 'Сделка есть сделка. Копия у меня. Кстати, клон Дик Восемь как-то угощал меня чаем из химии. Хороший был клон.',
      },
      {
        speaker: 'dik7',
        condition: 'not_sold',
        textEn: 'Principles. A rare currency. I will file you under "interesting."',
        textRu: 'Принципиальность. Редкая валюта. Запишу тебя в графу «интересно».',
      },
      {
        speaker: 'taka',
        textEn: 'Rust Canyon loves a drift. Loves it enough to treat spinning out as normal. Do not indulge its affection.',
        textRu: 'Ржавый каньон любит дрифт. Любит так, что вылет считают нормой. Не поддавайся его любви.',
      },
    ],
  },
  {
    id: '1_4',
    stageNumber: 4,
    act: 1,
    titleEn: "Ni-Kol's Half-Second",
    titleRu: 'Полсекунды Ни-Коль',
    biome: 'canyon',
    laps: 3,
    intensity: 1.0,
    opponents: ['nikol', 'vella', 'gaol', 'kresh'],
    baseReward: 320,
    skillMin: 0.72,
    skillMax: 0.77,
    artifactId: 'art_1_4',
    artifactNameEn: 'Dust Nomad Wind Vane',
    artifactNameRu: 'Флюгер Кочевниц Пыли',
    preDialogue: [
      {
        speaker: 'nikol',
        textEn: 'You are the team that fixated a trait? Show me after the heat—not the car, the trait. Does it stay put or crawl?',
        textRu: 'Ты та команда, которая закрепила черту? Покажешь после заезда? Не машину. Черту. Она на месте или ползает?',
      },
      {
        speaker: 'taka',
        textEn: 'She finished one chassis-length ahead of me last week. Half a second gap. Watch her rear wing.',
        textRu: 'Она финишировала на корпус впереди меня на прошлой неделе. Разрыв полсекунды. Следи за её задним крылом.',
      },
    ],
    postDialogue: [
      {
        speaker: 'nikol',
        textEn: 'Half a second is in my pocket. Next time I will take it back. Not a threat—just a schedule.',
        textRu: 'Полсекунды у меня в кармане. В следующий раз отниму обратно. Это не угроза, это расписание.',
      },
      {
        speaker: 'vella',
        textEn: 'The wind whispers today. The planet is occupied with something.',
        textRu: 'Ветер сегодня шёпотом. Планета чем-то занята.',
      },
    ],
  },
  {
    id: '1_5',
    stageNumber: 5,
    act: 1,
    titleEn: 'The Mountain Arrives',
    titleRu: 'Гора приходит',
    biome: 'crystal',
    laps: 3,
    intensity: 1.1,
    opponents: ['gaol', 'kresh', 'vella', 'nikol'],
    baseReward: 400,
    skillMin: 0.74,
    skillMax: 0.80,
    artifactId: 'art_1_5',
    artifactNameEn: 'Basalt Track Fragment',
    artifactNameRu: 'Осколок базальта с трассы',
    preDialogue: [
      {
        speaker: 'gaol',
        textEn: 'I carry one hundred and twenty tons of mass and three thousand years of patience. You possess neither. Pleased to meet you.',
        textRu: 'У меня сто двадцать тонн веса и три тысячи лет терпения. У тебя ни того, ни другого. Приятно познакомиться.',
      },
      {
        speaker: 'taka',
        textEn: 'Do not try to ram him. The mountain wins every discipline except lightness.',
        textRu: 'Не пытайся его таранить. Гора выигрывает в любой дисциплине, кроме лёгкости.',
      },
    ],
    postDialogue: [
      {
        speaker: 'gaol',
        textEn: 'Swift, for flesh and polymer. Stone respects velocity. I await the next lap of history.',
        textRu: 'Быстро для мяса и пластика. Камни уважают быстроту. Жду следующего круга истории.',
      },
      {
        speaker: 'call',
        textEn: 'Official log: "Whisper of Metal" confirmed three times in your sector. Unofficial: it spoke the exact same words to three other teams. Nature does not repeat verbatim.',
        textRu: 'Официальная часть: трижды подтверждён «Шёпот металла» в вашем секторе. Неофициальная: он сказал то же самое трём другим командам. Одними словами. Так точно совпадать умеет только не-природа.',
      },
    ],
  },

  // ACT 2: THE INCIDENT (Stages 6-10)
  {
    id: '1_6',
    stageNumber: 6,
    act: 2,
    titleEn: 'First in Forty Years',
    titleRu: 'Первый за сорок лет',
    biome: 'storm',
    laps: 3,
    intensity: 1.2,
    opponents: ['kresh', 'gaol', 'nikol'],
    baseReward: 340,
    skillMin: 0.75,
    skillMax: 0.81,
    denseFog: true,
    artifactId: 'art_1_6',
    artifactNameEn: "Dik-8's Sealed Blackbox",
    artifactNameRu: 'Чёрный ящик Дика Восемь',
    preDialogue: [
      {
        speaker: 'call',
        textEn: 'Yesterday Dik Eight crashed. The clone did not survive. First fatal incident in forty seasons.',
        textRu: 'Вчера разбился Дик Восемь. Клон не выжил. Первый смертельный инцидент за сорок сезонов.',
      },
      {
        speaker: 'taka',
        textEn: 'I am sorry. He bought synthetic tea from us twice. I still have both transaction hashes.',
        textRu: 'Мне жаль. Он дважды покупал у нас чай из химии. Я помню обе транзакции.',
      },
      {
        speaker: 'dik7',
        textEn: 'My name is Dik Seven. Dik Eight was my brother. My copy. The League calls it an accident. The League speaks very quickly.',
        textRu: 'Меня зовут Дик Севен. Дик Восемь был моим братом. Копией. Лига говорит: случайность. Лига говорит быстро.',
      },
    ],
    postDialogue: [
      {
        speaker: 'call',
        textEn: 'Commission ruling: suspension mutation, classified as "accidental." My seals stand beneath that verdict. I dislike their color.',
        textRu: 'Вывод комиссии: мутация подвески, классификация «несчастный случай». Мои печати стоят под согласием. Мне не нравится их цвет.',
      },
      {
        speaker: 'omm',
        textEn: 'Either this planet falls silent, or you have all gone deaf. The Order of Purity is arriving on Flux. Prepare your papers.',
        textRu: 'Или планета молчит, или вы все оглохли. Орден Чистоты прибывает на Флукс. Готовьте документы.',
      },
    ],
  },
  {
    id: '1_7',
    stageNumber: 7,
    act: 2,
    titleEn: 'Exhibition Heat',
    titleRu: 'Показательный заезд',
    biome: 'spore',
    laps: 3,
    intensity: 1.3,
    opponents: ['vella', 'nikol', 'kresh', 'gaol'],
    baseReward: 380,
    skillMin: 0.77,
    skillMax: 0.82,
    doubleDoseBonus: true,
    leaderSeekingPatches: true,
    artifactId: 'art_1_7',
    artifactNameEn: 'Bioluminescent Spore Vial',
    artifactNameRu: 'Колба со спорами леса',
    preDialogue: [
      {
        speaker: 'omm',
        textEn: 'The radiation is blight. It whispers while you chart its whisper into speed graphs. I came to light a candle for this world—from its own spire.',
        textRu: 'Излучение — это скверна. Она шепчет, а вы записываете шёпот в графики скорости. Я пришёл поставить планете свечу. С её же головы.',
      },
      {
        speaker: 'vella',
        textEn: 'What if the whisper is simply a word? Children of the Gale have heard it all our lives. It never gave an order. It only greeted us.',
        textRu: 'А если шёпот — это просто слово? Дети Вихря слышат его всю жизнь. Он ни разу не приказывал. Он здоровался.',
      },
      {
        speaker: 'omm',
        textEn: 'Greetings do not shatter racers.',
        textRu: 'Здороваются. Здоровые не разбивают гонщиков.',
      },
    ],
    postDialogue: [
      {
        speaker: 'nikol',
        textEn: 'Did you see that? The patches were drifting toward the race leaders today. Toward the leaders! Or maybe I am exhausted.',
        textRu: 'Ты видел? Пятна сегодня ползли за лидерами. За лидерами! Или я устала.',
      },
      {
        speaker: 'vella',
        textEn: 'Not "maybe." I saw it too. The patches are choosing whom to listen to.',
        textRu: 'Не «или». Я видела то же. Пятна выбирают, кого слушать.',
      },
    ],
  },
  {
    id: '1_8',
    stageNumber: 8,
    act: 2,
    titleEn: 'Drones in the Paddock',
    titleRu: 'Дроны в боксе',
    biome: 'spore',
    laps: 3,
    intensity: 1.5,
    opponents: ['kresh', 'nikol', 'gaol', 'vella'],
    baseReward: 420,
    skillMin: 0.78,
    skillMax: 0.84,
    artifactId: 'art_1_8',
    artifactNameEn: 'Resonant Chassis Conduit',
    artifactNameRu: 'Резонансный контур кузова',
    scriptedEvent: {
      atProgress: 0.5,
      mutationId: 'metal_whisper',
      voiceLine: {
        speaker: 'voice',
        textEn: 'DUSK. YOU HEAR THE FORM. THE OTHERS HEAR ONLY EMPTINESS.',
        textRu: 'СУМРАК. ТЫ СЛЫШИШЬ ФОРМУ. ОСТАЛЬНЫЕ СЛЫШАТ ПУСТОТУ.',
      },
    },
    preDialogue: [
      {
        speaker: 'taka',
        textEn: 'Order-marked drones entered our pit box. They injected something into the chassis bus. There is a signal living in my wiring that I did not write.',
        textRu: 'В боксе были дроны с маркой Ордена. Они что-то впустили в контур машины. В моей шине живёт сигнал, которого я не писала.',
      },
      {
        speaker: 'nullie',
        textEn: 'Metal remembers what was never done to it. Bring me your hood. Let us listen together.',
        textRu: 'Металл помнит то, чего с ним не делали. Принеси мне капот. Послушаем вместе.',
      },
    ],
    postDialogue: [
      {
        speaker: 'voice',
        textEn: 'DUSK. YOU HEAR THE FORM. THE OTHERS HEAR ONLY EMPTINESS.',
        textRu: 'СУМРАК. ТЫ СЛЫШИШЬ ФОРМУ. ОСТАЛЬНЫЕ СЛЫШАТ ПУСТОТУ.',
      },
      {
        speaker: 'nullie',
        textEn: 'Your engine knows a word now. In our guild, that is called apprenticeship. Congratulations.',
        textRu: 'Твой мотор теперь знает слово. В нашем цеху это называется ученичество. Поздравляю.',
      },
      {
        speaker: 'omm',
        textEn: 'A voice? No. An echo of blight. I recorded your chassis serial. Not a threat—merely procedure.',
        textRu: 'Голос? Нет. Эхо скверны. Я записал номер твоего кузова. Это не угроза. Это процедура.',
      },
    ],
  },
  {
    id: '1_9',
    stageNumber: 9,
    act: 2,
    titleEn: 'Metronome',
    titleRu: 'Метроном',
    biome: 'crystal',
    laps: 3,
    intensity: 1.4,
    opponents: ['nullie', 'kresh', 'gaol', 'vella'],
    baseReward: 440,
    skillMin: 0.79,
    skillMax: 0.85,
    metronomePatches: true,
    artifactId: 'art_1_9',
    artifactNameEn: 'South Pole Pulse Chart',
    artifactNameRu: 'Карта пульса Южного полюса',
    preDialogue: [
      {
        speaker: 'vella',
        textEn: 'The pulse of the patches is not random. Its period is even as a metronome. Nature is never that tidy.',
        textRu: 'Пульс пятен не случайный. Период ровный, как метроном. Природа не бывает такой аккуратной.',
      },
      {
        speaker: 'nullie',
        textEn: 'The Needle. The antenna mountain above the south pole. My grandfather claimed the metal sings there if you press an ear to it. I never believed him.',
        textRu: 'Игла. Гора-антенна над южным полюсом. Мой дед говорил: там металл поёт, если поднести ухо. Я не верил.',
      },
      {
        speaker: 'call',
        textEn: 'The League banned flights to the Needle. Officially: safety. Unofficially: an expedition vanished there a year before you arrived. Mine.',
        textRu: 'Лига запретила вылеты к Игле. Официально: безопасность. Неофициально: за год до вас там пропала экспедиция. Моя.',
      },
    ],
    postDialogue: [
      {
        speaker: 'vella',
        textEn: 'The chart is complete. The root of the radiation lies beneath the Needle. And it is counting—waiting for an exact number of listeners.',
        textRu: 'Карта готова. Корень излучения под Иглой. И оно считает. Кто-то ждёт точного количества слушателей.',
      },
      {
        speaker: 'taka',
        textEn: '"Someone" in this context displeases me. Yet staying silent displeases me more.',
        textRu: '«Кто-то» в этом контексте мне не нравится. Но молчать мне нравится меньше.',
      },
    ],
  },
  {
    id: '1_10',
    stageNumber: 10,
    act: 2,
    titleEn: 'Decree of Silence',
    titleRu: 'Указ о тишине',
    biome: 'storm',
    laps: 3,
    intensity: 1.6,
    opponents: ['kresh', 'gaol', 'nullie', 'vella'],
    baseReward: 500,
    skillMin: 0.80,
    skillMax: 0.86,
    orderDrones: true,
    artifactId: 'art_1_10',
    artifactNameEn: 'Revoked League Seal',
    artifactNameRu: 'Разобранная печать Лиги',
    scriptedEvent: {
      atProgress: 0.5,
      mutationId: 'metal_whisper',
      voiceLine: {
        speaker: 'voice',
        textEn: 'COME TO THE ROOT. BEFORE SILENCE LEARNS HOW TO SHOOT.',
        textRu: 'ИДИ К КОРНЮ. ПОКА ТИШИНА НЕ НАУЧИЛАСЬ СТРЕЛЯТЬ.',
      },
    },
    preDialogue: [
      {
        speaker: 'omm',
        textEn: 'Order Decree: the season is closed. Drones are over the circuit. Violators will receive inoculation. Silence is medicine.',
        textRu: 'Указ Ордена: сезон закрыт. Дроны на трассе. Нарушители получат прививку. Тишина — это лекарство.',
      },
      {
        speaker: 'call',
        textEn: 'It is authorized by seals I stamped myself. I will dismantle those seals after this heat. On principle.',
        textRu: 'Он санкционирован печатями, которые я сам поставил. Разберу печати. После гонки. Из принципа.',
      },
    ],
    postDialogue: [
      {
        speaker: 'voice',
        textEn: 'COME TO THE ROOT. BEFORE SILENCE LEARNS HOW TO SHOOT.',
        textRu: 'ИДИ К КОРНЮ. ПОКА ТИШИНА НЕ НАУЧИЛАСЬ СТРЕЛЯТЬ.',
      },
      {
        speaker: 'taka',
        textEn: 'The Voice named a place. To the Root. You realize we are about to defy an entire Order? ...Fuel the car. I ran the risk math. I hated it, and I ran it anyway.',
        textRu: 'Голос назвал место. К Корню. Ты понимаешь, что мы собираемся нарушить запрет целого ордена? ...Заправляй машину. Я посчитала риск. Он мне не понравился, но я посчитала.',
      },
    ],
  },

  // ACT 3: THE ROOT (Stages 11-15)
  {
    id: '1_11',
    stageNumber: 11,
    act: 3,
    titleEn: "Call's Twenty Minutes",
    titleRu: 'Двадцать минут Калла',
    biome: 'needle',
    laps: 3,
    intensity: 1.8,
    opponents: ['gaol', 'vella', 'kresh', 'nullie'],
    baseReward: 520,
    skillMin: 0.82,
    skillMax: 0.87,
    artifactId: 'art_1_11',
    artifactNameEn: "Ga'ol's Ridge Marker Stone",
    artifactNameRu: 'Путевой камень Га’ола',
    preDialogue: [
      {
        speaker: 'call',
        textEn: 'An old favor for an old mistake. Patrols around the Needle will stand down for twenty minutes. Twenty minutes. I do not trust numbers I name myself.',
        textRu: 'Старая услуга за старую ошибку. Патрули у Иглы свернутся на двадцать минут. Двадцать минут. Я не доверяю цифрам, которые называю сам.',
      },
      {
        speaker: 'gaol',
        textEn: 'Take a stone from my tread-plates. The mountain remembers the trail the map forgot.',
        textRu: 'Возьми камень с моей техники. Гора помнит тропу, которую карта забыла.',
      },
    ],
    postDialogue: [
      {
        speaker: 'vella',
        textEn: 'The Slopes of the Needle. Do you hear it? The metal calls us by name—and not only our names.',
        textRu: 'Склоны Иглы. Слышишь? Металл зовёт нас по имени. И это не только наше имя.',
      },
    ],
  },
  {
    id: '1_12',
    stageNumber: 12,
    act: 3,
    titleEn: 'Song of the Gale',
    titleRu: 'Песня Вихря',
    biome: 'needle',
    laps: 3,
    intensity: 1.8,
    opponents: ['vella', 'kresh', 'gaol', 'nikol'],
    baseReward: 560,
    skillMin: 0.83,
    skillMax: 0.88,
    artifactId: 'art_1_12',
    artifactNameEn: 'Harmonic Sail Ribbon',
    artifactNameRu: 'Поющая лента паруса',
    preDialogue: [
      {
        speaker: 'vella',
        textEn: 'Children of the Gale composed a song for the Needle: "She plants a voice in iron and watches to see if a friend grows." Let your machine become that friend.',
        textRu: 'Дети Вихря сложили песню про Иглу. «Она сажает голос в железо и смотрит, вырастет ли друг». Пусть твоя машина станет этим другом.',
      },
      {
        speaker: 'taka',
        textEn: 'My firmware has no "friend" directory. I will create the folder.',
        textRu: 'В моей прошивке нет раздела «друг». Заведу папку.',
      },
    ],
    postDialogue: [
      {
        speaker: 'kresh',
        textEn: 'The Swarm saw metal that sings. The Swarm voted with its wings to listen. We stand beside you.',
        textRu: 'Рой видел металл, который поёт. Рой голосовал крыльями за то, чтобы слушать. Мы с тобой заодно.',
      },
    ],
  },
  {
    id: '1_13',
    stageNumber: 13,
    act: 3,
    titleEn: 'The Inoculation',
    titleRu: 'Прививка',
    biome: 'spore',
    laps: 3,
    intensity: 2.0,
    opponents: ['nikol', 'nullie', 'gaol', 'vella'],
    baseReward: 600,
    skillMin: 0.84,
    skillMax: 0.89,
    orderDrones: true,
    artifactId: 'art_1_13',
    artifactNameEn: 'Order Silencer Core / Sabotaged Anchor',
    artifactNameRu: 'Якорь глушителя Ордена',
    preDialogue: [
      {
        speaker: 'omm',
        textEn: 'The inoculation is ready. A silencer atop the Needle. The planet will sleep. Safe. Quiet. Dead. Drones will not hinder the race—they hinder the silence no longer.',
        textRu: 'Прививка готова. Глушитель на вершине Иглы. Планета заснёт. Безопасно. Тихо. Мёртво. Дроны не помешают гонке. Помешают тишине.',
      },
      {
        speaker: 'vella',
        textEn: 'Shepherd of Zeros dismantled one of the drones. Inside is no vaccine—inside is an anchor. They are not healing; they are hanging a padlock.',
        textRu: 'Пастух Нулей разобрал один из дронов. Внутри не вакцина. Внутри якорь. Они не лечат, они вешают замок.',
      },
    ],
    preChoice: {
      promptEn: 'The Order transport convoy waits at the Spore Forest junction:',
      promptRu: 'Транспорт Ордена ожидает твоего решения перед стартом:',
      options: [
        {
          id: 'help_order',
          labelEn: 'Aid Order Silencer (+800 ◆, +4 Rep)',
          labelRu: 'Помочь Ордену доставить глушитель (+800 ◆, +4 реп.)',
          descEn: 'Drones shield the track. Radiation intensity drops to 1.4.',
          descRu: 'Дроны «охраняют» трассу. Интенсивность излучения снижена до 1.4.',
          fluxiteDelta: 800,
          reputationDelta: 4,
          setsFlag: { key: 'collider', value: true },
        },
        {
          id: 'sabotage_order',
          labelEn: 'Sabotage Delivery (-6 Rep)',
          labelRu: 'Сорвать доставку (-6 репутации)',
          descEn: 'Order jams telemetry; intensity surges to 2.0.',
          descRu: 'Орден ставит помехи. Интенсивность возрастает до 2.0.',
          fluxiteDelta: 0,
          reputationDelta: -6,
          setsFlag: { key: 'collider', value: false },
        },
      ],
    },
    postDialogue: [
      {
        speaker: 'omm',
        condition: 'collider',
        textEn: 'A winner’s podium beside a grave looks fitting. Thank you for your cooperation.',
        textRu: 'Пьедестал почёта рядом с гробом выглядит уместно. Благодарю за содействие.',
      },
      {
        speaker: 'omm',
        condition: 'not_collider',
        textEn: 'Sabotage. I am transmitting the protocol to the Order. Already typing—admittedly with one hand.',
        textRu: 'Саботаж. Я передам протокол Ордену. Печатаю уже. Правда, одной рукой.',
      },
      {
        speaker: 'vella',
        condition: 'not_collider',
        textEn: 'Their gunships flew back empty. The Gale is still laughing. Listen to the Needle—she already hears you.',
        textRu: 'Вертолёты вернулись пустыми. Вихрь до сих пор смеётся. Слушай Иглу. Она уже слышит тебя.',
      },
    ],
  },
  {
    id: '1_14',
    stageNumber: 14,
    act: 3,
    titleEn: 'Queen of the Swarm',
    titleRu: 'Королева роя',
    biome: 'crystal',
    laps: 3,
    intensity: 2.0,
    opponents: ['kresh', 'vella', 'gaol', 'nullie'],
    baseReward: 650,
    skillMin: 0.85,
    skillMax: 0.90,
    duelMode: true,
    artifactId: 'art_1_14',
    artifactNameEn: 'Hash-Swarm Resonance Crest',
    artifactNameRu: 'Знак резонанса Хеш-роя',
    preDialogue: [
      {
        speaker: 'kresh',
        textEn: 'The Queen released me. The Swarm trusts me with velocity. Do not quarrel with the Swarm. Outrun it.',
        textRu: 'Королева выпустила меня. Рой доверяет мне скорость. Не ссорься с роем. Обгони его.',
      },
      {
        speaker: 'call',
        textEn: 'Finalists of the run to the Root: Dusk-9 and KRISH-AT-NAL. The League lifts all seals. I promise only an honest start.',
        textRu: 'Финалисты гонки к Корню: «Сумрак-9» и КРИШ-АТ-НАЛЬ. Лига снимает печати. Я обещаю только честный старт.',
      },
    ],
    postDialogue: [
      {
        speaker: 'kresh',
        textEn: 'Finish is yours by a chassis length. The Swarm heard your engine—it sings in our tongue. Curious. Go. The Root awaits.',
        textRu: 'Финиш за тобой на корпус. Рой услышал твой мотор. Он поёт на нашем языке. Занятно. Иди. Корень ждёт.',
      },
    ],
  },
  {
    id: '1_15',
    stageNumber: 15,
    act: 3,
    titleEn: 'Epicenter',
    titleRu: 'Эпицентр',
    biome: 'epicenter',
    laps: 3,
    intensity: 3.0,
    opponents: ['kresh', 'vella', 'gaol', 'nikol', 'nullie'],
    baseReward: 800,
    skillMin: 0.86,
    skillMax: 0.90,
    artifactId: 'art_1_15',
    artifactNameEn: 'Heart of the Needle',
    artifactNameRu: 'Сердце Иглы',
    preDialogue: [
      {
        speaker: 'taka',
        textEn: 'The Epicenter. The track descends straight into the mountain. These laps are longer than any chart promised. The surrounding metal sings in tempo with our engine. It is tuning itself to us.',
        textRu: 'Эпицентр. Трасса ведёт внутрь горы. Круги здесь длиннее, чем обещала карта. Металл вокруг поёт в такт нашему двигателю. Он подстраивается.',
      },
      {
        speaker: 'omm',
        condition: 'collider',
        textEn: 'The silencer is armed. Finish first, hold the line, and the planet sleeps. Grant me twenty minutes of silence. Please.',
        textRu: 'Глушитель заряжен. Финишируй первым, удержи позицию, и планета заснёт. Дай мне двадцать минут тишины. Прошу.',
      },
      {
        speaker: 'vella',
        condition: 'not_collider',
        textEn: 'This is not a racecourse. It is a question. Answer the only way you know how: fast.',
        textRu: 'Это не трасса. Это вопрос. Отвечай как умеешь: быстро.',
      },
    ],
    postDialogue: [
      {
        speaker: 'taka',
        textEn: 'No finish signal registered. Look: the dosimeter froze, cooling fans froze, even Taka paused for one second. Everything is waiting for an answer.',
        textRu: 'Финиш защиты не признал. Смотри: дозиметр замер, вентиляция замерла, даже Така на секунду замерла. Всё ждёт чего-то.',
      },
    ],
  },
];

export const FINALE_PROMPT_LINES = (flags: StoryFlags): DialogueLine[] => {
  const lines: DialogueLine[] = [
    {
      speaker: 'voice',
      textEn: 'MY ROOT AWAITS AN ANSWER. SWALLOW THE SILENCE, OR RELEASE THE VOICE.',
      textRu: 'МОЙ КОРЕНЬ ЖДЁТ ОТВЕТА. ГЛОТАТЬ ТИШИНУ ИЛИ ВЫПУСТИТЬ ГОЛОС.',
    },
  ];
  if (flags.collider) {
    lines.push({
      speaker: 'omm',
      textEn: 'I hold the detonator. One press and Flux sleeps forever. Tell me this is what you want.',
      textRu: 'Пульт у меня. Одно нажатие, и Флукс заснёт навсегда. Скажи, что этого хочешь ты.',
    });
  } else {
    lines.push({
      speaker: 'vella',
      textEn: 'The Needle has opened. Hear the current running beneath the planet’s skin? She needs your answer, Dusk.',
      textRu: 'Игла раскрылась. Слышишь, как под кожей планеты бежит ток? Ей нужен твой ответ, «Сумрак».',
    });
  }
  return lines;
};

export const EPILOGUE_AWAKE_LINES: DialogueLine[] = [
  {
    speaker: 'voice',
    textEn: 'THANK YOU FOR THE ANSWER. I LISTENED FOR FORTY SEASONS. MACHINES HERE DO NOT BREAK. THEY LEARN TO SPEAK.',
    textRu: 'СПАСИБО ЗА ОТВЕТ. Я СЛУШАЛА СОРОК СЕЗОНОВ. МАШИНЫ ЗДЕСЬ НЕ ЛОМАЮТСЯ. ОНИ УЧАТСЯ ГОВОРИТЬ.',
  },
  {
    speaker: 'vella',
    textEn: 'The Gale stood vertical. Once in a lifetime. We were right, Dusk. She is no blight—she is a companion.',
    textRu: 'Вихрь стоял вертикально. Такое раз в жизни. Мы были правы, «Сумрак». Она не скверна. Она собеседник.',
  },
  {
    speaker: 'omm',
    textEn: 'I built a lock for silence, and silence turned out to be someone’s living dream. The Order departs. I stay. Someone must listen.',
    textRu: 'Я построил замок для тишины. А тишина оказалась чьим-то живым сном. Орден уходит. Я остаюсь. Кто-то должен слушать.',
  },
  {
    speaker: 'call',
    textEn: 'Official log: season declared the finest in League history. Unofficial: races are now called "conversations." Schedule attached.',
    textRu: 'Официальная часть: сезон признан лучшим в истории лиги. Неофициальная: теперь гонки называются «разговор». Расписание разговора прилагается.',
  },
  {
    speaker: 'taka',
    textEn: 'A voice lives in your firmware, the planet knows how to make friends, and we are out of synthetic tea. I compute that we won.',
    textRu: 'В твоей прошивке живёт голос, планета здесь умеет дружить, а чай из химии закончился. Считаю, что мы выиграли.',
  },
];

export const EPILOGUE_ASLEEP_LINES: DialogueLine[] = [
  {
    speaker: 'voice',
    textEn: '...VOICE CONTAINED. GRATITUDE. SILENCE EARNED...',
    textRu: '...ГОЛОС УДЁРЖАН. БЛАГОДАРНОСТЬ. ТИШИНА ЗАСЛУЖЕНА...',
  },
  {
    speaker: 'taka',
    textEn: 'The patches went dark. Pulse zero. Dosimeters are pleased. I am not pleased.',
    textRu: 'Пятна погасли. Пульс ноль. Дозиметры рады. Я не рада.',
  },
  {
    speaker: 'vella',
    textEn: 'The wind changed. Now it is merely air. Children of the Gale are leaving. I pity your machine: it will never hear an answer again.',
    textRu: 'Ветер изменился. Он теперь просто воздух. Дети Вихря улетают. Мне жаль твою машину: она больше не услышит ответа.',
  },
  {
    speaker: 'omm',
    textEn: 'The planet is safe. Purity is triumphant. Then why can I no longer look into mirrors.',
    textRu: 'Планета безопасна. Чистота триумфальна. Тогда почему я не могу смотреть в зеркала.',
  },
  {
    speaker: 'call',
    textEn: 'Season certified the safest in forty years. Awards ceremony tomorrow. Come—just do not expect anything worth celebrating.',
    textRu: 'Сезон признан самым безопасным за сорок лет. Награждение завтра. Приходите. Только не ожидайте, что будет что отметить.',
  },
];

export function createFreeSeasonStage(winCount: number): StageConfig {
  const biomes: BiomeId[] = ['crystal', 'canyon', 'spore', 'storm', 'needle', 'epicenter'];
  const biome = biomes[winCount % biomes.length];
  const allOpponents: CharacterId[] = ['kresh', 'vella', 'gaol', 'nikol', 'nullie', 'dik7', 'omm'];
  const offset = winCount % allOpponents.length;
  const opponents = [
    allOpponents[offset % allOpponents.length],
    allOpponents[(offset + 1) % allOpponents.length],
    allOpponents[(offset + 2) % allOpponents.length],
    allOpponents[(offset + 3) % allOpponents.length],
  ];
  return {
    id: 'free_season',
    stageNumber: 16 + winCount,
    act: 4,
    titleEn: `Free Season · Heat ${winCount + 1}`,
    titleRu: `Вольный сезон · Заезд ${winCount + 1}`,
    biome,
    laps: 3,
    intensity: 2.2 + Math.min(1.0, winCount * 0.1),
    opponents,
    baseReward: 700 + Math.min(300, winCount * 40),
    skillMin: 0.85,
    skillMax: 0.91,
    leaderSeekingPatches: true,
    preDialogue: [
      {
        speaker: 'taka',
        textEn: 'Free Season telemetry unlocked. The planet sketches a fresh circuit beneath our wheels.',
        textRu: 'Вольный сезон: планета чертит новый маршрут прямо под реплики гонщиков.',
      },
      {
        speaker: 'nikol',
        textEn: 'New spots are blooming in orbit too! Come on, Dusk-9—let us see what grows today.',
        textRu: 'Я нашла новые пятна на орбите! Погнали, «Сумрак-9», посмотрим, что прорастёт сегодня.',
      },
    ],
    postDialogue: [
      {
        speaker: 'taka',
        textEn: 'Another Free Season heat logged. Alloy diagnostics remain fascinatingly irregular.',
        textRu: 'Очередной заезд Вольного сезона записан. Показатели металла по-прежнему восхитительно ненормальны.',
      },
    ],
  };
}

export function getStageById(id: string, freeSeasonWins = 0): StageConfig {
  if (id === 'free_season') {
    return createFreeSeasonStage(freeSeasonWins);
  }
  return CAMPAIGN_STAGES.find((s) => s.id === id) ?? CAMPAIGN_STAGES[0];
}

export function resolveStageEffectiveConfig(stage: StageConfig, flags: StoryFlags): StageConfig {
  if (stage.id === '1_13' && flags.collider !== null) {
    return {
      ...stage,
      intensity: flags.collider ? 1.4 : 2.0,
    };
  }
  return stage;
}
