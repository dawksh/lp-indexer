
export const abbreviateNumbers = (num: number) =>
  Math.abs(num) >= 1e12
    ? (num / 1e12).toFixed(2).replace(/\.00$/, "") + "T"
    : Math.abs(num) >= 1e9
    ? (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B"
    : Math.abs(num) >= 1e6
    ? (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M"
    : Math.abs(num) >= 1e3
    ? (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K"
    : num.toString();
