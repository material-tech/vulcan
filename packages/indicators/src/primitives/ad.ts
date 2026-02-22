import { fp18 } from '@vulcan-js/core'

/**
 * Create an accumulation/distribution processor.
 *
 * MFM = ((C - L) - (H - C)) / (H - L)
 * MFV = MFM * Volume
 * AD = Previous AD + MFV
 */
export function ad(): (h: bigint, l: bigint, c: bigint, v: bigint) => bigint {
  let prevAD = fp18.ZERO

  return (h: bigint, l: bigint, c: bigint, v: bigint): bigint => {
    const range = h - l
    // When high equals low, the range is zero and MFM is undefined; treat as 0
    const mfm = range === fp18.ZERO
      ? fp18.ZERO
      : fp18.div((c - l) - (h - c), range)
    const mfv = fp18.mul(mfm, v)
    prevAD += mfv
    return prevAD
  }
}
