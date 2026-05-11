const Mixtape = require('../models/Mixtape');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O,0,1,I confusion

const generate = () => {
  let code = 'MX-';
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
};

// Keep generating until unique (collision near-impossible at small scale)
const uniqueCode = async () => {
  let code, exists;
  do {
    code = generate();
    exists = await Mixtape.findOne({ code });
  } while (exists);
  return code;
};

module.exports = { uniqueCode };