const dataUrl = "data/portfolio-links.json";

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const prettyLabel = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());

const getMobileCategoryLabel = (label) => label;

const mobileNavBreakpoint = window.matchMedia("(max-width: 720px)");
const responsiveHeroBreakpoint = window.matchMedia("(max-width: 980px)");

const setupHorizontalScrollIndicator = (scroller) => {
  if (!scroller || scroller.dataset.scrollIndicatorReady === "true") {
    return;
  }

  const originalParent = scroller.parentElement;

  if (!originalParent) {
    return;
  }

  const shell = document.createElement("div");
  shell.className = "media-embed-scroll-shell";
  originalParent.insertBefore(shell, scroller);
  shell.appendChild(scroller);

  const indicator = document.createElement("div");
  indicator.className = "media-scrollbar-indicator";
  indicator.setAttribute("aria-label", "Horizontal project scroller controls");

  const prevButton = document.createElement("button");
  prevButton.className = "media-scrollbar-arrow media-scrollbar-arrow-prev";
  prevButton.type = "button";
  prevButton.setAttribute("aria-label", "Scroll left");
  prevButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5.5 8.5 12l6 6.5"></path></svg>';

  const track = document.createElement("div");
  track.className = "media-scrollbar-indicator-track";

  const thumb = document.createElement("div");
  thumb.className = "media-scrollbar-indicator-thumb";

  const nextButton = document.createElement("button");
  nextButton.className = "media-scrollbar-arrow media-scrollbar-arrow-next";
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Scroll right");
  nextButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.5 5.5 6 6.5-6 6.5"></path></svg>';

  track.appendChild(thumb);
  indicator.appendChild(prevButton);
  indicator.appendChild(track);
  indicator.appendChild(nextButton);
  shell.appendChild(indicator);

  let frameId = 0;
  let isDragging = false;
  let activePointerId = null;
  let dragOffsetX = 0;

  const syncScrollFromPointer = (clientX) => {
    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const maxScroll = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
    const maxThumbTravel = Math.max(trackRect.width - thumbRect.width, 0);

    if (maxScroll <= 0 || maxThumbTravel <= 0) {
      scroller.scrollLeft = 0;
      return;
    }

    const nextThumbLeft = Math.min(
      Math.max(clientX - trackRect.left - dragOffsetX, 0),
      maxThumbTravel
    );
    const progress = nextThumbLeft / maxThumbTravel;

    scroller.scrollLeft = progress * maxScroll;
  };

  const syncIndicator = () => {
    frameId = 0;

    const maxScroll = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
    const hasOverflow = maxScroll > 1;

    indicator.hidden = !hasOverflow;

    if (!hasOverflow) {
      indicator.style.removeProperty("--scroll-indicator-size");
      indicator.style.removeProperty("--scroll-indicator-offset");
      return;
    }

    const thumbSizePercent = Math.min(
      100,
      Math.max((scroller.clientWidth / scroller.scrollWidth) * 100, 24)
    );
    const travelPercent = 100 - thumbSizePercent;
    const progress = maxScroll > 0 ? scroller.scrollLeft / maxScroll : 0;
    const atStart = progress <= 0.005;
    const atEnd = progress >= 0.995;
    indicator.style.setProperty("--scroll-indicator-size", `${thumbSizePercent}%`);
    indicator.style.setProperty(
      "--scroll-indicator-offset",
      `${travelPercent * progress}%`
    );
    prevButton.disabled = atStart;
    nextButton.disabled = atEnd;
  };

  const requestSync = () => {
    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(syncIndicator);
  };

  thumb.addEventListener("pointerdown", (event) => {
    if (!indicator.hidden) {
      isDragging = true;
      activePointerId = event.pointerId;
      dragOffsetX = event.clientX - thumb.getBoundingClientRect().left;
      indicator.classList.add("is-dragging");
      thumb.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  });

  thumb.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== activePointerId) {
      return;
    }

    syncScrollFromPointer(event.clientX);
  });

  const stopDragging = (event) => {
    if (!isDragging || event.pointerId !== activePointerId) {
      return;
    }

    isDragging = false;
    activePointerId = null;
    indicator.classList.remove("is-dragging");

    if (thumb.hasPointerCapture(event.pointerId)) {
      thumb.releasePointerCapture(event.pointerId);
    }
  };

  thumb.addEventListener("pointerup", stopDragging);
  thumb.addEventListener("pointercancel", stopDragging);

  const scrollByPage = (direction) => {
    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.85, 180),
      behavior: "smooth",
    });
  };

  prevButton.addEventListener("click", () => scrollByPage(-1));
  nextButton.addEventListener("click", () => scrollByPage(1));

  scroller.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync, { passive: true });

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(requestSync);
    observer.observe(scroller);
    Array.from(scroller.children).forEach((child) => observer.observe(child));
  }

  scroller.dataset.scrollIndicatorReady = "true";
  requestSync();
  window.setTimeout(requestSync, 250);
};

