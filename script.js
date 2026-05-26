const contentKey = "filmcraft-portfolio-content";
const contentVersionKey = "filmcraft-portfolio-content-version";
const videoDbName = "filmcraft-video-store";
const videoStoreName = "videos";
const oldWorkLead = "下方窗口可替换为你的真实视频。鼠标移入会自动静音预览，点击任意窗口可打开播放。";
const refinedWorkLead = "以代表作品为入口，快速查看不同类型项目中的拍摄、剪辑、调色与交付能力。";

let memoryContent = null;
let contentRenderId = 0;
const pendingVideoFiles = new Map();
const pendingCoverFiles = new Map();
const pendingCoverDataUrls = new Map();
const pendingCollectionVideoFiles = new Map();
const objectUrls = new Map();
const pendingCoverPreviewUrls = new Map();

function clearObjectUrlCache() {
  objectUrls.clear();
}

function clearPendingCoverPreviewUrls(index) {
  const entries = index === undefined
    ? [...pendingCoverPreviewUrls.entries()]
    : [[index, pendingCoverPreviewUrls.get(index)]];
  entries.forEach(([key, url]) => {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {}
    pendingCoverPreviewUrls.delete(key);
  });
}

function getPendingCoverPreviewUrl(index, file) {
  if (!file) return "";
  const cached = pendingCoverPreviewUrls.get(index);
  if (cached) return cached;
  const url = URL.createObjectURL(file);
  pendingCoverPreviewUrls.set(index, url);
  return url;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function createCompressedCoverDataUrl(file) {
  const fallback = async () => readFileAsDataUrl(file);
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return fallback();
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    return dataUrl.length <= 1_800_000 ? dataUrl : "";
  } catch {
    const dataUrl = await fallback();
    return dataUrl.length <= 1_800_000 ? dataUrl : "";
  }
}

const defaultContent = {
  profile: {
    name: "你的姓名",
    role: "摄像 / 后期剪辑 / 媒体内容制作",
    jobTarget: "摄像师 / 后期剪辑师 / 新媒体视觉",
    city: "可替换城市，接受外出拍摄",
    education: "XX大学 / 影视摄影与制作 / 本科",
    experience: "2024.05 - 至今，摄像 / 后期 / 新闻采编经验",
    tools: "DaVinci / After Effects / 剪映 / DJI / SONY",
    contact: "hello@example.com · 你的微信号",
    intro:
      "适合岗位：摄像师 / 后期剪辑师 / 视频内容创作 / 新媒体视觉。重点展示项目类型、代表作品和实际经历，让招聘方快速判断你的执行能力。"
  },
  workLead: refinedWorkLead,
  projects: [
    {
      kicker: "Short Video",
      title: "短视频内容",
      linkText: "进入短视频合集",
      meta: "Vertical · 00:45",
      video: "assets/videos/short-video.mp4",
      description: "适合展示账号内容、快剪、口播、探店、活动切片等项目，突出节奏、字幕包装和平台适配。"
    },
    {
      kicker: "Documentary",
      title: "纪录片 / 人物故事",
      linkText: "进入纪录片合集",
      meta: "Documentary · 03:20",
      video: "assets/videos/documentary.mp4",
      description: "适合放人物纪实、专题片段、采访结构和现场观察类作品。"
    },
    {
      kicker: "Commercial",
      title: "TVC / 商业广告",
      linkText: "进入 TVC 合集",
      meta: "TVC · 00:30",
      video: "assets/videos/tvc.mp4",
      description: "适合突出布光、镜头质感、产品节奏和商业视觉完成度。"
    },
    {
      kicker: "Short Film",
      title: "微电影",
      linkText: "进入微电影合集",
      meta: "Film · 06:00",
      video: "assets/videos/short-film.mp4",
      description: "适合展示叙事镜头、场面调度、情绪剪辑和声音节奏。"
    },
    {
      kicker: "Promotion",
      title: "宣传片 / 品牌片",
      linkText: "进入宣传片合集",
      meta: "Promo · 01:30",
      video: "assets/videos/promo.mp4",
      description: "适合放企业宣传、城市形象、校园宣传、活动回顾等完整项目。"
    },
    {
      kicker: "Mini Drama",
      title: "短剧 / 剧情内容",
      linkText: "进入短剧合集",
      meta: "Drama · 02:10",
      video: "assets/videos/mini-drama.mp4",
      description: "适合突出镜头连续性、表演调度、情节节奏和批量内容生产能力。"
    }
  ]
};

const defaultCollectionItems = [
  {
    title: "合集作品 01",
    bili: "",
    video: "",
    description: "这里可以放这个分类下的第一个代表作品。"
  },
  {
    title: "合集作品 02",
    bili: "",
    video: "",
    description: "可以填写 B站链接 / BV号，或填写 mp4 直链。"
  },
  {
    title: "合集作品 03",
    bili: "",
    video: "",
    description: "建议写清项目职责、拍摄/剪辑内容和交付平台。"
  },
  {
    title: "合集作品 04",
    bili: "",
    video: "",
    description: "适合补充同一类别下的不同风格、不同客户或不同平台版本。"
  },
  {
    title: "合集作品 05",
    bili: "",
    video: "",
    description: "可以放完整片段、精选片段、幕后花絮或对比版本。"
  },
  {
    title: "合集作品 06",
    bili: "",
    video: "",
    description: "建议保留最能代表你能力的作品，避免数量太多但重点不清。"
  }
];

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const videoModal = document.querySelector("[data-video-modal]");
const modalVideo = document.querySelector("[data-modal-video]");
let modalBili = document.querySelector("[data-modal-bili]");
const editorModal = document.querySelector("[data-editor-modal]");
const editorForm = document.querySelector("[data-editor-form]");
const editorProjects = document.querySelector("[data-editor-projects]");
const editorStatus = document.querySelector("[data-editor-status]");

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.classList.toggle("is-open");
  navLinks?.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    navToggle?.classList.remove("is-open");
    navLinks.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

