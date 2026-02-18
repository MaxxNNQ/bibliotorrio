let DATA = null;

const $ = (sel) => document.querySelector(sel);
function norm(s){ return (s||"").toLowerCase(); }

// фиксированный список рубрик (даже если пока пустые)
const CATEGORY_ORDER = [
  "all",
  "публицистика",
  "художественная литература",
  "саморазвитие",
  "ислам",
  "буддизм",
  "православие",
];

let CURRENT_CAT = "all";

function labelCat(v){
  if(v === "all") return "Все";
  // первая буква заглавная
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function setActiveCat(val){
  CURRENT_CAT = val || "all";
  const wrap = $("#cats");
  if(!wrap) return;
  wrap.querySelectorAll("button[data-cat]").forEach(btn=>{
    const isActive = btn.getAttribute("data-cat") === CURRENT_CAT;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function buildCategoryButtons(){
  const wrap = $("#cats");
  if(!wrap) return;

  // из данных тоже соберём категории, чтобы не потерять расширение в будущем
  const fromData = new Set((DATA.books||[]).map(b => (b.category||"").trim()).filter(Boolean));
  const ordered = [];
  CATEGORY_ORDER.forEach(c => ordered.push(c));
  // добавить новые, которых нет в фиксированном списке
  [...fromData].sort((a,b)=>a.localeCompare(b,"ru")).forEach(c=>{
    if(!ordered.includes(c)) ordered.push(c);
  });

  wrap.innerHTML = "";
  const frag = document.createDocumentFragment();

  ordered.forEach(c=>{
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "catBtn";
    btn.setAttribute("data-cat", c);
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = labelCat(c);

    btn.addEventListener("click", ()=>{
      setActiveCat(c);
      applyFilters();
    });

    frag.appendChild(btn);
  });

  wrap.appendChild(frag);
  setActiveCat("all");
}

function render(list){
  const grid = $("#grid");
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  list.forEach((b)=>{
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role","button");
    card.setAttribute("aria-label", `${b.author}. ${b.title}. Открыть описание`);

    const img = document.createElement("img");
    img.className = "cover";
    img.loading = "lazy";
    img.src = b.cover;
    img.alt = `${b.title} — обложка`;

    const meta = document.createElement("div");
    meta.className = "meta";

    const author = document.createElement("div");
    author.className = "author";
    author.textContent = b.author;

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = b.title;

    meta.appendChild(author);
    meta.appendChild(title);

    card.appendChild(img);
    card.appendChild(meta);
// зелёная галочка "прочитано"
const mark = document.createElement("div");
mark.className = "readMark";
mark.textContent = "✓";

if (b.read) {
  mark.classList.add("on");
}

mark.addEventListener("click", (e)=>{
  e.stopPropagation();
  b.read = !b.read;

  if (b.read) {
    mark.classList.add("on");
  } else {
    mark.classList.remove("on");
  }
});

card.appendChild(mark);
    function openModal(){
      const mCover = $("#mCover");
      const mAuthor = $("#mAuthor");
      const mTitle = $("#mTitle");
      const mDesc  = $("#mDesc");
      const modal  = $("#modal");

      if (mCover) { mCover.src = b.cover; mCover.alt = `${b.title} — обложка`; }
      if (mAuthor) mAuthor.textContent = b.author || "";
      if (mTitle)  mTitle.textContent  = b.title  || "";
      if (mDesc)   mDesc.textContent   = b.desc   || "";

      if (modal) modal.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
    }

    card.addEventListener("click", openModal);
    card.addEventListener("keydown", (e)=>{
      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();
        openModal();
      }
    });

    frag.appendChild(card);
  });

  grid.appendChild(frag);

  const count = $("#count");
  if (count && DATA && Array.isArray(DATA.books)) {
    count.textContent = `${list.length} / ${DATA.books.length}`;
  }
}

function applyFilters(){
  const qEl = $("#q");
  const q = norm(qEl ? qEl.value : "").trim();

  let list = (DATA && Array.isArray(DATA.books)) ? DATA.books.slice() : [];

  if (CURRENT_CAT !== "all"){
    list = list.filter(b => ((b.category || "").trim()) === CURRENT_CAT);
  }

  if(q){
    list = list.filter((b)=>{
      const hay = norm(b.author)+" "+norm(b.title)+" "+norm(b.desc);
      return hay.includes(q);
    });
  }

  render(list);
}

function closeModal(){
  const modal = $("#modal");
  if (modal) modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

async function init(){
  const res = await fetch("data.json", { cache:"no-store" });
  if (!res.ok) throw new Error(`data.json HTTP ${res.status}`);
  DATA = await res.json();

  document.title = DATA.title || "Каталог библиотеки";
  const siteTitle = $("#siteTitle");
  const siteSubtitle = $("#siteSubtitle");
  if (siteTitle) siteTitle.textContent = DATA.title || "Каталог библиотеки";
  if (siteSubtitle) siteSubtitle.textContent = DATA.subtitle || "Нажми на описание — увидишь, что внутри.";

  if (!DATA || !Array.isArray(DATA.books)) throw new Error("data.json: нет массива books");

  buildCategoryButtons();
  applyFilters();

  const q = $("#q");
  if (q) q.addEventListener("input", applyFilters);

  const modal = $("#modal");
  if (modal) {
    modal.addEventListener("click", (e)=>{
      const t = e.target;
      if(t && t.dataset && t.dataset.close){ closeModal(); }
    });
  }

  window.addEventListener("keydown",(e)=>{
    if(e.key==="Escape") closeModal();
  });
}

init().catch((err)=>{
  console.error(err);
  const grid = $("#grid");
  if (grid) {
    grid.innerHTML =
      "<div style='color:#ffb4b4'>Не смог загрузить data.json. Проверь, что файл лежит рядом с index.html, и что Pages опубликован из правильной папки.</div>";
  }
});
