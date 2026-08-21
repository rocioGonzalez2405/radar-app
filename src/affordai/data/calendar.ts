/**
 * The dataset's clock.
 *
 * Lives on its own so that both the generator and the authored hero ledgers can
 * read it without importing each other — households.ts already imports heroes.ts
 * to inject the hero records, so heroes.ts must not import back.
 */

/**
 * Twenty-four months of ledger per household, ending in the present month.
 *
 * The proposal asks for twelve to twenty-four months of coherent behaviour, and
 * the upper end is what the risk model needs: a twelve-month rent trend and a
 * six-month income trend both have to fit inside the window with room to spare.
 */
export const HISTORY_MONTHS = 24

/** The console's present. Matches the "verified through August 2026" badge. */
export const CURRENT_MONTH = '2026-08'

/** `YYYY-MM` labels, oldest first, ending at CURRENT_MONTH. */
export const historyMonths = (count = HISTORY_MONTHS): string[] => {
  const [endYear, endMonth] = CURRENT_MONTH.split('-').map(Number)
  const labels: string[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const zeroBased = endYear * 12 + (endMonth - 1) - offset
    labels.push(
      `${Math.floor(zeroBased / 12)}-${String((zeroBased % 12) + 1).padStart(2, '0')}`,
    )
  }
  return labels
}

/** `2026-08` reads as `Aug 2026` on an axis. */
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const formatMonth = (month: string): string => {
  const [year, index] = month.split('-').map(Number)
  return `${MONTH_NAMES[index - 1]} ${year}`
}