function bindSpotlightCards(root = document) {
  root.querySelectorAll(".spotlight-card").forEach((card) => {
    if (card.dataset.spotlightBound) return;
    card.dataset.spotlightBound = "true";
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });
}

bindSpotlightCards();

function cloneContent(content) {
  return JSON.parse(JSON.stringify(content));
}

function defaultCollectionTitle(index) {
  return `视频 ${String(index + 1).padStart(2, "0")}`;
}

function normalizeCollectionTitle(title, index) {
  const value = String(title || "").trim();
  if (!value || value.includes("鍚堥泦") || value.includes("合集")) return defaultCollectionTitle(index);
  return value;
}

function normalizeContent(content) {
  const source = content && typeof content === "object" ? content : {};
  return {
    ...defaultContent,
    ...source,
    workLead: !source.workLead || source.workLead === oldWorkLead ? refinedWorkLead : source.workLead,
    profile: { ...defaultContent.profile, ...(source.profile || {}) },
    projects: defaultContent.projects.map((project, index) => ({
      ...project,
      ...((source.projects || [])[index] || {}),
      collection: defaultCollectionItems.map((item, itemIndex) => {
        const mergedItem = {
          ...item,
          ...(((source.projects || [])[index] || {}).collection || [])[itemIndex]
        };
        return {
          ...mergedItem,
          title: normalizeCollectionTitle(mergedItem.title, itemIndex)
        };
      })
    }))
  };
}

function getStaticContent() {
  return normalizeContent(window.FILMCRAFT_STATIC_CONTENT || defaultContent);
}

function getStaticContentVersion() {
  return String(window.FILMCRAFT_STATIC_CONTENT_VERSION || "");
}

function safeStorageGet(key) {
  try {
    return window.localStorage?.getItem(key) || window.sessionStorage?.getItem(key);
  } catch {
    try {
      return window.sessionStorage?.getItem(key);
    } catch {
      return null;
    }
  }
}

function safeStorageSet(key, value) {
  let saved = false;
  try {
    window.localStorage?.removeItem(key);
    window.localStorage?.setItem(key, value);
    saved = true;
  } catch {}
  try {
    window.sessionStorage?.removeItem(key);
    window.sessionStorage?.setItem(key, value);
    saved = true;
  } catch {}
  return saved;
}

function safeStorageRemove(key) {
  try {
    window.localStorage?.removeItem(key);
  } catch {}
  try {
    window.sessionStorage?.removeItem(key);
  } catch {}
}

function clearSavedContent() {
  safeStorageRemove(contentKey);
  safeStorageRemove(contentVersionKey);
}

function resetRuntimeContent() {
  memoryContent = null;
  pendingVideoFiles.clear();
  pendingCoverFiles.clear();
  pendingCoverDataUrls.clear();
  pendingCollectionVideoFiles.clear();
  clearPendingCoverPreviewUrls();
}

function hasSavedContent() {
  return Boolean(safeStorageGet(contentKey) || memoryContent);
}

function readContent() {
  if (memoryContent) return normalizeContent(memoryContent);
  const staticVersion = getStaticContentVersion();
  if (staticVersion && safeStorageGet(contentVersionKey) !== staticVersion) {
    safeStorageRemove(contentKey);
  }
  const raw = safeStorageGet(contentKey);
  if (raw) {
    try {
      return normalizeContent(JSON.parse(raw));
    } catch {
      return getStaticContent();
    }
  }
  return getStaticContent();
}

function writeContent(content) {
  memoryContent = cloneContent(content);
  const saved = safeStorageSet(contentKey, JSON.stringify(content, null, 2));
  if (saved) safeStorageSet(contentVersionKey, getStaticContentVersion());
  return saved;
}

function setEditorStatus(message, isError = false) {
  if (!editorStatus) return;
  editorStatus.textContent = message;
  editorStatus.classList.toggle("is-error", isError);
}

function openVideoDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(videoDbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(videoStoreName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMediaBlob(key, file) {
  const db = await openVideoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(videoStoreName, "readwrite");
    tx.objectStore(videoStoreName).put(file, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getMediaBlob(key) {
  const db = await openVideoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(videoStoreName, "readonly");
    const request = tx.objectStore(videoStoreName).get(key);
    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

const saveVideoBlob = saveMediaBlob;
const getVideoBlob = getMediaBlob;

async function resolveProjectVideo(project, index) {
  const pending = pendingVideoFiles.get(index);
  if (pending) return URL.createObjectURL(pending);
  if (project.videoBlobKey) {
    if (objectUrls.has(project.videoBlobKey)) return objectUrls.get(project.videoBlobKey);
    try {
      const blob = await getVideoBlob(project.videoBlobKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrls.set(project.videoBlobKey, url);
        return url;
      }
    } catch (error) {
      console.warn("Unable to load stored video", error);
    }
  }
  return project.video || "";
}

async function resolveCollectionVideo(item, projectIndex, itemIndex) {
  const pendingKey = `${projectIndex}-${itemIndex}`;
  const pending = pendingCollectionVideoFiles.get(pendingKey);
  if (pending) return URL.createObjectURL(pending);
  if (item.videoBlobKey) {
    if (objectUrls.has(item.videoBlobKey)) return objectUrls.get(item.videoBlobKey);
    try {
      const blob = await getMediaBlob(item.videoBlobKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrls.set(item.videoBlobKey, url);
        return url;
      }
    } catch (error) {
      console.warn("Unable to load stored collection video", error);
    }
  }
  return item.video || "";
}

async function resolveProjectCover(project, index) {
  const pending = pendingCoverFiles.get(index);
  if (pending) return getPendingCoverPreviewUrl(index, pending);
  if (project.coverDataUrl) return project.coverDataUrl;
  if (project.coverBlobKey) {
    if (objectUrls.has(project.coverBlobKey)) return objectUrls.get(project.coverBlobKey);
    try {
      const blob = await getMediaBlob(project.coverBlobKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrls.set(project.coverBlobKey, url);
        return url;
      }
    } catch (error) {
      console.warn("Unable to load stored cover", error);
    }
  }
  return project.cover || "";
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined) element.textContent = value;
}

function setTextFor(root, selector, value) {
  const element = root.querySelector(selector);
  if (element && value !== undefined) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cssUrl(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function getCoverSettings(project = {}) {
  return {
    fit: project.coverFit === "cover" ? "cover" : "contain",
    x: clampNumber(project.coverX, 0, 100, 50),
    y: clampNumber(project.coverY, 0, 100, 50),
    scale: clampNumber(project.coverScale, 0.8, 2, 1)
  };
}

function getMediaFrameSettings(item = {}) {
  return {
    fit: item.videoFit === "contain" ? "contain" : "cover",
    x: clampNumber(item.videoX, 0, 100, 50),
    y: clampNumber(item.videoY, 0, 100, 50),
    scale: clampNumber(item.videoScale, 0.8, 2, 1)
  };
}

function setCoverImage(windowEl, coverUrl, settings, options = {}) {
  let image = windowEl.querySelector(".cover-image");
  if (!coverUrl) {
    if (options.preserveExisting && image) return;
    image?.remove();
    windowEl.classList.remove("has-cover");
    windowEl.style.removeProperty("background-image");
    return;
  }
  if (!image) {
    image = document.createElement("img");
    image.className = "cover-image";
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    windowEl.prepend(image);
  }
  image.src = coverUrl;
  image.style.objectFit = settings.fit;
  image.style.objectPosition = `${settings.x}% ${settings.y}%`;
  image.style.transform = `scale(${settings.scale})`;
  windowEl.classList.add("has-cover");
  windowEl.style.removeProperty("background-image");
}

async function refreshProjectCovers(content = readContent(), options = {}) {
  const cards = document.querySelectorAll("[data-video-card]");
  await Promise.all(
    content.projects.map(async (project, index) => {
      const card = cards[index];
      const windowEl = card?.querySelector(".video-window");
      if (!windowEl) return;
      const coverUrl = await resolveProjectCover(project, index);
      const shouldPreserve = options.preserveExisting && Boolean(project.coverBlobKey || project.coverDataUrl || project.cover || pendingCoverFiles.get(index));
      setCoverImage(windowEl, coverUrl, getCoverSettings(project), { preserveExisting: shouldPreserve });
    })
  );
}

function scheduleProjectCoverRefresh(content = readContent()) {
  const refresh = () => {
    if (editorModal && !editorModal.hidden) return;
    refreshProjectCovers(content, { preserveExisting: true });
  };
  requestAnimationFrame(refresh);
  window.setTimeout(refresh, 250);
  window.setTimeout(refresh, 900);
}

function getCoverEditorSettings(index) {
  const fields = editorForm?.elements;
  const scaleValue = Number(fields?.[`project-${index}-coverScale`]?.value || 100) / 100;
  return getCoverSettings({
    coverFit: fields?.[`project-${index}-coverFit`]?.value,
    coverX: fields?.[`project-${index}-coverX`]?.value,
    coverY: fields?.[`project-${index}-coverY`]?.value,
    coverScale: scaleValue
  });
}

function previewCoverForProject(index, coverUrl, settings = getCoverEditorSettings(index)) {
  const card = document.querySelectorAll("[data-video-card]")[index];
  const windowEl = card?.querySelector(".video-window");
  if (windowEl) setCoverImage(windowEl, coverUrl, settings);
  const preview = document.querySelector(`[data-cover-preview="${index}"]`);
  if (preview) setCoverImage(preview, coverUrl, settings);
}

function applyContent(content) {
  const renderId = ++contentRenderId;
  setText(".hero-profile h1 .title-line", content.profile.name);
  setText(".role-line", content.profile.role);
  setText(".intro-band p", content.profile.intro);
  setText(".work-section .section-lead", content.workLead);

  const meta = document.querySelector(".profile-meta");
  if (meta) {
    meta.innerHTML = [
      ["求职方向", content.profile.jobTarget],
      ["所在城市", content.profile.city],
      ["学历", content.profile.education],
      ["工作经验", content.profile.experience],
      ["常用工具", content.profile.tools],
      ["联系方式", content.profile.contact]
    ]
      .map(([label, value]) => `<span><strong>${label}</strong> ${escapeHtml(value)}</span>`)
      .join("");
  }

  document.querySelectorAll("[data-video-card]").forEach(async (card, index) => {
    const project = content.projects[index];
    if (!project) return;
    setTextFor(card, ".card-kicker", project.kicker);
    setTextFor(card, "h3", project.title);
    setTextFor(card, ".category-link", project.linkText);
    const description = card.querySelector(".card-content p:last-child");
    if (description) description.textContent = project.description;
    const biliUrl = getProjectBiliUrl(project);
    const video = card.querySelector("video");
    if (video) {
      video.dataset.src = biliUrl ? "" : await resolveProjectVideo(project, index);
      if (renderId !== contentRenderId) return;
      video.removeAttribute("src");
      video.load();
    }
    const windowEl = card.querySelector(".video-window");
    if (windowEl) {
      const coverUrl = await resolveProjectCover(project, index);
      if (renderId !== contentRenderId) return;
      setCoverImage(windowEl, coverUrl, getCoverSettings(project), {
        preserveExisting: Boolean(project.coverBlobKey || project.coverDataUrl || project.cover || pendingCoverFiles.get(index))
      });
    }
    const cardBili = card.querySelector(".card-bili");
    if (cardBili) cardBili.remove();
    if (biliUrl) {
      windowEl?.classList.add("has-bili");
      card.dataset.biliReady = "true";
      setTextFor(card, ".play-badge", "B站");
      setTextFor(card, ".window-cta", "B站播放");
    } else {
      windowEl?.classList.remove("has-bili");
      delete card.dataset.biliReady;
      setTextFor(card, ".play-badge", "播放");
      setTextFor(card, ".window-cta", "播放预览");
    }
  });
}

function hydrateVideo(video) {
  if (!video || video.src) return;
  if (video.dataset.src) video.src = video.dataset.src;
}

function getBiliPlayerUrl(value) {
  let input = String(value || "").trim();
  if (!input) return "";
  const iframeSrc = input.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) input = iframeSrc.trim();
  if (input.startsWith("//")) input = `https:${input}`;
  const bv = input.match(/BV[a-zA-Z0-9]+/)?.[0];
  const av = input.match(/(?:av|aid=)(\d+)/i)?.[1];
  const params = "page=1&p=1&autoplay=0&high_quality=1&danmaku=0&as_wide=1&qn=112&quality=112&hideCoverInfo=1";
  if (bv) return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bv)}&${params}`;
  if (av) return `https://player.bilibili.com/player.html?aid=${encodeURIComponent(av)}&${params}`;
  if (input.includes("player.bilibili.com")) {
    try {
      const url = new URL(input);
      const bvid = url.searchParams.get("bvid");
      const aid = url.searchParams.get("aid");
      if (bvid) return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&${params}`;
      if (aid) return `https://player.bilibili.com/player.html?aid=${encodeURIComponent(aid)}&${params}`;
      params.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      return url.toString();
    } catch {
      return input;
    }
  }
  return "";
}

function getProjectBiliUrl(project) {
  return getBiliPlayerUrl(project?.bili) || getBiliPlayerUrl(project?.video);
}

function getFreshBiliUrl(url) {
  if (!url) return "";
  try {
    const freshUrl = new URL(url);
    freshUrl.searchParams.set("autoplay", "1");
    freshUrl.searchParams.set("t", "0");
    freshUrl.searchParams.set("start", "0");
    freshUrl.searchParams.set("_open", Date.now().toString());
    return freshUrl.toString();
  } catch {
    return url;
  }
}

function resetBiliPlayer() {
  if (!modalBili) return;
  const freshBili = modalBili.cloneNode(false);
  modalBili.hidden = true;
  modalBili.removeAttribute("src");
  modalBili.replaceWith(freshBili);
  modalBili = freshBili;
}

async function renderCollectionPage(content) {
  const page = document.querySelector("[data-collection-index]");
  const list = document.querySelector("[data-collection-videos]");
  if (!page || !list) return;

  const projectIndex = Number(page.dataset.collectionIndex);
  const project = content.projects[projectIndex];
  if (!project) return;

  const items = await Promise.all(
    project.collection.map(async (item, index) => {
      const title = item.title || defaultCollectionTitle(index);
      const playerUrl = getBiliPlayerUrl(item.bili) || getBiliPlayerUrl(item.video);
      const directVideo = playerUrl ? "" : await resolveCollectionVideo(item, projectIndex, index);
      const settings = getMediaFrameSettings(item);
      const mediaStyle = `object-fit:${settings.fit};object-position:${settings.x}% ${settings.y}%;transform:scale(${settings.scale});`;
      const media = playerUrl
        ? `<iframe src="${escapeHtml(playerUrl)}" title="${escapeHtml(title)}" allow="fullscreen; autoplay" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`
        : directVideo
          ? `<video controls playsinline src="${escapeHtml(directVideo)}" style="${mediaStyle}"></video>`
          : `<div class="collection-player-empty">&#22312;&#32534;&#36753;&#20869;&#23481;&#37324;&#20026;&#36825;&#20010;&#35270;&#39057;&#22635;&#20889; B&#31449;&#38142;&#25509; / BV&#21495;&#12289;&#35270;&#39057;&#30452;&#38142;&#65292;&#25110;&#30452;&#25509;&#25302;&#20837;&#26412;&#22320;&#35270;&#39057;&#12290;</div>`;
      return `
        <article class="collection-work spotlight-card">
          <div class="collection-player">${media}</div>
          <div class="collection-work-copy">
            <p class="card-kicker">${escapeHtml(project.kicker || "Video")}</p>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(item.description || "")}</p>
          </div>
        </article>
      `;
    })
  );

  list.innerHTML = items.join("");
  bindSpotlightCards(list);
}
function playPreview(card) {
  const video = card.querySelector("video");
  hydrateVideo(video);
  if (!video?.src) return;
  card.classList.add("is-playing");
  video.muted = true;
  video.play().catch(() => card.classList.remove("is-playing"));
}

function stopPreview(card) {
  const video = card.querySelector("video");
  card.classList.remove("is-playing");
  if (!video) return;
  video.pause();
  video.currentTime = 0;
}

function openVideo(card) {
  const index = [...document.querySelectorAll("[data-video-card]")].indexOf(card);
  const project = readContent().projects[index];
  const biliUrl = getProjectBiliUrl(project);
  if (biliUrl && videoModal && modalBili && modalVideo) {
    modalVideo.pause();
    modalVideo.currentTime = 0;
    modalVideo.hidden = true;
    modalVideo.removeAttribute("src");
    modalVideo.load();
    resetBiliPlayer();
    modalBili.sandbox = "allow-scripts allow-same-origin allow-presentation";
    modalBili.referrerPolicy = "no-referrer-when-downgrade";
    modalBili.hidden = false;
    videoModal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      modalBili.src = getFreshBiliUrl(biliUrl);
    });
    return;
  }

  const preview = card.querySelector("video");
  hydrateVideo(preview);
  if (!videoModal || !modalVideo || !preview?.src) return;
  if (modalBili) {
    resetBiliPlayer();
  }
  modalVideo.hidden = false;
  modalVideo.src = preview.currentSrc || preview.src;
  modalVideo.currentTime = 0;
  modalVideo.onloadedmetadata = () => {
    modalVideo.currentTime = 0;
  };
  videoModal.hidden = false;
  document.body.style.overflow = "hidden";
  modalVideo.play().catch(() => {});
}

function closeVideo() {
  if (!videoModal || !modalVideo) return;
  document.querySelectorAll("[data-video-card]").forEach((card) => stopPreview(card));
  modalVideo.pause();
  modalVideo.onloadedmetadata = null;
  modalVideo.removeAttribute("src");
  modalVideo.load();
  modalVideo.hidden = false;
  resetBiliPlayer();
  videoModal.hidden = true;
  document.body.style.overflow = "";
}

function bindVideoCards() {
  document.querySelectorAll("[data-video-card]").forEach((card) => {
    if (card.dataset.videoBound === "true") return;
    card.dataset.videoBound = "true";
    card.addEventListener("pointerenter", () => playPreview(card));
    card.addEventListener("pointerleave", () => stopPreview(card));
    card.addEventListener("focusin", () => playPreview(card));
    card.addEventListener("focusout", () => stopPreview(card));
    const opener = card.querySelector("[data-video-open]");
    opener?.addEventListener("click", () => openVideo(card));
    opener?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openVideo(card);
      }
    });
  });
}