const initPrimaryNav = () => {
  const nav = document.getElementById("site-nav");
  const toggle = document.querySelector(".nav-toggle");

  if (!nav || !toggle) {
    return;
  }

  const setExpanded = (expanded) => {
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", expanded ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", expanded);
  };

  setExpanded(false);

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    setExpanded(!expanded);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileNavBreakpoint.matches) {
        setExpanded(false);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setExpanded(false);
    }
  });

  mobileNavBreakpoint.addEventListener("change", (event) => {
    if (!event.matches) {
      setExpanded(false);
    }
  });
};

const initResponsiveHeroMetrics = () => {
  const hero = document.querySelector(".hero");
  const heroCopy = document.querySelector(".hero-copy");
  const heroVisual = document.querySelector(".hero-visual");
  const metrics = document.getElementById("hero-metrics");

  if (!hero || !heroCopy || !heroVisual || !metrics) {
    return;
  }

  const placeMetrics = () => {
    if (responsiveHeroBreakpoint.matches) {
      if (metrics.parentElement !== hero || metrics.previousElementSibling !== heroVisual) {
        hero.insertBefore(metrics, heroVisual.nextSibling);
      }
      return;
    }

    if (metrics.parentElement !== heroCopy) {
      heroCopy.appendChild(metrics);
    }
  };

  placeMetrics();
  responsiveHeroBreakpoint.addEventListener("change", placeMetrics);
};

const initMobileCategoryMenu = () => {
  const trigger = document.getElementById("mobile-category-trigger");
  const current = document.getElementById("mobile-category-current");
  const menu = document.getElementById("mobile-category-menu");
  const creditsSection = document.getElementById("credits");
  const categoryLinks = Array.from(document.querySelectorAll(".category-pills a"));
  const menuLinks = Array.from(document.querySelectorAll(".mobile-category-menu-list a"));
  const nav = document.getElementById("site-nav");

  if (!trigger || !current || !menu || !creditsSection || !categoryLinks.length || !menuLinks.length) {
    return;
  }

  const allLinks = [...categoryLinks, ...menuLinks];
  const sections = categoryLinks
    .map((link) => {
      const section = document.getElementById(link.dataset.categoryTarget ?? "");
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (!sections.length) {
    return;
  }

  let isMenuOpen = false;
  let activeId = sections[0].section.id;
  let rafId = 0;

  const setMenuOpen = (open) => {
    isMenuOpen = open;
    trigger.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    menu.classList.toggle("is-open", open);
  };

  const setTriggerVisible = (visible) => {
    trigger.hidden = !visible;
    trigger.classList.toggle("is-visible", visible);
    if (!visible) {
      setMenuOpen(false);
    }
  };

  const setActiveCategory = (id) => {
    const activeLink = allLinks.find((link) => link.dataset.categoryTarget === id);
    if (!activeLink) {
      return;
    }

    activeId = id;
    current.textContent = activeLink.dataset.mobileLabel ?? activeLink.textContent;

    allLinks.forEach((link) => {
      const isActive = link.dataset.categoryTarget === id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const syncState = () => {
    rafId = 0;

    const onMobile = mobileNavBreakpoint.matches;
    const creditsBounds = creditsSection.getBoundingClientRect();
    const showTrigger =
      onMobile && creditsBounds.top <= 96 && creditsBounds.bottom >= 180;

    setTriggerVisible(showTrigger);

    if (!showTrigger || nav?.classList.contains("is-open")) {
      setMenuOpen(false);
    }

    const offset = 124;
    let nextActiveId = activeId;

    sections.forEach(({ section }, index) => {
      const rect = section.getBoundingClientRect();
      const nextSectionRect = sections[index + 1]?.section.getBoundingClientRect();

      if (rect.top - offset <= 0) {
        nextActiveId = section.id;
      }

      if (rect.top - offset > 0 && index === 0) {
        nextActiveId = section.id;
      }

      if (nextSectionRect && nextSectionRect.top - offset <= 0) {
        nextActiveId = sections[index + 1].section.id;
      }
    });

    setActiveCategory(nextActiveId);
  };

  const requestSync = () => {
    if (rafId) {
      return;
    }

    rafId = window.requestAnimationFrame(syncState);
  };

  trigger.addEventListener("click", () => {
    if (trigger.hidden) {
      return;
    }

    setMenuOpen(!isMenuOpen);
  });

  allLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetId = link.dataset.categoryTarget;
      if (targetId) {
        setActiveCategory(targetId);
      }
      setMenuOpen(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (
      isMenuOpen &&
      !menu.contains(event.target) &&
      !trigger.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });

  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync);
  mobileNavBreakpoint.addEventListener("change", requestSync);

  setMenuOpen(false);
  setActiveCategory(activeId);
  syncState();
};

const getDisplayHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^(www\.|m\.)/i, "");
  } catch {
    return url;
  }
};

const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
};

