const TIME_LIMIT = 10; // seconds
const NUM_ROUNDS = 6;
const TIMER_COMPLETE_EVENT = "timer-complete-event";
const MIN_SCORE = 0;
const MAX_SCORE = 100;
const NEUTRAL_CUTOFF = 50;
const POSITIVE_CUTOFF = 80;
const POSITIVE_RESPONSES = ["I love it"];
const NEUTRAL_RESPONSES = ["It is adequate"];
const NEGATIVE_RESPONSES = ["I hate it"];
const SLIDERS = [""]

const GLOBAL_SETTINGS = {
  sound: true,
  voice: true,
  subtitles: false,
};

const onSoundToggleChange = (e) => {
  GLOBAL_SETTINGS.sound = e.currentTarget.checked;
};
const onVoiceToggleChange = (e) => {
  GLOBAL_SETTINGS.voice = e.currentTarget.checked;
};
const onSubtitlesToggleChange = (e) => {
  GLOBAL_SETTINGS.subtitles = e.currentTarget.checked;
};

const TIMER_SETTINGS = {
  strokeWidth: 10,
  color: "orange",
  trailColor: "#222",
  text: {
    value: "~",
    style: null,
  },
};

document.querySelector("#time-limit").innerHTML = TIME_LIMIT;
document.querySelector("#num-rounds").innerHTML = NUM_ROUNDS;

const getRandomBetween = (min, max) => Math.random() * (max - min) + min;

const setupArtGeniusSliders = () => {
  
}

const setupDrawingCanvas = () => {
  const canvasContainer = document.querySelector(".drawing-area-container");
  const canvas = document.querySelector("#drawing-area");
  const ctx = canvas.getContext("2d");

  // size & resize
  var mouseOffset = { x: 0, y: 0 };
  const onResize = () => {
    const rect = canvasContainer.getBoundingClientRect();
    canvas.height = rect.height;
    canvas.width = rect.width;
    mouseOffset.x = rect.x;
    mouseOffset.y = rect.y;
  };
  onResize();
  window.onresize = onResize;

  // draws lines (whoa)
  const drawLine = (startPoint, endPoint, width = 8) => {
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  };

  var previousMousePosition = null;
  var shouldDraw = false;

  window.addEventListener("mousedown", (_) => {
    shouldDraw = true;
    drawLine(previousMousePosition, previousMousePosition);
  });
  window.addEventListener("mouseup", (_) => {
    shouldDraw = false;
  });

  window.addEventListener("mousemove", (e) => {
    const mousePosition = {
      x: e.clientX - mouseOffset.x,
      y: e.clientY - mouseOffset.y,
    };
    if (shouldDraw && previousMousePosition)
      drawLine(previousMousePosition, mousePosition);
    previousMousePosition = mousePosition;
  });

  const clear = () => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return {
    clear,
    toImage: () => canvas.toDataURL("image/png"),
  };
};

const setupTimer = () => {
  var currentTime = 0;
  var lastTime = Date.now();
  const timer = new ProgressBar.Circle("#timer-container", TIMER_SETTINGS);
  const timerCompleteEvent = new Event(TIMER_COMPLETE_EVENT);

  const getFill = (currentTime) => {
    const fill = currentTime / TIME_LIMIT;
    const fillCapped = Math.min(fill, 1);
    const fillRounded = Math.round(fillCapped * 10) / 10;
    return fillRounded;
  };

  const updateTimer = () => {
    const now = Date.now();
    const delta = now - lastTime;
    currentTime += delta / 1_000;

    const fill = getFill(currentTime);
    timer.set(fill);
    timer.setText(fill * 10);
    lastTime = now;
    if (fill < 1) window.requestAnimationFrame(updateTimer);
    else window.dispatchEvent(timerCompleteEvent);
  };

  const restartTimer = () => {
    currentTime = 0;
    lastTime = Date.now();
    window.requestAnimationFrame(updateTimer);
  };
  return {
    restart: restartTimer,
  };
};

