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

function gameL(overrides: Partial<CopilotGameStrings>): CopilotGameStrings {
  return { ...EN_GAME, ...overrides };
}

const DE_GAME = gameL({
  jokeUserPrompt: 'Erzähl mir einen Witz!',
  anotherJoke: 'Noch einen!',
  triviaStartLabel: 'Ingenieur-Quiz',
  rpsStartLabel: 'Schere-Stein-Papier',
  rpsPrompt: 'Wähle Schere, Stein oder Papier!',
  rpsRock: 'Stein', rpsPaper: 'Papier', rpsScissors: 'Schere',
  gameMenuUser: 'Spielmenü', gameMenuPrompt: 'Welches Spiel möchtest du spielen?',
  startTrivia: 'Quiz', startRps: 'Schere-Stein-Papier',
  questionN: 'Frage', triviaCorrect: 'Richtig!', triviaWrong: 'Falsche Antwort.',
  triviaCorrectWas: 'Richtige Antwort war', gameOver: 'Spiel vorbei! Dein Punktestand',
  playAgainPrompt: 'Noch ein Spiel?', newGame: 'Neues Spiel', mainMenu: 'Hauptmenü',
  rpsTie: 'Unentschieden!', rpsWin: 'Du gewinnst!', rpsLose: 'Ich gewinne!',
  rpsYourMove: 'Dein Zug', rpsMyMove: 'Mein Zug', rpsScore: 'Punkte', rpsPlayAgain: 'Nochmal spielen?',
});

const ES_GAME = gameL({
  jokeUserPrompt: '¡Cuéntame un chiste!', anotherJoke: '¡Otro más!',
  triviaStartLabel: 'Trivia de ingeniería', rpsStartLabel: 'Piedra-Papel-Tijera',
  rpsPrompt: '¡Elige piedra, papel o tijera!', rpsRock: 'Piedra', rpsPaper: 'Papel', rpsScissors: 'Tijera',
  gameMenuUser: 'Menú de juegos', gameMenuPrompt: '¿Qué juego quieres jugar?',
  startTrivia: 'Trivia', startRps: 'Piedra-Papel-Tijera',
  questionN: 'Pregunta', triviaCorrect: '¡Correcto!', triviaWrong: 'Respuesta incorrecta.',
  triviaCorrectWas: 'La respuesta correcta era', gameOver: '¡Fin del juego! Tu puntuación',
  playAgainPrompt: '¿Jugar otro?', newGame: 'Nuevo juego', mainMenu: 'Menú principal',
  rpsTie: '¡Empate!', rpsWin: '¡Ganaste!', rpsLose: '¡Gané yo!',
  rpsYourMove: 'Tu jugada', rpsMyMove: 'Mi jugada', rpsScore: 'Puntuación', rpsPlayAgain: '¿Jugar de nuevo?',
});

const FR_GAME = gameL({
  jokeUserPrompt: 'Raconte-moi une blague !', anotherJoke: 'Encore une !',
  triviaStartLabel: 'Quiz ingénierie', rpsStartLabel: 'Pierre-Papier-Ciseaux',
  rpsPrompt: 'Choisis pierre, papier ou ciseaux !', rpsRock: 'Pierre', rpsPaper: 'Papier', rpsScissors: 'Ciseaux',
  gameMenuUser: 'Menu jeux', gameMenuPrompt: 'Quel jeu veux-tu jouer ?',
  startTrivia: 'Quiz', startRps: 'Pierre-Papier-Ciseaux',
  questionN: 'Question', triviaCorrect: 'Correct !', triviaWrong: 'Mauvaise réponse.',
  triviaCorrectWas: 'La bonne réponse était', gameOver: 'Partie terminée ! Ton score',
  playAgainPrompt: 'Rejouer ?', newGame: 'Nouvelle partie', mainMenu: 'Menu principal',
  rpsTie: 'Égalité !', rpsWin: 'Tu gagnes !', rpsLose: 'Je gagne !',
  rpsYourMove: 'Ton coup', rpsMyMove: 'Mon coup', rpsScore: 'Score', rpsPlayAgain: 'Rejouer ?',
});

