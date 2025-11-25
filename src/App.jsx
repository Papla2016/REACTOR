import React, { useEffect, useState } from 'react';

const LS_KEY = 'pv_ultra_v1';
const cats = [
  { id: 'gov', name: 'Гос. сервисы' },
  { id: 'banks', name: 'Банки' },
  { id: 'ins', name: 'Страховые' },
  { id: 'employers', name: 'Работодатели' },
  { id: 'edu', name: 'Образование' },
];

const scopes = [
  { id: 'court', name: 'Суды' },
  { id: 'medical', name: 'Медицина' },
  { id: 'finance', name: 'Финансы' },
  { id: 'hr', name: 'Кадры' },
];

const rid = () => Math.random().toString(36).slice(2, 9);
const d = () => new Date().toISOString().slice(0, 10);
const demoCourt = () => ({
  id: rid(),
  court: 'Мосгорсуд',
  date: d(),
  status: 'Рассмотрено',
  amount: 125_000,
  raw: 'РЕШЕНИЕ: иск частично',
  norm: { исход: 'Удовлетворён ч.' },
});

const demoMed = () => ({
  id: rid(),
  date: d(),
  dx: 'J06.9 ОРВИ',
  tests: ['ОАК: норма', 'CRP: 5'],
  raw: 'Рецепт, покой',
  norm: {},
});

const demoFin = () => ({
  id: rid(),
  acc: '****1234',
  income: 185_000,
  score: 720,
  raw: 'Обороты 185k',
  norm: {},
});

const demoHR = () => ({
  id: rid(),
  org: 'ООО Пример',
  pos: 'Инженер',
  from: '2022-01-10',
  to: 'н.в.',
  raw: 'Приказ 42-к',
  norm: {},
});

const Card = ({ children, style, className }) => (
  <div className={`border rounded-2xl bg-white p-4 ${className || ''}`} style={style}>
    {children}
  </div>
);

const H = ({ children }) => <div className="font-semibold mb-2">{children}</div>;

