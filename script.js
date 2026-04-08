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

const createSpotifyEmbedCard = ({ label, url, context, compact = false }) => {
  const embedUrl = getSpotifyEmbedUrl(url);
  if (!embedUrl) {
    return null;
  }

  const card = document.createElement("section");
  card.className = `spotify-embed-card${compact ? " is-compact" : ""}`;

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

const buildEmbedCards = (entries, context) => {
  const compact = entries.length > 1;

  return entries
    .flatMap((entry) => [
      {
        url: entry.url,
        element: createSpotifyEmbedCard({
          label: entry.label,
          url: entry.url,
          context,
          compact,
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

const getSocialIcon = (service) => {
  const key = service.toLowerCase();

  const icons = {
    instagram: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5"></rect>
        <circle cx="12" cy="12" r="4.25"></circle>
        <circle cx="17.4" cy="6.6" r="1.1" class="icon-fill"></circle>
      </svg>
    `,
    tiktok: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.2 3.5v10.1a3.7 3.7 0 1 1-2.7-3.55V7.9a6.3 6.3 0 1 0 5.3 6.2V9.2a6.85 6.85 0 0 0 3.7 1.1V7.6c-2.5 0-4.55-1.9-4.8-4.1Z"></path>
      </svg>
    `,
    twitter: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.9 4H22l-6.77 7.74L23 20h-6.1l-4.77-5.65L7.18 20H4.05l7.24-8.28L4 4h6.25l4.31 5.12Z"></path>
      </svg>
    `,
    imdb: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="2.5"></rect>
        <path class="icon-fill" d="M6.2 9.1h1.6v5.8H6.2zm2.6 0h1.9l.8 3.5.8-3.5h1.9v5.8H13v-3.9l-1 3.9h-1.1l-1-3.9v3.9H8.8zm6.3 0h1.7c1.4 0 2.5.5 2.5 2.9 0 2.3-1 2.9-2.5 2.9h-1.7zm1.6 1.3v3.2h.2c.7 0 1-.3 1-1.6s-.3-1.6-1-1.6z"></path>
      </svg>
    `,
    url: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.6 13.4a1 1 0 0 1 0-1.4l3-3a3.25 3.25 0 1 1 4.6 4.6l-2.1 2.1a3.25 3.25 0 0 1-4.6 0 1 1 0 1 1 1.4-1.4 1.25 1.25 0 0 0 1.8 0l2.1-2.1a1.25 1.25 0 0 0-1.8-1.8l-3 3a1 1 0 0 1-1.4 0Z"></path>
        <path d="M13.4 10.6a1 1 0 0 1 0 1.4l-3 3a3.25 3.25 0 1 1-4.6-4.6l2.1-2.1a3.25 3.25 0 0 1 4.6 0 1 1 0 1 1-1.4 1.4 1.25 1.25 0 0 0-1.8 0l-2.1 2.1a1.25 1.25 0 0 0 1.8 1.8l3-3a1 1 0 0 1 1.4 0Z"></path>
      </svg>
    `,
  };

  return icons[key] ?? icons.url;
};

const renderMetrics = (data) => {
  const portfolioCount = data.portfolioCategories.reduce(
    (total, category) =>
      total +
      (category.items?.length ?? 0) +
      (category.unlinkedItems?.length ?? 0),
    0
  );
  const categoryCount = data.portfolioCategories.length;
  const additionalCount = data.visibleButUnlinkedPortfolioMentions.reduce(
    (total, group) => total + group.items.length,
    0
  );

  const metrics = [
    { label: "Project credits", value: `${portfolioCount}+` },
    { label: "Portfolio categories", value: String(categoryCount) },
    { label: "Additional mentions", value: `${additionalCount}+` },
  ];

  const metricsList = document.getElementById("hero-metrics");
  metrics.forEach((metric, index) => {
    const item = document.createElement("li");
    item.className = `fade-in delay-${index + 1}`;
    item.innerHTML = `
      <span class="metric-label">${metric.label}</span>
      <span class="metric-value">${metric.value}</span>
    `;
    metricsList.appendChild(item);
  });
};

const renderHeroCards = (data) => {
  document.getElementById("location-card").innerHTML = `
    <p class="card-label">Location</p>
    <p class="card-value">${data.contact.location}<br />Available for remote sessions</p>
  `;

  document.getElementById("studio-card").innerHTML = `
    <p class="card-label">Studio setup</p>
    <p class="card-value">${data.equipment.microphone}<br />${data.equipment.interface}</p>
  `;
};

const renderDemos = (data) => {
  const grid = document.getElementById("demo-grid");

  data.samplesAndReels.forEach((sample, index) => {
    const card = document.createElement("article");
    card.className = `demo-card fade-in delay-${Math.min(index + 1, 3)}`;

    const localPath = sample.localPath.replace(/\\/g, "/");
    card.innerHTML = `
      <h3>${sample.title}</h3>
      <audio controls preload="none">
        <source src="${localPath}" type="audio/${sample.format}" />
        Your browser does not support the audio element.
      </audio>
    `;

    grid.appendChild(card);
  });
};

const renderCredits = (data) => {
  const list = document.getElementById("credits-list");
  const pills = document.getElementById("category-pills");
  const template = document.getElementById("credit-item-template");

  data.portfolioCategories.forEach((category) => {
    const slug = slugify(category.category);

    const pill = document.createElement("a");
    pill.href = `#${slug}`;
    pill.textContent = category.category;
    pills.appendChild(pill);

    const group = document.createElement("section");
    group.className = "credit-group fade-in";
    group.id = slug;

    const totalItems =
      (category.items?.length ?? 0) + (category.unlinkedItems?.length ?? 0);
    group.innerHTML = `
      <div class="credit-group-header">
        <div>
          <h3>${category.category}</h3>
          <p>${totalItems} listed credit${totalItems === 1 ? "" : "s"}</p>
        </div>
      </div>
    `;

    const itemsWrap = document.createElement("div");
    itemsWrap.className = "credit-items";

    category.items?.forEach((item) => {
      const clone = template.content.firstElementChild.cloneNode(true);
      const title = clone.querySelector("h4");
      const meta = clone.querySelector(".credit-meta");
      const year = clone.querySelector(".credit-year");
      const links = clone.querySelector(".credit-links");
      const notes = clone.querySelector(".credit-notes");

      title.textContent = item.title;
      year.textContent = item.year;

      if (item.roles?.length) {
        meta.textContent = `${item.roles.length} credited roles`;

        item.roles.forEach((role) => {
          const block = document.createElement("div");
          block.className = "mini-note";
          const roleTitle = document.createElement("p");
          roleTitle.innerHTML = `<strong>${role.name}</strong>`;
          block.appendChild(roleTitle);

          const mediaEmbeds = buildEmbedCards(role.links, buildPerformanceContext(role.name));
          const embeddedUrls = new Set(mediaEmbeds.map((entry) => entry.url));
          appendNonEmbeddedLinks(block, role.links, embeddedUrls);

          if (mediaEmbeds.length) {
            const embedsWrap = document.createElement("div");
            embedsWrap.className = "media-embed-grid";
            mediaEmbeds.forEach((embed) => embedsWrap.appendChild(embed.element));
            block.appendChild(embedsWrap);
          }

          links.appendChild(block);
        });
      } else {
        meta.textContent = item.role;
        if (item.links?.length) {
          const mediaEmbeds = buildEmbedCards(item.links, buildPerformanceContext(item.role));
          const embeddedUrls = new Set(mediaEmbeds.map((entry) => entry.url));
          appendNonEmbeddedLinks(links, item.links, embeddedUrls);

          if (mediaEmbeds.length) {
            const embedsWrap = document.createElement("div");
            embedsWrap.className = "media-embed-grid";
            mediaEmbeds.forEach((embed) => embedsWrap.appendChild(embed.element));
            links.appendChild(embedsWrap);
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
      const aside = document.createElement("div");
      aside.className = "credit-item";
      aside.innerHTML = `
        <div class="credit-item-header">
          <div>
            <h4>Available on request</h4>
            <p class="credit-meta">Provided in the source data without public links.</p>
          </div>
        </div>
      `;

      const listEl = document.createElement("ul");
      listEl.className = "credit-note-list";
      category.unlinkedItems.forEach((entry) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${entry.title}</strong> (${entry.year})<br />${entry.role}<br />${entry.note}`;
        listEl.appendChild(li);
      });
      aside.appendChild(listEl);
      itemsWrap.appendChild(aside);
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

const renderAdditionalExperience = (data) => {
  const container = document.getElementById("additional-experience");
  const wrapper = document.createElement("div");
  wrapper.className = "experience-groups";

  data.visibleButUnlinkedPortfolioMentions.forEach((group) => {
    const block = document.createElement("section");
    block.className = "experience-group";

    const heading = document.createElement("h4");
    heading.textContent = group.category;
    block.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "stack-list";
    group.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    block.appendChild(list);
    wrapper.appendChild(block);
  });

  container.appendChild(wrapper);
};

const renderContact = (data) => {
  const contactList = document.getElementById("contact-list");
  const contactItems = [
    {
      label: "Email",
      value: data.contact.email,
      href: `mailto:${data.contact.email}`,
    },
    {
      label: "Discord",
      value: data.contact.discord,
    },
  ];

  contactItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "contact-item";
    row.innerHTML = `<div class="contact-label">${item.label}</div>`;

    if (item.href) {
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.value;
      row.appendChild(link);
    } else {
      const value = document.createElement("div");
      value.textContent = item.value;
      value.style.fontWeight = "700";
      value.style.color = "var(--surface-ink)";
      row.appendChild(value);
    }

    contactList.appendChild(row);
  });

  const socialGrid = document.getElementById("social-grid");
  data.socialProfiles.forEach((profile) => {
    const card = document.createElement("a");
    card.href = profile.url;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.className = "social-card";
    card.innerHTML = `
      <span class="social-card-icon">${getSocialIcon(profile.service)}</span>
      <span class="social-card-label">${profile.label}</span>
      <strong>View profile</strong>
    `;
    socialGrid.appendChild(card);
  });
};

const injectSchema = (data) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Umi Fusion",
    jobTitle: "Voice Actor",
    image: "assets/images/umi-fusion-headshot.jpg",
    email: data.contact.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: data.contact.location,
    },
    knowsAbout: data.portfolioCategories.map((category) => category.category),
    sameAs: data.socialProfiles.map((profile) => profile.url),
  };

  document.getElementById("person-schema").textContent = JSON.stringify(schema);
};

const renderPage = (data) => {
  renderMetrics(data);
  renderHeroCards(data);
  renderDemos(data);
  renderCredits(data);
  renderEquipment(data);
  renderSimpleList("training-list", data.training);
  renderSimpleList("education-list", data.education);
  renderAdditionalExperience(data);
  renderContact(data);
  injectSchema(data);
};

const renderError = () => {
  document.getElementById("hero-summary").textContent =
    "The portfolio data could not be loaded. Serve the site from a web server so the JSON file can be requested normally.";
};

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load ${dataUrl}`);
    }

    return response.json();
  })
  .then(renderPage)
  .catch(renderError);
