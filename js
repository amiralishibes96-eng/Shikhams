"use strict";

const tracks = [
  {
    id: 1,
    title: "نمونه آهنگ اول",
    artist: "خواننده اول",
    album: "آلبوم اول",
    category: "پاپ",
    src: "assets/music/song-1.mp3",
    cover: "assets/images/cover-1.jpg"
  },
  {
    id: 2,
    title: "نمونه آهنگ دوم",
    artist: "خواننده دوم",
    album: "آلبوم دوم",
    category: "بی‌کلام",
    src: "assets/music/song-2.mp3",
    cover: "assets/images/cover-2.jpg"
  },
  {
    id: 3,
    title: "نمونه آهنگ سوم",
    artist: "خواننده سوم",
    album: "آلبوم سوم",
    category: "راک",
    src: "assets/music/song-3.mp3",
    cover: "assets/images/cover-3.jpg"
  }
];

const $ = selector => document.querySelector(selector);
const audio = $("#audio");

let currentIndex = -1;
let shuffle = false;
let repeat = false;
let libraryMode = "all";

let liked = JSON.parse(localStorage.getItem("sk-liked") || "[]");
let playlists = JSON.parse(localStorage.getItem("sk-playlists") || "[]");

function saveData() {
  localStorage.setItem("sk-liked", JSON.stringify(liked));
  localStorage.setItem("sk-playlists", JSON.stringify(playlists));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 2200);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function coverHTML(track) {
  return `<img src="${escapeHTML(track.cover)}"
    alt="${escapeHTML(track.title)}"
    onerror="this.remove()">`;
}

function renderCards(list = tracks) {
  const grid = $("#track-grid");

  if (!list.length) {
    grid.innerHTML = '<p class="muted">آهنگی پیدا نشد.</p>';
    return;
  }

  grid.innerHTML = list.map(track => `
    <article class="track-card">
      <div class="cover">
        ${coverHTML(track)}
        <button data-play="${track.id}">▶</button>
      </div>
      <h3>${escapeHTML(track.title)}</h3>
      <div class="card-footer">
        <p>${escapeHTML(track.artist)}</p>
        <button class="heart ${liked.includes(track.id) ? "liked" : ""}"
          data-like="${track.id}">
          ${liked.includes(track.id) ? "♥" : "♡"}
        </button>
      </div>
    </article>
  `).join("");
}

function renderRows(target, list) {
  $(target).innerHTML = list.length
    ? list.map(track => `
      <div class="track-row">
        <div class="row-cover">${coverHTML(track)}</div>
        <div>
          <div class="row-title">${escapeHTML(track.title)}</div>
          <div class="row-artist">${escapeHTML(track.artist)}</div>
        </div>
        <span class="row-duration">♫</span>
        <button class="row-play" data-play="${track.id}">▶</button>
      </div>
    `).join("")
    : '<p class="muted">هنوز آهنگی وجود ندارد.</p>';
}

function updateCurrentLike() {
  if (currentIndex === -1) return;

  const track = tracks[currentIndex];
  const isLiked = liked.includes(track.id);

  $("#current-like").textContent = isLiked ? "♥" : "♡";
  $("#current-like").classList.toggle("liked", isLiked);
}

function playTrack(id) {
  const index = tracks.findIndex(
    track => String(track.id) === String(id)
  );

  if (index === -1) return;

  currentIndex = index;
  const track = tracks[index];

  $("#current-title").textContent = track.title;
  $("#current-artist").textContent = track.artist;
  $("#current-cover").innerHTML = coverHTML(track);

  updateCurrentLike();

  audio.src = track.src;
  audio.load();

  audio.play().catch(() => {
    $("#play").textContent = "▶";
    toast("فایل آهنگ را بررسی کن.");
  });
}

function toggleLike(id) {
  const trackId = Number(id);

  if (liked.includes(trackId)) {
    liked = liked.filter(item => item !== trackId);
  } else {
    liked.push(trackId);
  }

  saveData();
  renderCards();

  renderRows(
    "#library-results",
    libraryMode === "liked"
      ? tracks.filter(track => liked.includes(track.id))
      : tracks
  );

  updateCurrentLike();
}

function showView(name) {
  document.querySelectorAll(".view").forEach(view => {
    view.classList.add("hidden");
  });

  const target = $(`#${name}-view`);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.view === name);
  });

  if (name === "library") {
    renderRows(
      "#library-results",
      libraryMode === "liked"
        ? tracks.filter(track => liked.includes(track.id))
        : tracks
    );
  }
}