const Btn = ({ onClick, children, pri }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl border text-sm ${
      pri ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-50'
    }`}
  >
    {children}
  </button>
);

const Pill = ({ t }) => <span className="px-2 py-0.5 rounded-lg text-xs border bg-slate-50">{t}</span>;

const Row = ({ l, r }) => <div className="flex items-center justify-between">{l}{r}</div>;

const Grid = ({ n = 2, children }) => <div className={`grid gap-3 md:grid-cols-${n}`}>{children}</div>;

function useStore() {
  const init = {
    role: 'guest',
    citizen: {
      sources: [],
      data: { court: [], medical: [], finance: [], hr: [] },
      grants: [],
      log: [],
      pending: [],
    },
    admin: {
      policies: { blockSecret: true, hidePassports: true, allowDownloadDefault: false },
      integrations: [{ id: 'sudrf', name: 'ГАС Правосудие', schedule: 'ежедневно', status: 'активна' }],
    },
  };

  const [st, setSt] = useState(() => {
    try {
      const r = localStorage.getItem(LS_KEY);
      return r ? JSON.parse(r) : init;
    } catch {
      return init;
    }
  });

  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(st)), [st]);
  return [st, setSt];
}

export default function App() {
  const [st, setSt] = useStore();
  const reset = () => {
    localStorage.removeItem(LS_KEY);
    location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white">🔐</div>
            <div>
              <div className="font-semibold">PersonaVault</div>
              <div className="text-xs text-slate-500">Единый кабинет персональных данных</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-1.5 rounded-xl border text-sm"
              value={st.role}
              onChange={(e) => setSt({ ...st, role: e.target.value })}
            >
              <option value="guest">Гость</option>
              <option value="citizen">Гражданин</option>
              <option value="specialist">Специалист</option>
              <option value="admin">Администратор</option>
            </select>
            <Btn onClick={reset}>Сброс демо</Btn>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        {st.role === 'guest' && <Guest onStart={() => setSt({ ...st, role: 'citizen' })} />}
        {st.role === 'citizen' && <Citizen st={st} setSt={setSt} />}
        {st.role === 'specialist' && <Specialist st={st} setSt={setSt} />}
        {st.role === 'admin' && <Admin st={st} setSt={setSt} />}
      </main>
    </div>
  );
}

const Small = ({ t, d: desc }) => (
  <div className="p-3 border rounded-2xl bg-white">
    <div className="font-medium">{t}</div>
    <div className="text-xs text-slate-500">{desc}</div>
  </div>
);

function Guest({ onStart }) {
  return (
    <Grid n={2}>
      <Card>
        <H>Почему PersonaVault</H>
        <ul className="list-disc pl-5 text-sm space-y-1 text-slate-600">
          <li>Один кабинет для всех ПД</li>
          <li>Роли видят свой «срез»</li>
          <li>Журнал прозрачности</li>
        </ul>
        <div className="mt-3">
          <Btn pri onClick={onStart}>Создать учётную запись</Btn>
        </div>
      </Card>
      <Card>
        <H>Роли</H>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Small t="Судья" d="Судебные данные" />
          <Small t="Врач" d="Медкарта и анализы" />
          <Small t="Банк" d="Доходы и кредиты" />
          <Small t="Работодатель" d="Кадровые записи" />
        </div>
      </Card>
    </Grid>
  );
}

function Citizen({ st, setSt }) {
  const [tab, setTab] = useState('data');
  const c = st.citizen;

  const wlog = (e) =>
    setSt((p) => ({
      ...p,
      citizen: { ...p.citizen, log: [{ id: rid(), when: new Date().toISOString(), ...e }, ...p.citizen.log] },
    }));

  const connect = (id) => {
    const cat = cats.find((x) => x.id === id);
    const s = {
      id: rid(),
      categoryId: id,
      name: `${cat.name} · интеграция`,
      status: 'в обработке',
      updatedAt: new Date().toISOString(),
    };

    setSt((p) => ({ ...p, citizen: { ...p.citizen, sources: [...p.citizen.sources, s] } }));

    setTimeout(() => {
      setSt((p) => {
        const nd = { ...p };
        nd.citizen.sources = nd.citizen.sources.map((x) =>
          x.id === s.id ? { ...x, status: 'обновлено', updatedAt: new Date().toISOString() } : x,
        );

        if (id === 'gov') {
          nd.citizen.data.court = [demoCourt(), ...nd.citizen.data.court];
          nd.citizen.data.medical = [demoMed(), ...nd.citizen.data.medical];
        }
        if (id === 'banks') {
          nd.citizen.data.finance = [demoFin(), ...nd.citizen.data.finance];
        }
        if (id === 'employers') {
          nd.citizen.data.hr = [demoHR(), ...nd.citizen.data.hr];
        }

        return nd;
      });
    }, 600);
  };

  const issue = (form) => {
    const g = {
      id: rid(),
      role: form.role,
      scopeIds: form.scopeIds,
      expiresAt: form.expiresAt,
      allowDownload: form.allowDownload,
      requirePrompt: form.requirePrompt,
      token: `PV-${rid().slice(0, 4).toUpperCase()}-${rid().slice(0, 4).toUpperCase()}`,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setSt((p) => ({ ...p, citizen: { ...p.citizen, grants: [g, ...p.citizen.grants] } }));
  };

  const revoke = (id) =>
    setSt((p) => ({
      ...p,
      citizen: { ...p.citizen, grants: p.citizen.grants.map((g) => (g.id === id ? { ...g, active: false } : g)) },
    }));

  const approve = (id) => {
    const r = c.pending.find((x) => x.id === id);
    if (!r) return;

    issue({ role: r.role, scopeIds: r.scopeIds || ['court'], expiresAt: d(), allowDownload: false, requirePrompt: true });
    setSt((p) => ({ ...p, citizen: { ...p.citizen, pending: p.citizen.pending.filter((x) => x.id !== id) } }));
  };

  const decline = (id) =>
    setSt((p) => ({ ...p, citizen: { ...p.citizen, pending: p.citizen.pending.filter((x) => x.id !== id) } }));

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4 bg-slate-900 text-white">ЛК гражданина · Источники · Доступы · Журнал</div>
      <div className="flex gap-2 flex-wrap">
        {['data', 'sources', 'access', 'log'].map((v) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-3 py-1.5 rounded-xl border text-sm ${tab === v ? 'bg-slate-900 text-white border-slate-900' : ''}`}
          >
            {{ data: 'Мои данные', sources: 'Источники', access: 'Доступы', log: 'Журнал' }[v]}
          </button>
        ))}
      </div>

      {tab === 'sources' && (
        <Grid n={3}>
          {cats.map((categ) => (
            <Card key={categ.id}>
              <Row l={<div className="font-medium">{categ.name}</div>} r={<Btn pri onClick={() => connect(categ.id)}>Подключить</Btn>} />
              <div className="mt-2 space-y-2 text-sm">
                {c &&
                  st.citizen.sources
                    .filter((s) => s.categoryId === categ.id)
                    .map((s) => (
                      <div key={s.id} className="p-2 border rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-slate-500">{new Date(s.updatedAt).toLocaleString()}</div>
                        </div>
                        <Pill t={s.status} />
                      </div>
                    ))}
                {st.citizen.sources.filter((s) => s.categoryId === categ.id).length === 0 && (
                  <div className="text-xs text-slate-500">Ещё нет подключений</div>
                )}
              </div>
            </Card>
          ))}
        </Grid>
      )}

      {tab === 'data' && (
        <Card>
          <DataTabs data={c.data} onView={(t) => wlog({ actor: 'Вы', role: 'citizen', action: 'view', dataType: t, reason: 'Просмотр в ЛК' })} />
        </Card>
      )}

      {tab === 'access' && (
        <div className="space-y-3">
          <Card>
            <H>Выдать доступ</H>
            <IssueForm onIssue={issue} />
            <div className="text-sm text-slate-600 mt-2">Скопируйте токен и передайте специалисту</div>
          </Card>

          <Grid n={2}>
            {c.grants.map((g) => (
              <GrantCard key={g.id} g={g} onRevoke={() => revoke(g.id)} />
            ))}
            {c.grants.length === 0 && <Card>Пока нет выданных доступов</Card>}
          </Grid>

          <Card>
            <H>Запросы на доступ</H>
            <div className="space-y-2">
              {c.pending.map((r) => (
                <div key={r.id} className="p-3 border rounded-2xl flex items-center justify-between">
                  <div className="text-sm">
                    <b>{roleLabel(r.role)}</b> · причина: {r.reason}
                  </div>
                  <div className="flex gap-2">
                    <Btn onClick={() => approve(r.id)}>Одобрить</Btn>
                    <Btn onClick={() => decline(r.id)}>Отклонить</Btn>
                  </div>
                </div>
              ))}
              {c.pending.length === 0 && <div className="text-sm text-slate-500">Запросов нет</div>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'log' && (
        <Card>
          <H>Журнал</H>
          <LogTable rows={c.log} />
        </Card>
      )}
    </div>
  );
}

