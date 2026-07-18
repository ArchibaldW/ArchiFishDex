const TwitchService = require("./service/twitch/twitch-service");
const TwitchTurpleService = require("./service/twitch/twitch-turple-service");
const botWebSocket = require("./service/bot/botWebSocket.js");
const { jwtDecode } = require('jwt-decode');

(async () => {
  const twitchService = new TwitchService();

  const twitchTurpleService = new TwitchTurpleService();
  const freshAccessToken = await twitchTurpleService.start(
    process.env.TWITCH_USER_ID,
    process.env.TWITCH_CLIENT_ID,
    process.env.TWITCH_CLIENT_SECRET,
    process.env.ACCESS_TOKEN,
    process.env.REFRESH_TOKEN,
    process.env.TWITCH_CHANNEL_NAME,
    (newAccessToken) => {
      console.log("✅ Token Twitch rafraîchi, reconnexion tmi.js");
      twitchService.reconnectWithToken(`oauth:${newAccessToken}`);
    }
  );
  console.log("✅ freshAccessToken reçu :", freshAccessToken ? "OK" : "MANQUANT");
  console.log(
    "TwitchService → Track chat from: from: https://twitch.tv/" +
      process.env.TWITCH_BOT_USERNAME
  );

  await twitchService.start(
    process.env.TWITCH_BOT_USERNAME,
    `oauth:${freshAccessToken}`,
    process.env.TWITCH_CHANNEL_NAME
  );

  console.log(
    "TwitchService → Track chat from: https://twitch.tv/" +
      process.env.TWITCH_CHANNEL_NAME
  );

  botWebSocket.start();

  // Variable pour stocker le token actuel
  let apiToken = null;

  // Fonction pour s'authentifier et obtenir un token
  async function authenticateAndScheduleRefresh() {
      console.log("Tentative d'authentification du bot...");
      try {
          const response = await fetch(`${process.env.API_URL}/api/auth/bot`, {
              method: 'POST',
              headers: { 'x-bot-secret': process.env.BOT_API_SECRET }
          });

          if (!response.ok) {
              throw new Error(`Échec de l'authentification: ${response.statusText}`);
          }

          const data = await response.json();
          apiToken = data.token;
          console.log("✅ Bot authentifié, nouveau token reçu !");

          // Décode le token pour lire sa date d'expiration
          const decodedToken = jwtDecode(apiToken);
          const expirationTime = decodedToken.exp * 1000; // Convertir en millisecondes
          const now = Date.now();
          
          // Calculons quand renouveler : à 80% de la durée de vie restante
          const renewalTime = now + (expirationTime - now) * 0.8;

          // Planifier la prochaine exécution
          scheduleNextRefresh(renewalTime - now);

      } catch (error) {
          console.error("❌ Erreur critique lors de l'authentification:", error);
          // En cas d'échec, on réessaie dans 1 minute
          scheduleNextRefresh(60 * 1000); 
      }
  }

  function scheduleNextRefresh(ms) {
      setTimeout(authenticateAndScheduleRefresh, ms);
      console.log(`Prochain renouvellement du token dans ${(ms / 1000 / 60).toFixed(2)} minutes.`);
  }

  // ---- Démarrage du bot ----
  // Lancez le premier cycle d'authentification au démarrage
  authenticateAndScheduleRefresh();


  

  const fishingRegex = /^Félicitation @(.+?) tu as attrapé un (.+?) qui pèse (.+?)kg et vaut (.+?) de pognon! Tu as désormais (.+?) de pognon!/;

  const specialCases = [
    // 1G
    { "code": "0003m", "name": "Méga-Florizarre" },
    { "code": "0003g", "name": "Florizarre Gigamax" },
    { "code": "0009m", "name": "Méga-Tortank" },    
    { "code": "0009g", "name": "Tortank Gigamax" },
    { "code": "0052gi", "name": "Miaouss Gigamax" },
    { "code": "0080m", "name": "Méga-Flagadoss" },
    { "code": "0094m", "name": "Mega-Ectoplasma" },
    { "code": "0094g", "name": "Ectoplasma Gigamax" },
    { "code": "0099g", "name": "Krabboss Gigamax" },
    { "code": "0130m", "name": "Méga-Leviator" },
    { "code": "0131g", "name": "Locklass Gigamax" },
    { "code": "0133g", "name": "Evoli Gigamax" },
    { "code": "0150mx", "name": "Mega-Mewtwo X" },
    { "code": "0150my", "name": "Mega-Mewtwo Y" },

    // 3G
    { "code": "0260m", "name": "Méga-Laggron" },
    { "code": "0319m", "name": "Méga-Sharpedo" },
    { "code": "0351f", "name": "Morphéo Solaire" },
    { "code": "0351w", "name": "Morphéo Eau de Pluie" },
    { "code": "0351i", "name": "Morphéo Blizzard" },
    { "code": "0359m", "name": "Méga-Absol" },
    { "code": "0382p", "name": "Primo-Kyogre" },

    // 4G
    { "code": "0422e", "name": "Sancoki Mer Orient" },
    { "code": "0422o", "name": "Sancoki Mer Occident" },
    { "code": "0423e", "name": "Tritosor Mer Orient" },
    { "code": "0423o", "name": "Tritosor Mer Occident" },
    { "code": "0448m", "name": "Méga-Lucario" },
    { "code": "0479h", "name": "Motisma Chaleur" },
    { "code": "0479c", "name": "Motisma Froid" },
    { "code": "0479f", "name": "Motisma Hélice" },
    { "code": "0479m", "name": "Motisma Tonte" },
    { "code": "0479w", "name": "Motisma Lavage" },
    { "code": "0493w", "name": "Arceus Eau" },

    // 5G
    { "code": "0550b", "name": "Bargantua Bleu" },
    { "code": "0550r", "name": "Bargantua Rouge" },
    { "code": "0592f", "name": "Viskuse Femelle" },
    { "code": "0592m", "name": "Viskuse Mâle" },
    { "code": "0593f", "name": "Moyade Femelle" },
    { "code": "0593m", "name": "Moyade Mâle" },

    // 6G
    { "code": "0038p", "name": "Exagide Parade" },
    { "code": "0038a", "name": "Exagide Assaut" },

    // 7G
    { "code": "0037a", "name": "Goupix d'Alola" },
    { "code": "0038a", "name": "Feunard d'Alola" },
    { "code": "0052a", "name": "Miaouss d'Alola" },
    { "code": "0053a", "name": "Persian d'Alola" },
    { "code": "0745d", "name": "Lougaroc Diurne" },
    { "code": "0745n", "name": "Lougaroc Nocturne" },
    { "code": "0745c", "name": "Lougaroc Crépusculaire" },
    { "code": "0746b", "name": "Froussardine en banc" },

    // 8G
    { "code": "0052g", "name": "Miaouss de Galar" },
    { "code": "0058h", "name": "Caninos de Hisui" },
    { "code": "0059h", "name": "Arcanin de Hisui" },
    { "code": "0079g", "name": "Ramoloss de Galar" },
    { "code": "0080g", "name": "Flagadoss de Galar" },
    { "code": "0083g", "name": "Canarticho de Galar" },
    { "code": "0199g", "name": "Roigada de Galar" },
    { "code": "0211h", "name": "Qwilfish de Hisui" },
    { "code": "0222g", "name": "Corayon de Galar" },
    { "code": "0503h", "name": "Clamiral de Hisui" },
    { "code": "0570h", "name": "Zorua de Hisui" },
    { "code": "0571h", "name": "Zoroark de Hisui" },
    { "code": "0550w", "name": "Bargantua Blanc" },
    { "code": "0834g", "name": "Torgamord Gigamax" },
    { "code": "0841g", "name": "Pomdrapi Gigamax" },
    { "code": "0842g", "name": "Dratain Gigamax" },
    { "code": "0845g", "name": "Nigosier Gobe-chu" },
    { "code": "0845h", "name": "Nigosier Gobe-tout" },
    { "code": "0875g", "name": "Bekaglaçon Tête de Gel" },
    { "code": "0875t", "name": "Bekaglaçon Tête Dégel" },
    { "code": "0892m", "name": "Shifours Mille Poings" },
    { "code": "0892mg", "name": "Shifours Mille Poings Gigamax" },
    { "code": "0892f", "name": "Shifours Poing Final" },
    { "code": "0892fg", "name": "Shifours Poing Final Gigamax" },
    { "code": "0902f", "name": "Paragruel Femelle" },
    { "code": "0902m", "name": "Paragruel Mâle" },

    // 9G
    { "code": "0128p", "name": "Tauros de Paldea" },
    { "code": "0128f", "name": "Tauros de Paldea Feu" },
    { "code": "0128w", "name": "Tauros de Paldea Eau" },
    { "code": "0099g", "name": "Krabboss Gigamax" },
    { "code": "0194p", "name": "Axoloto de Paldea" },
    { "code": "0964f", "name": "Superdofin forme Super" },
    { "code": "0978c", "name": "Nigirigon forme Courbée" },
    { "code": "0978a", "name": "Nigirigon forme Affalée" },
    { "code": "0978r", "name": "Nigirigon forme Raide" },
    { "code": "1017t", "name": "Ogerpon au Masque Turquoise" },
    { "code": "1017w", "name": "Ogerpon au Masque du Puits" },
    { "code": "1017h", "name": "Ogerpon au Masque du Fourneau" },
    { "code": "1017c", "name": "Ogerpon au Masque de la Pierre" },
  ];

  const specialCasesMap = new Map(specialCases.map(item => [item.name, item.code]));
  twitchService.addOnMessage(
    async (msg, context) => {
      if (context.username === process.env.TWITCH_CHANNEL_NAME) {
        const match = msg.match(fishingRegex);

        if (match) {
          const capturedCatch = match[2];

          let finalFish = {
            username : match[1].toLowerCase(), 
            weight : match[3],
            value : match[4],
            date : new Date().toISOString(),
            code : '', 
            shiny : false
          };

          finalFish.shiny = capturedCatch.includes('(Shiny)');

          // On extrait le nom du poisson (tout ce qui est après " - " et avant " (shiny)")
          const namePartMatch = capturedCatch.match(/ - (.*?)(?:\s\(Shiny\))?$/);

          if (namePartMatch) {
            const fishName = namePartMatch[1]; // ex: "Sancoki Mer Orient"

            // On regarde si ce nom est un cas spécial
            if (specialCasesMap.has(fishName)) {
              // Si oui, on prend le code spécial
              finalFish.code = specialCasesMap.get(fishName);
            } else {
              // Si non, on applique la logique normale pour extraire l'ID numérique
              const idMatch = capturedCatch.match(/(\d+)/);
              if (idMatch) {
                finalFish.code = idMatch[1];
              }
            }
          }

          try {
            const res = await fetch(`${process.env.API_URL}/api/users/catch`, {
              method: 'POST',
              body: JSON.stringify(finalFish),
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
              }
            });
            if (!res.ok) throw new Error('Erreur API');
            const result = await res.json()
            result.achievements.forEach(achievement => {
              twitchService.say(`Ding dong @${match[1]}, tu as réussi le succès #${achievement.number} : ${achievement.name} - ${achievement.description} (${achievement.value} points)`);
            });
          } catch (error) {
            console.error(error);
          }
        }
      }
    }
  )
})();