const IT_GAME = gameL({
  jokeUserPrompt: 'Raccontami una barzelletta!', anotherJoke: 'Ancora una!',
  triviaStartLabel: 'Quiz ingegneria', rpsStartLabel: 'Sasso-Carta-Forbici',
  rpsPrompt: 'Scegli sasso, carta o forbici!', rpsRock: 'Sasso', rpsPaper: 'Carta', rpsScissors: 'Forbici',
  gameMenuUser: 'Menu giochi', gameMenuPrompt: 'Quale gioco vuoi giocare?',
  startTrivia: 'Quiz', startRps: 'Sasso-Carta-Forbici',
  questionN: 'Domanda', triviaCorrect: 'Corretto!', triviaWrong: 'Risposta sbagliata.',
  triviaCorrectWas: 'La risposta corretta era', gameOver: 'Fine partita! Il tuo punteggio',
  playAgainPrompt: 'Giocare ancora?', newGame: 'Nuova partita', mainMenu: 'Menu principale',
  rpsTie: 'Pareggio!', rpsWin: 'Hai vinto!', rpsLose: 'Ho vinto io!',
  rpsYourMove: 'La tua mossa', rpsMyMove: 'La mia mossa', rpsScore: 'Punteggio', rpsPlayAgain: 'Giocare ancora?',
});

const PT_GAME = gameL({
  jokeUserPrompt: 'Conta uma piada!', anotherJoke: 'Mais uma!',
  triviaStartLabel: 'Quiz de engenharia', rpsStartLabel: 'Pedra-Papel-Tesoura',
  rpsPrompt: 'Escolha pedra, papel ou tesoura!', rpsRock: 'Pedra', rpsPaper: 'Papel', rpsScissors: 'Tesoura',
  gameMenuUser: 'Menu de jogos', gameMenuPrompt: 'Qual jogo você quer jogar?',
  startTrivia: 'Quiz', startRps: 'Pedra-Papel-Tesoura',
  questionN: 'Pergunta', triviaCorrect: 'Correto!', triviaWrong: 'Resposta errada.',
  triviaCorrectWas: 'A resposta correta era', gameOver: 'Fim de jogo! Sua pontuação',
  playAgainPrompt: 'Jogar outro?', newGame: 'Novo jogo', mainMenu: 'Menu principal',
  rpsTie: 'Empate!', rpsWin: 'Você venceu!', rpsLose: 'Eu venci!',
  rpsYourMove: 'Sua jogada', rpsMyMove: 'Minha jogada', rpsScore: 'Pontuação', rpsPlayAgain: 'Jogar de novo?',
});

const RU_GAME = gameL({
  jokeUserPrompt: 'Расскажи шутку!', anotherJoke: 'Ещё одну!',
  triviaStartLabel: 'Инженерная викторина', rpsStartLabel: 'Камень-Ножницы-Бумага',
  rpsPrompt: 'Выбери камень, ножницы или бумагу!', rpsRock: 'Камень', rpsPaper: 'Бумага', rpsScissors: 'Ножницы',
  gameMenuUser: 'Меню игр', gameMenuPrompt: 'Какую игру хочешь сыграть?',
  startTrivia: 'Викторина', startRps: 'КНБ',
  questionN: 'Вопрос', triviaCorrect: 'Верно!', triviaWrong: 'Неверный ответ.',
  triviaCorrectWas: 'Правильный ответ', gameOver: 'Игра окончена! Ваш счёт',
  playAgainPrompt: 'Сыграть ещё?', newGame: 'Новая игра', mainMenu: 'Главное меню',
  rpsTie: 'Ничья!', rpsWin: 'Вы выиграли!', rpsLose: 'Я выиграл!',
  rpsYourMove: 'Ваш ход', rpsMyMove: 'Мой ход', rpsScore: 'Счёт', rpsPlayAgain: 'Ещё раз?',
});

