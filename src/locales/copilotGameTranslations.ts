import type { Language } from '@/store/i18nStore';

export type TriviaQuestion = {
  q: string;
  options: { label: string; value: string }[];
  correct: string;
  explanation: string;
};

export type CopilotGameStrings = {
  jokeUserPrompt: string;
  anotherJoke: string;
  triviaStartLabel: string;
  rpsStartLabel: string;
  rpsPrompt: string;
  rpsRock: string;
  rpsPaper: string;
  rpsScissors: string;
  gameMenuUser: string;
  gameMenuPrompt: string;
  startTrivia: string;
  startRps: string;
  questionN: string;
  triviaCorrect: string;
  triviaWrong: string;
  triviaCorrectWas: string;
  gameOver: string;
  playAgainPrompt: string;
  newGame: string;
  mainMenu: string;
  rpsTie: string;
  rpsWin: string;
  rpsLose: string;
  rpsYourMove: string;
  rpsMyMove: string;
  rpsScore: string;
  rpsPlayAgain: string;
};

const EN_GAME: CopilotGameStrings = {
  jokeUserPrompt: 'Tell me a joke!',
  anotherJoke: 'One More!',
  triviaStartLabel: 'Engineering Trivia',
  rpsStartLabel: 'Rock-Paper-Scissors',
  rpsPrompt: 'Pick Rock, Paper, or Scissors!',
  rpsRock: 'Rock',
  rpsPaper: 'Paper',
  rpsScissors: 'Scissors',
  gameMenuUser: 'Game Menu',
  gameMenuPrompt: 'Which game would you like to play?',
  startTrivia: 'Trivia Quiz',
  startRps: 'Rock-Paper-Scissors',
  questionN: 'Question',
  triviaCorrect: 'Correct!',
  triviaWrong: 'Wrong answer.',
  triviaCorrectWas: 'Correct answer was',
  gameOver: 'Game Over! Your score',
  playAgainPrompt: 'Want to play another game?',
  newGame: 'New Game',
  mainMenu: 'Main Menu',
  rpsTie: 'Draw! We picked the same move.',
  rpsWin: 'You win! Nice move.',
  rpsLose: 'I win! AI power.',
  rpsYourMove: 'Your move',
  rpsMyMove: 'My move',
  rpsScore: 'Score',
  rpsPlayAgain: 'Play again?',
};

const TR_GAME: CopilotGameStrings = {
  jokeUserPrompt: 'Bana bir \u015faka yap/anlat!',
  anotherJoke: 'Bir Tane Daha!',
  triviaStartLabel: 'Bilgi Yar\u0131\u015fmas\u0131',
  rpsStartLabel: 'Ta\u015f-Ka\u011f\u0131t-Makas',
  rpsPrompt: 'Ta\u015f, Ka\u011f\u0131t ya da Makas se\u00e7!',
  rpsRock: 'Ta\u015f',
  rpsPaper: 'Ka\u011f\u0131t',
  rpsScissors: 'Makas',
  gameMenuUser: 'Oyun Men\u00fcs\u00fc',
  gameMenuPrompt: 'Hangi oyunu oynamak istersin?',
  startTrivia: 'Bilgi Yar\u0131\u015fmas\u0131',
  startRps: 'Ta\u015f-Ka\u011f\u0131t-Makas',
  questionN: 'Soru',
  triviaCorrect: 'Do\u011fru cevap!',
  triviaWrong: 'Yanl\u0131\u015f cevap.',
  triviaCorrectWas: 'Do\u011fru cevap',
  gameOver: 'Oyun Bitti! Skorun',
  playAgainPrompt: 'Yeni bir oyun oynamak ister misin?',
  newGame: 'Yeni Oyun',
  mainMenu: 'Ana Men\u00fc',
  rpsTie: 'Berabere! \u0130kimiz de ayn\u0131 hamleyi yapt\u0131k.',
  rpsWin: 'Tebrikler, kazand\u0131n!',
  rpsLose: 'Ben kazand\u0131m!',
  rpsYourMove: 'Senin hamlen',
  rpsMyMove: 'Benim hamlem',
  rpsScore: 'Skorun',
  rpsPlayAgain: 'Tekrar oynamak ister misin?',
};

const TRIVIA_EN: TriviaQuestion[] = [
  {
    q: 'Which metal has the highest strength-to-weight ratio?',
    options: [
      { label: 'Iron', value: 'iron' },
      { label: 'Titanium', value: 'titanium' },
      { label: 'Aluminum', value: 'aluminum' },
    ],
    correct: 'titanium',
    explanation: 'Titanium offers the highest strength-to-weight ratio among common structural metals.',
  },
  {
    q: 'Roughly what percentage of tightening torque is lost to friction in a bolt?',
    options: [
      { label: '10%', value: '10' },
      { label: '50%', value: '50' },
      { label: '90%', value: '90' },
    ],
    correct: '90',
    explanation: 'About 90% of torque overcomes friction; only ~10% becomes preload.',
  },
  {
    q: 'Which component supports rotating shafts and reduces friction?',
    options: [
      { label: 'Key', value: 'key' },
      { label: 'Bearing', value: 'bearing' },
      { label: 'Pin', value: 'pin' },
    ],
    correct: 'bearing',
    explanation: 'Bearings carry loads and minimize friction in rotating assemblies.',
  },
];

