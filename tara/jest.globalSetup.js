// Day boundaries depend on the time zone; pin it so tests behave the same on every machine.
module.exports = () => {
  process.env.TZ = 'Asia/Manila';
};
