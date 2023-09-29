var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "./database/database.db"

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Ne peut pas ouvrir db
    console.error(err.message)
    throw err
  } else {
    console.log('Connected to the SQLite database.')
    db.run(`CREATE TABLE IF NOT EXISTS links (
          originalURL text,
          shortURL text
          )`,
      (err) => {
        if (err) {
          // table déja créée
        }
      });
  }
});


module.exports = db
