import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;


const connectionString = process.env.DATABASE_URL;
const db = connectionString
  ? new pg.Client({
      connectionString,

      ssl: { rejectUnauthorized: false },
    })
  : new pg.Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT) || 5432,
      ssl: { rejectUnauthorized: false },
    });

db.connect().catch((err) => {
  console.error(" Failed to connect to Postgres:", err);
  process.exit(1); 
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

let currentUserId = 1;
let users = [];

async function checkVisited() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries WHERE user_id = $1;",
    [currentUserId]
  );
  return result.rows.map((row) => row.country_code);
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  try {
    const countries = await checkVisited();
    const currentUser = await getCurrentUser();

    res.render("index.ejs", {
      countries,
      total: countries.length,
      users,
      color: currentUser?.color || "white",
    });
  } catch (err) {
    console.error("Error loading page:", err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [String(input || "").toLowerCase()]
    );

    const data = result.rows[0];
    if (!data) throw new Error("Country not found");

    const countryCode = data.country_code;

    await db.query(
      "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
      [countryCode, currentUserId]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error adding country:", err.message);
    res.redirect("/");
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = parseInt(req.body.user);
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const { name, color } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id;",
      [name, color]
    );

    currentUserId = result.rows[0].id;
    res.redirect("/");
  } catch (err) {
    console.error("Error creating new user:", err.message);
    res.redirect("/");
  }
});

app.get("/setup", async (req, res) => {
  try {
    if (!process.env.SETUP_TOKEN || req.query.token !== process.env.SETUP_TOKEN) {
      return res.status(403).send("Forbidden");
    }
    const sql = `
      DROP TABLE IF EXISTS visited_countries;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS countries;

      CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(15) UNIQUE NOT NULL,
        color VARCHAR(15)
      );

      CREATE TABLE countries (
        country_code CHAR(2) PRIMARY KEY,
        country_name TEXT NOT NULL
      );

      CREATE TABLE visited_countries(
        id SERIAL PRIMARY KEY,
        country_code CHAR(2) NOT NULL REFERENCES countries(country_code),
        user_id INTEGER NOT NULL REFERENCES users(id),
        UNIQUE (country_code, user_id)
      );

      INSERT INTO users (name, color)
      VALUES ('Angela', 'teal'), ('Jack', 'powderblue')
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO countries (country_code, country_name) VALUES
      ('FR', 'France'), ('GB', 'United Kingdom'), ('CA', 'Canada'),
      ('US', 'United States'), ('DE', 'Germany'), ('IL', 'Israel')
      ON CONFLICT (country_code) DO NOTHING;

      INSERT INTO visited_countries (country_code, user_id)
      VALUES ('FR', 1), ('GB', 1), ('CA', 2), ('FR', 2)
      ON CONFLICT DO NOTHING;
    `;
    await db.query(sql);
    res.send("✅ Database initialized successfully");
  } catch (e) {
    console.error(e);
    res.status(500).send("Setup failed");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