const TRIVIA_TR: TriviaQuestion[] = [
  {
    q: 'Hangisi en y\u00fcksek mukavemet/a\u011f\u0131rl\u0131k oran\u0131na sahip metaldir?',
    options: [
      { label: 'Demir', value: 'iron' },
      { label: 'Titanyum', value: 'titanium' },
      { label: 'Al\u00fcminyum', value: 'aluminum' },
    ],
    correct: 'titanium',
    explanation: 'Titanyum, metaller aras\u0131nda en y\u00fcksek mukavemet/a\u011f\u0131rl\u0131k oran\u0131na sahiptir.',
  },
  {
    q: 'C\u0131vata s\u0131k\u0131m\u0131nda torkun yakla\u015f\u0131k y\u00fczde ka\u00e7\u0131 s\u00fcrt\u00fcnmeye gider?',
    options: [
      { label: '%10', value: '10' },
      { label: '%50', value: '50' },
      { label: '%90', value: '90' },
    ],
    correct: '90',
    explanation: 'Torkun yakla\u015f\u0131k %90\u2019\u0131 s\u00fcrt\u00fcnmeye gider, yaln\u0131zca %10\u2019u \u00f6n y\u00fcklemeye d\u00f6n\u00fc\u015f\u00fcr.',
  },
  {
    q: 'D\u00f6nen milleri desteklemek i\u00e7in hangi eleman kullan\u0131l\u0131r?',
    options: [
      { label: 'Kama', value: 'key' },
      { label: 'Rulman', value: 'bearing' },
      { label: 'Pim', value: 'pin' },
    ],
    correct: 'bearing',
    explanation: 'Rulmanlar d\u00f6nen millerin y\u00fcklerini ta\u015f\u0131r ve s\u00fcrt\u00fcnmeyi azalt\u0131r.',
  },
];

const GAME_BY_LOCALE: Record<Language, CopilotGameStrings> = {
  en: EN_GAME,
  tr: TR_GAME,
  de: { ...EN_GAME, gameMenuPrompt: 'Welches Spiel m\u00f6chtest du spielen?', startTrivia: 'Quiz', startRps: 'Schere-Stein-Papier' },
  es: { ...EN_GAME, gameMenuPrompt: '\u00bfQu\u00e9 juego quieres jugar?', startTrivia: 'Trivia', startRps: 'Piedra-Papel-Tijera' },
  fr: { ...EN_GAME, gameMenuPrompt: 'Quel jeu veux-tu jouer ?', startTrivia: 'Quiz', startRps: 'Pierre-Papier-Ciseaux' },
  it: { ...EN_GAME, gameMenuPrompt: 'Quale gioco vuoi giocare?', startTrivia: 'Quiz', startRps: 'Sasso-Carta-Forbici' },
  pt: { ...EN_GAME, gameMenuPrompt: 'Qual jogo voc\u00ea quer jogar?', startTrivia: 'Quiz', startRps: 'Pedra-Papel-Tesoura' },
  ru: { ...EN_GAME, gameMenuPrompt: '\u041a\u0430\u043a\u0443\u044e \u0438\u0433\u0440\u0443 \u0445\u043e\u0447\u0435\u0448\u044c \u0438\u0433\u0440\u0430\u0442\u044c?', startTrivia: '\u0412\u0438\u043a\u0442\u043e\u0440\u0438\u043d\u0430', startRps: '\u041a\u043d\u0431' },
  zh: { ...EN_GAME, gameMenuPrompt: '\u60f3\u73a9\u4ec0\u4e48\u6e38\u620f\uff1f', startTrivia: '\u95ee\u7b54', startRps: '\u722c\u866b\u5e03\u5934\u526a\u5b50' },
  ja: { ...EN_GAME, gameMenuPrompt: '\u3069\u306e\u30b2\u30fc\u30e0\u3092\u3057\u307e\u3059\u304b\uff1f', startTrivia: '\u30af\u30a4\u30ba', startRps: '\u30b8\u30e3\u30f3\u30b1\u30f3\u30dd\u30f3' },
  ko: { ...EN_GAME, gameMenuPrompt: '\uc5b4\ub290 \uac8c\uc784\uc744 \ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?', startTrivia: '\ud034\uc988', startRps: '\uac00\uc704\ubc14\uc704\ubcf4' },
  ar: { ...EN_GAME, gameMenuPrompt: '\u0623\u064a \u0644\u0639\u0628\u0629 \u062a\u0631\u064a\u062f \u0627\u0644\u0644\u0639\u0628\u061f', startTrivia: '\u0627\u0645\u062a\u062d\u0627\u0646', startRps: '\u062d\u062c\u0631\u0629-\u0648\u0631\u0642\u0629-\u0645\u0642\u0635' },
};

export function getCopilotGameStrings(locale: string): CopilotGameStrings {
  return GAME_BY_LOCALE[locale as Language] ?? EN_GAME;
}

export function getTriviaQuestions(locale: string): TriviaQuestion[] {
  return locale === 'tr' ? TRIVIA_TR : TRIVIA_EN;
}
