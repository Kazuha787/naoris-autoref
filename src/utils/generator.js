function generateDeviceHash() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

module.exports = { generateDeviceHash };
