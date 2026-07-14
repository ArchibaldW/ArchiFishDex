const UserCatch = require('../models/UserCatch');
const { getStartOfToday, getStartOfWeek, getStartOfMonth } = require('../utils/date');

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

    res.json({
        jour: capturesJour,
        semaine: capturesSemaine,
        mois: capturesMois
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}