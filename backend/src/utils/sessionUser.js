const toSessionUser = user => ({
  id: user.id,
  full_name: user.full_name,
  avatar_url: user.avatar_url ?? null,
  role: user.role,
});

module.exports = { toSessionUser };
