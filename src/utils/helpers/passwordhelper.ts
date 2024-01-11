import * as argon2 from 'argon2';
import * as crypto from 'crypto';

function generateRandomSalt(length: number) {
  return crypto.randomBytes(length).toString('hex');
}

async function hashPassword(password: string) {
  try {
    const salt = generateRandomSalt(16);
    const hashedPassword = await argon2.hash(password, {
      salt: Buffer.from(salt, 'hex'),
      type: argon2.argon2id,
      hashLength: 32,
    });
    const combinedPassword = hashedPassword + salt;
    return combinedPassword;
  } catch (err) {
    throw new Error('Error while hashing password' + err);
  }
}
async function verifyPassword(storedPassword: string, inputPassword: string) {
  try {
    const salt = storedPassword.slice(-32);
    const actualPassword = storedPassword.slice(0, -32);
    const passwordMatched = await argon2.verify(actualPassword.normalize(), inputPassword, {
      salt: Buffer.from(salt, 'hex'),
      type: argon2.argon2id,
      hashLength: 32,
    });
    return passwordMatched;
  } catch (err) {
    throw new Error('Error while verifying password :' + err);
  }
}

export {hashPassword, verifyPassword, generateRandomSalt};