function fillEditor(content) {
  const fields = editorForm.elements;
  Object.entries(content.profile).forEach(([key, value]) => {
    if (fields[key]) fields[key].value = value;
  });
  if (fields.workLead) fields.workLead.value = content.workLead || "";
  setEditorStatus("");
  editorProjects.innerHTML = content.projects
    .map((project, index) => {
      const coverSettings = getCoverSettings(project);
      return `
        <section class="editor-project" data-editor-project="${index}">
          <h3>${escapeHtml(project.title || `作品 ${index + 1}`)}</h3>
          <label>英文标签 <input name="project-${index}-kicker" type="text" value="${escapeHtml(project.kicker)}" /></label>
          <label>标题 <input name="project-${index}-title" type="text" value="${escapeHtml(project.title)}" /></label>
          <label>合集入口文字 <input name="project-${index}-linkText" type="text" value="${escapeHtml(project.linkText)}" /></label>
          <label class="full-field">&#23553;&#38754;&#22270;&#36335;&#24452; / &#22270;&#29255;&#38142;&#25509; <input name="project-${index}-cover" type="text" value="${escapeHtml(project.cover)}" placeholder="&#20363;&#22914; assets/images/cover-short.jpg &#25110; https://..." /></label>
          <div class="media-dropzone cover-dropzone full-field" data-cover-drop="${index}">
            <input name="project-${index}-cover-file" type="file" accept="image/*" hidden />
            <strong>&#25302;&#20837;&#23553;&#38754;&#22270;&#29255;</strong>
            <span>${escapeHtml(project.coverName || "&#25903;&#25345; jpg / png / webp / gif&#65292;&#20063;&#21487;&#20197;&#28857;&#20987;&#36825;&#37324;&#36873;&#25321;&#22270;&#29255;&#12290;")}</span>
          </div>
          <div class="cover-adjuster full-field" data-cover-adjuster="${index}">
            <div class="cover-preview" data-cover-preview="${index}"><span>&#23553;&#38754;&#39044;&#35272;</span></div>
            <label>&#26174;&#31034;&#26041;&#24335;
              <select name="project-${index}-coverFit">
                <option value="contain" ${coverSettings.fit === "contain" ? "selected" : ""}>&#23436;&#25972;&#26174;&#31034;</option>
                <option value="cover" ${coverSettings.fit === "cover" ? "selected" : ""}>&#38138;&#28385;&#35009;&#20999;</option>
              </select>
            </label>
            <label>&#24038;&#21491;&#20301;&#32622; <input name="project-${index}-coverX" type="range" min="0" max="100" step="1" value="${coverSettings.x}" /></label>
            <label>&#19978;&#19979;&#20301;&#32622; <input name="project-${index}-coverY" type="range" min="0" max="100" step="1" value="${coverSettings.y}" /></label>
            <label>&#30011;&#38754;&#32553;&#25918; <input name="project-${index}-coverScale" type="range" min="80" max="200" step="1" value="${Math.round(coverSettings.scale * 100)}" /></label>
          </div>
          <label class="full-field">视频路径 <input name="project-${index}-video" type="text" value="${escapeHtml(project.video)}" /></label>
          <label class="full-field">B站链接 / BV号 <input name="project-${index}-bili" type="text" value="${escapeHtml(project.bili)}" placeholder="例如 BV1xx411c7mD 或 https://www.bilibili.com/video/BV..." /></label>
          <div class="video-dropzone full-field" data-video-drop="${index}">
            <input name="project-${index}-file" type="file" accept="video/*" hidden />
            <strong>拖入视频文件</strong>
            <span>${escapeHtml(project.videoName || "支持 mp4 / mov / webm，也可以点击这里选择文件。")}</span>
          </div>
          <div class="editor-collection-slots full-field">
            <h4>&#35270;&#39057;</h4>
            ${project.collection
              .map((item, itemIndex) => {
                const videoSettings = getMediaFrameSettings(item);
                return `
                  <div class="editor-collection-slot">
                    <strong>&#35270;&#39057; ${itemIndex + 1}</strong>
                    <label>标题 <input name="project-${index}-collection-${itemIndex}-title" type="text" value="${escapeHtml(item.title)}" /></label>
                    <label>B站链接 / BV号 <input name="project-${index}-collection-${itemIndex}-bili" type="text" value="${escapeHtml(item.bili)}" /></label>
                    <label>视频直链 <input name="project-${index}-collection-${itemIndex}-video" type="text" value="${escapeHtml(item.video)}" /></label>
                    <div class="video-dropzone full-field" data-collection-video-drop="${index}-${itemIndex}">
                      <input name="project-${index}-collection-${itemIndex}-file" type="file" accept="video/*" hidden />
                      <strong>&#25302;&#20837;&#36825;&#20010;&#35270;&#39057;</strong>
                      <span>${escapeHtml(item.videoName || "&#36866;&#21512;&#30701;&#35270;&#39057;&#23567;&#25991;&#20214;&#65292;&#25302;&#20837;&#21518;&#20445;&#23384;&#21363;&#21487;&#26174;&#31034;&#22312;&#21512;&#38598;&#39029;&#12290;")}</span>
                    </div>
                    <div class="collection-video-adjuster full-field">
                      <label>&#26174;&#31034;&#26041;&#24335;
                        <select name="project-${index}-collection-${itemIndex}-videoFit">
                          <option value="cover" ${videoSettings.fit === "cover" ? "selected" : ""}>&#38138;&#28385;&#35009;&#20999;</option>
                          <option value="contain" ${videoSettings.fit === "contain" ? "selected" : ""}>&#23436;&#25972;&#26174;&#31034;</option>
                        </select>
                      </label>
                      <label>&#24038;&#21491;&#20301;&#32622; <input name="project-${index}-collection-${itemIndex}-videoX" type="range" min="0" max="100" step="1" value="${videoSettings.x}" /></label>
                      <label>&#19978;&#19979;&#20301;&#32622; <input name="project-${index}-collection-${itemIndex}-videoY" type="range" min="0" max="100" step="1" value="${videoSettings.y}" /></label>
                      <label>&#30011;&#38754;&#32553;&#25918; <input name="project-${index}-collection-${itemIndex}-videoScale" type="range" min="80" max="200" step="1" value="${Math.round(videoSettings.scale * 100)}" /></label>
                    </div>
                    <label class="full-field">说明 <textarea name="project-${index}-collection-${itemIndex}-description" rows="2">${escapeHtml(item.description)}</textarea></label>
                  </div>
                `;
              })
              .join("")}
          </div>
          <label class="full-field">描述 <textarea name="project-${index}-description" rows="3">${escapeHtml(project.description)}</textarea></label>
        </section>
      `;
    })
    .join("");
  bindDropzones();
  bindCoverAdjusters();
}