const ZH_GAME = gameL({
  jokeUserPrompt: '讲个笑话！', anotherJoke: '再来一个！',
  triviaStartLabel: '工程问答', rpsStartLabel: '石头剪刀布',
  rpsPrompt: '选择石头、布或剪刀！', rpsRock: '石头', rpsPaper: '布', rpsScissors: '剪刀',
  gameMenuUser: '游戏菜单', gameMenuPrompt: '想玩什么游戏？',
  startTrivia: '问答', startRps: '石头剪刀布',
  questionN: '问题', triviaCorrect: '正确！', triviaWrong: '回答错误。',
  triviaCorrectWas: '正确答案是', gameOver: '游戏结束！你的得分',
  playAgainPrompt: '再玩一局？', newGame: '新游戏', mainMenu: '主菜单',
  rpsTie: '平局！', rpsWin: '你赢了！', rpsLose: '我赢了！',
  rpsYourMove: '你的出招', rpsMyMove: '我的出招', rpsScore: '得分', rpsPlayAgain: '再玩一次？',
});

const JA_GAME = gameL({
  jokeUserPrompt: 'ジョークを言って！', anotherJoke: 'もう一つ！',
  triviaStartLabel: 'エンジニアクイズ', rpsStartLabel: 'じゃんけん',
  rpsPrompt: 'グー、チョキ、パーを選んで！', rpsRock: 'グー', rpsPaper: 'パー', rpsScissors: 'チョキ',
  gameMenuUser: 'ゲームメニュー', gameMenuPrompt: 'どのゲームをしますか？',
  startTrivia: 'クイズ', startRps: 'じゃんけん',
  questionN: '問題', triviaCorrect: '正解！', triviaWrong: '不正解。',
  triviaCorrectWas: '正解は', gameOver: 'ゲーム終了！スコア',
  playAgainPrompt: 'もう一度？', newGame: '新しいゲーム', mainMenu: 'メインメニュー',
  rpsTie: 'あいこ！', rpsWin: 'あなたの勝ち！', rpsLose: '私の勝ち！',
  rpsYourMove: 'あなたの手', rpsMyMove: '私の手', rpsScore: 'スコア', rpsPlayAgain: 'もう一度？',
});

const KO_GAME = gameL({
  jokeUserPrompt: '농담 해줘!', anotherJoke: '한 번 더!',
  triviaStartLabel: '엔지니어링 퀴즈', rpsStartLabel: '가위바위보',
  rpsPrompt: '가위, 바위, 보를 선택하세요!', rpsRock: '바위', rpsPaper: '보', rpsScissors: '가위',
  gameMenuUser: '게임 메뉴', gameMenuPrompt: '어떤 게임을 하시겠습니까?',
  startTrivia: '퀴즈', startRps: '가위바위보',
  questionN: '문제', triviaCorrect: '정답!', triviaWrong: '오답입니다.',
  triviaCorrectWas: '정답은', gameOver: '게임 종료! 점수',
  playAgainPrompt: '다시 할까요?', newGame: '새 게임', mainMenu: '메인 메뉴',
  rpsTie: '무승부!', rpsWin: '이겼습니다!', rpsLose: '제가 이겼습니다!',
  rpsYourMove: '당신의 선택', rpsMyMove: '내 선택', rpsScore: '점수', rpsPlayAgain: '다시 할까요?',
});

