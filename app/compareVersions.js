const toNum = (v) => { const n = Number(v); return Number.isNaN(n) ? 0 : n; };

module.exports = (v1, v2) => {
  const v1Parts = v1.split('.');
  const v2Parts = v2.split('.');

  for (let i = 0; i < 3; i += 1) {
    const s1 = toNum(v1Parts[i]);
    const s2 = toNum(v2Parts[i]);

    if (s1 > s2) {
      return -1;
    }
    if (s1 < s2) {
      return 1;
    }
  }

  return 0;
};
