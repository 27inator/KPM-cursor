const crypto = require('crypto');
const ALGO = 'aes-256-gcm';
const KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32); // 32 bytes

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

function decrypt(data) {
  const [ivHex, tagHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

module.exports = { encrypt, decrypt }; 