const AR_GAME = gameL({
  jokeUserPrompt: 'احكِ نكتة!', anotherJoke: 'واحدة أخرى!',
  triviaStartLabel: 'مسابقة هندسية', rpsStartLabel: 'حجر-ورقة-مقص',
  rpsPrompt: 'اختر حجراً أو ورقة أو مقصاً!', rpsRock: 'حجر', rpsPaper: 'ورقة', rpsScissors: 'مقص',
  gameMenuUser: 'قائمة الألعاب', gameMenuPrompt: 'أي لعبة تريد اللعب؟',
  startTrivia: 'امتحان', startRps: 'حجر-ورقة-مقص',
  questionN: 'سؤال', triviaCorrect: 'صحيح!', triviaWrong: 'إجابة خاطئة.',
  triviaCorrectWas: 'الإجابة الصحيحة كانت', gameOver: 'انتهت اللعبة! نتيجتك',
  playAgainPrompt: 'لعب مرة أخرى؟', newGame: 'لعبة جديدة', mainMenu: 'القائمة الرئيسية',
  rpsTie: 'تعادل!', rpsWin: 'فزت!', rpsLose: 'فزت أنا!',
  rpsYourMove: 'حركتك', rpsMyMove: 'حركتي', rpsScore: 'النتيجة', rpsPlayAgain: 'لعب مرة أخرى؟',
});

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

const TRIVIA_DE: TriviaQuestion[] = [
  { q: 'Welches Metall hat das beste Festigkeits-Gewichts-Verhältnis?', options: [{ label: 'Eisen', value: 'iron' }, { label: 'Titan', value: 'titanium' }, { label: 'Aluminium', value: 'aluminum' }], correct: 'titanium', explanation: 'Titan bietet unter den gängigen Metallen das beste Verhältnis.' },
  { q: 'Wie viel Prozent des Anziehdrehmoments geht bei Schrauben in Reibung verloren?', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'Etwa 90 % des Drehmoments überwinden Reibung; nur ~10 % werden Vorspannkraft.' },
  { q: 'Welches Bauteil stützt rotierende Wellen und reduziert Reibung?', options: [{ label: 'Passfeder', value: 'key' }, { label: 'Lager', value: 'bearing' }, { label: 'Stift', value: 'pin' }], correct: 'bearing', explanation: 'Lager tragen Lasten und minimieren Reibung in rotierenden Baugruppen.' },
];

const TRIVIA_ES: TriviaQuestion[] = [
  { q: '¿Qué metal tiene la mejor relación resistencia/peso?', options: [{ label: 'Hierro', value: 'iron' }, { label: 'Titanio', value: 'titanium' }, { label: 'Aluminio', value: 'aluminum' }], correct: 'titanium', explanation: 'El titanio ofrece la mejor relación entre metales estructurales comunes.' },
  { q: '¿Qué porcentaje del par de apriete se pierde por fricción en un tornillo?', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'Aproximadamente el 90 % del par vence la fricción; solo ~10 % se convierte en precarga.' },
  { q: '¿Qué componente soporta ejes rotativos y reduce la fricción?', options: [{ label: 'Chaveta', value: 'key' }, { label: 'Rodamiento', value: 'bearing' }, { label: 'Pasador', value: 'pin' }], correct: 'bearing', explanation: 'Los rodamientos soportan cargas y minimizan la fricción.' },
];

const TRIVIA_FR: TriviaQuestion[] = [
  { q: 'Quel métal a le meilleur rapport résistance/masse ?', options: [{ label: 'Fer', value: 'iron' }, { label: 'Titane', value: 'titanium' }, { label: 'Aluminium', value: 'aluminum' }], correct: 'titanium', explanation: 'Le titane offre le meilleur rapport parmi les métaux courants.' },
  { q: 'Quel pourcentage du couple de serrage est perdu en frottement ?', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'Environ 90 % du couple surmonte le frottement ; seulement ~10 % devient précharge.' },
  { q: 'Quel composant supporte les arbres en rotation et réduit la friction ?', options: [{ label: 'Clavette', value: 'key' }, { label: 'Roulement', value: 'bearing' }, { label: 'Goupille', value: 'pin' }], correct: 'bearing', explanation: 'Les roulements portent les charges et minimisent la friction.' },
];