const getActionIcon = (type) => {
  const icons = {
    external: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 5h5v5"></path>
        <path d="M10 14 19 5"></path>
        <path d="M19 13v4.25A1.75 1.75 0 0 1 17.25 19H6.75A1.75 1.75 0 0 1 5 17.25V6.75A1.75 1.75 0 0 1 6.75 5H11"></path>
      </svg>
    `,
    copy: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="9" width="10" height="10" rx="2"></rect>
        <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>
      </svg>
    `,
  };

  return icons[type];
};

const createProfileCard = ({ label, detail, href, service = "url", action = "external" }) => {
  const card = document.createElement("article");
  card.className = "social-card";

  const main = document.createElement(href ? "a" : "div");
  main.className = "social-card-main";

  if (href) {
    main.href = href;
    if (!href.startsWith("mailto:")) {
      main.target = "_blank";
      main.rel = "noreferrer";
    }
  }

  main.innerHTML = `
    <span class="social-card-icon">${getSocialIcon(service)}</span>
    <span class="social-card-copy">
      <strong>${label}</strong>
      <span class="social-card-detail">${detail}</span>
    </span>
  `;

  card.appendChild(main);

  if (action === "copy") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "social-card-action";
    button.setAttribute("aria-label", `Copy ${label}`);
    button.title = `Copy ${label}`;
    button.innerHTML = getActionIcon("copy");
    button.addEventListener("click", async () => {
      try {
        await copyText(detail);
        card.classList.add("is-copied");
        button.setAttribute("aria-label", `${label} copied`);
        button.title = `${label} copied`;
        window.setTimeout(() => {
          card.classList.remove("is-copied");
          button.setAttribute("aria-label", `Copy ${label}`);
          button.title = `Copy ${label}`;
        }, 1400);
      } catch {
        button.setAttribute("aria-label", `Unable to copy ${label}`);
      }
    });
    card.appendChild(button);
  } else if (href && !href.startsWith("mailto:")) {
    const actionLink = document.createElement("a");
    actionLink.href = href;
    actionLink.target = "_blank";
    actionLink.rel = "noreferrer";
    actionLink.className = "social-card-action";
    actionLink.setAttribute("aria-label", `Open ${label}`);
    actionLink.title = `Open ${label}`;
    actionLink.innerHTML = getActionIcon("external");
    card.appendChild(actionLink);
  }

  return card;
};

const makeLink = (label, url, className = "project-link") => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  anchor.className = className;
  anchor.textContent = label;
  return anchor;
};

const getSpotifyEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!/spotify\.com$/i.test(parsed.hostname)) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    const type = parts[0];
    const id = parts[1];

    if (!id || !["episode", "track", "show", "album", "playlist", "artist"].includes(type)) {
      return null;
    }

    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
  } catch {
    return null;
  }
};

const createSpotifyEmbedCard = ({ label, url, context, compact = false, short = false }) => {
  const embedUrl = getSpotifyEmbedUrl(url);
  if (!embedUrl) {
    return null;
  }

  const card = document.createElement("section");
  card.className = `spotify-embed-card${compact ? " is-compact" : ""}${short ? " is-short" : ""}`;

  const meta = document.createElement("div");
  meta.className = "spotify-embed-meta";
  meta.innerHTML = `
    <strong>${label}</strong>
    <span>${context}</span>
  `;

  const frameWrap = document.createElement("div");
  frameWrap.className = "spotify-frame-wrap";

  const iframe = document.createElement("iframe");
  iframe.src = embedUrl;
  iframe.loading = "lazy";
  iframe.scrolling = "no";
  iframe.allow =
    "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.title = `${context} - ${label} Spotify embed`;
  frameWrap.appendChild(iframe);

  card.appendChild(meta);
  card.appendChild(frameWrap);
  return card;
};

const getYouTubeEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname === "/playlist") {
        const list = parsed.searchParams.get("list");
        return list ? `https://www.youtube.com/embed/videoseries?list=${list}` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
};

const createYouTubeEmbedCard = ({ label, url, context, compact = false }) => {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) {
    return null;
  }

  const card = document.createElement("section");
  card.className = `youtube-embed-card${compact ? " is-compact" : ""}`;

  const meta = document.createElement("div");
  meta.className = "youtube-embed-meta";
  meta.innerHTML = `
    <strong>${label}</strong>
    <span>${context}</span>
  `;

  const frameWrap = document.createElement("div");
  frameWrap.className = "youtube-frame-wrap";

  const iframe = document.createElement("iframe");
  iframe.src = embedUrl;
  iframe.loading = "lazy";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.title = `${context} - ${label} YouTube embed`;
  iframe.allowFullscreen = true;
  frameWrap.appendChild(iframe);

  card.appendChild(meta);
  card.appendChild(frameWrap);
  return card;
};

