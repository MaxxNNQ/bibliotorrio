let DATA = null;

const $ = (sel) => document.querySelector(sel);

function norm(s){ return (s||"").toLowerCase(); }

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

function applySearch(){
  const qEl = $("#q");
  const q = norm(qEl ? qEl.value : "").trim();
  if(!q){ render(DATA.books); return; }

  const list = DATA.books.filter((b)=>{
    const hay = norm(b.author)+" "+norm(b.title)+" "+norm(b.desc);
    return hay.includes(q);
  });
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

  // категории
const cats = [...new Set(DATA.books.map(b => b.category).filter(Boolean))];
const catSel = document.getElementById("cat");

if (catSel) {
  cats.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSel.appendChild(opt);
  });
}
// фильтр по категории
if (catSel) {
  catSel.addEventListener("change", () => {
    const val = catSel.value;

    if (val === "all") {
      render(DATA.books);
      return;
    }

    const filtered = DATA.books.filter(b => b.category === val);
    render(filtered);
  });
}
  document.title = DATA.title || "Каталог библиотеки";
  const siteTitle = $("#siteTitle");
  const siteSubtitle = $("#siteSubtitle");
  if (siteTitle) siteTitle.textContent = DATA.title || "Каталог библиотеки";
  if (siteSubtitle) siteSubtitle.textContent = DATA.subtitle || "Нажми на описание — увидишь, что внутри.";

  if (!DATA || !Array.isArray(DATA.books)) throw new Error("data.json: нет массива books");

  render(DATA.books);

  const q = $("#q");
  if (q) q.addEventListener("input", applySearch);

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
