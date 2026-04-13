const userService = require('../services/userService');

async function getProfile(req, res) {
  try {
    const profile = await userService.getUserProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le profil utilisateur' });
  }
}

module.exports = {
  getProfile
};
