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

const shortSpotifyEmbedTitles = new Set(["Solarity", "Eastmouth"]);
const horizontalEmbedTitles = new Set(["Solarity", "Eastmouth"]);

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
    instagram: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5"></rect>
        <circle cx="12" cy="12" r="4.25"></circle>
        <circle cx="17.4" cy="6.6" r="1.1" class="icon-fill"></circle>
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
      <strong>${item.title}</strong>
      <span>${buildPerformanceContext(item.role)}</span>
    </div>
    <div class="project-visual-media">
      <img src="${visual.image}" alt="${item.title} promotional artwork" loading="lazy" />
    </div>
  `;
  return card;
};

const createFacebookEmbedCard = (item) => {
  const embed = facebookEmbeds[item.title];
  if (!embed) {
    return null;
  }

  const card = document.createElement("section");
  card.className = "facebook-embed-card";
  card.innerHTML = `
    <div class="facebook-embed-meta">
      <strong>Project video</strong>
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

  const metrics = [
    { label: "Project credits", value: "22+" },
    { label: "IMDb credits", value: "8" },
    { label: "Experience", value: "5+ years" },
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
    <p class="card-label">Email</p>
    <p class="card-value">${data.contact.email}</p>
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

      if (horizontalEmbedTitles.has(item.title)) {
        clone.classList.add("credit-item-scroll-embeds");
      }

      title.textContent = item.title;
      year.textContent = item.year;

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
        }
      } else {
        meta.textContent = item.description ?? item.role;
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
        const notes = clone.querySelector(".credit-notes");

        title.textContent = entry.title;
        meta.textContent = entry.description ?? `${entry.role} (${entry.note})`;
        year.textContent = entry.year;
        links.remove();
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
      label: "Bookings & inquiries",
      value: data.contact.email,
      href: `mailto:${data.contact.email}`,
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











