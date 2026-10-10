const mongoose = require('mongoose');
const Catch = require('../models/Catch');
const User = require('../models/User');
const UserCatch = require('../models/UserCatch');
const Achievement = require('../models/Achievement');
const numbers = require('../utils/numbers.js');
const checkAchievements = require('../utils/checkAchievements.js')

exports.getUserPokedex = async (req, res) => {
  try {
    const { username, global } = req.query;
    const isGlobal = global === 'true';
    const targetUsername = username || req.user.username;

    const [catches, stats] = await Promise.all([
      Catch.find({}).lean(),
      UserCatch.aggregate([
        ...(!isGlobal ? [{ $match: { username: targetUsername } }] : []),
        {
          $group: {
            _id: { code: "$code", shiny: "$shiny" },
            count: { $sum: 1 },
            maxValue: { $max: "$value" }
          }
        }
      ])
    ]);

    const normalData = new Map();
    const shinyData = new Map();

    stats.forEach(s => {
      const targetMap = s._id.shiny ? shinyData : normalData;
      targetMap.set(s._id.code, {
        count: s.count,
        maxValue: s.maxValue
      });
    });

    const pokedex = catches.map(p => {
      const normal = normalData.get(p.code) || { count: 0, maxValue: 0 };
      const shiny = shinyData.get(p.code) || { count: 0, maxValue: 0 };

      return {
        ...p,
        countNormal: normal.count,
        maxWeightNormal: normal.maxValue,
        countShiny: shiny.count,
        maxWeightShiny: shiny.maxValue,
        caughtNormal: normal.count > 0,
        caughtShiny: shiny.count > 0
      };
    });

    return res.status(200).json(pokedex);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

exports.getPokedexUsers = async (req, res) => {
  try {
    const usernames = await UserCatch.distinct('username');
    const users = await User.find({ _id: { $in: usernames } }).select('_id displayName').lean();
    const displayNames = new Map(users.map(user => [user._id, user.displayName || user._id]));
    const pokedexUsers = usernames
      .map(username => ({
        username,
        displayName: displayNames.get(username) || username
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));

    return res.status(200).json(pokedexUsers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

exports.getUserProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const [user, firstCatch, lastCatch, bestValueCatch, bestWeightCatch, titleAchievements, catchCounts] = await Promise.all([
      User.findById(username).select('displayName favoritePokemonCode favoritePokemonShiny achievements selectedTitleAchievementNumber').lean(),
      UserCatch.findOne({ username }).sort({ date: 1 }).select('date').lean(),
      UserCatch.findOne({ username }).sort({ date: -1 }).select('date').lean(),
      UserCatch.findOne({ username }).sort({ value: -1, date: 1 }).select('code shiny value').lean(),
      UserCatch.findOne({ username }).sort({ weight: -1, date: 1 }).select('code shiny weight').lean(),
      Achievement.find({ title: { $exists: true, $nin: [null, ''] } }).select('number title').lean(),
      UserCatch.aggregate([
        { $match: { username } },
        { $group: { _id: { code: '$code', shiny: '$shiny' }, count: { $sum: 1 } } },
        { $sort: { count: -1, '_id.code': 1 } }
      ])
    ]);

    if (!user || !firstCatch) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const unlockedNumbers = new Set((user.achievements || []).map(achievement => achievement.number));
    const unlockedTitles = titleAchievements
      .filter(achievement => unlockedNumbers.has(achievement.number))
      .map(({ number, title }) => ({ achievementNumber: number, title }));
    const selectedTitle = unlockedTitles.find(
      title => title.achievementNumber === user.selectedTitleAchievementNumber
    ) || null;
    const mostCaughtNormal = catchCounts.find(catchCount => !catchCount._id.shiny) || null;
    const mostCaughtShiny = catchCounts.find(catchCount => catchCount._id.shiny) || null;

    return res.status(200).json({
      username,
      displayName: user.displayName || username,
      favoritePokemonCode: user.favoritePokemonCode || null,
      favoritePokemonShiny: user.favoritePokemonShiny === true,
      firstCatchDate: firstCatch.date,
      lastCatchDate: lastCatch.date,
      bestValueCatch,
      bestWeightCatch,
      mostCaughtNormal: mostCaughtNormal
        ? { code: mostCaughtNormal._id.code, count: mostCaughtNormal.count }
        : null,
      mostCaughtShiny: mostCaughtShiny
        ? { code: mostCaughtShiny._id.code, count: mostCaughtShiny.count, shiny: true }
        : null,
      selectedTitle,
      unlockedTitles
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

exports.updateUserProfile = async (req, res) => {
  try {
    const { displayName, achievementNumber, favoritePokemonCode, favoritePokemonShiny } = req.body;
    const normalizedDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
    if (!normalizedDisplayName || normalizedDisplayName.length > 32) {
      return res.status(400).json({ error: 'Le nom d’affichage doit contenir entre 1 et 32 caractères.' });
    }

    if (favoritePokemonCode !== undefined && favoritePokemonCode !== null && typeof favoritePokemonCode !== 'string') {
      return res.status(400).json({ error: 'Pokémon préféré invalide.' });
    }
    if (favoritePokemonShiny !== undefined && typeof favoritePokemonShiny !== 'boolean') {
      return res.status(400).json({ error: 'Forme du Pokémon préféré invalide.' });
    }

    if (achievementNumber !== null && (!Number.isInteger(achievementNumber) || achievementNumber <= 0)) {
      return res.status(400).json({ error: 'Numéro de succès invalide.' });
    }

    const user = await User.findById(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const nextFavoritePokemonCode = favoritePokemonCode === undefined
      ? user.favoritePokemonCode || null
      : favoritePokemonCode;
    const nextFavoritePokemonShiny = nextFavoritePokemonCode === null
      ? false
      : favoritePokemonShiny === undefined
        ? user.favoritePokemonShiny === true
        : favoritePokemonShiny;
    if (nextFavoritePokemonCode !== null && !await Catch.exists({ code: nextFavoritePokemonCode })) {
      return res.status(400).json({ error: 'Ce Pokémon ne fait pas partie du Pokédex.' });
    }

    let selectedTitle = null;
    if (achievementNumber !== null) {
      const isUnlocked = (user.achievements || []).some(item => item.number === achievementNumber);
      const achievement = await Achievement.findOne({
        number: achievementNumber,
        title: { $exists: true, $nin: [null, ''] }
      }).select('number title').lean();

      if (!achievement || !isUnlocked) {
        return res.status(400).json({ error: 'Ce titre n’a pas été débloqué.' });
      }

      selectedTitle = {
        achievementNumber: achievement.number,
        title: achievement.title
      };
    }

    user.displayName = normalizedDisplayName;
    user.favoritePokemonCode = nextFavoritePokemonCode;
    user.favoritePokemonShiny = nextFavoritePokemonShiny;
    user.selectedTitleAchievementNumber = achievementNumber;
    await user.save();

    return res.status(200).json({
      displayName: user.displayName,
      favoritePokemonCode: user.favoritePokemonCode,
      favoritePokemonShiny: user.favoritePokemonShiny,
      selectedTitle
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

exports.getUserStatistics = async (req, res) => {
  try {
    const username = req.user.username;

    const [userCatches, catches] = await Promise.all([
      UserCatch.find({ username }).lean(),
      Catch.find({}).lean()
    ]);

    if (!userCatches || userCatches.length === 0) {
      return res.status(200).json({ global: { total: catches.length, caughtNormal: 0, caughtShiny: 0 }, generations: [], types: [], tags: [] });
    }

    const normalSet = new Set(userCatches.filter(c => !c.shiny).map(c => c.code));
    const shinySet = new Set(userCatches.filter(c => c.shiny).map(c => c.code));

    const statsGlobal = {
      total: catches.length,
      caughtNormal: normalSet.size,
      caughtShiny: shinySet.size
    };

    // --- Générations ---
    const genMaps = catches.reduce((acc, pokemon) => {
      if (!acc[pokemon.gen]) acc[pokemon.gen] = new Set();
      acc[pokemon.gen].add(pokemon.code);
      return acc;
    }, {});

    const statsByGen = Object.keys(genMaps).sort((a, b) => a - b).map(gen => {
      const genSet = genMaps[gen];
      return {
        gen: Number(gen),
        total: genSet.size,
        caughtNormal: [...normalSet].filter(code => genSet.has(code)).length,
        caughtShiny: [...shinySet].filter(code => genSet.has(code)).length
      };
    });

    // --- Types ---
    const typeMaps = catches.reduce((acc, pokemon) => {
      const types = [pokemon.type1, pokemon.type2].filter(Boolean);
      types.forEach(type => {
        if (!acc[type]) acc[type] = new Set();
        acc[type].add(pokemon.code);
      });
      return acc;
    }, {});

    const statsByType = Object.keys(typeMaps).sort().map(type => {
      const typeSet = typeMaps[type];
      return {
        type,
        total: typeSet.size,
        caughtNormal: [...normalSet].filter(code => typeSet.has(code)).length,
        caughtShiny: [...shinySet].filter(code => typeSet.has(code)).length
      };
    });

    // --- Tags ---
    const tagMaps = catches.reduce((acc, p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(tag => {
          if (!acc[tag]) acc[tag] = new Set();
          acc[tag].add(p.code);
        });
      }
      return acc;
    }, {});
    
    const statsByTags = Object.keys(tagMaps).sort().map(tag => {
      const tagSet = tagMaps[tag];
      return {
        tag,
        total: tagSet.size,
        caughtNormal: [...normalSet].filter(code => tagSet.has(code)).length,
        caughtShiny: [...shinySet].filter(code => tagSet.has(code)).length
      };
    });

    return res.status(200).json({
      global: statsGlobal,
      generations: statsByGen,
      types: statsByType,
      tags: statsByTags
    });
  } catch (err) {
    console.error("Erreur stats:", err);
    return res.status(500).json({ error: err.message });
  }
}

exports.getUserAchievements = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.username }).lean();
    if (!user) {
      return res.status(404).json({ error: "Vous n'avez encore rien pêché" });
    }

    const [achievements, totalUsersWithAchievements, achievementStats] = await Promise.all([
      Achievement.find({}).sort({ number: 1 }).lean(),
      
      User.countDocuments({ 'achievements.0': { $exists: true } }),
      
      User.aggregate([
        { $match: { 'achievements.0': { $exists: true } } },
        { $unwind: "$achievements" },
        { $group: { _id: "$achievements.number", count: { $sum: 1 } } }
      ])
    ]);

    const achievementCounts = new Map(
      achievementStats.map(stat => [stat._id, stat.count])
    );

    const userAchievementsMap = new Map(
      (user.achievements || []).map(a => [a.number, a.date])
    );

    const enrichedAchievements = achievements.map(achievement => {
      const globalCount = achievementCounts.get(achievement.number) || 0;
      const unlocked = userAchievementsMap.has(achievement.number);
      
      return {
        ...achievement,
        hasTitle: Boolean(achievement.title),
        title: unlocked ? achievement.title || null : null,
        unlocked,
        date: userAchievementsMap.get(achievement.number) || null,
        
        percentage: totalUsersWithAchievements > 0 
          ? Math.round((globalCount / totalUsersWithAchievements) * 100) 
          : 0
      };
    });

    return res.status(200).json({ 
      achievements: enrichedAchievements, 
      totalPoints: user.achievementsPoints || 0 
    });

  } catch (err) {
    console.error("Erreur lors de la récupération des succès:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getLeaderboards = async (req, res) => {
  try {
    const excludedUser = "archibaldwirslayd";

    const [totalCatchesRaw, uniqueCatchesRaw, achievementsRaw, achievementPointsRaw] = await Promise.all([
      
      // Leaderboard 1: Total catches
      UserCatch.aggregate([
        { $match: { username: { $ne: excludedUser } } },
        { $group: { _id: "$username", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]),

      // Leaderboard 2: Unique catches
      UserCatch.aggregate([
        { $match: { username: { $ne: excludedUser } } },
        { $group: { _id: "$username", uniqueCodes: { $addToSet: "$code" } } },
        { $project: { _id: 1, unique: { $size: "$uniqueCodes" } } },
        { $sort: { unique: -1 } },
        { $limit: 10 }
      ]),

      // Leaderboard 3: Achievements count
      User.aggregate([
        { $match: { _id: { $ne: excludedUser } } },
        { $project: { _id: 1, count: { $size: { $ifNull: ["$achievements", []] } } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Leaderboard 4: Achievement points
      User.aggregate([
        { $match: { _id: { $ne: excludedUser } } },
        { $project: { _id: 1, points: { $ifNull: ["$achievementsPoints", 0] } } },
        { $sort: { points: -1 } },
        { $limit: 10 }
      ])
    ]);

    const formatLeaderboard = (data) => 
      data.map((entry, index) => {
        const { _id, ...rest } = entry;
        return {
          rank: index + 1,
          username: _id,
          ...rest
        };
      });

    const leaderboards = {
      totalCatches: formatLeaderboard(totalCatchesRaw),
      uniqueCatches: formatLeaderboard(uniqueCatchesRaw),
      achievements: formatLeaderboard(achievementsRaw),
      achievementPoints: formatLeaderboard(achievementPointsRaw)
    };
    const usernames = [...new Set(
      Object.values(leaderboards).flatMap(board => board.map(entry => entry.username))
    )];
    const users = await User.find({ _id: { $in: usernames } }).select('_id displayName').lean();
    const displayNames = new Map(users.map(user => [user._id, user.displayName || user._id]));

    return res.status(200).json({
      totalCatches: leaderboards.totalCatches.map(entry => ({
        ...entry,
        displayName: displayNames.get(entry.username) || entry.username
      })),
      uniqueCatches: leaderboards.uniqueCatches.map(entry => ({
        ...entry,
        displayName: displayNames.get(entry.username) || entry.username
      })),
      achievements: leaderboards.achievements.map(entry => ({
        ...entry,
        displayName: displayNames.get(entry.username) || entry.username
      })),
      achievementPoints: leaderboards.achievementPoints.map(entry => ({
        ...entry,
        displayName: displayNames.get(entry.username) || entry.username
      }))
    });
    
  } catch (err) {
    console.error("Erreur lors de la génération des leaderboards:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.addUserCatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const catchData = {
      ...req.body,
      weight: numbers.parseNumericValue(req.body.weight),
      value: numbers.parseNumericValue(req.body.value)
    };

    if (catchData.weight === null || catchData.value === null) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid numeric fields for weight or value' });
    }

    const newCatch = new UserCatch(catchData);
    await newCatch.save({ session })

    
    const username = catchData.username;
    let user = await User.findOne({_id : username}).session(session);

    if(!user) {
      user = new User({
        _id: username
      })
    }

    const {achievementsOwned, user : newUser} = await checkAchievements(user, session)

    await newUser.save({ session })

    await session.commitTransaction();
    
    return res.status(201).json({achievements : achievementsOwned})
  } catch (err) {
    await session.abortTransaction();
    console.log(err)
    return res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
}