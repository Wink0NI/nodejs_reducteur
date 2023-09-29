const { customAlphabet } = require('nanoid');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./models/Urls');

// HEX
let nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);
const PORT = process.env.PORT || 3000;
const link = "https://reducteur-js-api.onrender.com";

function executeQuery(query, data, callback) {
  try {
    // enregistrer les modifications
    db.serialize(() => {
      // Executer la fonction
      db.all(query, data, (err, lignes) => {
        if (err) {
          // Callback avec erreur
          callback(err, null);
        } else {
          // Callback avec les lignes
          callback(null, lignes);
        }
      });
    });
  } catch (error) {
    // Cas erreur: Callback erreur
    console.error("Error:", error);
    callback(error, null);
  }
}

app = express();
app.use(
  cors({
    origin: "*",
  })
); // origine -> tous les sites

app.use(express.json());
app.use(express.static("dist"))

app.post("/api/shorten", async (req, res, next) => {
  if (req.body.url) {
    try {

      // Axios pour se connecter
      const response = await axios.get(req.body.url.toString(), {
        validateStatus: (status) => {
          return status < 500;
        },
      });

      if (response.status !== 404) {
        const generateUniqueshortURL = () => {
          // Générer un shortURL aléatoire
          const shortURL = nanoid();
          const shortURLCheckQuery = `SELECT * FROM links WHERE shortenURL = ?`;

          executeQuery(shortURLCheckQuery, [shortURL], (err, lignes) => {
            if (err) {
              res.status(400).json({ message: err });
            } else {
              if (lignes.length === 0) {
                // Le shortURL est unique, insérer l'URL
                const insertQuery = `INSERT INTO links (originalURL, shortenURL) VALUES (?, ?)`;

                executeQuery(insertQuery, [req.body.url, shortURL], (err, result) => {
                  if (err) {
                    res.status(400).json({ message: err });
                  } else {
                    res.status(200).json({ lien_raccourci: `${link}/${shortURL}` });
                  }
                });
              } else {
                // Le shortURL existe déjà, réessayer avec un nouveau shortURL
                generateUniqueshortURL();
              }
            }
          });
        };

        // Commencer la génération avec un shortURL unique
        generateUniqueshortURL();
      }
      else {
        res.json({
          message: response.statusText,
          status: response.status,
        });
      }

    } catch (err) {
      next(err);
    }
  } else {
    res.status(400);
    const error = new Error("URL is required");
    next(error);
  }
});

app.get("/:shortURL", async (req, res, next) => {
  try {
    const shortURL = req.params.shortURL;
    const shortURLCheckQuery = "SELECT originalUrl FROM links WHERE shortenURL = ?";

    executeQuery(shortURLCheckQuery, [shortURL], (err, lignes) => {

      if (err) {
        return next(err);
      }

      if (lignes.length > 0) {
        // Rediriger vers l'URL d'origine
        const originalUrl = lignes[0].originalURL;
        res.status(301).redirect(originalUrl);
      } else {
        next();
      }
    });
  } catch (err) {
    next(err);
  }
});


function notFound(req, res, next) {
  res.status(404);
  const error = new Error("Not found - " + req.originalUrl);
  return next(error);
}

function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    error: {
      status: res.statusCode,
      stack: process.env.ENV === "development" ? err.stack : undefined,
    },
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Listening on port ${PORT}... in mode ${process.env.NODE_ENV}. Go to http://localhost:${PORT} if connected in local mode or to https://reducteur-js-api.onrender.com if deployed.`));
