const UserCatch = require('../models/UserCatch');
const User = require('../models/User');
const { getStartOfToday, getStartOfWeek, getStartOfMonth } = require('../utils/date');

const getBestCatch = (catches, field) => catches.reduce(
  (best, current) => best === null || current[field] > best[field] ? current : best,
  null
);

exports.getCatches = async (req, res) => {
  try {
    const catches = await UserCatch.find({});

    res.json(catches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.getLastCatches = async (req, res) => {
  try {
    const catches = await UserCatch.find({});

    const debutJour = getStartOfToday();
    const debutSemaine = getStartOfWeek();
    const debutMois = getStartOfMonth();

    const capturesJour = catches.filter(c => c.date >= debutJour);
    const capturesSemaine = catches.filter(c => c.date >= debutSemaine);
    const capturesMois = catches.filter(c => c.date >= debutMois);
    const dernieresCaptures = [...catches]
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
    const meilleures = {
      jour: {
        weight: getBestCatch(capturesJour, 'weight'),
        value: getBestCatch(capturesJour, 'value')
      },
      semaine: {
        weight: getBestCatch(capturesSemaine, 'weight'),
        value: getBestCatch(capturesSemaine, 'value')
      },
      mois: {
        weight: getBestCatch(capturesMois, 'weight'),
        value: getBestCatch(capturesMois, 'value')
      }
    };
    const records = [
      ...dernieresCaptures,
      ...Object.values(meilleures).flatMap(period => Object.values(period).filter(Boolean))
    ];
    const usernames = [...new Set(records.map(catchItem => catchItem.username))];
    const users = await User.find({ _id: { $in: usernames } }).select('_id displayName').lean();
    const displayNames = new Map(users.map(user => [user._id, user.displayName || user._id]));
    const includeDisplayName = catchItem => catchItem
      ? { ...catchItem.toObject(), displayName: displayNames.get(catchItem.username) || catchItem.username }
      : null;

    res.json({
        dernieres: dernieresCaptures.map(includeDisplayName),
        meilleures: Object.fromEntries(
          Object.entries(meilleures).map(([period, metrics]) => [
            period,
            Object.fromEntries(Object.entries(metrics).map(([metric, catchItem]) => [metric, includeDisplayName(catchItem)]))
          ])
        )
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}