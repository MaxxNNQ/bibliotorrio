
let DATA = null;

const $ = (sel) => document.querySelector(sel);

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

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

    const open = document.createElement("a");
    open.href = "javascript:void(0)";
    open.className = "open";
    open.textContent = "Открыть описание";

    meta.appendChild(author);
    meta.appendChild(title);
    meta.appendChild(open);

    card.appendChild(img);
    card.appendChild(meta);

    function openModal(){
      $("#mCover").src = b.cover;
      $("#mCover").alt = `${b.title} — обложка`;
      $("#mAuthor").textContent = b.author;
      $("#mTitle").textContent = b.title;
      $("#mDesc").textContent = b.desc;
      $("#modal").setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
    }

    card.addEventListener("click", openModal);
    card.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openModal(); }});
    open.addEventListener("click", (e)=>{ e.preventDefault(); openModal(); });

    frag.appendChild(card);
  });

  grid.appendChild(frag);
  $("#count").textContent = `${list.length} / ${DATA.books.length}`;
}

function applySearch(){
  const q = norm($("#q").value).trim();
  if(!q){ render(DATA.books); return; }
  const list = DATA.books.filter((b)=>{
    const hay = norm(b.author)+" "+norm(b.title)+" "+norm(b.desc);
    return hay.includes(q);
  });
  render(list);
}

function closeModal(){
  $("#modal").setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

async function init(){
  const res = await fetch("data.json", {cache:"no-store"});
  DATA = await res.json();
  document.title = DATA.title || "Каталог библиотеки";
  $("#siteTitle").textContent = DATA.title || "Каталог библиотеки";
  $("#siteSubtitle").textContent = DATA.subtitle || "Нажми на описание — увидишь, что внутри.";
  render(DATA.books);

  $("#q").addEventListener("input", applySearch);

  $("#modal").addEventListener("click", (e)=>{
    const t = e.target;
    if(t && t.dataset && t.dataset.close){ closeModal(); }
  });
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });
}

init().catch((err)=>{
  console.error(err);
  $("#grid").innerHTML = "<div style='color:#ffb4b4'>Не смог загрузить data.json. Проверь, что файл лежит рядом с index.html.</div>";
});