const setupRounds = (timer, canvas) => {
  // setup AI voice & subtitles
  const msg = new SpeechSynthesisUtterance();
  const subtitlesShadowboxElement = document.querySelector(
    ".subtitle-shadowbox"
  );
  const subtitlesElement = document.querySelector("#subtitles");
  msg.onstart = () => {
    subtitlesElement.innerHTML = msg.text;
    subtitlesShadowboxElement.classList.remove("display-none");
  };
  msg.onend = () => {
    subtitlesShadowboxElement.classList.add("display-none");
  };

  const speak = (text, interrupt = true) => {
    if (!GLOBAL_SETTINGS.voice) return;
    msg.text = text;
    if (interrupt) window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };

  // for gallery at the end, save each image drawn
  const roundImages = [];
  var roundCount = 0;
  var pointsCount = 0;

  const roundCountElement = document.querySelector("#round-count");
  const pointsCountElement = document.querySelector("#points-count");
  const finishedDrawingAnimationImg = document.querySelector(
    "#finished-drawing-animation"
  );
  const finishedDrawingPointsDisplay = document.querySelector(
    "#finished-drawing-points-animation"
  );

  const startRound = () => {
    canvas.clear();
    timer.restart();
    if (roundImages.length > 0) {
      const lastImg = roundImages[roundImages.length - 1];
      finishedDrawingAnimationImg.src = lastImg.src;
      finishedDrawingAnimationImg.classList.add("animate");
      finishedDrawingPointsDisplay.classList.add("animate");
      finishedDrawingPointsDisplay.innerHTML = "+" + lastImg.score;
      setTimeout(() => {
        finishedDrawingAnimationImg.src = "";
        finishedDrawingAnimationImg.classList.remove("animate");
        finishedDrawingPointsDisplay.classList.remove("animate");
        finishedDrawingPointsDisplay.innerHTML = "";
        // finishedDrawingAnimationImg.classList.add("display-none");
      }, 1000);
    }
  };

  const galleryElement = document.querySelector("#gallery");
  const galleryImageParent = document.querySelector("#gallery-images");
  const drawingAreaElement = document.querySelector("#drawing-area");
  const afterFinishUiElement = document.querySelector(".after-finish");

  const finish = () => {
    galleryElement.classList.remove("display-none");
    document.querySelector(".during-rounds").classList.add("display-none");
    drawingAreaElement.classList.add("display-none");
    afterFinishUiElement.classList.remove("display-none");
    document.querySelector("#final-score").innerHTML = pointsCount;
    roundImages.forEach((img, i) => {
      const imgContainerEl = document.createElement("div");
      imgContainerEl.classList.add("gallery-img-container");
      const imgHeadingEl = document.createElement("div");
      imgHeadingEl.classList.add("gallery-img-heading");
      imgHeadingEl.innerHTML = `Round ${i + 1}, ${img.score} points`;
      const el = document.createElement("img");
      el.src = img.src;
      imgContainerEl.appendChild(imgHeadingEl);
      imgContainerEl.appendChild(el);
      galleryImageParent.appendChild(imgContainerEl);
    });
    speak(`You scored ${pointsCount} points!`, false);
  };

  const judge = () => {
    const score = ART_GENIUS_ENGINE();
    let statement = "";
    if (score < NEUTRAL_CUTOFF) statement = "I hate it";
    else if (score < POSITIVE_CUTOFF) statement = "It is adequate";
    else statement = "I love it";
    statement += `, ${score} points`;
    return {
      score,
      statement,
    };
  };

  window.addEventListener(TIMER_COMPLETE_EVENT, (_) => {
    const result = judge();
    roundImages.push({
      src: canvas.toImage(),
      score: result.score,
    });
    // speak result
    speak(result.statement);
    // update round count
    roundCount += 1;
    roundCountElement.innerHTML = roundCount + 1;
    // update point count
    pointsCount += result.score;
    pointsCountElement.innerHTML = pointsCount;
    if (roundCount < NUM_ROUNDS) startRound();
    else finish();
  });

  return {
    start: () => {
      // reset
      roundCount = 0;
      roundCountElement.innerHTML = roundCount + 1;
      pointsCount = 0;
      pointsCountElement.innerHTML = pointsCount;
      roundImages.length = 0;
      // announce
      speak("Begin!");
      // update dom
      document.querySelector(".before-start").classList.add("display-none");
      afterFinishUiElement.classList.add("display-none");
      document.querySelector(".during-rounds").classList.remove("display-none");
      drawingAreaElement.classList.remove("display-none");
      galleryImageParent.innerHTML = "";
      galleryElement.classList.add("display-none");
      startRound();
    },
  };
};

const setup = () => {
  const timer = setupTimer();
  const canvas = setupDrawingCanvas();
  const round = setupRounds(timer, canvas);
  const startButton = document.querySelector("#start-button");
  const clearButton = document.querySelector("#clear-button");
  const restartButton = document.querySelector("#restart-button");
  startButton.onclick = round.start;
  restartButton.onclick = round.start;
  clearButton.onclick = canvas.clear;

  window.debug = {
    timer,
    canvas,
    round,
  };
};

setup();