const createBandcampEmbedCard = ({ label, url, embedUrl, context }) => {
  if (!embedUrl) {
    return null;
  }

  try {
    const parsedEmbed = new URL(embedUrl);
    if (!/bandcamp\.com$/i.test(parsedEmbed.hostname)) {
      return null;
    }
  } catch {
    return null;
  }

  const card = document.createElement("section");
  card.className = "bandcamp-embed-card";
  card.innerHTML = `
    <div class="bandcamp-embed-meta">
      <strong>${label}</strong>
      <span>${context}</span>
    </div>
    <div class="bandcamp-frame-wrap">
      <iframe
        src="${embedUrl}"
        loading="lazy"
        seamless
        title="${context} - ${label} Bandcamp embed"
      ></iframe>
    </div>
  `;
  return card;
};
const buildEmbedCards = (entries, context, forceCompact = false, forceShort = false) => {
  const compact = forceCompact || entries.length > 1;

  return entries
    .flatMap((entry) => [
      {
        url: entry.url,
        element: createSpotifyEmbedCard({
          label: entry.label,
          url: entry.url,
          context,
          compact,
          short: forceShort,
        }),
      },
      {
        url: entry.url,
        element: createYouTubeEmbedCard({
          label: entry.label,
          url: entry.url,
          context,
          compact,
        }),
      },
      {
        url: entry.url,
        element: createCustomVideoEmbedCard({
          label: entry.label,
          url: entry.url,
          context,
        }),
      },
      {
        url: entry.url,
        element: createBandcampEmbedCard({
          label: entry.label,
          url: entry.url,
          embedUrl: entry.embedUrl,
          context,
        }),
      },
    ])
    .filter((entry) => entry.element);
};

const appendNonEmbeddedLinks = (container, entries, embeddedUrls) => {
  const remainingEntries = entries.filter((entry) => !embeddedUrls.has(entry.url));
  if (!remainingEntries.length) {
    return;
  }

  const linkRow = document.createElement("div");
  linkRow.className = "project-links";
  remainingEntries.forEach((entry) => linkRow.appendChild(makeLink(entry.label, entry.url)));
  container.appendChild(linkRow);
};

const buildPerformanceContext = (roleName) => `Umi Fusion as ${roleName}`;

const getPrimaryLinkLabel = (item) =>
  item.links?.find((entry) => typeof entry.label === "string" && entry.label.trim())?.label ??
  item.title;

const shortSpotifyEmbedTitles = new Set(["Solarity", "Eastmouth"]);

const getProjectLinkCount = (item) => {
  const directLinks = item.links?.length ?? 0;
  const roleLinks =
    item.roles?.reduce((total, role) => total + (role.links?.length ?? 0), 0) ?? 0;

  return directLinks + roleLinks;
};

const shouldUseHorizontalEmbedScroll = (item) => getProjectLinkCount(item) > 1;

const getAudioMimeType = (format) => {
  const normalized = format.toLowerCase();
  if (normalized === "mp3") {
    return "audio/mpeg";
  }

  return `audio/${normalized}`;
};

const getSocialIcon = (service) => {
  const key = service.toLowerCase();

  const icons = {
    email: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="3"></rect>
        <path d="M5.5 8l6.5 5 6.5-5"></path>
      </svg>
    `,
    instagram: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5"></rect>
        <circle cx="12" cy="12" r="3.75"></circle>
        <circle cx="17" cy="7" r="1"></circle>
      </svg>
    `,
    imdb: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="3"></rect>
        <path d="M7 8.5v7"></path>
        <path d="M10 8.5v7"></path>
        <path d="M10 12h3.5"></path>
        <path d="M13.5 8.5v7"></path>
        <path d="M16.5 15.5v-7H18a2 2 0 0 1 0 4h-1.5"></path>
      </svg>
    `,
    url: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5"></circle>
        <path d="M4.5 12h15"></path>
        <path d="M12 4.5a12 12 0 0 1 0 15"></path>
        <path d="M12 4.5a12 12 0 0 0 0 15"></path>
      </svg>
    `,
  };

  return icons[key] ?? icons.url;
};

