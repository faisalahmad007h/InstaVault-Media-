const urlInput = document.getElementById("urlInput");
const pasteBtn = document.getElementById("pasteBtn");
const clearBtn = document.getElementById("clearBtn");

const downloadBtn = document.getElementById("downloadBtn");
const downloadText = document.getElementById("downloadText");

const message = document.getElementById("message");

const previewSection = document.getElementById("previewSection");
const mediaGrid = document.getElementById("mediaGrid");
const mediaCount = document.getElementById("mediaCount");

const qualityArea = document.getElementById("qualityArea");
const quality = document.getElementById("quality");

const toast = document.getElementById("toast");
const sparkContainer = document.getElementById("sparkContainer");

const historyGrid = document.getElementById("historyGrid");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const downloadAllBtn = document.getElementById("downloadAllBtn");


/* --------------------------------
   INSTAGRAM URL VALIDATION
-------------------------------- */

function isInstagramUrl(value) {

  try {

    const url = new URL(value);

    const host = url.hostname
      .replace("www.", "")
      .toLowerCase();

    return (
      host === "instagram.com" ||
      host === "instagram.org"
    );

  } catch {

    return false;

  }

}


/* --------------------------------
   SPARK EFFECT
-------------------------------- */

function createSparks(event) {

  const amount = 14;

  for (let i = 0; i < amount; i++) {

    const spark = document.createElement("span");

    spark.className = "spark";

    const angle =
      Math.random() * Math.PI * 2;

    const distance =
      25 + Math.random() * 70;

    const x =
      Math.cos(angle) * distance;

    const y =
      Math.sin(angle) * distance;

    spark.style.left = `${event.clientX}px`;
    spark.style.top = `${event.clientY}px`;

    spark.style.setProperty(
      "--x",
      `${x}px`
    );

    spark.style.setProperty(
      "--y",
      `${y}px`
    );

    const size =
      2 + Math.random() * 4;

    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;

    sparkContainer.appendChild(spark);

    setTimeout(() => {
      spark.remove();
    }, 800);
  }
}


/* --------------------------------
   GLOBAL BUTTON SPARKS
-------------------------------- */

document.addEventListener("click", (event) => {

  const target =
    event.target.closest(
      "button"
    );

  if (!target) return;

  createSparks(event);

});


/* --------------------------------
   TOAST
-------------------------------- */

let toastTimer;

function showToast(text) {

  toast.textContent = text;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2500);

}


/* --------------------------------
   PASTE
-------------------------------- */

pasteBtn.addEventListener(
  "click",
  async () => {

    try {

      const text =
        await navigator.clipboard.readText();

      if (!text) {

        showToast(
          "Clipboard is empty."
        );

        return;
      }

      urlInput.value = text.trim();

      showToast(
        "Link pasted."
      );

    } catch {

      showToast(
        "Please paste the link manually."
      );

    }

  }
);


/* --------------------------------
   CLEAR
-------------------------------- */

clearBtn.addEventListener(
  "click",
  () => {

    urlInput.value = "";

    previewSection.classList.add(
      "hidden"
    );

    message.textContent = "";

  }
);


/* --------------------------------
   DOWNLOAD / RESOLVE
-------------------------------- */

downloadBtn.addEventListener(
  "click",
  async () => {

    const url =
      urlInput.value.trim();

    if (!isInstagramUrl(url)) {

      message.textContent =
        "That link doesn't look right.";

      return;
    }


    downloadBtn.classList.add(
      "loading"
    );

    downloadText.textContent =
      "Checking…";

    message.textContent =
      "Resolving available media…";


    try {

      const response =
        await fetch("/api/resolve", {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            url
          })

        });


      const data =
        await response.json();


      if (!response.ok || !data.success) {

        throw new Error(
          data.message ||
          "Media could not be retrieved."
        );

      }


      renderMedia(data);

      message.textContent = "";

      showToast(
        "Media found successfully."
      );


    } catch (error) {

      message.textContent =
        error.message ||
        "Something went wrong.";

      previewSection.classList.add(
        "hidden"
      );

    } finally {

      downloadBtn.classList.remove(
        "loading"
      );

      downloadText.textContent =
        "Download";

    }

  }
);


/* --------------------------------
   RENDER MEDIA
-------------------------------- */

