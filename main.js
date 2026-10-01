require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

const PORT =
  process.env.PORT || 3000;


/* -----------------------------
   MIDDLEWARE
----------------------------- */

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* -----------------------------
   INSTAGRAM URL CHECK
----------------------------- */

function isInstagramUrl(value) {

  try {

    const url =
      new URL(value);

    const hostname =
      url.hostname
        .replace("www.", "")
        .toLowerCase();

    return (
      hostname === "instagram.com"
    );

  } catch {

    return false;

  }

}


/* -----------------------------
   MEDIA RESOLVER
----------------------------- */

class MediaResolver {

  async resolveUrl(url) {

    /*
      IMPORTANT:

      Connect your authorized/legitimate
      media provider here.

      The provider should return something
      like:

      {
        success: true,

        items: [
          {
            type: "video",
            url: "https://...",
            previewUrl: "https://...",
            thumbnail: "https://...",
            filename: "InstaVault_Reel.mp4"
          }
        ]
      }

      Do NOT put private API keys in
      frontend JavaScript.
    */


    throw new Error(
      "No media provider configured. Connect an authorized media API in MediaResolver."
    );

  }

}


/* -----------------------------
   RESOLVE ENDPOINT
----------------------------- */

app.post(
  "/api/resolve",
  async (req, res) => {

    try {

      const { url } =
        req.body || {};


      if (
        !url ||
        !isInstagramUrl(url)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please provide a valid Instagram URL."

        });

      }


      const resolver =
        new MediaResolver();


      const result =
        await resolver.resolveUrl(url);


      return res.json(result);


    } catch (error) {

      console.error(
        "Resolve error:",
        error.message
      );


      return res.status(503).json({

        success: false,

        message:
          "This media couldn't be retrieved right now. Please try again later."

      });

    }

  }
);


/* -----------------------------
   HEALTH CHECK
----------------------------- */

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      success: true,
      service: "InstaVault",
      status: "online"
    });

  }
);


/* -----------------------------
   SPA FALLBACK
----------------------------- */

app.get(
  "*",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );

  }
);


/* -----------------------------
   START SERVER
----------------------------- */

app.listen(
  PORT,
  () => {

    console.log(
      `InstaVault running at http://localhost:${PORT}`
    );

  }
);