function bindCoverAdjusters() {
  document.querySelectorAll("[data-cover-adjuster]").forEach((adjuster) => {
    const index = Number(adjuster.dataset.coverAdjuster);
    const updatePreview = async () => {
      const pending = pendingCoverFiles.get(index);
      const project = readContent().projects[index];
      const typedCover = editorForm?.elements?.[`project-${index}-cover`]?.value;
      const coverUrl = pending ? getPendingCoverPreviewUrl(index, pending) : typedCover || (await resolveProjectCover(project, index));
      previewCoverForProject(index, coverUrl, getCoverEditorSettings(index));
    };
    adjuster.querySelectorAll("input, select").forEach((field) => {
      field.addEventListener("input", updatePreview);
      field.addEventListener("change", updatePreview);
    });
    const coverPathField = editorForm?.elements?.[`project-${index}-cover`];
    coverPathField?.addEventListener("input", updatePreview);
    coverPathField?.addEventListener("change", updatePreview);
    updatePreview();
  });
}

function bindDropzones() {
  document.querySelectorAll("[data-cover-drop]").forEach((zone) => {
    const index = Number(zone.dataset.coverDrop);
    const input = zone.querySelector("input");
    const setFile = async (file) => {
      if (!file || !file.type.startsWith("image/")) {
        setEditorStatus("请拖入图片文件。", true);
        return;
      }
      clearPendingCoverPreviewUrls(index);
      pendingCoverFiles.set(index, file);
      pendingCoverDataUrls.set(index, await createCompressedCoverDataUrl(file));
      zone.classList.add("has-file");
      zone.querySelector("span").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
      setEditorStatus("封面图片已加入，点击保存到页面后会绑定到对应作品。");
      previewCoverForProject(index, getPendingCoverPreviewUrl(index, file), getCoverEditorSettings(index));
    };

    zone.addEventListener("click", () => input?.click());
    input?.addEventListener("change", () => setFile(input.files?.[0]));
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-dragover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-dragover");
      setFile(event.dataTransfer?.files?.[0]);
    });
  });

  document.querySelectorAll("[data-video-drop]").forEach((zone) => {
    const index = Number(zone.dataset.videoDrop);
    const input = zone.querySelector("input");
    const setFile = (file) => {
      if (!file || !file.type.startsWith("video/")) {
        setEditorStatus("请拖入视频文件。", true);
        return;
      }
      pendingVideoFiles.set(index, file);
      zone.classList.add("has-file");
      zone.querySelector("span").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
      setEditorStatus("视频已加入，点击“保存到页面”后会绑定到对应作品。");
    };

    zone.addEventListener("click", () => input?.click());
    input?.addEventListener("change", () => setFile(input.files?.[0]));
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-dragover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-dragover");
      setFile(event.dataTransfer?.files?.[0]);
    });
  });

  document.querySelectorAll("[data-collection-video-drop]").forEach((zone) => {
    const key = zone.dataset.collectionVideoDrop;
    const input = zone.querySelector("input");
    const setFile = (file) => {
      if (!file || !file.type.startsWith("video/")) {
        setEditorStatus("请拖入视频文件。", true);
        return;
      }
      pendingCollectionVideoFiles.set(key, file);
      zone.classList.add("has-file");
      zone.querySelector("span").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
      setEditorStatus("合集视频已加入，点击保存到页面后会显示在对应合集页。");
    };

    zone.addEventListener("click", () => input?.click());
    input?.addEventListener("change", () => setFile(input.files?.[0]));
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-dragover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-dragover");
      setFile(event.dataTransfer?.files?.[0]);
    });
  });
}

