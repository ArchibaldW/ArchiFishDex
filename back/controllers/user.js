const Catch = require('../models/Catch');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const checkAchievements = require('../utils/checkAchievements.js')

exports.getUserPokedex = async (req, res) => {
  try {
    const user = await User.findOne({_id: req.user.username});
    if (!user){
      return res.status(404).json({error : "Vous n'avez encore rien pêché"})
    }

    const catches = await Catch.find({}).lean();

    const normalCounts = new Map();
    const shinyCounts = new Map();

    user.catches.forEach(c => {
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
    const user = await User.findOne({_id: req.user.username});
    if (!user){
      return res.status(404).json({error : "Vous n'avez encore rien pêché"})
    }

    const catches = await Catch.find({}).lean();
    const normalSet = new Set(user.catches.filter(c => !c.shiny).map(c => c.code));
    const shinySet = new Set(user.catches.filter(c => c.shiny).map(c => c.code));

    const statsGlobal = {
      total : catches.length,
      caughtNormal : normalSet.size,
      caughtShiny : shinySet.size
    };

    // Generations
    const generations = [...new Set(catches.map(c => c.gen))].sort((a, b) => a - b);

    const genMaps = catches.reduce((acc, pokemon) => {
        if (!acc[pokemon.gen]) {
            acc[pokemon.gen] = new Set();
        }
        acc[pokemon.gen].add(pokemon.code);
        return acc;
    }, {});

    const statsByGen = generations.map(gen => {
        const genSet = genMaps[gen];
        
        return {
            gen,
            total: genSet.size,
            caughtNormal: [...normalSet].filter(code => genSet.has(code)).length,
            caughtShiny: [...shinySet].filter(code => genSet.has(code)).length
        };
    });


    // Types
    const types = [...new Set(
      catches.flatMap(c => [c.type1, c.type2].filter(Boolean))
    )].sort();

    const typeMaps = catches.reduce((acc, pokemon) => {
        const types = [pokemon.type1, pokemon.type2].filter(Boolean);
        
        types.forEach(type => {
            if (!acc[type]) acc[type] = new Set();
            acc[type].add(pokemon.code);
        });
        
        return acc;
    }, {});

    const statsByType = types.map(type => {
        const typeSet = typeMaps[type];
        
        return {
            type,
            total: typeSet.size,
            caughtNormal: [...normalSet].filter(code => typeSet.has(code)).length,
            caughtShiny: [...shinySet].filter(code => typeSet.has(code)).length
        };
    });


    // Tags
    const tags = [...new Set(
      catches.flatMap(c => c.tags || [])
    )].sort();

    const tagMaps = catches.reduce((acc, p) => {
        if (Array.isArray(p.tags)) {
            p.tags.forEach(tag => {
                if (!acc[tag]) acc[tag] = new Set();
                acc[tag].add(p.code);
            });
        }
        return acc;
    }, {});
    
    const statsByTags = tags.map(tag => {
        const tagSet = tagMaps[tag];
            
        return {
            tag,
            total: tagSet.size,
            caughtNormal: [...normalSet].filter(code => tagSet.has(code)).length,
            caughtShiny: [...shinySet].filter(code => tagSet.has(code)).length
        };
    });

    return res.status(200).json({
      global : statsGlobal,
      generations : statsByGen,
      types : statsByType,
      tags : statsByTags
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

exports.getUserAchievements = async (req, res) => {
  try {
    const user = await User.findOne({_id: req.user.username});
    if (!user){
      return res.status(404).json({error : "Vous n'avez encore rien pêché"})
    }

    const users = await User.find({}).lean();

    const achievements = await Achievement.find({}).lean();
    achievements.sort((a, b) => a.number - b.number);

    const usersWithAchievements = users.filter(u => u.achievements && u.achievements.length > 0);
    const totalUsersWithAchievements = usersWithAchievements.length;

    const achievementCounts = new Map();
    usersWithAchievements.forEach(u => {
      u.achievements.forEach(achievement => {
        const count = achievementCounts.get(achievement.number) || 0;
        achievementCounts.set(achievement.number, count + 1);
      });
    });

    user.achievements.forEach(element => {
      achievements[element.number - 1].unlocked = true;
      achievements[element.number - 1].date = element.date;
    });

    achievements.forEach(achievement => {
      const count = achievementCounts.get(achievement.number) || 0;
      achievement.percentage = totalUsersWithAchievements > 0 
        ? Math.round((count / totalUsersWithAchievements) * 100) 
        : 0;
    });

    achievements.sort((a, b) => a.number - b.number)

    return res.status(200).json({ achievements, totalPoints: user.achievementsPoints });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

exports.getLeaderboards = async (req, res) => {
  try {
    const users = await User.find({}).lean();

    // Leaderboard 1: Total catches
    const totalCatches = users
      .map(user => ({
        username: user._id,
        total: user.catches ? user.catches.length : 0
      }))
      .filter(user => user.username !== "archibaldwirslayd")
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    // Leaderboard 2: Unique catches
    const uniqueCatches = users
      .map(user => {
        const uniqueCodes = new Set(user.catches ? user.catches.map(c => c.code) : []);
        return {
          username: user._id,
          unique: uniqueCodes.size
        };
      })
      .filter(user => user.username !== "archibaldwirslayd")
      .sort((a, b) => b.unique - a.unique)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    // Leaderboard 3: Achievements count
    const achievements = users
      .map(user => ({
        username: user._id,
        count: user.achievements ? user.achievements.length : 0
      }))
      .filter(user => user.username !== "archibaldwirslayd")
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    // Leaderboard 4: Achievement points
    const achievementPoints = users
      .map(user => ({
        username: user._id,
        points: user.achievementsPoints || 0
      }))
      .filter(user => user.username !== "archibaldwirslayd")
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    return res.status(200).json({
      totalCatches,
      uniqueCatches,
      achievements,
      achievementPoints
    });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err.message });
  }
}


exports.addUserCatch = async (req, res) => {
  try {
    const { pseudo, catch: catchData } = req.body;
    let user = await User.findOne({_id : pseudo});

    if(!user) {
      user = new User({
        _id: pseudo,
        catches: [catchData]
      })
    } else {
      user.catches.push(catchData)
    }

    const {achievementsOwned, user : newUser} = await checkAchievements(user)

    await newUser.save()
    return res.status(201).json({achievements : achievementsOwned})
  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err.message });
  }
}