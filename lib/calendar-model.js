import {sharedHolidayPlan} from './shared-holidays.js';

export const MODEL_ID = 'calendario-modelo';

export function nationalDates(year) {
  // Calendário gregoriano. A Paixão de Cristo ocorre dois dias antes da Páscoa.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30;
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - c % 4) % 7;
  const easter = h + l - 7 * Math.floor((a + 11 * h + 22 * l) / 451) + 114;
  const friday = new Date(Date.UTC(year, Math.floor(easter / 31) - 1, easter % 31 - 1));
  return Object.fromEntries([
    ['01-01', 'Confraternização Universal'],
    [friday.toISOString().slice(5, 10), 'Paixão de Cristo'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia Mundial do Trabalho'],
    ['09-07', 'Independência do Brasil'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ...(year >= 2024 ? [['11-20', 'Dia Nacional de Zumbi e da Consciência Negra']] : []),
    ['12-25', 'Natal']
  ].map(([date, name]) => [year + '-' + date, name]));
}

export function changeModel(model, body) {
  const dates = {...model.dates};
  const generated = new Set(model.generated);
  if (body.op === 'calendar_model_generate') {
    const year = Number(body.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2199) throw Error('Informe um ano entre 2000 e 2199.');
    if (!generated.has(year)) {
      for (const [date, name] of Object.entries(nationalDates(year))) dates[date] ??= name;
      generated.add(year);
    }
  } else {
    const {date, name} = sharedHolidayPlan([], body.date, body.op === 'calendar_model_delete' ? 'Excluir' : body.name);
    if (body.previous && body.previous !== date) {
      if (!Object.hasOwn(dates, body.previous)) throw Error('A data original não está no modelo.');
      if (Object.hasOwn(dates, date)) throw Error('Já existe uma data no modelo nesse dia.');
      delete dates[body.previous];
    }
    if (body.op === 'calendar_model_delete') delete dates[date];
    else dates[date] = name;
  }
  return {dates, generated: [...generated].sort()};
}

export function applyModel(data, previous, model) {
  const state = data.state;
  if (!state?.cfg) return data;
  const days = {...state.days};
  const originals = {};
  const saved = previous?.modelOriginals || {};
  const active = ([date]) => date >= state.cfg.inicio && date <= state.cfg.termino && state.reg?.[date]?.dado !== 'sim';
  const entries = Object.entries(model?.dates || {}).filter(active);
  if (!entries.length && !Object.keys(saved).length && !Object.hasOwn(data, 'modelOriginals')) return data;

  for (const [date, original] of Object.entries(saved)) {
    if (original === null) delete days[date];
    else days[date] = original;
  }
  for (const [date, name] of entries) {
    originals[date] = days[date] ?? null;
    days[date] = {s: [], t: 'feriado', h: name};
  }
  const {modelOriginals, ...doc} = data;
  return {...doc, state: {...state, days}, ...(entries.length ? {modelOriginals: originals} : {})};
}