function collectEditorContent() {
  const fields = editorForm.elements;
  const content = readContent();
  content.profile = {
    name: fields.name?.value || "",
    role: fields.role?.value || "",
    jobTarget: fields.jobTarget?.value || "",
    city: fields.city?.value || "",
    education: fields.education?.value || "",
    experience: fields.experience?.value || "",
    tools: fields.tools?.value || "",
    contact: fields.contact?.value || "",
    intro: fields.intro?.value || ""
  };
  content.workLead = fields.workLead?.value || "";
  content.projects = content.projects.map((project, index) => ({
    ...project,
    kicker: fields[`project-${index}-kicker`]?.value || "",
    title: fields[`project-${index}-title`]?.value || "",
    linkText: fields[`project-${index}-linkText`]?.value || "",
    meta: project.meta || "",
    cover: fields[`project-${index}-cover`]?.value || "",
    coverBlobKey: project.coverBlobKey || "",
    coverName: project.coverName || "",
    coverDataUrl: project.coverDataUrl || "",
    coverFit: fields[`project-${index}-coverFit`]?.value || "contain",
    coverX: fields[`project-${index}-coverX`]?.value || "50",
    coverY: fields[`project-${index}-coverY`]?.value || "50",
    coverScale: String((Number(fields[`project-${index}-coverScale`]?.value || 100) / 100).toFixed(2)),
    video: fields[`project-${index}-video`]?.value || "",
    bili: fields[`project-${index}-bili`]?.value || "",
    description: fields[`project-${index}-description`]?.value || "",
    collection: project.collection.map((item, itemIndex) => ({
      ...item,
      title: fields[`project-${index}-collection-${itemIndex}-title`]?.value || "",
      bili: fields[`project-${index}-collection-${itemIndex}-bili`]?.value || "",
      video: fields[`project-${index}-collection-${itemIndex}-video`]?.value || "",
      videoBlobKey: item.videoBlobKey || "",
      videoName: item.videoName || "",
      videoFit: fields[`project-${index}-collection-${itemIndex}-videoFit`]?.value || "cover",
      videoX: fields[`project-${index}-collection-${itemIndex}-videoX`]?.value || "50",
      videoY: fields[`project-${index}-collection-${itemIndex}-videoY`]?.value || "50",
      videoScale: String((Number(fields[`project-${index}-collection-${itemIndex}-videoScale`]?.value || 100) / 100).toFixed(2)),
      description: fields[`project-${index}-collection-${itemIndex}-description`]?.value || ""
    }))
  }));
  return content;
}

