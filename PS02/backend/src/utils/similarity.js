'use strict';

function levenshtein(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_value, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function ratio(left, right) {
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  return 1 - levenshtein(left, right) / Math.max(left.length, right.length);
}

function tokenSort(left, right) {
  const sortTokens = (value) => value.split(/\s+/).filter(Boolean).sort().join(' ');
  return ratio(sortTokens(left), sortTokens(right));
}

function tokenSet(left, right) {
  const leftTokens = new Set(left.split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.split(/\s+/).filter(Boolean));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).sort();
  if (!intersection.length) return 0;
  const leftOnly = [...leftTokens].filter((token) => !rightTokens.has(token)).sort();
  const rightOnly = [...rightTokens].filter((token) => !leftTokens.has(token)).sort();
  const common = intersection.join(' ');
  return Math.max(
    ratio(common, [...intersection, ...leftOnly].join(' ')),
    ratio(common, [...intersection, ...rightOnly].join(' ')),
  );
}

function nameSimilarity(left, right) {
  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const a = normalize(left);
  const b = normalize(right);
  return Math.max(ratio(a, b), tokenSort(a, b), tokenSet(a, b));
}

module.exports = { levenshtein, nameSimilarity, ratio, tokenSet, tokenSort };