// Sjellja e ftesës në shfletues: zarfi, muzika, animacionet, numërimi, RSVP, QR.
(function () {
  var cfg = window.__INV || {};
  var body = document.body;
  var audio = document.getElementById('bgm');
  var mbtn = document.getElementById('musicBtn');
  var musicStateKey = 'leaders-music-state-v2';
  var invitationOpenedKey = 'leaders-invitation-opened-v1';
  var honorLetterSeenKey = 'leaders-honor-letter-seen-v1';
  var mobileMenuNoticedKey = 'leaders-mobile-menu-noticed-v1';
  var musicShouldPlay = false;
  var lastKnownMusicTime = 0;
  var navigationStateSaved = false;
  var musicState = { playing: false, activeSrc: '', tracks: {} };

  function readSession(key) {
    try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function writeSession(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (e) {}
  }

  function readMusicState() {
    var saved = readSession(musicStateKey);
    if (!saved) return null;
    try {
      var state = JSON.parse(saved);
      if (typeof state.playing !== 'boolean' || !state.tracks || typeof state.tracks !== 'object') return null;
      return state;
    } catch (e) { return null; }
  }

  function normalizeMusicSrc(src) {
    if (!src) return '';
    try { return new URL(src, window.location.href).pathname; } catch (e) { return src; }
  }

  function currentMusicSrc() {
    if (!audio) return '';
    return normalizeMusicSrc(audio.getAttribute('src') || audio.currentSrc);
  }

  function savedTrackTime(src, includeElapsed) {
    var track = musicState.tracks[normalizeMusicSrc(src)];
    if (!track || !Number.isFinite(track.currentTime)) return 0;
    var elapsed = includeElapsed && musicState.playing && track.savedAt
      ? Math.max(0, (Date.now() - track.savedAt) / 1000)
      : 0;
    return Math.max(0, track.currentTime + elapsed);
  }

  function saveMusicState(playing, currentTime) {
    if (!audio) return;
    var src = currentMusicSrc();
    musicState.playing = typeof playing === 'boolean' ? playing : musicShouldPlay;
    musicState.activeSrc = src;
    musicState.tracks[src] = {
      currentTime: Number.isFinite(currentTime)
        ? currentTime
        : (Number.isFinite(audio.currentTime) ? audio.currentTime : lastKnownMusicTime),
      savedAt: Date.now()
    };
    writeSession(musicStateKey, JSON.stringify(musicState));
  }

  // Yjet dhe flokët e borës ndajnë një shtresë globale në të gjithë faqen.
  var globalFx = document.getElementById('globalFx');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (globalFx && window.Snowflakes && !reducedMotion) {
    new window.Snowflakes({
      container: globalFx,
      color: '#fff',
      count: window.innerWidth < 600 ? 24 : 36,
      minOpacity: 0.28,
      maxOpacity: 0.8,
      minSize: 9,
      maxSize: 24,
      rotation: true,
      speed: 0.7,
      wind: true,
      zIndex: 1,
      autoResize: true
    });
  }

  // Asset дахь ганц жетонууд зоос шиг тонгорч, доош хурд авч унана.
  if (globalFx && !reducedMotion) {
    var jetonShower = document.createElement('div');
    var compactJetons = window.innerWidth < 600;
    var jetonCount = compactJetons ? 3 : 5;
    var jetonImages = [
      '/assets/casino/3d/poker-chip-red.avif',
      '/assets/casino/3d/poker-chip-black.avif',
      '/assets/casino/3d/poker-chip-blue.avif',
      '/assets/casino/3d/poker-chip-green.avif'
    ];
    jetonShower.className = 'falling-jetons';
    for (var jetonIndex = 0; jetonIndex < jetonCount; jetonIndex += 1) {
      var jeton = document.createElement('span');
      var jetonImage = document.createElement('img');
      var jetonDuration = 7.4 + (jetonIndex % 4) * 0.8;
      jeton.className = 'falling-jeton';
      jeton.style.setProperty('--jeton-left', ((jetonIndex * 37 + 9) % 94) + '%');
      jeton.style.setProperty('--jeton-size', ((compactJetons ? 48 : 58) + (jetonIndex % 3) * 9) + 'px');
      jeton.style.setProperty('--jeton-duration', jetonDuration + 's');
      jeton.style.setProperty('--jeton-delay', (-(0.9 + jetonIndex * jetonDuration / jetonCount)) + 's');
      jeton.style.setProperty('--jeton-tumble-duration', (1.2 + (jetonIndex % 3) * 0.16) + 's');
      jeton.style.setProperty('--jeton-tumble-delay', (-jetonIndex * 0.21) + 's');
      jetonImage.src = jetonImages[jetonIndex % jetonImages.length];
      jetonImage.alt = '';
      jetonImage.draggable = false;
      jeton.appendChild(jetonImage);
      jetonShower.appendChild(jeton);
    }
    globalFx.appendChild(jetonShower);
  }

  function setupHeroVideo() {
    var heroVideo = document.querySelector('.hero-video');
    if (!heroVideo) return;
    if (reducedMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
      return;
    }
    if (body.classList.contains('has-env') && !body.classList.contains('opened')) {
      heroVideo.pause();
      return;
    }
    var deferredSources = heroVideo.querySelectorAll('source[data-src]');
    if (deferredSources.length) {
      deferredSources.forEach(function (source) {
        source.setAttribute('src', source.getAttribute('data-src'));
        source.removeAttribute('data-src');
      });
      heroVideo.load();
    }
    heroVideo.play().catch(function () {});
  }
  setupHeroVideo();

  function setupHeroRoulette() {
    var game = document.querySelector('[data-roulette-game]');
    if (!game || game.getAttribute('data-roulette-ready') === 'true') return;
    game.setAttribute('data-roulette-ready', 'true');

    var numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    var redNumbers = { 1: true, 3: true, 5: true, 7: true, 9: true, 12: true, 14: true, 16: true, 18: true, 19: true, 21: true, 23: true, 25: true, 27: true, 30: true, 32: true, 34: true, 36: true };
    var sector = 360 / numbers.length;
    var wheel = game.querySelector('[data-roulette-wheel]');
    var numberRing = game.querySelector('[data-roulette-numbers]');
    var ball = game.querySelector('[data-roulette-ball]');
    var button = game.querySelector('[data-roulette-spin]');
    var celebration = document.querySelector('[data-roulette-celebration]');
    var confettiLeft = celebration && celebration.querySelector('[data-roulette-confetti-left]');
    var confettiRight = celebration && celebration.querySelector('[data-roulette-confetti-right]');
    if (!wheel || !numberRing || !ball || !button) return;

    function colorFor(number) {
      if (number === 0) return 'green';
      return redNumbers[number] ? 'red' : 'black';
    }

    var palette = { green: '#0a6a3e', red: '#981d24', black: '#111311' };
    var colorStops = numbers.map(function (number, index) {
      return palette[colorFor(number)] + ' ' + (index * sector) + 'deg ' + ((index + 1) * sector) + 'deg';
    });
    wheel.style.setProperty('--roulette-colors', 'conic-gradient(from ' + (-sector / 2) + 'deg,' + colorStops.join(',') + ')');

    var fragment = document.createDocumentFragment();
    numbers.forEach(function (number, index) {
      var angle = index * sector;
      var radians = angle * Math.PI / 180;
      var label = document.createElement('button');
      var color = colorFor(number);
      label.type = 'button';
      label.className = 'hero-roulette-number';
      label.textContent = number;
      label.setAttribute('data-roulette-number', number);
      label.setAttribute('aria-pressed', 'false');
      label.setAttribute('aria-label', number + ' · ' + (color === 'red' ? 'Улаан' : color === 'black' ? 'Хар' : 'Ногоон') + ' сонгох');
      label.style.left = (50 + Math.sin(radians) * 42.7) + '%';
      label.style.top = (50 - Math.cos(radians) * 42.7) + '%';
      label.style.transform = 'translate(-50%,-50%) rotate(' + angle + 'deg)';
      fragment.appendChild(label);
    });
    numberRing.appendChild(fragment);

    var currentRotation = 0;
    var ballRotation = 0;
    var isSpinning = false;
    var selectedPrediction = null;
    var winAudioContext;

    function randomIndex() {
      if (window.crypto && window.crypto.getRandomValues) {
        var value = new Uint32Array(1);
        window.crypto.getRandomValues(value);
        return value[0] % numbers.length;
      }
      return Math.floor(Math.random() * numbers.length);
    }

    function randomUnit() {
      if (window.crypto && window.crypto.getRandomValues) {
        var value = new Uint32Array(1);
        window.crypto.getRandomValues(value);
        return value[0] / 4294967296;
      }
      return Math.random();
    }

    function chooseResultIndex(prediction) {
      if (!prediction) return randomIndex();
      var shouldWin = randomUnit() < 0.5;
      var candidates = [];
      numbers.forEach(function (number, index) {
        var matches = prediction.mode === 'color'
          ? colorFor(number) === prediction.value
          : number === prediction.value;
        if (matches === shouldWin) candidates.push(index);
      });
      return candidates[Math.floor(randomUnit() * candidates.length)];
    }

    function primeWinAudio() {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!winAudioContext) winAudioContext = new AudioContextClass();
      var unlock = function () {
        var source = winAudioContext.createBufferSource();
        source.buffer = winAudioContext.createBuffer(1, 1, winAudioContext.sampleRate);
        source.connect(winAudioContext.destination);
        source.start(0);
      };
      if (winAudioContext.state === 'suspended') winAudioContext.resume().then(unlock).catch(function () {});
      else unlock();
    }

    function renderWinChime() {
      if (!winAudioContext || winAudioContext.state !== 'running') return;
      var now = winAudioContext.currentTime;
      var master = winAudioContext.createGain();
      var compressor = winAudioContext.createDynamicsCompressor();
      master.gain.setValueAtTime(.36, now);
      master.gain.setValueAtTime(.36, now + 1.8);
      master.gain.exponentialRampToValueAtTime(.001, now + 3.2);
      compressor.threshold.setValueAtTime(-18, now);
      compressor.knee.setValueAtTime(12, now);
      compressor.ratio.setValueAtTime(5, now);
      compressor.attack.setValueAtTime(.004, now);
      compressor.release.setValueAtTime(.18, now);
      master.connect(compressor);
      compressor.connect(winAudioContext.destination);

      var impact = winAudioContext.createOscillator();
      var impactGain = winAudioContext.createGain();
      impact.type = 'sine';
      impact.frequency.setValueAtTime(150, now);
      impact.frequency.exponentialRampToValueAtTime(62, now + .34);
      impactGain.gain.setValueAtTime(.95, now);
      impactGain.gain.exponentialRampToValueAtTime(.001, now + .38);
      impact.connect(impactGain);
      impactGain.connect(master);
      impact.start(now);
      impact.stop(now + .4);

      [523.25, 659.25, 783.99, 1046.5].forEach(function (frequency, index) {
        var start = now + .06 + index * .105;
        [1, 2.01].forEach(function (partial, partialIndex) {
          var oscillator = winAudioContext.createOscillator();
          var noteGain = winAudioContext.createGain();
          oscillator.type = partialIndex ? 'sine' : 'triangle';
          oscillator.frequency.setValueAtTime(frequency * partial, start);
          noteGain.gain.setValueAtTime(.001, start);
          noteGain.gain.exponentialRampToValueAtTime(partialIndex ? .19 : .62, start + .018);
          noteGain.gain.exponentialRampToValueAtTime(.001, start + 1.7);
          oscillator.connect(noteGain);
          noteGain.connect(master);
          oscillator.start(start);
          oscillator.stop(start + 1.75);
        });
      });

      [1567.98, 2093].forEach(function (frequency, index) {
        var sparkle = winAudioContext.createOscillator();
        var sparkleGain = winAudioContext.createGain();
        var start = now + .5 + index * .12;
        sparkle.type = 'sine';
        sparkle.frequency.setValueAtTime(frequency, start);
        sparkleGain.gain.setValueAtTime(.001, start);
        sparkleGain.gain.exponentialRampToValueAtTime(.28, start + .012);
        sparkleGain.gain.exponentialRampToValueAtTime(.001, start + 1.25);
        sparkle.connect(sparkleGain);
        sparkleGain.connect(master);
        sparkle.start(start);
        sparkle.stop(start + 1.3);
      });
    }

    function playWinChime() {
      if (!winAudioContext) return;
      if (winAudioContext.state === 'suspended') {
        winAudioContext.resume().then(renderWinChime).catch(function () {});
      } else renderWinChime();
    }

    function renderLoseChime() {
      if (!winAudioContext || winAudioContext.state !== 'running') return;
      var now = winAudioContext.currentTime;
      var master = winAudioContext.createGain();
      master.gain.setValueAtTime(.3, now);
      master.gain.setValueAtTime(.3, now + .65);
      master.gain.exponentialRampToValueAtTime(.001, now + 1.85);
      master.connect(winAudioContext.destination);

      [392, 311.13, 246.94].forEach(function (frequency, index) {
        var start = now + index * .28;
        var oscillator = winAudioContext.createOscillator();
        var noteGain = winAudioContext.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * .84, start + .78);
        noteGain.gain.setValueAtTime(.001, start);
        noteGain.gain.exponentialRampToValueAtTime(.62, start + .018);
        noteGain.gain.exponentialRampToValueAtTime(.001, start + .88);
        oscillator.connect(noteGain);
        noteGain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + .92);
      });
    }

    function playLoseChime() {
      if (!winAudioContext) return;
      if (winAudioContext.state === 'suspended') {
        winAudioContext.resume().then(renderLoseChime).catch(function () {});
      } else renderLoseChime();
    }

    function renderSpinSound() {
      if (!winAudioContext || winAudioContext.state !== 'running') return;
      var now = winAudioContext.currentTime;
      var duration = reducedMotion ? .25 : 5.2;
      var master = winAudioContext.createGain();
      var elapsed = 0;
      master.gain.setValueAtTime(.16, now);
      master.gain.setValueAtTime(.16, now + Math.max(0, duration - .45));
      master.gain.exponentialRampToValueAtTime(.001, now + duration);
      master.connect(winAudioContext.destination);

      while (elapsed < duration - .04) {
        var progress = elapsed / duration;
        var interval = progress < .18
          ? .072 - (progress / .18) * .032
          : .04 + Math.pow((progress - .18) / .82, 2.35) * .22;
        var tick = winAudioContext.createOscillator();
        var tickGain = winAudioContext.createGain();
        var tickTime = now + elapsed;
        tick.type = 'triangle';
        tick.frequency.setValueAtTime(760 - progress * 270, tickTime);
        tick.frequency.exponentialRampToValueAtTime(260, tickTime + .035);
        tickGain.gain.setValueAtTime(.001, tickTime);
        tickGain.gain.exponentialRampToValueAtTime(.7, tickTime + .003);
        tickGain.gain.exponentialRampToValueAtTime(.001, tickTime + .045);
        tick.connect(tickGain);
        tickGain.connect(master);
        tick.start(tickTime);
        tick.stop(tickTime + .05);
        elapsed += interval;
      }
    }

    function playSpinSound() {
      if (!winAudioContext) return;
      if (winAudioContext.state === 'suspended') {
        winAudioContext.resume().then(renderSpinSound).catch(function () {});
      } else renderSpinSound();
    }

    function selectNumber(number, selectedButton) {
      if (isSpinning) return;
      var color = colorFor(number);
      var colorLabel = color === 'red' ? 'Улаан' : color === 'black' ? 'Хар' : 'Ногоон';
      selectedPrediction = { mode: 'number', value: number };
      numberRing.querySelectorAll('[data-roulette-number]').forEach(function (numberButton) {
        var selected = numberButton === selectedButton;
        numberButton.classList.toggle('is-selected', selected);
        numberButton.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      game.classList.remove('has-result', 'is-winner', 'is-loser', 'needs-selection', 'result-red', 'result-black', 'result-green');
      button.querySelector('span').textContent = 'Spin';
      button.querySelector('small').textContent = number + ' · ' + colorLabel;
      button.setAttribute('aria-label', number + ' ' + colorLabel + ' сонгосон, roulette хүрд эргүүлэх');
      primeWinAudio();
    }

    numberRing.addEventListener('click', function (event) {
      var numberButton = event.target.closest('[data-roulette-number]');
      if (!numberButton || !numberRing.contains(numberButton)) return;
      selectNumber(Number(numberButton.getAttribute('data-roulette-number')), numberButton);
    });

    function fillConfetti(container, direction) {
      if (!container) return;
      container.replaceChildren();
      var colors = ['#f7d985', '#fff0b0', '#d9234e', '#f3a33c'];
      for (var i = 0; i < 30; i += 1) {
        var piece = document.createElement('i');
        var distance = 110 + randomUnit() * 260;
        piece.style.setProperty('--tx', (direction * distance) + 'px');
        piece.style.setProperty('--ty', (-220 + randomUnit() * 440) + 'px');
        piece.style.setProperty('--turn', (-420 + randomUnit() * 840) + 'deg');
        piece.style.setProperty('--delay', (randomUnit() * .38) + 's');
        piece.style.setProperty('--duration', (1.5 + randomUnit() * 1.2) + 's');
        piece.style.setProperty('--piece-color', colors[i % colors.length]);
        container.appendChild(piece);
      }
    }

    function celebrateWin() {
      if (!celebration) return;
      fillConfetti(confettiLeft, 1);
      fillConfetti(confettiRight, -1);
      celebration.classList.remove('is-active');
      void celebration.offsetWidth;
      celebration.classList.add('is-active');
      game.classList.add('is-winner');
      window.setTimeout(function () {
        celebration.classList.remove('is-active');
        game.classList.remove('is-winner');
      }, reducedMotion ? 1500 : 4800);
    }

    function spinWheel(prediction) {
      if (isSpinning) return;
      isSpinning = true;
      playSpinSound();
      var selectedIndex = chooseResultIndex(prediction);
      var selectedNumber = numbers[selectedIndex];
      var selectedColor = colorFor(selectedNumber);
      var won = prediction && (prediction.mode === 'color'
        ? prediction.value === selectedColor
        : prediction.value === selectedNumber);
      var desiredRotation = (360 - (selectedIndex * sector)) % 360;
      var normalizedRotation = ((currentRotation % 360) + 360) % 360;
      var correction = (desiredRotation - normalizedRotation + 360) % 360;
      currentRotation += (5 * 360) + correction;
      ballRotation -= 8 * 360;

      game.classList.remove('has-result', 'is-winner', 'is-loser', 'result-red', 'result-black', 'result-green');
      game.classList.add('is-spinning');
      celebration && celebration.classList.remove('is-active');
      button.disabled = true;
      button.setAttribute('aria-label', 'Roulette хүрд эргэж байна');
      button.querySelector('small').textContent = 'Эргэж байна';
      wheel.style.transform = 'rotate(' + currentRotation + 'deg)';
      ball.style.transform = 'rotate(' + ballRotation + 'deg)';

      window.setTimeout(function () {
        if (!game.isConnected) return;
        var colorLabel = selectedColor === 'red' ? 'Улаан' : selectedColor === 'black' ? 'Хар' : 'Ногоон';
        game.classList.remove('is-spinning');
        game.classList.add('has-result', 'result-' + selectedColor);
        if (!won) game.classList.add('is-loser');
        button.querySelector('span').textContent = selectedNumber;
        button.querySelector('small').textContent = won ? colorLabel : 'Дахин үзэх';
        button.disabled = false;
        button.setAttribute('aria-label', 'Roulette үр дүн ' + selectedNumber + ' ' + colorLabel + ', дахин ёндоо үзэх');
        isSpinning = false;
        if (won) {
          playWinChime();
          celebrateWin();
        } else playLoseChime();
      }, reducedMotion ? 250 : 5300);
    }

    button.addEventListener('click', function () {
      if (isSpinning) return;
      if (!selectedPrediction) {
        game.classList.add('needs-selection');
        button.querySelector('small').textContent = 'Эхлээд тоо сонго';
        return;
      }
      primeWinAudio();
      spinWheel(selectedPrediction);
    });
  }
  setupHeroRoulette();

  function seekMusic(startTime) {
    if (!audio || !Number.isFinite(startTime)) return;
    var applyTime = function () {
      var nextTime = Math.max(0, startTime);
      if (Number.isFinite(audio.duration) && audio.duration > 0) nextTime %= audio.duration;
      audio.currentTime = nextTime;
      lastKnownMusicTime = nextTime;
    };
    if (audio.readyState >= 1) applyTime();
    else audio.addEventListener('loadedmetadata', applyTime, { once: true });
  }

  function syncMusicVideo(startTime) {
    if (!audio || !Number.isFinite(startTime)) return;
    var selector = audio.getAttribute('data-sync-video');
    var video = selector && document.querySelector(selector);
    if (!video) return;
    var applyTime = function () {
      var nextTime = Math.max(0, startTime);
      if (Number.isFinite(video.duration) && video.duration > 0) nextTime %= video.duration;
      video.currentTime = nextTime;
      if (!reducedMotion) video.play().catch(function () {});
    };
    if (video.readyState >= 1) applyTime();
    else video.addEventListener('loadedmetadata', applyTime, { once: true });
  }

  function playMusic(startTime) {
    if (!audio) return;
    musicShouldPlay = true;
    audio.volume = 0.7;
    var nextTime = Number.isFinite(startTime) ? startTime : audio.currentTime;
    seekMusic(nextTime);
    syncMusicVideo(nextTime);
    audio.play().then(function () {
      mbtn && mbtn.classList.add('on');
      saveMusicState(true);
    }).catch(function () {});
  }

  function setMusicSource(src) {
    var nextSrc = normalizeMusicSrc(src);
    if (!audio || !nextSrc || currentMusicSrc() === nextSrc) return;
    saveMusicState(undefined, lastKnownMusicTime);
    var shouldResume = musicShouldPlay;
    audio.pause();
    audio.setAttribute('src', nextSrc);
    lastKnownMusicTime = savedTrackTime(nextSrc, false);
    audio.load();
    if (shouldResume) playMusic(lastKnownMusicTime);
    else {
      seekMusic(lastKnownMusicTime);
      saveMusicState(false, lastKnownMusicTime);
    }
  }

  if (mbtn) mbtn.addEventListener('click', function () {
    if (audio.paused) playMusic();
    else { musicShouldPlay = false; audio.pause(); mbtn.classList.remove('on'); saveMusicState(false); }
  });

  // Route болон track бүрийн тоглосон секунд, асаалттай төлөвийг хадгална.
  if (audio) {
    var savedMusicState = readMusicState();
    if (savedMusicState) {
      musicState = savedMusicState;
      musicShouldPlay = savedMusicState.playing;
      var initialSrc = currentMusicSrc();
      var initialTime = savedTrackTime(initialSrc, savedMusicState.activeSrc === initialSrc);
      if (musicShouldPlay) playMusic(initialTime);
      else seekMusic(initialTime);
    }

    var lastMusicSave = 0;
    audio.addEventListener('timeupdate', function () {
      lastKnownMusicTime = audio.currentTime;
      if (Date.now() - lastMusicSave < 1000) return;
      lastMusicSave = Date.now();
      saveMusicState();
    });

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href]');
      if (!link || link.target === '_blank') return;
      var target = new URL(link.href, window.location.href);
      if (target.origin === window.location.origin && target.pathname !== window.location.pathname) {
        lastKnownMusicTime = audio.currentTime;
        saveMusicState(undefined, lastKnownMusicTime);
        navigationStateSaved = true;
      }
    }, true);
    window.addEventListener('pagehide', function () {
      if (!navigationStateSaved) saveMusicState(undefined, lastKnownMusicTime);
    });
  }

  function setupMusicContext(sourceAudio) {
    if (!audio || !sourceAudio) return;
    var syncVideo = sourceAudio.getAttribute('data-sync-video');
    if (syncVideo) audio.setAttribute('data-sync-video', syncVideo);
    else audio.removeAttribute('data-sync-video');
    setMusicSource(sourceAudio.getAttribute('src'));
  }
  setupMusicContext(audio);

  // Постерын доорх film дэлгэцэнд ороход үндсэн хөгжмийг film-ийн дуутай солино.
  var eventFilmObserver;
  var eventFilmController;
  var eventFilmVideo;
  function setupEventFilm() {
    if (eventFilmObserver) eventFilmObserver.disconnect();
    if (eventFilmController) eventFilmController.abort();
    if (eventFilmVideo) eventFilmVideo.pause();
    eventFilmObserver = null;
    eventFilmVideo = null;

    var film = document.querySelector('[data-event-film]');
    if (!film) return;
    var video = film.querySelector('.event-film-video');
    var filmAudioSrc = film.getAttribute('data-audio-src');
    var filmVideoSelector = film.getAttribute('data-sync-video');
    if (!video || !filmAudioSrc || !filmVideoSelector) return;

    eventFilmController = new AbortController();
    var signal = eventFilmController.signal;
    var routeAudioSrc = currentMusicSrc();
    var routeVideoSelector = audio && audio.getAttribute('data-sync-video');
    var filmIsActive = false;
    var switchTimer;
    eventFilmVideo = video;

    signal.addEventListener('abort', function () { window.clearTimeout(switchTimer); }, { once: true });

    var ensureAudioPlayback = function (expectedSrc, startTime) {
      window.setTimeout(function () {
        if (!audio || !musicShouldPlay || currentMusicSrc() !== normalizeMusicSrc(expectedSrc) || !audio.paused) return;
        playMusic(startTime);
      }, 250);
    };

    var setFilmActive = function (active) {
      if (active === filmIsActive) return;
      filmIsActive = active;
      film.classList.toggle('is-active', active);

      if (active) {
        if (audio) audio.setAttribute('data-sync-video', filmVideoSelector);
        setMusicSource(filmAudioSrc);
        if (!reducedMotion) video.play().catch(function () {});
        ensureAudioPlayback(filmAudioSrc, video.currentTime);
        return;
      }

      video.pause();
      if (audio) {
        if (routeVideoSelector) audio.setAttribute('data-sync-video', routeVideoSelector);
        else audio.removeAttribute('data-sync-video');
      }
      setMusicSource(routeAudioSrc);
      ensureAudioPlayback(routeAudioSrc, lastKnownMusicTime);
    };

    if (audio) audio.addEventListener('timeupdate', function () {
      if (!filmIsActive || currentMusicSrc() !== normalizeMusicSrc(filmAudioSrc) || video.readyState < 1) return;
      if (Math.abs(video.currentTime - audio.currentTime) > 0.45) video.currentTime = audio.currentTime;
    }, { signal: signal });

    if (!('IntersectionObserver' in window)) return;
    eventFilmObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        window.clearTimeout(switchTimer);
        switchTimer = window.setTimeout(function () {
          setFilmActive(entry.isIntersecting && entry.intersectionRatio >= 0.5);
        }, 160);
      });
    }, { threshold: [0, 0.5, 1], rootMargin: '-8% 0px -8% 0px' });
    eventFilmObserver.observe(film);
  }
  setupEventFilm();

  // Mobile navigation: үндсэн холбоосууд + бусад хэсгийн burger drawer.
  var mobileNavController;
  function setupMobileNav() {
    if (mobileNavController) mobileNavController.abort();
    mobileNavController = new AbortController();
    var signal = mobileNavController.signal;
    var mobileNav = document.querySelector('.mobile-nav');
    if (!mobileNav) return;
    var navLinks = [].slice.call(document.querySelectorAll('.mobile-nav a[href^="#"],.desktop-nav a[href^="#"]'));
    var menuToggle = mobileNav.querySelector('.mobile-menu-toggle');
    var menuPanel = mobileNav.querySelector('.mobile-menu-panel');
    var menuBackdrop = mobileNav.querySelector('.mobile-menu-backdrop');
    var menuClose = mobileNav.querySelector('.mobile-menu-close');
    if (!menuToggle || !menuPanel || !menuBackdrop || !menuClose) return;
    menuToggle.setAttribute('aria-label', 'Дэлгэрэнгүй цэс: мэндчилгээ, тоглоом, dress code, хөтөлбөр, байршил');

    var menuHead = menuPanel.querySelector('.mobile-menu-head');
    if (menuHead && !menuHead.querySelector('.mobile-menu-lead')) {
      var menuLead = document.createElement('p');
      menuLead.className = 'mobile-menu-lead';
      menuLead.textContent = 'Casino Night-ийн хөтөлбөр болон хэрэгтэй мэдээлэл';
      menuHead.appendChild(menuLead);
    }
    [].slice.call(menuPanel.querySelectorAll('.mobile-menu-links a')).forEach(function (link) {
      var path = normalizeRoute(new URL(link.href, window.location.href).pathname);
      if (path === '/awards/' || path === '/lottery/') link.classList.add('is-featured');
    });

    var menuNudgeTimer;
    var dismissMenuNudge = function () {
      window.clearTimeout(menuNudgeTimer);
      mobileNav.classList.remove('has-menu-nudge');
      writeSession(mobileMenuNoticedKey, '1');
    };
    var sectionIds = ['top', 'director-greeting', 'casino-experience', 'game-rules', 'assignment', 'dresscode', 'program', 'location'];
    var setMenu = function (open, restoreFocus) {
      dismissMenuNudge();
      mobileNav.classList.toggle('is-open', open);
      document.body.classList.toggle('mobile-menu-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuPanel.setAttribute('aria-hidden', String(!open));
      if (open) {
        menuPanel.removeAttribute('inert');
        setTimeout(function () { menuClose.focus(); }, 50);
      } else {
        menuPanel.setAttribute('inert', '');
        if (restoreFocus) menuToggle.focus();
      }
    };
    menuToggle.addEventListener('click', function () { setMenu(!mobileNav.classList.contains('is-open')); }, { signal: signal });
    menuBackdrop.addEventListener('click', function () { setMenu(false, true); }, { signal: signal });
    menuClose.addEventListener('click', function () { setMenu(false, true); }, { signal: signal });
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false, Boolean(link.closest('.mobile-menu-panel'))); }, { signal: signal });
    });
    document.addEventListener('keydown', function (e) {
      if (!mobileNav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setMenu(false, true); return; }
      if (e.key === 'Tab') {
        var focusable = [].slice.call(menuPanel.querySelectorAll('a,button'));
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, { signal: signal });
    var updateNav = function () {
      var currentId = 'top';
      var marker = window.scrollY + window.innerHeight * 0.42;
      sectionIds.forEach(function (id) {
        var section = document.getElementById(id);
        if (section && section.offsetTop <= marker) currentId = id;
      });
      navLinks.forEach(function (link) {
        if (link.getAttribute('href') === '#' + currentId) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      menuToggle.classList.toggle('is-contextual', currentId !== 'top');
    };
    var navTicking = false;
    window.addEventListener('scroll', function () {
      if (navTicking) return;
      navTicking = true;
      window.requestAnimationFrame(function () { updateNav(); navTicking = false; });
    }, { passive: true, signal: signal });
    window.addEventListener('resize', function () {
      updateNav();
      if (window.innerWidth > 900 && mobileNav.classList.contains('is-open')) setMenu(false);
    }, { signal: signal });
    updateNav();

    if (!reducedMotion && !readSession(mobileMenuNoticedKey) && window.innerWidth <= 900) {
      menuNudgeTimer = window.setTimeout(function () {
        if (!mobileNav.classList.contains('is-open')) mobileNav.classList.add('has-menu-nudge');
      }, 1800);
    }
  }
  setupMobileNav();

  // Card-ийн data-video-src утга нэмэгдэхэд мэндчилгээний тоглуулагч автоматаар идэвхжинэ.
  var greetingVideoController;
  var activeGreetingDialog;
  function setupGreetingVideos() {
    if (activeGreetingDialog && activeGreetingDialog.open) activeGreetingDialog.close();
    activeGreetingDialog = null;
    if (greetingVideoController) greetingVideoController.abort();
    greetingVideoController = new AbortController();
    var signal = greetingVideoController.signal;
    var dialog = document.querySelector('[data-greeting-dialog]');
    var cards = [].slice.call(document.querySelectorAll('[data-greeting-card]'));
    if (!dialog || !cards.length) return;
    var video = dialog.querySelector('[data-greeting-video]');
    var title = dialog.querySelector('[data-greeting-title]');
    var closeButton = dialog.querySelector('[data-greeting-close]');
    var resumeMusic = false;

    var closeDialog = function () {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    };
    var cleanUp = function () {
      video.pause();
      video.removeAttribute('src');
      video.removeAttribute('poster');
      video.load();
      body.classList.remove('greeting-video-open');
      activeGreetingDialog = null;
      if (resumeMusic) playMusic();
      resumeMusic = false;
    };

    cards.forEach(function (card) {
      var src = card.getAttribute('data-video-src') || '';
      var status = card.querySelector('[data-greeting-status], .greeting-card-copy em');
      if (!src) {
        card.disabled = true;
        card.setAttribute('aria-disabled', 'true');
        return;
      }
      card.disabled = false;
      card.removeAttribute('aria-disabled');
      if (status) status.textContent = 'Видео үзэх';
      card.setAttribute('aria-label', (card.getAttribute('data-video-title') || 'Видео мэндчилгээ') + ' үзэх');
      card.addEventListener('click', function () {
        var poster = card.getAttribute('data-video-poster') || '';
        title.textContent = card.getAttribute('data-video-title') || 'Видео мэндчилгээ';
        video.src = src;
        if (poster) video.poster = poster;
        else video.removeAttribute('poster');
        resumeMusic = Boolean(audio && !audio.paused && musicShouldPlay);
        if (resumeMusic) {
          audio.pause();
          mbtn && mbtn.classList.remove('on');
        }
        activeGreetingDialog = dialog;
        body.classList.add('greeting-video-open');
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        video.play().catch(function () {});
      }, { signal: signal });
    });
    closeButton.addEventListener('click', closeDialog, { signal: signal });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) closeDialog(); }, { signal: signal });
    dialog.addEventListener('close', cleanUp, { signal: signal });
    dialog.addEventListener('cancel', function () { window.setTimeout(cleanUp, 0); }, { signal: signal });
  }
  setupGreetingVideos();

  // Animacionet kur seksionet hyjnë në ekran
  var reveal = function () {
    var items = [].slice.call(document.querySelectorAll('.rv:not(.in)'));
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el, i) {
      if (el.closest('.hero')) { setTimeout(function () { el.classList.add('in'); }, 150 + i * 160); }
      else io.observe(el);
    });
  };

  // Дугтуй нээгдсэний дараа хүндэтгэлийн захиаг тухайн session-д нэг удаа үзүүлнэ.
  function setupHonorLetter(delay) {
    var dialog = document.querySelector('[data-honor-letter]');
    if (!dialog || dialog.getAttribute('data-honor-letter-ready') === 'true' || readSession(honorLetterSeenKey) === '1') return;
    dialog.setAttribute('data-honor-letter-ready', 'true');
    var closeButtons = [].slice.call(dialog.querySelectorAll('[data-honor-letter-close]'));
    var closeTimer;

    var closeLetter = function () {
      if (!dialog.open || dialog.classList.contains('is-closing')) return;
      dialog.classList.remove('is-open');
      dialog.classList.add('is-closing');
      body.classList.remove('honor-letter-open');
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () {
        if (typeof dialog.close === 'function' && dialog.open) dialog.close();
        else dialog.removeAttribute('open');
        dialog.classList.remove('is-closing');
      }, reducedMotion ? 0 : 420);
    };

    closeButtons.forEach(function (button) { button.addEventListener('click', closeLetter); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) closeLetter(); });
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); closeLetter(); });

    window.setTimeout(function () {
      if (!dialog.isConnected || readSession(honorLetterSeenKey) === '1') return;
      writeSession(honorLetterSeenKey, '1');
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      body.classList.add('honor-letter-open');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { dialog.classList.add('is-open'); });
      });
    }, delay || 0);
  }

  var env = document.getElementById('envelope');
  if (env) {
    var opened = false;
    var open = function () {
      if (opened) return; opened = true;
      writeSession(invitationOpenedKey, '1');
      body.classList.add('opened'); setupHeroVideo(); playMusic(0);
      setTimeout(reveal, 1500);
      setTimeout(function () { env.remove(); }, 2500);
      setupHonorLetter(2550);
    };
    if (readSession(invitationOpenedKey) === '1') {
      env.remove(); body.classList.add('opened'); setupHeroVideo(); reveal();
      setupHonorLetter(550);
    } else {
      env.addEventListener('click', open);
      env.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    }
  } else { body.classList.add('opened'); reveal(); }

  // Numërimi mbrapsht
  var countdownTimer;
  function setupCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    var cd = document.querySelector('[data-cd]');
    if (!cd) return;
    var target = new Date(cd.getAttribute('data-cd')).getTime();
    var u = {}; ['d', 'h', 'm', 's'].forEach(function (k) { u[k] = cd.querySelector('[data-u="' + k + '"]'); });
    var tick = function () {
      var diff = Math.max(0, target - Date.now());
      u.d.textContent = Math.floor(diff / 864e5);
      u.h.textContent = String(Math.floor(diff / 36e5) % 24).padStart(2, '0');
      u.m.textContent = String(Math.floor(diff / 6e4) % 60).padStart(2, '0');
      u.s.textContent = String(Math.floor(diff / 1e3) % 60).padStart(2, '0');
    };
    tick(); countdownTimer = setInterval(tick, 1000);
  }
  setupCountdown();

  // QR i hyrjes
  var qrEl = document.querySelector('[data-qr]');
  if (qrEl) import('/js/qr.js').then(function (m) { m.drawQR(qrEl, qrEl.dataset.qr, { dark: '#111' }); }).catch(function () {});

  // RSVP
  var form = document.querySelector('.rsvp-form');
  if (form) {
    var msg = form.querySelector('.rsvp-msg'), btn = form.querySelector('button[type=submit]');
    var guestsRow = form.querySelector('.guests-row');
    form.querySelectorAll('input[name=attending]').forEach(function (r) {
      r.addEventListener('change', function () { guestsRow.style.display = form.attending.value === '1' ? '' : 'none'; });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (cfg.mode !== 'live' || !form.dataset.endpoint) { msg.textContent = msg.dataset.prev; return; }
      btn.disabled = true; btn.textContent = btn.dataset.sending;
      var fd = new FormData(form), payload = {};
      fd.forEach(function (v, k) { payload[k] = v; });
      if (cfg.code) payload.code = cfg.code;
      fetch(form.dataset.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function () {
          msg.textContent = payload.attending === '1' ? msg.dataset.ok : msg.dataset.no;
          form.classList.add('done');
        })
        .catch(function () { msg.textContent = msg.dataset.err; btn.disabled = false; btn.textContent = btn.dataset.send; });
    });
  }

  // Galeria: shiko fotot në ekran të plotë
  var phs = document.querySelectorAll('.gal .ph');
  if (phs.length) {
    var srcs = Array.prototype.map.call(phs, function (a) { return a.getAttribute('href'); });
    var cur = 0, box = document.createElement('div');
    box.className = 'lb'; box.setAttribute('role', 'dialog');
    box.innerHTML = '<img alt=""><button class="x" type="button" aria-label="Хаах">✕</button>' + (srcs.length > 1 ? '<button class="pv" type="button" aria-label="Өмнөх">‹</button><button class="nx" type="button" aria-label="Дараах">›</button>' : '') + '<div class="ct"></div>';
    document.body.appendChild(box);
    var img = box.querySelector('img'), ct = box.querySelector('.ct');
    var show = function (i) { cur = (i + srcs.length) % srcs.length; img.src = srcs[cur]; ct.textContent = srcs.length > 1 ? (cur + 1) + ' / ' + srcs.length : ''; box.classList.add('on'); };
    var close = function () { box.classList.remove('on'); };
    phs.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); }); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('x')) close(); });
    var pv = box.querySelector('.pv'), nx = box.querySelector('.nx');
    if (pv) { pv.addEventListener('click', function () { show(cur - 1); }); nx.addEventListener('click', function () { show(cur + 1); }); }
    document.addEventListener('keydown', function (e) { if (!box.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    var sx = 0; box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });
  }

  // Дотоод route-уудыг document reload хийхгүй сольж, нэг audio элементийг тасралтгүй хадгална.
  var softNavigationPending = false;
  function normalizeRoute(pathname) {
    var path = pathname.replace(/\/index\.html$/, '/');
    if (path === '/artists') return '/artists/';
    if (path === '/menu') return '/menu/';
    if (path === '/tickets') return '/tickets/';
    return path;
  }
  function isSoftRoute(pathname) {
    var path = normalizeRoute(pathname);
    return path === '/' || path === '/artists/' || path === '/menu/' || path === '/tickets/';
  }
  function updateDescription(nextDocument) {
    var current = document.querySelector('meta[name="description"]');
    var next = nextDocument.querySelector('meta[name="description"]');
    if (current && next) current.setAttribute('content', next.getAttribute('content') || '');
  }
  function finishSoftNavigation(target, nextDocument, replaceHistory) {
    var currentMain = document.querySelector('main');
    var currentNav = document.querySelector('.mobile-nav');
    var currentDesktopNav = document.querySelector('.desktop-nav');
    var nextMain = nextDocument.querySelector('main');
    var nextNav = nextDocument.querySelector('.mobile-nav');
    var nextDesktopNav = nextDocument.querySelector('.desktop-nav');
    if (!currentMain || !currentNav || !currentDesktopNav || !nextMain || !nextNav || !nextDesktopNav) throw new Error('Incomplete route document');

    currentMain.replaceWith(nextMain);
    currentNav.replaceWith(nextNav);
    currentDesktopNav.replaceWith(nextDesktopNav);
    document.title = nextDocument.title;
    updateDescription(nextDocument);
    body.className = nextDocument.body.className;
    body.classList.remove('has-env', 'mobile-menu-open');
    body.classList.add('opened');
    body.removeAttribute('aria-busy');

    var destination = normalizeRoute(target.pathname) + target.search + target.hash;
    if (!replaceHistory) window.history.pushState({ softRoute: true }, '', destination);
    navigationStateSaved = false;
    setupMobileNav();
    setupHeroVideo();
    setupHeroRoulette();
    setupGreetingVideos();
    setupMusicContext(nextDocument.querySelector('#bgm'));
    setupEventFilm();
    setupCountdown();
    setupHonorLetter(550);
    reveal();

    if (target.hash) {
      window.requestAnimationFrame(function () {
        var section = document.getElementById(decodeURIComponent(target.hash.slice(1)));
        if (section) section.scrollIntoView();
      });
    } else window.scrollTo(0, 0);
  }
  function softNavigate(url, replaceHistory) {
    if (softNavigationPending) return;
    softNavigationPending = true;
    body.setAttribute('aria-busy', 'true');
    var target = new URL(url, window.location.href);
    fetch(normalizeRoute(target.pathname) + target.search)
      .then(function (response) {
        if (!response.ok) throw new Error('Route request failed');
        return response.text();
      })
      .then(function (html) {
        var nextDocument = new DOMParser().parseFromString(html, 'text/html');
        finishSoftNavigation(target, nextDocument, replaceHistory);
      })
      .catch(function () {
        window.location.href = target.href;
      })
      .finally(function () {
        softNavigationPending = false;
        body.removeAttribute('aria-busy');
      });
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    var target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin || !isSoftRoute(target.pathname)) return;
    var currentPath = normalizeRoute(window.location.pathname);
    var targetPath = normalizeRoute(target.pathname);
    if (currentPath === targetPath) {
      if (target.hash) return;
      e.preventDefault();
      navigationStateSaved = false;
      return;
    }
    e.preventDefault();
    softNavigate(target.href, false);
  });
  window.addEventListener('popstate', function () {
    if (isSoftRoute(window.location.pathname)) softNavigate(window.location.href, true);
  });
})();
