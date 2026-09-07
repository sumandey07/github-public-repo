const baseUrl = "https://api.github.com/users";

const usernameInput = document.getElementById("username");
const form = document.getElementById("form");
const errorEl = document.getElementById("error");
const heroEl = document.getElementById("hero");
const resultsEl = document.getElementById("userDetails");
const loaderEl = document.getElementById("loader");
const reposListEl = document.getElementById("reposList");
const noReposEl = document.getElementById("noRepos");
const perPageSelect = document.getElementById("perPageCounters");
const searchReposInput = document.getElementById("searchRepos");
const paginationCont = document.getElementById("paginationCont");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");

let currentUsername = "";
let currentPage = 1;
let perPage = 10;
let totalRepos = 0;

// Optional token: only used if you define one. Never sends `undefined`.
const ACCESS_TOKEN =
  typeof process !== "undefined" && process.env && process.env.ACCESS_TOKEN
    ? process.env.ACCESS_TOKEN
    : "";

if (typeof process === "undefined") {
  window.process = { env: {} };
}

// Common language color map (subset of GitHub's linguist colors).
const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Shell: "#89e051",
  Vue: "#41b883",
  Jupyter: "#DA5B0B",
};

function apiHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (ACCESS_TOKEN) headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  return headers;
}

function showLoader() {
  loaderEl.classList.add("show");
}

function hideLoader() {
  loaderEl.classList.remove("show");
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(n) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n || 0);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function setMeta(itemId, valueId, value, isLink = false, href = "") {
  const item = document.getElementById(itemId);
  const valueEl = document.getElementById(valueId);
  if (!value) {
    item.style.display = "none";
    return;
  }
  item.style.display = "";
  valueEl.textContent = value;
  if (isLink) valueEl.href = href || value;
}

// ---------- Render the user profile ----------
function renderProfile(data) {
  document.getElementById("title").textContent = `${data.name || data.login
    } · GitHub`;
  document.getElementById("profileImage").src = data.avatar_url;
  document.getElementById("name").textContent = data.name || data.login;

  const loginEl = document.getElementById("login");
  loginEl.textContent = `@${data.login}`;
  loginEl.href = data.html_url;

  const bioEl = document.getElementById("bio");
  bioEl.textContent = data.bio || "";
  bioEl.style.display = data.bio ? "" : "none";

  document.getElementById("repoCount").textContent = formatNumber(
    data.public_repos
  );
  document.getElementById("followers").textContent = formatNumber(
    data.followers
  );
  document.getElementById("following").textContent = formatNumber(
    data.following
  );

  setMeta("locationItem", "location", data.location);
  setMeta("companyItem", "company", data.company);

  const blog =
    data.blog && data.blog.trim()
      ? data.blog.startsWith("http")
        ? data.blog
        : `https://${data.blog}`
      : "";
  setMeta("blogItem", "profileLink", data.blog || "", true, blog);

  setMeta(
    "twitterItem",
    "twitterLink",
    data.twitter_username ? `@${data.twitter_username}` : "",
    true,
    data.twitter_username ? `https://twitter.com/${data.twitter_username}` : ""
  );

  totalRepos = data.public_repos || 0;
}

// ---------- Render a single repo card ----------
function repoCardHtml(repo) {
  const desc = repo.description
    ? `<p class="repo-desc">${escapeHtml(repo.description)}</p>`
    : `<p class="repo-desc" style="opacity:.6">No description provided.</p>`;

  const topics = (repo.topics || [])
    .slice(0, 5)
    .map((t) => `<span class="topic-chip">${escapeHtml(t)}</span>`)
    .join("");
  const topicsHtml = topics ? `<div class="repo-topics">${topics}</div>` : "";

  const langColor = LANG_COLORS[repo.language] || "#8b949e";
  const langHtml = repo.language
    ? `<span><span class="lang-dot" style="background:${langColor}"></span>${escapeHtml(
      repo.language
    )}</span>`
    : "";

  return `
    <article class="repo-card" data-name="${escapeHtml(
    (repo.name || "").toLowerCase()
  )}">
      <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener">
        <i class="fa-regular fa-folder"></i>${escapeHtml(repo.name)}
      </a>
      ${desc}
      ${topicsHtml}
      <div class="repo-meta">
        ${langHtml}
        <span class="icon-star"><i class="fa-solid fa-star"></i>${formatNumber(
    repo.stargazers_count
  )}</span>
        <span><i class="fa-solid fa-code-fork"></i>${formatNumber(
    repo.forks_count
  )}</span>
        <span><i class="fa-regular fa-clock"></i>${timeAgo(
    repo.updated_at
  )}</span>
      </div>
    </article>`;
}

// ---------- Load repositories ----------
function repoLoad() {
  showLoader();
  reposListEl.innerHTML = "";
  noReposEl.classList.remove("show");

  fetch(
    `${baseUrl}/${encodeURIComponent(
      currentUsername
    )}/repos?page=${currentPage}&per_page=${perPage}&sort=updated`,
    { headers: apiHeaders() }
  )
    .then((res) => res.json())
    .then((repos) => {
      hideLoader();
      if (!Array.isArray(repos) || repos.length === 0) {
        noReposEl.classList.add("show");
        updatePagination();
        return;
      }
      reposListEl.innerHTML = repos.map(repoCardHtml).join("");
      updatePagination();
      searchFunc();
    })
    .catch(() => {
      hideLoader();
      noReposEl.textContent = "Could not load repositories.";
      noReposEl.classList.add("show");
    });
}

function updatePagination() {
  const totalPages = Math.max(1, Math.ceil(totalRepos / perPage));
  paginationCont.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function paginate(direction) {
  const totalPages = Math.max(1, Math.ceil(totalRepos / perPage));
  if (direction === "prev" && currentPage > 1) currentPage--;
  else if (direction === "next" && currentPage < totalPages) currentPage++;
  else return;
  repoLoad();
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function perPageCounter() {
  perPage = Number(perPageSelect.value);
  currentPage = 1;
  repoLoad();
}

// Client-side filter over the currently rendered repos.
function searchFunc() {
  const term = (searchReposInput.value || "").toLowerCase();
  const cards = reposListEl.querySelectorAll(".repo-card");
  cards.forEach((card) => {
    const name = card.getAttribute("data-name") || "";
    card.style.display = name.indexOf(term) > -1 ? "" : "none";
  });
}

// ---------- Search submit ----------
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const value = usernameInput.value.trim();
  errorEl.textContent = "";

  if (value.length === 0) {
    errorEl.textContent = "Please enter a username.";
    return;
  }

  currentUsername = value;
  currentPage = 1;
  showLoader();

  fetch(`${baseUrl}/${encodeURIComponent(value)}`, { headers: apiHeaders() })
    .then((res) => {
      if (res.status === 404) throw new Error("User not found");
      if (res.status === 403)
        throw new Error("Rate limit reached. Please try again later.");
      if (!res.ok) throw new Error("Something went wrong.");
      return res.json();
    })
    .then((data) => {
      hideLoader();
      renderProfile(data);
      resultsEl.classList.add("show");
      repoLoad();
    })
    .catch((err) => {
      hideLoader();
      resultsEl.classList.remove("show");
      errorEl.textContent = err.message || "Something went wrong.";
    });
});

window.onload = function () {
  usernameInput.focus();
};

