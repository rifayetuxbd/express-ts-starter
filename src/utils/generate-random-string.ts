import { getRandomValues } from 'crypto';

export const generateRandomString = (
  length: number,
  numberOnly: boolean = false,
) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const numbers = '0123456789';
  const characterSet = numberOnly ? numbers : chars;

  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(
      (getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) *
        characterSet.length,
    );
    result += characterSet[randomIndex];
  }
  return result;
};