const projectVisuals = {
  "Tripvia Audio Tours": {
    image:
      "https://static.wixstatic.com/media/229b79_89221bcd8b13415dba62715ef36b70d3~mv2.jpg/v1/fill/w_980,h_653,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/229b79_89221bcd8b13415dba62715ef36b70d3~mv2.jpg",
    eyebrow: "Tripvia Tours",
  },
  "Havasu Blues": {
    image:
      "https://staticdelivery.nexusmods.com/mods/130/images/76680/76680-1653238289-575718927.jpeg",
    eyebrow: "Nexus Mods Media",
  },
  "Big Misunderstood Wolf: Part 2": {
    image: "assets/images/projects/big-misunderstood-wolf-part-2.png",
    eyebrow: "Project Artwork",
  },
};

const facebookEmbeds = {
  "Partners Credit Union Card Design Commercial": {
    src: "https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2FPartnersFCU%2Fvideos%2F1767914383231113%2F&show_text=false&width=560&t=0",
    title: "Partners Credit Union Card Design Commercial Facebook video",
  },
};

const customVideoEmbeds = {
  "https://starsfandub.com/episodes/184-a-full-house/": {
    src: "https://odysee.com/$/embed/@Fighter4LuvFandubs:2/Sailor-Stars-Ep184-A-Full-House-fandub:8?r=BW3acLhGaSmGnTNShWkH4Jz9tRo7QEZz",
    title: "Sailor Moon Missing Episodes Fandub Episode 184 video",
  },
  "https://starsfandub.com/episodes/187-batter-up-sailor-moon/": {
    src: "https://odysee.com/$/embed/@Fighter4LuvFandubs:2/Sailor-Stars-Ep187-Batter-Up-Sailor-Moon-uncut:b?r=BW3acLhGaSmGnTNShWkH4Jz9tRo7QEZz",
    title: "Sailor Moon Missing Episodes Fandub Episode 187 video",
  },
};

const shouldHideProjectLinksForItem = (item) =>
  Boolean(facebookEmbeds[item.title] || projectVisuals[item.title]);

const createProjectVisual = (item) => {
  const visual = projectVisuals[item.title];
  if (!visual) {
    return null;
  }

  const projectUrl = item.links?.[0]?.url;
  if (!projectUrl) {
    return null;
  }

  const projectLabel = getPrimaryLinkLabel(item);

  const card = document.createElement("a");
  card.className = "project-visual-card";
  if (
    item.title === "Big Misunderstood Wolf: Part 2" ||
    item.title === "Tripvia Audio Tours"
  ) {
    card.classList.add("project-visual-card-square");
  }
  card.href = projectUrl;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.innerHTML = `
    <div class="project-visual-meta">
      <strong>${projectLabel}</strong>
      <span>${buildPerformanceContext(item.role)}</span>
    </div>
    <div class="project-visual-media">
      <img src="${visual.image}" alt="${item.title} promotional artwork" loading="lazy" />
    </div>
  `;
  return card;
};

const createUnlinkedMediaCard = (item) => {
  const card = document.createElement("section");
  card.className = "project-visual-card project-visual-card-unlinked";
  card.innerHTML = `
    <div class="project-visual-meta">
      <strong>${item.label ?? "Private media"}</strong>
      <span>${buildPerformanceContext(item.role)}</span>
    </div>
    <div class="project-visual-media project-visual-placeholder">
      <svg viewBox="0 0 24 24" class="project-visual-lock-icon">
        <path d="M7.5 10V7.75a4.5 4.5 0 1 1 9 0V10"></path>
        <rect x="5" y="10" width="14" height="10" rx="2.5"></rect>
        <circle cx="12" cy="15" r="1.25" class="icon-fill"></circle>
      </svg>
      <p class="project-visual-placeholder-note">${item.note ?? "Footage available upon request"}</p>
    </div>
  `;
  return card;
};

const createFacebookEmbedCard = (item) => {
  const embed = facebookEmbeds[item.title];
  if (!embed) {
    return null;
  }

  const projectLabel = getPrimaryLinkLabel(item);

  const card = document.createElement("section");
  card.className = "facebook-embed-card";
  card.innerHTML = `
    <div class="facebook-embed-meta">
      <strong>${projectLabel}</strong>
      <span>${buildPerformanceContext(item.role)}</span>
    </div>
    <div class="facebook-frame-wrap">
      <iframe
        src="${embed.src}"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowfullscreen
        title="${embed.title}"
      ></iframe>
    </div>
  `;
  return card;
};

const createCustomVideoEmbedCard = ({ label, url, context }) => {
  const embed = customVideoEmbeds[url];
  if (!embed) {
    return null;
  }

  const card = document.createElement("section");
  card.className = "youtube-embed-card";
  card.innerHTML = `
    <div class="youtube-embed-meta">
      <strong>${label}</strong>
      <span>${context}</span>
    </div>
    <div class="youtube-frame-wrap">
      <iframe
        src="${embed.src}"
        loading="lazy"
        allowfullscreen
        title="${embed.title}"
      ></iframe>
    </div>
  `;
  return card;
};