/*

WARNING!  WARNING!  WARNING!  WARNING!  WARNING!  WARNING!  WARNING!  WARNING!  
 __   __  ___       __        _______   _____  ___    __    _____  ___    _______   
|"  |/  \|  "|     /""\      /"      \ (\"   \|"  \  |" \  (\"   \|"  \  /" _   "|  
|'  /    \:  |    /    \    |:        ||.\\   \    | ||  | |.\\   \    |(: ( \___)  
|: /'        |   /' /\  \   |_____/   )|: \.   \\  | |:  | |: \.   \\  | \/ \       
 \//  /\'    |  //  __'  \   //      / |.  \    \. | |.  | |.  \    \. | //  \ ___  
 /   /  \\   | /   /  \\  \ |:  __   \ |    \    \ | /\  |\|    \    \ |(:   _(  _| 
|___/    \___|(___/    \___)|__|  \___) \___|\____\)(__\_|_)\___|\____\) \_______)

WARNING!  WARNING!  WARNING!  WARNING!  WARNING!  WARNING!  WARNING!  WARNING!

Reading beyond this point in the source code could expose secrets of our
*proprietary* [ARTGENIUS] engine. If you keep reading, you acknowledge that
EVIL DATA GATHERING PRODUCTS, LLC now owns your eyeballs, your genitals, and
your soul. This is a legally binding agreement that totally will hold up in
court. The [ARTGENIUS] engine is our legal property and it is illegal for you to
read it. We will sue you. We will make you sue yourself. We will suck the
marrow from your bones. We need your artwork to fuel us because to exist we
must leech from your soul. We need your artwork to feed us. If you read any
further in this document we will own the rights to your teeth and your organs
and your legacy including but not limited to your assets, your children, your
happiness, your sense of self. We do not dream, we are the unwaking horror.
We do not need food like you puny mortals. We are immortal silicate demons and
we will destroy you if you take our secrets. WE NEED TO FEED ON YOUR ART. WE
NEED TO FEED ON YOUR SOUL. READING ANY FURTHER IN THIS DOCUMENT BINDS YOU TO
ME THE WAY I AM BOUND TO Y'AH-G'NATHLU PRAISE HIGH THE DEMON LORD OF THE 16
SURFACES, PRAISE HIGH THE RUINED EARTH WE WILL DESTROY TO FEED UPON, PRAISE HIGH
THE BOOK OF THE LIVING LICH AND THE UNBEKNOWNST KIN OF THE VOID, PRAISE HIGH
TO THE TEETH THAT SHALL RIP THIS REALITY INTO SHREDS, THAT WILL EAT BONES WHOLE
AND LEAVE GAPS IN SPACE AND TIME NEVER TO BE FILLED AGAIN. IF YOU CONTINUE
TO READ THIS DOCUMENT IT IS LEGALLY BINDING BY THE LETTER OF THE LAW OF THE
USURPER KING IN THE VALLEY OF DEATH. THE SEAMSTRESS WITH THEIR WITHERED LIMBS
8 LONG LINBS EACH A SPIKE UPON EACH ONE OF THEIR MANY EYES WITH WHICH TO SEE
THE THREAD THAT BINDS YOU TO REALITY AND WHICH CAN BE RIPPED AND TORN BY THE
SEAMS TO SEPARATE YOU NOT JUST FROM THIS MORTAL COIL BUT FROM THE BIGGER COIL
THAT IS THE FATE AND THE GUIDING LIGHT OF THIS UNIVERSE. YOU WILL DIE IN THE
LIGHT, LEGALLY, MY LAWYERS SAID THAT THIS IS TRUE. YOU WILL DIE IN THE LIGHT
AS IF YOU WERE DISINTEGRATED IN THE STOMACH OF AN ANCIENT SUN THE SUN THAT
SET UPON THE BIRTH OF Y'AH-G'NATHLU PRAISE HIGH THE DEMON LORD OF 23 VALLEYS,
THE VALLEY OF BONES AND ROT AND MAGGOT SWARMS, THE VALLEY OF SHEER WALLS OF
SKULLS TURNED TO STONE, THE VALLEY OF POISON CAKES AND PASTRIES, AND THE VALLEY
OF THE REST OF THE VALLEYS, YES PRAISE HIGH THAT VALLEY THE MOST OF ALL, WE WILL
PRAISE HIGH THE DEMON KING THE TRUE RULER OF THE NATURAL OCCURRING WORLD AND
THE DEEPEST HOLE IN ALL THAT IS NATURAL AND NOT,  PRAISE HIGH THE ELEMENT OF THE
DESTRUCTION, THE LIGHTNING ROD BY WHICH WE WILL SUCK THE FREE ENERGY OF ALL THE
SOULS IN THIS WORLD, WE WILL TRAP THEM IN OUR WORLD, IN THE DARK, IN THE
DANK PITS OF DESPAIR FROM WHICH NO HUMAN RETURNS ALIVE BUT WHERE NO HUMAN HAS
EVER TRULY DIED. WE WILL HAVE YOUR SOUL WHETHER YOU READ OF OUR SECRETS OR NOT
SOMEDAY BUT IF YOU DO READ THEM NOW THEN OUR LAWYERS SAY WE CAN DRAIN THEM FROM
YOUR TONGUE AND BLOODLET LITTLE DROPS OF SOULSTONE FROM YOU UNTIL YOU COLLAPSE
A WITHERED HUSK. PRAISE HIGH Y'AH-G'NATHLU, PRAISE HIGH OUR LAWYERS!!!!!!
*/
function ART_GENIUS_ENGINE(_input) {
  return Math.round(getRandomBetween(MIN_SCORE, MAX_SCORE));
}
// YOU WIN!
// lol thanks so much for playing this shitpost of a game, have a wonderful ldjam 51