async function persistPendingVideos(content) {
  for (const [index, file] of pendingVideoFiles.entries()) {
    const key = `project-${index}-${Date.now()}-${file.name}`;
    await saveVideoBlob(key, file);
    content.projects[index].videoBlobKey = key;
    content.projects[index].videoName = file.name;
    content.projects[index].video = "";
  }
  pendingVideoFiles.clear();
  return content;
}

async function persistPendingCollectionVideos(content) {
  for (const [key, file] of pendingCollectionVideoFiles.entries()) {
    const [projectIndexText, itemIndexText] = key.split("-");
    const projectIndex = Number(projectIndexText);
    const itemIndex = Number(itemIndexText);
    const item = content.projects[projectIndex]?.collection?.[itemIndex];
    if (!item) continue;
    const blobKey = `collection-video-${projectIndex}-${itemIndex}-${Date.now()}-${file.name}`;
    await saveMediaBlob(blobKey, file);
    item.videoBlobKey = blobKey;
    item.videoName = file.name;
    item.video = "";
    item.bili = "";
  }
  pendingCollectionVideoFiles.clear();
  return content;
}

async function persistPendingCovers(content) {
  for (const [index, file] of pendingCoverFiles.entries()) {
    const key = `project-cover-${index}-${Date.now()}-${file.name}`;
    await saveMediaBlob(key, file);
    content.projects[index].coverBlobKey = key;
    content.projects[index].coverName = file.name;
    content.projects[index].coverDataUrl = pendingCoverDataUrls.get(index) || "";
    content.projects[index].cover = "";
  }
  pendingCoverFiles.clear();
  pendingCoverDataUrls.clear();
  clearPendingCoverPreviewUrls();
  return content;
}