const renderMetrics = (data) => {
  const portfolioCount = data.portfolioCategories.reduce(
    (total, category) =>
      total +
      (category.items?.length ?? 0) +
      (category.unlinkedItems?.length ?? 0),
    0
  );
  const additionalCount = data.visibleButUnlinkedPortfolioMentions.reduce(
    (total, group) => total + group.items.length,
    0
  );

  const imdbProfileUrl =
    data.socialProfiles.find((profile) => profile.service?.toLowerCase() === "imdb")?.url ?? null;

  const metrics = [
    { label: "Project credits", value: "22+", href: "#credits" },
    {
      label: "IMDb credits",
      value: "8",
      href: imdbProfileUrl,
      external: Boolean(imdbProfileUrl),
    },
    { label: "Experience", value: "5+ years" },
  ];

  const metricsList = document.getElementById("hero-metrics");
  metrics.forEach((metric, index) => {
    const item = document.createElement("li");
    item.className = `fade-in delay-${index + 1}`;

    const content = document.createElement(metric.href ? "a" : "div");
    content.className = `metric-card${metric.href ? " metric-card-link" : ""}`;
    if (metric.href) {
      content.href = metric.href;
      content.setAttribute("aria-label", `Jump to ${metric.label}`);
      if (metric.external) {
        content.target = "_blank";
        content.rel = "noreferrer";
        content.setAttribute("aria-label", `Open ${metric.label}`);
      }
    }

    content.innerHTML = `
      <span class="metric-label">${metric.label}</span>
      <span class="metric-value">${metric.value}</span>
    `;

    item.appendChild(content);
    metricsList.appendChild(item);
  });
};

const renderHeroCards = (data) => {
  document.getElementById("location-card").innerHTML = `
    <p class="card-label">Location</p>
    <p class="card-value">${data.contact.location}<br />Available for remote sessions</p>
  `;

  const studioCard = document.getElementById("studio-card");
  studioCard.innerHTML = "";

  const emailLink = document.createElement("a");
  emailLink.href = `mailto:${data.contact.email}`;
  emailLink.className = "hero-card-link";
  emailLink.setAttribute("aria-label", `Email ${data.contact.email}`);
  emailLink.innerHTML = `
    <p class="card-label">Email</p>
    <p class="card-value">${data.contact.email}</p>
  `;

  studioCard.appendChild(emailLink);
};

const renderDemos = (data) => {
  const grid = document.getElementById("demo-grid");

  data.samplesAndReels.forEach((sample, index) => {
    const card = document.createElement("article");
    card.className = `demo-card fade-in delay-${Math.min(index + 1, 3)}`;

    const localPath = sample.localPath.replace(/\\/g, "/");
    card.innerHTML = `
      <h3>${sample.title}</h3>
      <audio controls preload="metadata">
        <source src="${localPath}" type="${getAudioMimeType(sample.format)}" />
        Your browser does not support the audio element.
      </audio>
    `;

    grid.appendChild(card);
  });
};

