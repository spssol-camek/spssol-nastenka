const object = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value, maximum) => typeof value === 'string' && value.trim() && value.length <= maximum;
const date = value => text(value, 50) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

export function validateExams(value) {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Neplatný seznam písemek.');
  const ids = new Set();
  return value.map(exam => {
    if (!object(exam) || !text(exam.id, 100) || !/^[a-z0-9-]+$/.test(exam.id) || ids.has(exam.id) || !text(exam.title, 250) || !date(exam.startsAt) || !date(exam.endsAt) || Date.parse(exam.endsAt) <= Date.parse(exam.startsAt)) throw new Error('Neplatný termín písemky.');
    ids.add(exam.id);
    return { id: exam.id, title: exam.title.trim(), startsAt: exam.startsAt, endsAt: exam.endsAt };
  });
}

export function activeExam(exams, now = new Date()) {
  const time = now.getTime();
  return exams.find(exam => Date.parse(exam.startsAt) <= time && time < Date.parse(exam.endsAt));
}

export function examCountdown(exam, now = new Date()) {
  const seconds = Math.max(0, Math.ceil((Date.parse(exam.endsAt) - now.getTime()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