const TRIVIA_IT: TriviaQuestion[] = [
  { q: 'Quale metallo ha il miglior rapporto resistenza/peso?', options: [{ label: 'Ferro', value: 'iron' }, { label: 'Titanio', value: 'titanium' }, { label: 'Alluminio', value: 'aluminum' }], correct: 'titanium', explanation: 'Il titanio offre il miglior rapporto tra i metalli strutturali comuni.' },
  { q: 'Quale percentuale della coppia di serraggio si perde per attrito?', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'Circa il 90% della coppia supera l\'attrito; solo ~10% diventa precarico.' },
  { q: 'Quale componente supporta alberi rotanti e riduce l\'attrito?', options: [{ label: 'Chavetta', value: 'key' }, { label: 'Cuscinetto', value: 'bearing' }, { label: 'Perno', value: 'pin' }], correct: 'bearing', explanation: 'I cuscinetti sopportano i carichi e minimizzano l\'attrito.' },
];

const TRIVIA_PT: TriviaQuestion[] = [
  { q: 'Qual metal tem a melhor relação resistência/peso?', options: [{ label: 'Ferro', value: 'iron' }, { label: 'Titânio', value: 'titanium' }, { label: 'Alumínio', value: 'aluminum' }], correct: 'titanium', explanation: 'O titânio oferece a melhor relação entre metais estruturais comuns.' },
  { q: 'Que percentagem do torque de aperto se perde por atrito?', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'Cerca de 90% do torque vence o atrito; apenas ~10% vira pré-carga.' },
  { q: 'Qual componente suporta eixos rotativos e reduz o atrito?', options: [{ label: 'Chaveta', value: 'key' }, { label: 'Rolamento', value: 'bearing' }, { label: 'Pino', value: 'pin' }], correct: 'bearing', explanation: 'Rolamentos suportam cargas e minimizam o atrito.' },
];

const TRIVIA_RU: TriviaQuestion[] = [
  { q: 'Какой металл имеет лучшее соотношение прочности к массе?', options: [{ label: 'Железо', value: 'iron' }, { label: 'Титан', value: 'titanium' }, { label: 'Алюминий', value: 'aluminum' }], correct: 'titanium', explanation: 'Титан имеет лучшее соотношение среди распространённых конструкционных металлов.' },
  { q: 'Какой процент момента затяжки теряется на трении?', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'Около 90% момента преодолевает трение; лишь ~10% становится преднатягом.' },
  { q: 'Какой элемент поддерживает вращающиеся валы и снижает трение?', options: [{ label: 'Шпонка', value: 'key' }, { label: 'Подшипник', value: 'bearing' }, { label: 'Штифт', value: 'pin' }], correct: 'bearing', explanation: 'Подшипники воспринимают нагрузки и снижают трение.' },
];

const TRIVIA_ZH: TriviaQuestion[] = [
  { q: '哪种金属的强度重量比最高？', options: [{ label: '铁', value: 'iron' }, { label: '钛', value: 'titanium' }, { label: '铝', value: 'aluminum' }], correct: 'titanium', explanation: '钛在常见结构金属中强度重量比最高。' },
  { q: '螺栓拧紧扭矩大约多少百分比因摩擦损失？', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: '约90%扭矩用于克服摩擦，仅约10%转化为预紧力。' },
  { q: '哪种零件支撑旋转轴并减少摩擦？', options: [{ label: '键', value: 'key' }, { label: '轴承', value: 'bearing' }, { label: '销', value: 'pin' }], correct: 'bearing', explanation: '轴承承载载荷并减少旋转组件中的摩擦。' },
];