const renderCredits = (data) => {
  const list = document.getElementById("credits-list");
  const pills = document.getElementById("category-pills");
  const mobileMenuList = document.getElementById("mobile-category-menu-list");
  const template = document.getElementById("credit-item-template");

  data.portfolioCategories.forEach((category) => {
    const slug = slugify(category.category);
    const mobileLabel = getMobileCategoryLabel(category.category);

    const pill = document.createElement("a");
    pill.href = `#${slug}`;
    pill.textContent = category.category;
    pill.dataset.categoryTarget = slug;
    pill.dataset.mobileLabel = mobileLabel;
    pills.appendChild(pill);

    if (mobileMenuList) {
      const mobileLink = document.createElement("a");
      mobileLink.href = `#${slug}`;
      mobileLink.textContent = mobileLabel;
      mobileLink.dataset.categoryTarget = slug;
      mobileLink.dataset.mobileLabel = mobileLabel;
      mobileMenuList.appendChild(mobileLink);
    }

    const group = document.createElement("section");
    group.className = "credit-group fade-in";
    group.id = slug;

    const totalItems =
      (category.items?.length ?? 0) + (category.unlinkedItems?.length ?? 0);
    group.innerHTML = `
      <div class="credit-group-header">
        <div>
          <h3>${category.category}</h3>
        </div>
      </div>
    `;

    const itemsWrap = document.createElement("div");
    itemsWrap.className = "credit-items";

    const isUpcomingCategory = category.category === "Upcoming Projects";

    category.items?.forEach((item) => {
      const clone = template.content.firstElementChild.cloneNode(true);
      const title = clone.querySelector("h4");
      const meta = clone.querySelector(".credit-meta");
      const year = clone.querySelector(".credit-year");
      const links = clone.querySelector(".credit-links");
      const notes = clone.querySelector(".credit-notes");

      if (shouldUseHorizontalEmbedScroll(item)) {
        clone.classList.add("credit-item-scroll-embeds");
      }

      title.textContent = item.title;
      year.textContent = item.year ?? "";
      year.hidden = !item.year;

      const projectVisual = createProjectVisual(item);
      if (projectVisual) {
        links.appendChild(projectVisual);
      }

      const facebookEmbed = createFacebookEmbedCard(item);
      if (facebookEmbed) {
        links.appendChild(facebookEmbed);
      }

      if (item.roles?.length) {
        meta.textContent = item.description ?? item.roles.map((role) => role.name).join(" / ");
        const useCompactEmbeds = item.roles.length > 1;
        const useShortSpotifyEmbeds = shortSpotifyEmbedTitles.has(item.title);
        const combinedEmbeds = [];

        item.roles.forEach((role) => {
          const mediaEmbeds = buildEmbedCards(
            role.links,
            buildPerformanceContext(role.name),
            useCompactEmbeds,
            useShortSpotifyEmbeds
          );
          const embeddedUrls = new Set(mediaEmbeds.map((entry) => entry.url));
          appendNonEmbeddedLinks(links, role.links, embeddedUrls);
          combinedEmbeds.push(...mediaEmbeds.map((embed) => embed.element));
        });

        if (combinedEmbeds.length) {
          const embedsWrap = document.createElement("div");
          embedsWrap.className = "media-embed-grid";
          combinedEmbeds.forEach((embed) => embedsWrap.appendChild(embed));
          links.appendChild(embedsWrap);
          if (clone.classList.contains("credit-item-scroll-embeds")) {
            setupHorizontalScrollIndicator(embedsWrap);
          }
        }
      } else {
        meta.textContent =
          isUpcomingCategory && item.role && item.description
            ? `${buildPerformanceContext(item.role)} | ${item.description}`
            : item.description ?? item.role;
        if (item.links?.length) {
          const mediaEmbeds = buildEmbedCards(
            item.links,
            buildPerformanceContext(item.role),
            false,
            shortSpotifyEmbedTitles.has(item.title)
          );
          const embeddedUrls = new Set(mediaEmbeds.map((entry) => entry.url));

          if (!shouldHideProjectLinksForItem(item)) {
            appendNonEmbeddedLinks(links, item.links, embeddedUrls);
          }

          if (mediaEmbeds.length) {
            const embedsWrap = document.createElement("div");
            embedsWrap.className = "media-embed-grid";
            mediaEmbeds.forEach((embed) => embedsWrap.appendChild(embed.element));
            links.appendChild(embedsWrap);
            if (clone.classList.contains("credit-item-scroll-embeds")) {
              setupHorizontalScrollIndicator(embedsWrap);
            }
          }
        }
      }

      if (item.unlinkedMentions?.length) {
        const noteList = document.createElement("ul");
        noteList.className = "credit-note-list";
        item.unlinkedMentions.forEach((mention) => {
          const li = document.createElement("li");
          li.textContent = `Additional visible mention: ${mention}`;
          noteList.appendChild(li);
        });
        notes.appendChild(noteList);
      }

      itemsWrap.appendChild(clone);
    });

    if (category.unlinkedItems?.length) {
      category.unlinkedItems.forEach((entry) => {
        const clone = template.content.firstElementChild.cloneNode(true);
        const title = clone.querySelector("h4");
        const meta = clone.querySelector(".credit-meta");
        const year = clone.querySelector(".credit-year");
        const links = clone.querySelector(".credit-links");

        title.textContent = entry.title;
        meta.textContent = entry.description ?? entry.role;
        year.textContent = entry.year ?? "";
        year.hidden = !entry.year;
        links.appendChild(createUnlinkedMediaCard(entry));
        itemsWrap.appendChild(clone);
      });
    }

    group.appendChild(itemsWrap);
    list.appendChild(group);
  });
};

