export const STATUS = {
  DETECTED: "detected",
  ESTIMATED: "estimated",
  UNAVAILABLE: "unavailable",
};

export function detected(label, value) {
  return { label, value, status: STATUS.DETECTED };
}

export function estimated(label, value, note) {
  return { label, value, status: STATUS.ESTIMATED, note };
}

export function unavailable(label, note) {
  return { label, value: "Not exposed by browser", status: STATUS.UNAVAILABLE, note };
}
