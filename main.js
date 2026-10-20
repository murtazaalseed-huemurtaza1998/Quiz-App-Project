// 1. المتغيرات
let currentLevel = 'medium';
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 15;
let questions = [];
let musicPlaying = false;

const startScreen = document.getElementById('startScreen');
const quizArea = document.getElementById('quizArea');
const resultScreen = document.getElementById('resultScreen');
const bgMusic = document.getElementById('bgMusic');
const correctSound = document.getElementById('correctSound');
const wrongSound = document.getElementById('wrongSound');

// 2. تشغيل وايقاف الموسيقى
document.getElementById('musicBtn').onclick = () => {
  musicPlaying =!musicPlaying;
  if(musicPlaying) {
    bgMusic.volume = 0.3;
    bgMusic.play();
    document.getElementById('musicBtn').innerText = "🔇 ايقاف الموسيقى";
  } else {
    bgMusic.pause();
    document.getElementById('musicBtn').innerText = "🔊 تشغيل الموسيقى";
  }
}

// 3. جلب الاسئلة من API - Open Trivia DB
async function fetchQuestions(level, amount = 10) {
  let difficulty = level;
  document.getElementById('categoryName').innerText = "تحميل...";
  try {
    const res = await fetch(`https://opentdb.com/api.php?amount=${amount}&category=18&difficulty=${difficulty}&type=multiple`);
    const data = await res.json();
    questions = data.results.map(q => {
      let answers = [...q.incorrect_answers, q.correct_answer].sort(() => 0.5 - Math.random());
      return {
        question: decodeHTML(q.question),
        answers: answers.map(a => decodeHTML(a)),
        correct: answers.indexOf(decodeHTML(q.correct_answer))
      }
    });
    document.getElementById('categoryName').innerText = "برمجة وعلوم حاسوب";
  } catch(err) {
    alert("فشل تحميل الاسئلة. جرب مرة ثانية");
  }
}
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// 4. بدء اللعبة
document.querySelectorAll('.difficulty button').forEach(btn => {
  btn.onclick = async () => {
    currentLevel = btn.dataset.level;
    await fetchQuestions(currentLevel);
    if(questions.length === 0) return;
    startScreen.style.display = 'none';
    quizArea.style.display = 'block';
    loadQuestion();
    createBullets();
    loadHighscore();
  }
});

// 5. تحميل السؤال والباقي نفس الكود السابق
function loadQuestion() {
  resetTimer();
  const q = questions[currentQuestionIndex];
  document.getElementById('question').innerText = q.question;
  document.getElementById('qCount').innerText = currentQuestionIndex + 1;
  document.getElementById('qTotal').innerText = questions.length;
  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = '';
  q.answers.forEach((answer, index) => {
    const div = document.createElement('div');
    div.classList.add('answer');
    div.innerText = answer;
    div.dataset.index = index;
    div.onclick = selectAnswer;
    answersDiv.appendChild(div);
  });
  startTimer();
}

let selectedAnswer = null;
function selectAnswer(e) {
  document.querySelectorAll('.answer').forEach(a => a.classList.remove('selected'));
  e.target.classList.add('selected');
  selectedAnswer = parseInt(e.target.dataset.index);
}

document.getElementById('submitBtn').onclick = () => {
  if (selectedAnswer === null) return alert('اختر اجابة اولا');
  checkAnswer();
}

function checkAnswer() {
  clearInterval(timer);
  const correct = questions[currentQuestionIndex].correct;
  const answers = document.querySelectorAll('.answer');
  answers.forEach(a => a.style.pointerEvents = 'none');

  if (selectedAnswer === correct) {
    answers[selectedAnswer].classList.add('correct');
    correctSound.play();
    score += 10 * (currentLevel === 'hard'? 2 : currentLevel === 'medium'? 1.5 : 1);
  } else {
    answers[selectedAnswer].classList.add('wrong');
    answers[correct].classList.add('correct');
    wrongSound.play();
  }
  updateBullets();
  setTimeout(nextQuestion, 1800);
}

function nextQuestion() {
  currentQuestionIndex++;
  selectedAnswer = null;
  if (currentQuestionIndex < questions.length) {
    loadQuestion();
  } else {
    showResult();
  }
}

function startTimer() {
  timeLeft = 15;
  document.getElementById('timeLeft').innerText = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById('timeLeft').innerText = timeLeft;
    document.getElementById('timeBar').style.width = (timeLeft / 15) * 100 + '%';
    if (timeLeft <= 0) {
      clearInterval(timer);
      wrongSound.play();
      checkAnswer();
    }
  }, 1000);
}
function resetTimer() { clearInterval(timer); document.getElementById('timeBar').style.width = '100%'; }

function createBullets() {
  const bullets = document.getElementById('bullets');
  bullets.innerHTML = '';
  for(let i=0; i<questions.length; i++){
    const span = document.createElement('span');
    if(i === 0) span.classList.add('on');
    bullets.appendChild(span);
  }
}
function updateBullets() {
  document.querySelectorAll('.bullets span').forEach((span, i) => {
    span.classList.remove('on');
    if(i === currentQuestionIndex) span.classList.add('on');
  });
}

function showResult() {
  quizArea.style.display = 'none';
  resultScreen.style.display = 'block';
  const percentage = (score / (questions.length * 20)) * 100;
  document.getElementById('resultScore').innerText = `نتيجتك: ${Math.round(score)} نقطة`;
  let title = "حاول مرة اخرى 💪";
  if (percentage >= 80) title = "ممتاز! انت عبقري 🔥";
  else if (percentage >= 50) title = "جيد جدا";
  document.getElementById('resultTitle').innerText = title;
  saveHighscore(Math.round(score));
}

function saveHighscore(newScore) {
  let highscore = localStorage.getItem('quizHighscore') || 0;
  if (newScore > highscore) {
    localStorage.setItem('quizHighscore', newScore);
  }
}
function loadHighscore() {
  document.getElementById('highscore').innerText = localStorage.getItem('quizHighscore') || 0;
}
document.getElementById('restartBtn').onclick = () => location.reload();