function DataTabs({ data, onView }) {
  const [tab, setTab] = useState(data.court.length ? 'court' : 'medical');
  const [raw, setRaw] = useState(false);
  const [q, setQ] = useState('');
  const match = (t) => t.toLowerCase().includes(q.toLowerCase());

  const Box = ({ children }) => <div className="grid gap-3 md:grid-cols-2">{children}</div>;
  const tabBtn = (id, txt) => (
    <button
      className={`px-3 py-1.5 rounded-xl border text-sm ${tab === id ? 'bg-slate-900 text-white border-slate-900' : ''}`}
      onClick={() => {
        setTab(id);
        onView(id);
      }}
    >
      {txt}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tabBtn('court', 'Суды')}
        {tabBtn('medical', 'Медицина')}
        {tabBtn('finance', 'Финансы')}
        {tabBtn('hr', 'Кадры')}
        <span className="grow" />
        <input
          className="px-3 py-1.5 rounded-xl border text-sm w-48"
          placeholder="Поиск"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={raw} onChange={(e) => setRaw(e.target.checked)} /> сырой вид
        </label>
      </div>

      {tab === 'court' && (
        <Box>
          {data.court
            .filter((x) => match(raw ? x.raw : JSON.stringify(x.norm)))
            .map((x) => (
              <Card key={x.id}>
                <div className="text-sm font-medium">
                  {x.court} · {x.date} <Pill t={x.status} />
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {raw ? x.raw : `Сумма: ${x.amount.toLocaleString()} ₽ · Исход: ${x.norm.исход}`}
                </div>
                <div className="text-xs text-slate-400 mt-1">ID: {x.id}</div>
              </Card>
            ))}
        </Box>
      )}

      {tab === 'medical' && (
        <Box>
          {data.medical
            .filter((x) => match(raw ? x.raw : JSON.stringify(x.norm)))
            .map((x) => (
              <Card key={x.id}>
                <div className="text-sm font-medium">{x.date} · {x.dx}</div>
                <div className="text-sm text-slate-600 mt-1">{raw ? x.raw : x.tests.join(', ')}</div>
              </Card>
            ))}
        </Box>
      )}

      {tab === 'finance' && (
        <Box>
          {data.finance
            .filter((x) => match(raw ? x.raw : JSON.stringify(x.norm)))
            .map((x) => (
              <Card key={x.id}>
                <div className="text-sm font-medium">Счёт {x.acc} · скоринг {x.score}</div>
                <div className="text-sm text-slate-600 mt-1">{raw ? x.raw : `Доход/мес: ${x.income.toLocaleString()} ₽`}</div>
              </Card>
            ))}
        </Box>
      )}

      {tab === 'hr' && (
        <Box>
          {data.hr
            .filter((x) => match(raw ? x.raw : JSON.stringify(x.norm)))
            .map((x) => (
              <Card key={x.id}>
                <div className="text-sm font-medium">{x.org} · {x.pos}</div>
                <div className="text-sm text-slate-600 mt-1">{raw ? x.raw : `Период: ${x.from} — ${x.to}`}</div>
              </Card>
            ))}
        </Box>
      )}
    </div>
  );
}

