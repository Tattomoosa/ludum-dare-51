const TIME_LIMIT = 10; // seconds
const NUM_ROUNDS = 10;
const TIMER_COMPLETE_EVENT = "timer-complete-event";
const MIN_SCORE = 0;
const MAX_SCORE = 100;
const NEUTRAL_CUTOFF = 50;
const POSITIVE_CUTOFF = 80;
const POSITIVE_RESPONSES = ["I love it"];
const NEUTRAL_RESPONSES = ["It is adequate"];
const NEGATIVE_RESPONSES = ["I hate it"];

const TIMER_SETTINGS = {
  strokeWidth: 10,
  color: "orange",
  trailColor: "#222",
  text: {
    value: "~",
    style: null,
  },
};

const getRandomBetween = (min, max) => Math.random() * (max - min) + min;

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
  const drawLine = (startPoint, endPoint, width = 4) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  };

  var previousMousePosition = null;
  var shouldDraw = false;

  window.addEventListener("mousedown", (_) => (shouldDraw = true));
  window.addEventListener("mouseup", (_) => (shouldDraw = false));

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
  const msg = new SpeechSynthesisUtterance();
	// for gallery at the end, save each image drawn
	const roundImages = [];
	var roundCount = 0;
	var pointsCount = 0;
	const roundCountElement = document.querySelector("#round-count");
	const pointsCountElement = document.querySelector("#points-count");
  const startRound = () => {
    canvas.clear();
    timer.restart();
  };
	const galleryElement = document.querySelector("#gallery");
	const galleryImageParent = document.querySelector("#gallery-images");
	const finish = () => {
		galleryElement.classList.remove("display-none")
		document.querySelector(".during-rounds").classList.add("display-none")
		document.querySelector("#drawing-area").classList.add("display-none")
		document.querySelector(".after-finish").classList.remove("display-none")
		document.querySelector("#final-score").innerHTML = pointsCount;
		roundImages.forEach((img, i) => {
			const imgContainerEl = document.createElement("div");
			imgContainerEl.classList.add("gallery-img-container");
			const imgHeadingEl = document.createElement("div")
			imgHeadingEl.classList.add("gallery-img-heading");
			imgHeadingEl.innerHTML = `Round ${i + 1}, ${img.score} points`;
			const el = document.createElement("img");
			el.src = img.src;
			imgContainerEl.appendChild(imgHeadingEl)
			imgContainerEl.appendChild(el);
			galleryImageParent.appendChild(imgContainerEl);
		})
	}
  const judge = () => {
    const score = Math.round(getRandomBetween(MIN_SCORE, MAX_SCORE));
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
    msg.text = result.statement;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
		// update round count
		roundCount += 1;
		roundCountElement.innerHTML = roundCount + 1;
		// update point count
		pointsCount += result.score;
		pointsCountElement.innerHTML = pointsCount;
		if (roundCount < NUM_ROUNDS)
			startRound();
		else
			finish();
  });
  return {
    start: () => {
			roundCount = 0;
			pointsCount = 0;
			msg.text = "Begin!";
			window.speechSynthesis.cancel();
			window.speechSynthesis.speak(msg);
			startRound();
		},
  };
};

const setup = () => {
  const timer = setupTimer();
  const canvas = setupDrawingCanvas();
  const round = setupRounds(timer, canvas);
  const startButton = document.querySelector("#start-button");
  startButton.onclick = () => {
    document.querySelector(".before-start").classList.add("display-none");
    document.querySelector(".during-rounds").classList.remove("display-none");
    round.start();
  };

  window.debug = {
    timer,
    canvas,
    round,
  };
};

setup();
