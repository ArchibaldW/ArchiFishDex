const mongoose = require('mongoose');
const Catch = require('../models/Catch');
const User = require('../models/User');
const UserCatch = require('../models/UserCatch');
const Achievement = require('../models/Achievement');
const checkAchievements = require('../utils/checkAchievements.js')

exports.getUserPokedex = async (req, res) => {
  try {
    const [userCatches, catches] = await Promise.all([
      UserCatch.find({ username: req.user.username }).lean(),
      Catch.find({}).lean()
    ]);

    const normalCounts = new Map();
    const shinyCounts = new Map();

    userCatches.forEach(c => {
      const targetMap = c.shiny ? shinyCounts : normalCounts;
      const currentCount = targetMap.get(c.code) || 0;
      targetMap.set(c.code, currentCount + 1);
    });

    const pokedex = catches.map(
      p => (
        {
          ...p,
          countNormal: normalCounts.get(p.code) || 0,
          countShiny: shinyCounts.get(p.code) || 0,

          caughtNormal: normalCounts.has(p.code),
          caughtShiny: shinyCounts.has(p.code)
        }
      )
    );

    return res.status(200).json(pokedex);
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

    // 5. Assemblage final
    const enrichedAchievements = achievements.map(achievement => {
      const globalCount = achievementCounts.get(achievement.number) || 0;
      
      return {
        ...achievement,
        unlocked: userAchievementsMap.has(achievement.number),
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

    return res.status(200).json({
      totalCatches: formatLeaderboard(totalCatchesRaw),
      uniqueCatches: formatLeaderboard(uniqueCatchesRaw),
      achievements: formatLeaderboard(achievementsRaw),
      achievementPoints: formatLeaderboard(achievementPointsRaw)
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
    const catchData = req.body;
    const username = catchData.username;

    let user = await User.findOne({_id : username}).session(session);

    if(!user) {
      user = new User({
        _id: username
      })
    }

    const {achievementsOwned, user : newUser} = await checkAchievements(user, session)
    
    const newCatch = new UserCatch(catchData);

    await newUser.save({ session })
    await newCatch.save({ session })

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