# 🎣 ArchiFishDex

🇬🇧 *[Lire cette documentation en anglais](./README.md)*

> **Un projet fullstack interactif permettant aux viewers Twitch de pêcher, collectionner et suivre leurs Pokémon aquatiques en temps réel via un Pokédex personnel.**

---

## 🎮 Le concept : Lurk Bait & ArchiFishDex

L'expérience repose sur le jeu **[Lurk Bait](https://blam.cam/)**, un système de pêche automatique intégré aux streams Twitch. 

**Comment ça marche pour le viewer ?**
* Le viewer lance sa ligne via la commande `!fish` ou via des actions automatiques déclenchées par **Twitchat** (système de triggers personnalisés que j'ai configurés pour automatiser les interactions).
* Lorsqu'un Pokémon "mord", le jeu annonce la capture dans le chat avec son poids et sa valeur.
* **La contrainte :** Pour consulter son Pokédex ou le classement général en direct, l'affichage en jeu bloque le flux visuel du stream pour l'ensemble de la communauté.

**Le rôle d'ArchiFishDex :**
J'ai conçu cet écosystème pour offrir une **consultation asynchrone**. Les viewers peuvent suivre leur progression, admirer leurs succès et comparer leurs scores sur l'application web dédiée (via mobile ou second écran), sans jamais interrompre le live et/ou la pèche pour les autres participants.

---

## 📑 Table des matières
1. [Comment ça marche ?](#comment-ca-marche)
2. [Architecture du Projet](#architecture-du-projet)
3. [Technologies Utilisées](#technologies-utilisees)
4. [Fonctionnalités du Front (Application Web)](#fonctionnalites-du-front)
5. [Structure des Données (MongoDB Atlas)](#structure-des-donnees)
6. [Format de détection (Le Bot en détail)](#format-de-detection)
7. [Remerciements](#remerciements)
8. [Statut du Projet & Utilisation](#statut-du-projet)

---

## <a id="comment-ca-marche"></a>🔄 Comment ça marche ?

Le flux de données se déroule en 4 étapes clés :

1. **Jeu de pêche tiers ([Lurk Bait Twitch Fishing](https://blam.cam/))** : Les viewers interagissent avec le jeu directement sur le stream. Le jeu a été **entièrement customisé** pour l'univers Pokémon : il permet exclusivement la capture de Pokémon de type Eau ou appartenant à un groupe d'œufs aquatique. Avec **230 Pokémon disponibles** (en version normale et *shiny*), le jeu intègre leurs vrais cris, leurs poids réels, ainsi qu'une valeur liée à leur rareté. Une fois le Pokémon attrapé, le jeu annonce la capture dans le chat Twitch.
2. **Bot Twitch** : Écoute le chat en permanence, détecte les messages de capture validés par le jeu et extrait les données du joueur et du Pokémon capturé. Il se charge également d'annoncer dans le chat les succès obtenus par un joueur après une capture.
3. **Backend** : Reçoit les données du bot et met à jour la base de données en ajoutant la capture au profil de l'utilisateur. Les succès sont calculés en temps réel lors de cette étape : si un joueur débloque un succès, le backend renvoie un message au bot pour qu'il l'affiche instantanément dans le chat Twitch. Ces données sont également rendues disponibles pour l'application web.
4. **Frontend** : Récupère les données du backend pour afficher l'évolution, la collection et les succès des joueurs en temps réel.

---

## <a id="architecture-du-projet"></a>🏗 Architecture du Projet

Le dépôt monorepo est divisé en trois dossiers principaux :

* 📁 **/front** : L'interface utilisateur Web développée en Vue.js. Elle interroge le backend pour afficher le Pokédex interactif, les statistiques, les succès et les leaderboard.
* 📁 **/back** : Le serveur principal. Il gère la logique métier, la connexion à la base de données, le calcul des succès, et sert d'API centrale entre le bot et le frontend.
* 📁 **/bot** : Connecté à l'API Twitch, il lit le chat, filtre les annonces de Lurk Bait, envoie les données de capture au backend, et relaie les annonces de succès dans le chat.

---

## <a id="technologies-utilisees"></a>💻 Technologies Utilisées

* **Frontend** : Vue.js, Nuxt.Js, JavaScript, SCSS
* **Backend** : Node.js, Express, MongoDB
* **Bot** : Node.js, Twitch API (ex: tmi.js / Twitch.js)
* **Jeu Tiers** : Lurk Bait Twitch Fishing (Customisé pour l'occasion)

---

## <a id="fonctionnalites-du-front"></a>✨ Fonctionnalités du Front (Application Web)

L'application web est le véritable tableau de bord pour les viewers, offrant une expérience riche et détaillée :

### 🔐 Authentification & Sécurité (Twitch OAuth)
Pour garantir une expérience personnalisée et sécurisée, l'application intègre l'authentification officielle **Twitch OAuth2** :
* **Connexion unique** : Les viewers se connectent via leur compte Twitch pour accéder à leur Pokédex personnel.
* **Persistance des données** : Le backend fait le lien entre le nom d'utilisateur unique Twitch et les captures stockées en base de données (MongoDB).
* **Expérience utilisateur** : Cette intégration permet une synchronisation parfaite entre l'activité sur le chat (la pêche) et la visualisation sur le site (la collection).

### 👤 Gestion des Profils Utilisateurs
Le système assure la cohérence des données via une création de profil hybride basée sur le nom d'utilisateur Twitch unique :
* **Création par l'action** : Si un nouveau viewer pêche un Pokémon, son profil est instantanément généré en base de données pour enregistrer sa capture.
* **Création par l'Auth** : Si un viewer se connecte au site avant de pêcher, son profil est créé via le flux **Twitch OAuth2**.
* **Mapping Unique** : L'authentification permet de faire le lien sécurisé entre la session web et les données de capture stockées en base (MongoDB).

### 📖 Pokédex personnel
Visualisation de tous les Pokémon capturés par l'utilisateur (incluant les versions *shiny*). Pour inciter à la collection, **tous les Pokémon du jeu sont affichés, mais ceux qui n'ont pas encore été capturés apparaissent sous forme de silhouette noire**, rappelant le fameux *"Who's that Pokémon ?"*.
L'interface est également équipée de **nombreuses options de filtres** pour trier et chercher facilement dans sa collection.
> ![](https://github.com/user-attachments/assets/ac68a2b8-524c-483d-abd3-cfa82bd88e92)

### 📊 Statistiques détaillées
Suivi de l'évolution et de la progression de l'utilisateur quant à la complétion du *roster* complet, décomposé à travers de multiples catégories d'analyse (Générations, Types, Tags spéciaux).
> ![](https://github.com/user-attachments/assets/f98f75d3-dc3a-443a-b8cd-b0e8434e8f79)


### 🏆 Système de Succès (Achievements)
Des récompenses débloquées au fil de l'aventure. Chaque succès possède :
* Un niveau de rareté (**Bronze, Argent, Or, Platine**)
* Un numéro, un titre et une description
* Une valeur spécifique en points
* **Une statistique globale** : Le pourcentage d'obtention de ce succès par rapport à tous les joueurs ayant déjà débloqué au moins un succès.
* Les succès non obtenus ne montrent que leur numéro et leur pourcentage d'obtention au global, le reste est masqué pour éviter le spoil
> ![](https://github.com/user-attachments/assets/d47da27c-037d-434a-a57a-1f8aa8ed09b0)


### 🥇 Leaderboards
La compétition est à l'honneur avec **4 classements distincts** pour comparer ses exploits avec le reste de la communauté du stream.
> ![](https://github.com/user-attachments/assets/25d43cd3-3928-4545-92aa-2f7ac0935cbd)

---

## <a id="structure-des-donnees"></a>🗄️ Structure des Données (MongoDB Atlas)

Le backend s'appuie sur une base de données **MongoDB** hébergée sur Atlas. Elle contient des collections de référence constituées à la main, qui correspondent exactement aux fichiers internes du jeu customisé.

### 1. Collection `Pokemons` (Dictionnaire de référence)
Cette collection liste les 230 Pokémon disponibles dans le jeu. Elle intègre un système de `tags`, de générations et de types qui permet au frontend de proposer des options de filtres très poussées.

```json
{
  "code": "0008",
  "name": "Carabaffe",
  "gen": 1,
  "tags": ["starter"],
  "type1": "water",
  "type2": ""
}
```
*(Exemple d'un pokemon avec un tag particulier avec le tag correspondant :)*

```json
{
  "code": "0080g",
  "name": "Flagadoss de Galar",
  "gen": 8,
  "tags": ["variant"],
  "type1": "psychic",
  "type2": "poison"
}
```
*(Exemple d'un pokemon avec une variation)*

### 2. Collection Achievements (Succès)
Tout comme les Pokémon, les succès sont pré-enregistrés dans la base. Le backend vérifie cette liste en temps réel à chaque nouvelle capture. La logique métier qui calcule si les conditions d'un succès sont remplies est centralisée dans le fichier checkAchievements.js.

```json
{
  "number": 1,
  "name": "Il faut un début à tout",
  "description": "Capturer son premier pokémon",
  "tier": "bronze",
  "value": 5
}
```

> ⚠️ **Note sur le projet** : Les données exactes de la base (ainsi que les assets du jeu *Lurk Bait* modifié) sont privées et exclusives à mon stream. Ce dépôt GitHub a pour but de présenter l'architecture web, le bot et le backend qui gravitent autour du jeu, mais il n'est pas conçu pour être déployé "clé en main" par un tiers sans ces fichiers de référence.
---

## <a id="format-de-detection"></a>🎣 Format de détection (Le Bot en détail)

Le module `/bot` écoute les messages générés par **Lurk Bait** dans le chat Twitch lié à mon pseudo (ArchibaldWirslayd). Il utilise une expression régulière spécifique pour capter les annonces :

> `^Félicitation @(.+?) tu as attrapé un (.+?) qui pèse (.+?) et vaut (.+?) de pognon! Tu as désormais (.+?) de pognon!`

### Gestion des ID et Cas Spéciaux (Formes Régionales)
Le bot est capable d'extraire le numéro du Pokémon en 4 numeros (ex: "0129" pour Magicarpe) et de détecter s'il s'agit d'une version *(Shiny)*. 

De plus, il intègre un dictionnaire exhaustif pour gérer **toutes les formes régionales et cas spéciaux** (Méga-Évolutions, formes d'Alola/Galar/Hisui/Paldea, différences de genre, etc.). Par exemple :
* *Moyade Femelle* → Code `0593f`
* *Tritosor Mer Orient* → Code `0423e`
* *Superdofin forme Super* → Code `0964f`

Une fois le message parsé, un objet structuré est envoyé à l'API backend :
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

## <a id="remerciements"></a>🙏 Remerciements (Shoutout)

Un grand merci à Jimauve pour m'avoir fourni la base de code initiale du bot Twitch. Son travail m'a permis de démarrer sur de solides fondations avant d'y greffer toute la logique métier spécifique à ArchiDexFishing (l'expression régulière, les succès, et la communication avec mon backend) ! 

N'hésitez pas à aller découvrir sa [chaine Twitch](https://www.twitch.tv/jimauve)

---


## <a id="statut-du-projet"></a>🔒 Statut du Projet & Utilisation

Ce projet a été développé spécifiquement pour mon propre usage et ma propre chaîne Twitch.

Par conséquent :

❌ Ce dépôt n'accepte pas les contributions externes (Pull Requests).

❌ Aucun support technique ou aide à l'installation ne sera fourni.

Cependant, vous êtes totalement libres de forker ce projet, d'étudier le code, de vous en inspirer ou de l'utiliser comme base pour créer votre propre système de votre côté !

(Si vous souhaitez lancer les modules en local pour explorer le code, vous devrez créer vos propres fichiers .env et recréer une base de données avec vos propres données de test via npm install et npm run start dans chaque dossier).