function renderMedia(data) {

  previewSection.classList.remove(
    "hidden"
  );

  qualityArea.classList.remove(
    "hidden"
  );

  mediaGrid.innerHTML = "";

  const items =
    data.items || [];

  mediaCount.textContent =
    `${items.length} item${items.length === 1 ? "" : "s"} found`;


  items.forEach(
    (item, index) => {

      const card =
        document.createElement("div");

      card.className =
        "media-card";


      let preview = "";

      if (item.type === "video") {

        preview = `
          <video
            src="${escapeHtml(item.previewUrl || item.url)}"
            controls
            preload="metadata">
          </video>
        `;

      } else {

        preview = `
          <img
            src="${escapeHtml(item.thumbnail || item.url)}"
            alt="Media preview"
            loading="lazy">
        `;

      }


      card.innerHTML = `
        ${preview}

        <div class="media-info">

          <div class="media-type">
            ${(item.type || "media").toUpperCase()}
          </div>

          <div style="margin-top:5px;font-size:12px;color:#888;">
            Item ${index + 1}
          </div>

          <button
            class="secondary-download"
            style="height:45px;margin-top:10px;"
            data-download="${escapeHtml(item.url)}"
            data-filename="${escapeHtml(item.filename || `InstaVault_${index + 1}`)}">
            ↓ Save
          </button>

        </div>
      `;


      mediaGrid.appendChild(card);

    }
  );


  downloadAllBtn.classList.toggle(
    "hidden",
    items.length <= 1
  );


  document
    .querySelectorAll(
      "[data-download]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          downloadDirectFile(
            button.dataset.download,
            button.dataset.filename
          );

        }
      );

    });

}


/* --------------------------------
   DIRECT FILE DOWNLOAD
-------------------------------- */

async function downloadDirectFile(
  url,
  filename
) {

  if (!url) {

    showToast(
      "No downloadable media URL available."
    );

    return;
  }


  try {

    showToast(
      "Starting download…"
    );

    const response =
      await fetch(url);

    if (!response.ok) {

      throw new Error(
        "Download failed."
      );

    }


    const blob =
      await response.blob();


    const blobUrl =
      URL.createObjectURL(blob);


    const a =
      document.createElement("a");

    a.href = blobUrl;

    a.download =
      filename || "InstaVault-media";


    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(blobUrl);


    saveHistory({
      filename,
      timestamp:
        new Date().toISOString()
    });


    showToast(
      "Downloaded ✓"
    );


  } catch {

    showToast(
      "The media could not be downloaded."
    );

  }

}


/* --------------------------------
   HISTORY
-------------------------------- */

function getHistory() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "instavault_history"
      )
    ) || [];

  } catch {

    return [];

  }

}


function saveHistory(item) {

  const history =
    getHistory();

  history.unshift(item);

  const limited =
    history.slice(0, 20);

  localStorage.setItem(
    "instavault_history",
    JSON.stringify(limited)
  );

  renderHistory();

}


function renderHistory() {

  const history =
    getHistory();


  if (!history.length) {

    historyGrid.innerHTML = `
      <div class="empty-state glass">

        <div>↓</div>

        <h3>
          Nothing downloaded yet
        </h3>

        <p>
          Paste a supported Instagram link above to get started.
        </p>

      </div>
    `;

    return;
  }


  historyGrid.innerHTML =
    history.map(item => `

      <div class="feature glass">

        <div class="feature-icon">
          ✓
        </div>

        <h3>
          ${escapeHtml(
            item.filename ||
            "Downloaded media"
          )}
        </h3>

        <p>
          ${new Date(
            item.timestamp
          ).toLocaleString()}
        </p>

      </div>

    `).join("");

}


clearHistoryBtn.addEventListener(
  "click",
  () => {

    localStorage.removeItem(
      "instavault_history"
    );

    renderHistory();

    showToast(
      "History cleared."
    );

  }
);


/* --------------------------------
   SECURITY HELPER
-------------------------------- */

function escapeHtml(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* --------------------------------
   AUTO RENDER HISTORY
-------------------------------- */

renderHistory();


/* --------------------------------
   OPTIONAL CLIPBOARD DETECTION
-------------------------------- */

window.addEventListener(
  "focus",
  async () => {

    // Intentionally do not silently read clipboard.
    // The user can press Paste instead.

  }
);