function IssueForm({ onIssue }) {
  const [role, setRole] = useState('judge');
  const [scope, setScope] = useState(['court']);
  const [exp, setExp] = useState(() => {
    const dt = new Date(Date.now() + 7 * 864e5);
    return dt.toISOString().slice(0, 10);
  });
  const [dl, setDl] = useState(false);
  const [rp, setRp] = useState(true);
  const toggle = (id) => setScope((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="grid md:grid-cols-3 gap-2 items-center text-sm">
      <label>Роль</label>
      <select
        className="px-3 py-1.5 rounded-xl border text-sm md:col-span-2"
        value={role}
        onChange={(e) => {
          const v = e.target.value;
          setRole(v);
          setScope(v === 'judge' ? ['court'] : v === 'doctor' ? ['medical'] : v === 'bank' ? ['finance'] : ['hr']);
        }}
      >
        <option value="judge">Судья/суд</option>
        <option value="doctor">Врач/медорганизация</option>
        <option value="bank">Банк</option>
        <option value="employer">Работодатель</option>
      </select>

      <label>Данные</label>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        {scopes.map((s) => (
          <button
            key={s.id}
            className={`px-3 py-1.5 rounded-xl border text-sm ${scope.includes(s.id) ? 'bg-slate-900 text-white border-slate-900' : ''}`}
            onClick={() => toggle(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <label>Действует до</label>
      <input type="date" className="px-3 py-1.5 rounded-xl border text-sm md:col-span-2" value={exp} onChange={(e) => setExp(e.target.value)} />

      <label>Разрешить скачивание</label>
      <input type="checkbox" checked={dl} onChange={(e) => setDl(e.target.checked)} />

      <label>Запрос перед раскрытием</label>
      <input type="checkbox" checked={rp} onChange={(e) => setRp(e.target.checked)} />

      <div className="md:col-span-3">
        <Btn pri onClick={() => onIssue({ role, scopeIds: scope, expiresAt: exp, allowDownload: dl, requirePrompt: rp })}>
          Выдать
        </Btn>
      </div>
    </div>
  );
}

function GrantCard({ g, onRevoke }) {
  const copy = () => navigator.clipboard.writeText(g.token);
  const expired = new Date(g.expiresAt) < new Date();

  return (
    <Card>
      <Row
        l={<div className="font-medium text-sm">{roleLabel(g.role)}</div>}
        r={
          <div className="flex gap-2 text-xs">
            <Pill t={g.active ? 'активен' : 'отозван'} />
            {expired && <span className="px-2 py-0.5 rounded-lg text-xs bg-red-100 text-red-700">истёк</span>}
          </div>
        }
      />
      <div className="text-xs text-slate-500 mt-1">Доступ: {g.scopeIds.map((id) => scopes.find((s) => s.id === id)?.name).join(', ')} · до {g.expiresAt}</div>
      <div className="flex items-center gap-2 mt-2">
        <code className="px-2 py-1 rounded-xl bg-slate-50 border text-xs">{g.token}</code>
        <Btn onClick={copy}>Копировать</Btn>
      </div>
      <div className="mt-2">
        <Btn onClick={onRevoke}>Отозвать</Btn>
      </div>
    </Card>
  );
}

function LogTable({ rows }) {
  const [q, setQ] = useState('');
  const f = rows.filter((e) => JSON.stringify(e).toLowerCase().includes(q.toLowerCase()));

  const exp = () => {
    const blob = new Blob([JSON.stringify(f, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pv-access-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          className="px-3 py-1.5 rounded-xl border text-sm w-48"
          placeholder="Фильтр"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Btn onClick={exp}>Экспорт JSON</Btn>
      </div>

      <div className="overflow-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Когда</th>
              <th className="text-left p-2">Кто</th>
              <th className="text-left p-2">Роль</th>
              <th className="text-left p-2">Действие</th>
              <th className="text-left p-2">Тип</th>
              <th className="text-left p-2">Основание</th>
            </tr>
          </thead>
          <tbody>
            {f.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{new Date(e.when).toLocaleString()}</td>
                <td className="p-2">{e.actor}</td>
                <td className="p-2">{e.role}</td>
                <td className="p-2">{e.action}</td>
                <td className="p-2">{e.dataType}</td>
                <td className="p-2" title={e.reason}>
                  {e.reason}
                </td>
              </tr>
            ))}
            {f.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>
                  Нет записей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Specialist({ st, setSt }) {
  const [role, setRole] = useState('judge');
  const [token, setToken] = useState('');
  const [grant, setGrant] = useState(null);

  const log = (e) =>
    setSt((p) => ({
      ...p,
      citizen: { ...p.citizen, log: [{ id: rid(), when: new Date().toISOString(), ...e }, ...p.citizen.log] },
    }));

  const enter = () => {
    const g = st.citizen.grants.find(
      (x) => x.token === token && x.role === role && x.active && new Date(x.expiresAt) > new Date(),
    );
    if (!g) {
      alert('Доступ не найден: проверьте токен/роль/срок');
      return;
    }

    setGrant(g);
    log({ actor: `Специалист(${role})`, role: 'specialist', action: 'token-accept', dataType: g.scopeIds.join(','), reason: 'Вход по токену', grantId: g.id });
  };

  const req = () => {
    const reason = prompt('Основание запроса (дело №..., назначение ...)');
    if (!reason) return;

    const r = {
      id: rid(),
      role,
      reason,
      requestedAt: new Date().toISOString(),
      scopeIds: role === 'judge' ? ['court'] : role === 'doctor' ? ['medical'] : role === 'bank' ? ['finance'] : ['hr'],
    };

    setSt((p) => ({ ...p, citizen: { ...p.citizen, pending: [r, ...p.citizen.pending] } }));
    alert('Запрос отправлен гражданину');
  };

  const data = st.citizen.data;

  return (
    <Grid n={3}>
      <Card className="md:col-span-1">
        <H>Портал специалиста</H>
        <div className="text-sm mb-2">Роль</div>
        <select className="px-3 py-1.5 rounded-xl border text-sm mb-2 w-full" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="judge">Судья/суд</option>
          <option value="doctor">Врач/медорганизация</option>
          <option value="bank">Банк</option>
          <option value="employer">Работодатель</option>
        </select>

        <div className="text-sm mb-2">Токен доступа</div>
        <input
          className="px-3 py-1.5 rounded-xl border text-sm w-full mb-2"
          placeholder="PV-XXXX-YYYY"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <div className="flex gap-2">
          <Btn pri onClick={enter}>Войти</Btn>
          <Btn onClick={req}>Запросить доступ</Btn>
        </div>
      </Card>

      <Card className="md:col-span-2">
        <H>Разрешённые данные</H>
        {!grant && <div className="text-sm text-slate-500">Введите валидный токен</div>}
        {grant && (
          <div className="space-y-3">
            <div className="text-sm text-slate-600">
              Доступ: {grant.scopeIds.map((id) => scopes.find((s) => s.id === id)?.name).join(', ')} · до {grant.expiresAt}
            </div>
            <DataTabs
              data={data}
              onView={(t) =>
                log({ actor: `Специалист(${role})`, role: 'specialist', action: 'view', dataType: t, reason: 'Просмотр по токену', grantId: grant.id })
              }
            />
          </div>
        )}
      </Card>
    </Grid>
  );
}

function Admin({ st, setSt }) {
  const pol = st.admin.policies;
  const ints = st.admin.integrations;
  const log = st.citizen.log;

  const setPol = (p) => setSt({ ...st, admin: { ...st.admin, policies: p } });
  const addInt = () => {
    const name = prompt('Название интеграции');
    if (!name) return;

    setSt({ ...st, admin: { ...st.admin, integrations: [{ id: rid(), name, schedule: 'ежедневно', status: 'активна' }, ...ints] } });
  };

  const [q, setQ] = useState('');
  const fl = log.filter((e) => JSON.stringify(e).toLowerCase().includes(q.toLowerCase()));

  return (
    <Grid n={3}>
      <Card>
        <H>Политики доступа</H>
        <Toggle label="Запрещать служебные тайны" v={pol.blockSecret} on={(v) => setPol({ ...pol, blockSecret: v })} />
        <Toggle label="Скрывать паспортные номера" v={pol.hidePassports} on={(v) => setPol({ ...pol, hidePassports: v })} />
        <Toggle label="Скачивание по умолчанию" v={pol.allowDownloadDefault} on={(v) => setPol({ ...pol, allowDownloadDefault: v })} />
      </Card>

      <Card>
        <H>Интеграции</H>
        <Btn onClick={addInt}>Добавить интеграцию</Btn>
        <div className="space-y-2 mt-2 text-sm">
          {ints.map((i) => (
            <div key={i.id} className="p-2 border rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-slate-500">{i.schedule}</div>
              </div>
              <Pill t={i.status} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <H>Аудит</H>
        <input
          className="px-3 py-1.5 rounded-xl border text-sm w-full mb-2"
          placeholder="Фильтр по журналу"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="max-h-72 overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">Когда</th>
                <th className="text-left p-2">Кто</th>
                <th className="text-left p-2">Роль</th>
                <th className="text-left p-2">Действие</th>
              </tr>
            </thead>
            <tbody>
              {fl.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2">{new Date(e.when).toLocaleString()}</td>
                  <td className="p-2">{e.actor}</td>
                  <td className="p-2">{e.role}</td>
                  <td className="p-2" title={`${e.action} ${e.dataType}`}>
                    {e.action} {e.dataType}
                  </td>
                </tr>
              ))}
              {fl.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={4}>
                    Нет записей
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Grid>
  );
}

const Toggle = ({ label, v, on }) => (
  <label className="flex items-center justify-between text-sm mb-2">
    <span>{label}</span>
    <input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />
  </label>
);

const roleLabel = (r) => (r === 'judge' ? 'Судья/суд' : r === 'doctor' ? 'Врач' : r === 'bank' ? 'Банк' : 'Работодатель');