const TRIVIA_JA: TriviaQuestion[] = [
  { q: '強度重量比が最も高い金属は？', options: [{ label: '鉄', value: 'iron' }, { label: 'チタン', value: 'titanium' }, { label: 'アルミ', value: 'aluminum' }], correct: 'titanium', explanation: 'チタンは一般的な構造金属の中で最高の強度重量比を持ちます。' },
  { q: 'ボルト締付トルクの約何%が摩擦で失われますか？', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'トルクの約90%が摩擦を克服し、約10%のみが予圧力になります。' },
  { q: '回転軸を支え摩擦を減らす部品は？', options: [{ label: 'キー', value: 'key' }, { label: '軸受', value: 'bearing' }, { label: 'ピン', value: 'pin' }], correct: 'bearing', explanation: '軸受は荷重を受け持ち摩擦を最小化します。' },
];

const TRIVIA_KO: TriviaQuestion[] = [
  { q: '강도 대 중량 비가 가장 높은 금속은?', options: [{ label: '철', value: 'iron' }, { label: '티타늄', value: 'titanium' }, { label: '알루미늄', value: 'aluminum' }], correct: 'titanium', explanation: '티타늄은 일반 구조 금속 중 최고의 강도-중량 비를 제공합니다.' },
  { q: '볼트 체결 토크의 약 몇 %가 마찰로 손실되나요?', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: '토크의 약 90%가 마찰을 극복하고 약 10%만 예압이 됩니다.' },
  { q: '회전축을 지지하고 마찰을 줄이는 부품은?', options: [{ label: '키', value: 'key' }, { label: '베어링', value: 'bearing' }, { label: '핀', value: 'pin' }], correct: 'bearing', explanation: '베어링은 하중을 지지하고 마찰을 최소화합니다.' },
];

const TRIVIA_AR: TriviaQuestion[] = [
  { q: 'أي معدن له أفضل نسبة قوة إلى وزن؟', options: [{ label: 'حديد', value: 'iron' }, { label: 'تيتانيوم', value: 'titanium' }, { label: 'ألومنيوم', value: 'aluminum' }], correct: 'titanium', explanation: 'التيتانيوم يقدم أفضل نسبة بين المعادن الإنشائية الشائعة.' },
  { q: 'ما نسبة عزم الشد المفقودة بالاحتكاك في البرغي؟', options: [{ label: '10%', value: '10' }, { label: '50%', value: '50' }, { label: '90%', value: '90' }], correct: '90', explanation: 'حوالي 90% من العزم يتغلب على الاحتكاك؛ فقط ~10% يصبح إجهاداً مسبقاً.' },
  { q: 'أي مكون يدعم الأعمدة الدوارة ويقلل الاحتكاك؟', options: [{ label: 'إسفين', value: 'key' }, { label: 'محمل', value: 'bearing' }, { label: 'دبوس', value: 'pin' }], correct: 'bearing', explanation: 'المحامل تحمل الأحمال وتقلل الاحتكاك.' },
];

const GAME_BY_LOCALE: Record<Language, CopilotGameStrings> = {
  en: EN_GAME,
  tr: TR_GAME,
  de: DE_GAME,
  es: ES_GAME,
  fr: FR_GAME,
  it: IT_GAME,
  pt: PT_GAME,
  ru: RU_GAME,
  zh: ZH_GAME,
  ja: JA_GAME,
  ko: KO_GAME,
  ar: AR_GAME,
};

const TRIVIA_BY_LOCALE: Record<Language, TriviaQuestion[]> = {
  en: TRIVIA_EN,
  tr: TRIVIA_TR,
  de: TRIVIA_DE,
  es: TRIVIA_ES,
  fr: TRIVIA_FR,
  it: TRIVIA_IT,
  pt: TRIVIA_PT,
  ru: TRIVIA_RU,
  zh: TRIVIA_ZH,
  ja: TRIVIA_JA,
  ko: TRIVIA_KO,
  ar: TRIVIA_AR,
};

export function getCopilotGameStrings(locale: string): CopilotGameStrings {
  return GAME_BY_LOCALE[locale as Language] ?? EN_GAME;
}

export function getTriviaQuestions(locale: string): TriviaQuestion[] {
  return TRIVIA_BY_LOCALE[locale as Language] ?? TRIVIA_EN;
}