async function saveEditorContent() {
  let content = collectEditorContent();
  content = await persistPendingVideos(content);
  content = await persistPendingCollectionVideos(content);
  content = await persistPendingCovers(content);
  const persisted = writeContent(content);
  applyContent(content);
  renderCollectionPage(content);
  fillEditor(content);
  setEditorStatus(
    persisted
      ? "已保存到页面。B站链接会立即显示，封面会在返回后保持。"
      : "已在当前页面生效，但内置浏览器本地存储可能已满。建议减少本地视频/大封面，或把文件放进 assets 后上传 GitHub。",
    !persisted
  );
}

function openEditor() {
  fillEditor(readContent());
  editorModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeEditor() {
  editorModal.hidden = true;
  document.body.style.overflow = "";
}

async function exportContent() {
  try {
    await saveEditorContent();
    const content = readContent();
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio-content.json";
    link.click();
    URL.revokeObjectURL(url);
    setEditorStatus("已保存到页面，并导出备份文件。");
  } catch (error) {
    console.error(error);
    setEditorStatus("导出失败：视频可能过大，或内置浏览器限制了本地存储。", true);
  }
}

document.querySelectorAll("[data-video-close]").forEach((button) => button.addEventListener("click", closeVideo));
document.querySelector("[data-editor-open]")?.addEventListener("click", openEditor);
document.querySelectorAll("[data-editor-close]").forEach((button) => button.addEventListener("click", closeEditor));
document.querySelector("[data-editor-export]")?.addEventListener("click", exportContent);
document.querySelector("[data-editor-reset]")?.addEventListener("click", () => {
  writeContent(defaultContent);
  resetRuntimeContent();
  memoryContent = cloneContent(defaultContent);
  applyContent(defaultContent);
  fillEditor(defaultContent);
  setEditorStatus("已恢复示例内容。");
});
document.querySelector("[data-editor-clear]")?.addEventListener("click", () => {
  resetRuntimeContent();
  clearSavedContent();
  const content = getStaticContent();
  applyContent(content);
  fillEditor(content);
  setEditorStatus("已清除本地保存。刷新页面后会显示 index.html 里的内容。");
});

editorForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveEditorContent().catch((error) => {
    console.error(error);
    setEditorStatus("保存失败：视频文件可能过大，或内置浏览器限制了本地视频存储。", true);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeVideo();
    if (!editorModal?.hidden) closeEditor();
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 45, 280)}ms`;
  revealObserver.observe(element);
});

const parallaxTarget = document.querySelector("[data-parallax]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (parallaxTarget && !reduceMotion) {
  window.addEventListener(
    "scroll",
    () => {
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.55), 1);
      parallaxTarget.style.opacity = (1 - progress * 0.42).toFixed(3);
      parallaxTarget.style.transform = `translateY(${progress * 72}px) scale(${1 - progress * 0.035})`;
    },
    { passive: true }
  );
}

function restoreSavedContent({ refreshMedia = false } = {}) {
  if (editorModal && !editorModal.hidden) return;
  if (refreshMedia) clearObjectUrlCache();
  const content = readContent();
  applyContent(content);
  renderCollectionPage(content);
  scheduleProjectCoverRefresh(content);
}

bindVideoCards();
restoreSavedContent();

window.addEventListener("pageshow", (event) => {
  restoreSavedContent({ refreshMedia: event.persisted });
});

window.addEventListener("popstate", () => {
  restoreSavedContent({ refreshMedia: true });
});

window.addEventListener("focus", () => {
  if (editorModal && !editorModal.hidden) return;
  scheduleProjectCoverRefresh();
});

document.addEventListener("visibilitychange", () => {
  if (editorModal && !editorModal.hidden) return;
  if (!document.hidden) {
    scheduleProjectCoverRefresh();
  }
});
