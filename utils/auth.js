const { hash, compare } = require("bcryptjs");

async function hashdPassword(password) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}

async function vrifyPassword(password, hashedPassword) {
  const vrifyPassword = await compare(password, hashedPassword);
  return vrifyPassword;
}
export { hashdPassword, vrifyPassword };
