# 🎣 ArchiFishDex

🇫🇷 *[Lire cette documentation en Français](./README.fr.md)*

> **An interactive fullstack project allowing Twitch viewers to fish, collect, and track their aquatic Pokémon in real-time through a personal Pokédex.**

---

## 🎮 The Concept: Lurk Bait & ArchiFishDex

The experience is based on the game **[Lurk Bait](https://blam.cam/)**, an automated fishing system integrated into Twitch streams. 

**How it works for the viewer?**
* The viewer casts their line via the `!fish` command or through automated actions triggered by **Twitchat** (a custom trigger system I configured to automate interactions).
* When a Pokémon "bites," the game announces the catch in the chat with its weight and value.
* **The constraint:** To consult their Pokédex or the global leaderboard live, the in-game display blocks the stream's visual feed for the entire community.

**The role of ArchiFishDex:**
I designed this ecosystem to offer **asynchronous consultation**. Viewers can track their progress, admire their achievements, and compare their scores on the dedicated web application (via mobile or second screen), without ever interrupting the live stream and/or fishing for other participants.

---

## 📑 Table of Contents
1. [How it works?](#how-it-works)
2. [Project Architecture](#project-architecture)
3. [Technologies Used](#technologies-used)
4. [Frontend Features (Web Application)](#frontend-features)
5. [Data Structure (MongoDB Atlas)](#data-structure)
6. [Detection Format (The Bot in detail)](#detection-format)
7. [Acknowledgments](#acknowledgments)
8. [Project Status & Usage](#project-status)

---

## <a id="how-it-works"></a>🔄 How it works?

The data flow takes place in 4 key steps:

1. **Third-party fishing game ([Lurk Bait Twitch Fishing](https://blam.cam/))**: Viewers interact with the game directly on stream. The game has been **entirely customized** for the Pokémon universe: it exclusively allows the capture of Water-type Pokémon or those belonging to an aquatic egg group. With **230 Pokémon available** (in normal and *shiny* versions), the game integrates their real cries, their actual weights, as well as a value linked to their rarity. Once the Pokémon is caught, the game announces the capture in the Twitch chat.
2. **Twitch Bot**: Constantly listens to the chat, detects capture messages validated by the game, and extracts player and captured Pokémon data. It is also responsible for announcing achievements obtained by a player in the chat after a capture.
3. **Backend**: Receives data from the bot and updates the database by adding the capture to the user's profile. Achievements are calculated in real-time during this step: if a player unlocks an achievement, the backend sends a message back to the bot to display it instantly in the Twitch chat. This data is also made available for the web application.
4. **Frontend**: Retrieves data from the backend to display the evolution, collection, and achievements of players in real-time.

---

## <a id="architecture-du-projet"></a>🏗 Project Architecture

The monorepo repository is divided into three main folders:

* 📁 **/front**: The Web user interface developed in Vue.js. It queries the backend to display the interactive Pokédex, statistics, achievements, and leaderboards.
* 📁 **/back**: The main server. It handles business logic, database connection, achievement calculation, and serves as the central API between the bot and the frontend.
* 📁 **/bot**: Connected to the Twitch API, it reads the chat, filters Lurk Bait announcements, sends capture data to the backend, and relays achievement announcements in the chat.

---

## <a id="technologies-utilisees"></a>💻 Technologies Used

* **Frontend**: Vue.js, Nuxt.Js, JavaScript, SCSS
* **Backend**: Node.js, Express, MongoDB
* **Bot**: Node.js, Twitch API (ex: tmi.js / Twitch.js)
* **Third-party Game**: Lurk Bait Twitch Fishing (Customized for the occasion)

---

## <a id="fonctionnalites-du-front"></a>✨ Frontend Features (Web Application)

The web application is the true dashboard for viewers, offering a rich and detailed experience:

### 🔐 Authentication & Security (Twitch OAuth)
To guarantee a personalized and secure experience, the application integrates the official **Twitch OAuth2** authentication:
* **Single Sign-On**: Viewers log in via their Twitch account to access their personal Pokédex.
* **Data Persistence**: The backend links the unique Twitch username to the captures stored in the database (MongoDB).
* **User Experience**: This integration allows for perfect synchronization between chat activity (fishing) and visualization on the site (the collection).

### 👤 User Profile Management
The system ensures data consistency via a hybrid profile creation process based on the unique Twitch username:
* **Creation by action**: If a new viewer catches a Pokémon, their profile is instantly generated in the database to record their capture.
* **Creation by Auth**: If a viewer connects to the site before fishing, their profile is created via the **Twitch OAuth2** flow.
* **Unique Mapping**: Authentication allows for a secure link between the web session and the capture data stored in the database (MongoDB).

### 📖 Personal Pokédex
Visualization of all Pokémon captured by the user (including *shiny* versions). To encourage collection, **all Pokémon in the game are displayed, but those not yet caught appear as a black silhouette**, reminiscent of the famous *"Who's that Pokémon?"*.
The interface is also equipped with **numerous filtering options** to easily sort and search through the collection.

### 📊 Detailed Statistics
Tracking the user's evolution and progress toward completing the full *roster*, broken down through multiple analysis categories (Generations, Types, Special Tags).

### 🏆 Achievement System
Rewards unlocked throughout the adventure. Each achievement has:
* A rarity level (**Bronze, Silver, Gold, Platinum**)
* A number, a title, and a description
* A specific point value
* **A global statistic**: The percentage of global completion for this achievement compared to all players who have unlocked at least one achievement.
* Unearned achievements only show their number and global completion percentage; the rest is hidden to avoid spoilers.

### 🥇 Leaderboards
Competition is in the spotlight with **4 distinct rankings** to compare feats with the rest of the stream community.

---

## <a id="structure-des-donnees"></a>🗄️ Data Structure (MongoDB Atlas)

The backend relies on a **MongoDB** database hosted on Atlas. It contains manually created reference collections that correspond exactly to the internal files of the customized game.

### 1. `Pokemons` Collection (Reference dictionary)
This collection lists the 230 Pokémon available in the game. It integrates a system of `tags`, generations, and types that allows the frontend to offer very advanced filtering options.

```json
{
  "code": "0008",
  "name": "Wartortle",
  "gen": 1,
  "tags": ["starter"],
  "type1": "water",
  "type2": ""
}
```

### 2. `Achievements` Collection
Just like the Pokémon, achievements are pre-recorded in the database. The backend checks this list in real-time with each new capture. The business logic that calculates if achievement conditions are met is centralized in the `checkAchievements.js` file.

```json
{
  "number": 1,
  "name": "A beginning for everything",
  "description": "Catch your first Pokémon",
  "tier": "bronze",
  "value": 5
}
```

> ⚠️ **Note on the project**: The exact database data (as well as the assets from the modified *Lurk Bait* game) are private and exclusive to my stream. This GitHub repository aims to present the web architecture, the bot, and the backend orbiting the game, but it is not designed to be deployed "turnkey" by a third party without these reference files.

---

## <a id="format-de-detection"></a>🎣 Detection Format (The Bot in detail)

The `/bot` module listens to messages generated by **Lurk Bait** in the Twitch chat linked to my username (ArchibaldWirslayd). It uses a specific regular expression to capture announcements:

> `^Félicitation @(.+?) tu as attrapé un (.+?) qui pèse (.+?) et vaut (.+?) de pognon! Tu as désormais (.+?) de pognon!`

### ID Management and Special Cases (Regional Forms)
The bot is able to extract the Pokémon number in 4 digits (ex: "0129" for Magikarp) and detect if it is a *(Shiny)* version.

Additionally, it integrates an exhaustive dictionary to handle **all regional forms and special cases** (Mega-Evolutions, Alola/Galar/Hisui/Paldea forms, gender differences, etc.). For example:
* *Female Jellicent* &rarr; Code `0593f`
* *Shellos East Sea* &rarr; Code `0423e`
* *Palafin Hero Form* &rarr; Code `0964f`

Once the message is parsed, a structured object is sent to the backend API:
```json
{
  "pseudo": "viewer_name",
  "catch": {
    "code": "0423e",
    "shiny": true
  }
}
```

---

## <a id="remerciements"></a>🙏 Acknowledgments (Shoutout)

A huge thank you to Jimauve for providing me with the initial code base for the Twitch bot. His work allowed me to start on solid foundations before grafting all the specific business logic for ArchiDexFishing (the regular expression, achievements, and communication with my backend)! 

Feel free to check out his [Twitch channel](https://www.twitch.tv/jimauve)

---

## <a id="statut-du-projet"></a>🔒 Project Status & Usage

This project was developed specifically for my own use and my own Twitch channel.

Therefore:

❌ This repository does not accept external contributions (Pull Requests).

❌ No technical support or installation help will be provided.

However, you are completely free to fork this project, study the code, take inspiration from it, or use it as a base to create your own system on your side!

(If you wish to launch the modules locally to explore the code, you will need to create your own .env files and recreate a database with your own test data via `npm install` and `npm run start` in each folder).