const renderEquipment = (data) => {
  const list = document.getElementById("equipment-list");
  Object.entries(data.equipment).forEach(([key, value]) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <dt>${prettyLabel(key)}</dt>
      <dd>${value}</dd>
    `;
    list.appendChild(wrap);
  });
};

const renderSimpleList = (id, items) => {
  const list = document.getElementById(id);
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
};

const renderBackgroundCredits = (id, items) => {
  const list = document.getElementById(id);
  list.className = "background-credit-list";
  list.innerHTML = "";

  items.forEach((item) => {
    const parsed =
      item && typeof item === "object" && !Array.isArray(item)
        ? {
            title: item.title ?? "",
            detail: item.detail ?? "",
            meta: item.year ?? item.meta ?? "",
          }
        : {
            title: String(item ?? ""),
            detail: "",
            meta: "",
          };

    const li = document.createElement("li");
    li.className = "background-credit-item";

    const copy = document.createElement("div");
    copy.className = "background-credit-copy";

    const title = document.createElement("h4");
    title.textContent = parsed.title;
    copy.appendChild(title);

    if (parsed.detail) {
      const detail = document.createElement("p");
      detail.textContent = parsed.detail;
      copy.appendChild(detail);
    }

    li.appendChild(copy);

    if (parsed.meta) {
      const meta = document.createElement("span");
      meta.className = "background-credit-meta";
      meta.textContent = parsed.meta;
      li.appendChild(meta);
    }

    list.appendChild(li);
  });
};

const renderAdditionalExperience = (data) => {
  const container = document.getElementById("additional-experience");
  const wrapper = document.createElement("div");
  wrapper.className = "experience-groups";

  data.visibleButUnlinkedPortfolioMentions.forEach((group) => {
    const block = document.createElement("section");
    block.className = "experience-group";


    const structuredItems = group.items
      .filter((item) => item && typeof item === "object" && !Array.isArray(item))
      .sort((a, b) => {
        const getSortYear = (value) => Number.parseInt(String(value).split("-")[0], 10) || 0;
        return getSortYear(b.year) - getSortYear(a.year);
      });

    if (structuredItems.length === group.items.length) {
      const list = document.createElement("div");
      list.className = "experience-credit-list";
      const usePlainRoleLabel = group.category === "Theater / Live Performances";

      structuredItems.forEach((item) => {
        const article = document.createElement("article");
        article.className = "experience-credit";

        const copy = document.createElement("div");
        copy.className = "experience-credit-copy";

        const title = document.createElement("h5");
        title.textContent = item.title;

        const role = document.createElement("p");
        role.textContent = usePlainRoleLabel ? item.role : `Umi Fusion as ${item.role}`;

        const year = document.createElement("span");
        year.className = "experience-credit-year";
        year.textContent = item.year ?? "";
        year.hidden = !item.year;

        copy.appendChild(title);
        copy.appendChild(role);
        article.appendChild(copy);
        article.appendChild(year);
        list.appendChild(article);
      });

      block.appendChild(list);
    } else {
      const list = document.createElement("ul");
      list.className = "stack-list";
      group.items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = typeof item === "string" ? item : item.title;
        list.appendChild(li);
      });
      block.appendChild(list);
    }

    wrapper.appendChild(block);
  });

  container.appendChild(wrapper);
};

const renderContact = (data) => {
  const contactGroups = document.getElementById("contact-groups");

  const createGroup = (title, className) => {
    const section = document.createElement("section");
    section.className = `contact-group ${className}`.trim();

    const heading = document.createElement("h4");
    heading.className = "contact-group-title";
    heading.textContent = title;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "contact-group-grid";
    section.appendChild(grid);

    return { section, grid };
  };

  const bookingsGroup = createGroup("Bookings and inquiries", "contact-group-bookings");
  const profilesGroup = createGroup("Professional profiles", "contact-group-profiles");

  [
    {
      label: "Email",
      detail: data.contact.email,
      href: `mailto:${data.contact.email}`,
      service: "email",
      action: "copy",
    },
    ...data.socialProfiles
      .filter((profile) => profile.service?.toLowerCase() === "instagram")
      .map((profile) => ({
        label: profile.label,
        detail: getDisplayHost(profile.url),
        href: profile.url,
        service: profile.service,
        action: "external",
      })),
  ].forEach((item) => bookingsGroup.grid.appendChild(createProfileCard(item)));

  data.socialProfiles
    .filter((profile) => profile.service?.toLowerCase() !== "instagram")
    .forEach((profile) => {
      profilesGroup.grid.appendChild(
        createProfileCard({
          label: profile.label,
          detail: getDisplayHost(profile.url),
          href: profile.url,
          service: profile.service,
          action: "external",
        })
      );
    });

  contactGroups.appendChild(bookingsGroup.section);
  contactGroups.appendChild(profilesGroup.section);
};

const renderPage = (data) => {
  renderMetrics(data);
  renderHeroCards(data);
  renderDemos(data);
  renderCredits(data);
  initMobileCategoryMenu();
  renderEquipment(data);
  renderBackgroundCredits("training-list", data.training);
  renderBackgroundCredits("education-list", data.education);
  renderAdditionalExperience(data);
  renderContact(data);
};

const renderError = () => {
  document.getElementById("hero-summary").textContent =
    "The portfolio data could not be loaded. Serve the site from a web server so the JSON file can be requested normally.";
};

initPrimaryNav();
initResponsiveHeroMetrics();

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load ${dataUrl}`);
    }

    return response.json();
  })
  .then(renderPage)
  .catch(renderError);





