function nextTrack() {
  if (!tracks.length) return;

  let nextIndex;

  if (shuffle && tracks.length > 1) {
    do {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } while (nextIndex === currentIndex);
  } else {
    nextIndex = (currentIndex + 1) % tracks.length;
  }

  playTrack(tracks[nextIndex].id);
}

function previousTrack() {
  if (currentIndex === -1) return;

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  const index = (currentIndex - 1 + tracks.length) % tracks.length;
  playTrack(tracks[index].id);
}

function renderPlaylists() {
  $("#playlist-list").innerHTML = playlists.length
    ? playlists.map(playlist => `
      <div class="playlist-item">
        ♫ ${escapeHTML(playlist.name)}
      </div>
    `).join("")
    : '<p class="muted">هنوز پلی‌لیستی نداری.</p>';
}

$("#create-playlist").addEventListener("click", () => {
  const name = prompt("نام پلی‌لیست را وارد کن:");
  if (!name || !name.trim()) return;

  playlists.push({ name: name.trim() });
  saveData();
  renderPlaylists();
  toast("پلی‌لیست ساخته شد.");
});

document.addEventListener("click", event => {
  const playButton = event.target.closest("[data-play]");
  const likeButton = event.target.closest("[data-like]");
  const navButton = event.target.closest("[data-view]");
  const categoryButton = event.target.closest("[data-category]");

  if (playButton) playTrack(playButton.dataset.play);

  if (likeButton) toggleLike(likeButton.dataset.like);

  if (navButton) showView(navButton.dataset.view);

  if (categoryButton) {
    const category = categoryButton.dataset.category;

    const filtered = category === "همه"
      ? tracks
      : tracks.filter(track => track.category === category);

    renderCards(filtered);
    showView("home");
  }
});

$("#play").addEventListener("click", () => {
  if (currentIndex === -1) {
    if (tracks.length) playTrack(tracks[0].id);
    return;
  }

  if (audio.paused) {
    audio.play().catch(() => toast("امکان پخش آهنگ وجود ندارد."));
  } else {
    audio.pause();
  }
});

$("#next").addEventListener("click", nextTrack);
$("#previous").addEventListener("click", previousTrack);

$("#shuffle").addEventListener("click", () => {
  shuffle = !shuffle;
  $("#shuffle").classList.toggle("active", shuffle);
  toast(shuffle ? "پخش تصادفی روشن شد" : "پخش تصادفی خاموش شد");
});

$("#repeat").addEventListener("click", () => {
  repeat = !repeat;
  $("#repeat").classList.toggle("active", repeat);
  toast(repeat ? "تکرار روشن شد" : "تکرار خاموش شد");
});

$("#current-like").addEventListener("click", () => {
  if (currentIndex !== -1) toggleLike(tracks[currentIndex].id);
});

$("#volume").addEventListener("input", event => {
  audio.volume = Number(event.target.value);
});

audio.addEventListener("timeupdate", () => {
  $("#current-time").textContent = formatTime(audio.currentTime);
  $("#duration").textContent = formatTime(audio.duration);

  $("#progress").value = audio.duration
    ? audio.currentTime / audio.duration * 100
    : 0;
});

$("#progress").addEventListener("input", event => {
  if (audio.duration) {
    audio.currentTime = audio.duration *
      Number(event.target.value) / 100;
  }
});

audio.addEventListener("ended", () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextTrack();
  }
});

audio.addEventListener("pause", () => {
  $("#play").textContent = "▶";
});

audio.addEventListener("play", () => {
  $("#play").textContent = "Ⅱ";
});

$("#search-input").addEventListener("input", event => {
  const query = event.target.value.trim().toLocaleLowerCase();

  const results = tracks.filter(track => {
    const text = [
      track.title,
      track.artist,
      track.album,
      track.category
    ].join(" ").toLocaleLowerCase();

    return text.includes(query);
  });

  showView("search");
  renderRows("#search-results", results);
});

$("#explore").addEventListener("click", () => {
  $("#search-input").focus();
});

document.querySelectorAll("[data-library]").forEach(button => {
  button.addEventListener("click", () => {
    libraryMode = button.dataset.library;

    document.querySelectorAll("[data-library]").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });

    renderRows(
      "#library-results",
      libraryMode === "liked"
        ? tracks.filter(track => liked.includes(track.id))
        : tracks
    );
  });
});

function initialize() {
  renderCards();
  renderRows("#search-results", []);
  renderRows("#library-results", tracks);
  renderPlaylists();
  audio.volume = 0.8;
}

initialize();