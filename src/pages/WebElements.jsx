import React, { useEffect, useMemo, useRef, useState } from 'react';
import './webelements.css';

// WebElements Practice Lab - independent page: no login, no API calls, no shared state. Plain React + JavaScript only.
const COUNTRIES = ['Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece',
  'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Nepal', 'Netherlands', 'New Zealand', 'Norway', 'Pakistan', 'Peru', 'Poland', 'Portugal',
  'Singapore', 'South Africa', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'United Kingdom', 'United States', 'Vietnam'];
const COURSES = [
  ['Asha Rao', 'Selenium WebDriver with Java: Basics + Advanced + Interview Guide', 30], ['Asha Rao', 'Learn SQL in Practical + Database Testing from Scratch', 25],
  ['Vikram Nair', 'Cypress End-to-End Testing with JavaScript from Scratch', 30], ['Vikram Nair', 'REST API Testing with Postman and Rest Assured', 20],
  ['Meera Iyer', 'Performance Testing with JMeter from Scratch', 25], ['Meera Iyer', 'Mobile Automation Testing with Appium', 35],
  ['Sanjay Kulkarni', 'Cucumber BDD Framework with Java and TestNG', 28], ['Sanjay Kulkarni', 'CI/CD for Testers: Jenkins and Docker Basics', 22]];
const STAFF = [['Alex', 'Engineer', 'Chennai', 28], ['Ben', 'Mechanic', 'Bengaluru', 23], ['Dwayne', 'Manager', 'Kolkata', 48], ['Ivory', 'Receptionist', 'Chennai', 18],
  ['Jack', 'Engineer', 'Pune', 32], ['John', 'Mechanic', 'Mumbai', 41], ['Joe', 'Engineer', 'Hyderabad', 35], ['Raymond', 'Receptionist', 'Delhi', 26], ['Mark', 'Manager', 'Pune', 52]];
const FRAME = `<body style="font-family:sans-serif;margin:8px"><h3>Course catalog (inside an iframe)</h3><p id="iframe-text">This text lives inside an iframe.</p>
<button id="iframe-btn" onclick="document.getElementById('iframe-text').innerText='Button clicked inside iframe'">Click me</button></body>`;
const SECTIONS = [['radio', 'Radio'], ['suggest', 'Suggestion'], ['dropdown', 'Dropdowns'], ['checkbox', 'Checkboxes'], ['window', 'Windows & Tabs'], ['alerts', 'Alerts'], ['product', 'Web Table'],
  ['hideshow', 'Hide/Show'], ['fixed', 'Fixed Header'], ['hover', 'Hover'], ['frame', 'iFrame'], ['datetime', 'Date & Time'], ['sliders', 'Sliders & Color'], ['form', 'Form Validation'],
  ['files', 'File Upload'], ['switches', 'Switches'], ['dynamic', 'Dynamic Loading'], ['tabs', 'Accordion & Tabs'], ['modal', 'Modal & Toast'], ['interactive', 'Rating, Tags, OTP'],
  ['drag', 'Drag & Drop'], ['grid', 'Data Grid'], ['scroll', 'Infinite Scroll'], ['shadow', 'Shadow DOM'], ['text', 'Rich Text'], ['actions', 'Mouse & Keyboard']];

const useTitle = t => useEffect(() => { const old = document.title; document.title = t; return () => { document.title = old; }; }, [t]);
const Card = ({ id, color, title, wide, children }) => <section id={'sec-' + id} className={`we-card c-${color}${wide ? ' wide' : ''}`} data-testid={'we-sec-' + id}>
  <h3 className="we-card-h">{title}</h3><div className="we-card-b">{children}</div></section>;
const Field = ({ label, children }) => <label className="we-field"><span>{label}</span>{children}</label>;

function DateTimeCard() {
  const [v, setV] = useState({ date: '', time: '', datetime: '', month: '', week: '' });
  const set = k => e => setV({ ...v, [k]: e.target.value });
  return <Card id="datetime" color="sky" title="Date & Time Pickers">
    {[['date', 'date', 'Date'], ['time', 'time', 'Time'], ['datetime-local', 'datetime', 'Date & time'], ['month', 'month', 'Month'], ['week', 'week', 'Week']].map(([t, k, l]) =>
      <Field key={k} label={l}><input type={t} id={k + '-input'} data-testid={'we-' + k} value={v[k]} onChange={set(k)} /></Field>)}
    <p className="we-out" data-testid="we-datetime-out">{Object.values(v).filter(Boolean).join(' | ') || 'Nothing selected yet'}</p></Card>;
}
function SlidersCard() {
  const [r, setR] = useState(40); const [n, setN] = useState(3); const [c, setC] = useState('#7c3aed');
  return <Card id="sliders" color="rose" title="Sliders, Numbers & Colors">
    <Field label={<>Volume: <b data-testid="we-range-out">{r}</b></>}><input type="range" id="range-input" data-testid="we-range" min="0" max="100" value={r} onChange={e => setR(+e.target.value)} /></Field>
    <progress id="progress-bar" data-testid="we-progress" value={r} max="100" />
    <meter id="meter-bar" data-testid="we-meter" value={r / 100} low="0.3" high="0.7" optimum="0.9" />
    <Field label="Quantity (1 to 10)"><input type="number" id="number-input" data-testid="we-number" min="1" max="10" step="1" value={n} onChange={e => setN(+e.target.value)} /></Field>
    <Field label="Pick a color"><input type="color" id="color-input" data-testid="we-color" value={c} onChange={e => setC(e.target.value)} /></Field>
    <div className="we-swatch" data-testid="we-swatch" style={{ background: c }}>{c}</div></Card>;
}
function FormCard() {
  const [msg, setMsg] = useState('');
  const submit = e => { e.preventDefault(); const f = new FormData(e.target); setMsg(`Registered ${f.get('email')} from ${f.get('country')}`); };
  return <Card id="form" color="emerald" title="HTML5 Form Validation">
    <form onSubmit={submit} data-testid="we-form" id="validation-form">
      <Field label="Email *"><input type="email" name="email" id="vf-email" data-testid="we-vf-email" required placeholder="you@example.com" /></Field>
      <Field label="Phone (10 digits) *"><input type="tel" name="phone" id="vf-phone" data-testid="we-vf-phone" pattern="[0-9]{10}" required placeholder="9876543210" /></Field>
      <Field label="Website"><input type="url" name="site" id="vf-url" data-testid="we-vf-url" placeholder="https://example.com" /></Field>
      <Field label="Password (min 8 characters) *"><input type="password" name="pwd" id="vf-pwd" data-testid="we-vf-pwd" minLength={8} required /></Field>
      <Field label="Country"><select name="country" id="vf-country" data-testid="we-vf-country"><optgroup label="Asia"><option>India</option><option>Japan</option></optgroup>
        <optgroup label="Europe"><option>France</option><option>Germany</option></optgroup></select></Field>
      <label><input type="checkbox" required id="vf-terms" data-testid="we-vf-terms" /> I accept the terms *</label>
      <button type="submit" className="we-btn" id="vf-submit" data-testid="we-vf-submit">Register</button>
      {msg && <div className="we-result" data-testid="we-vf-result">{msg}</div>}</form></Card>;
}
function FileCard() {
  const [files, setFiles] = useState([]); const [over, setOver] = useState(false);
  const names = l => Array.from(l).map(f => f.name);
  return <Card id="files" color="orange" title="File Upload & Drop Zone">
    <Field label="Single file"><input type="file" id="file-single" data-testid="we-file-single" onChange={e => setFiles(names(e.target.files))} /></Field>
    <Field label="Multiple images"><input type="file" id="file-multi" data-testid="we-file-multi" multiple accept="image/*" onChange={e => setFiles(names(e.target.files))} /></Field>
    <div className={'we-drop' + (over ? ' over' : '')} id="drop-zone" data-testid="we-dropzone" onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); setFiles(names(e.dataTransfer.files)); }}>Drag and drop files here</div>
    <ul data-testid="we-file-list">{files.map(f => <li key={f}>{f}</li>)}</ul></Card>;
}
function SwitchCard() {
  const [on, setOn] = useState({ wifi: true, dark: false }); const [dis, setDis] = useState(true);
  return <Card id="switches" color="violet" title="Toggle Switches & Input States">
    {[['wifi', 'Wi-Fi'], ['dark', 'Dark mode']].map(([k, l]) => <label key={k}><input type="checkbox" role="switch" id={'switch-' + k} data-testid={'we-switch-' + k} checked={on[k]}
      onChange={e => setOn({ ...on, [k]: e.target.checked })} /> {l}: <b data-testid={'we-switch-' + k + '-state'}>{on[k] ? 'ON' : 'OFF'}</b></label>)}
    <Field label="Disabled / enabled input"><input type="text" id="state-input" data-testid="we-state-input" disabled={dis} placeholder={dis ? 'I am disabled' : 'I am enabled'} /></Field>
    <button className="we-btn" id="toggle-enable" data-testid="we-toggle-enable" onClick={() => setDis(!dis)}>{dis ? 'Enable input' : 'Disable input'}</button>
    <Field label="Read-only input"><input type="text" id="readonly-input" data-testid="we-readonly" readOnly value="Cannot edit me" /></Field></Card>;
}
function DynamicCard() {
  const [state, setState] = useState('idle'); const [pct, setPct] = useState(0); const [late, setLate] = useState(false);
  const load = () => { setState('loading'); setTimeout(() => setState('done'), 2000); };
  const start = () => { setPct(0); const t = setInterval(() => setPct(p => { if (p >= 100) { clearInterval(t); return 100; } return p + 10; }), 300); };
  const showLate = () => { setLate(false); setTimeout(() => setLate(true), 3000); };
  return <Card id="dynamic" color="green" title="Dynamic Loading & Waits">
    <button className="we-btn" id="load-data" data-testid="we-load" onClick={load}>Load data (2s)</button>
    {state === 'loading' && <div className="we-spinner" role="status" data-testid="we-spinner" />}
    {state === 'done' && <p className="we-result" data-testid="we-loaded">Data loaded successfully</p>}
    <div><button className="we-btn" id="start-progress" data-testid="we-start-progress" onClick={start}>Start progress</button><b data-testid="we-pct">{pct}%</b></div>
    <div className="we-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" data-testid="we-bar"><i style={{ width: pct + '%' }} /></div>
    <button className="we-btn" id="show-late" data-testid="we-show-late" onClick={showLate}>Show element after 3s</button>
    {late && <p className="we-result" id="late-text" data-testid="we-late">I appeared after 3 seconds</p>}</Card>;
}
function TabsCard() {
  const [tab, setTab] = useState('overview');
  const T = { overview: 'Overview: practice finds elements quickly and waits for them reliably.', specs: 'Specs: React 18, plain JavaScript, no extra UI libraries.', faq: 'FAQ: every element has an id and a data-testid.' };
  return <Card id="tabs" color="indigo" title="Accordion & Tabs">
    {[['What is a locator?', 'A way to find an element: id, CSS selector, text or data-testid.'], ['Why use waits?', 'Elements can load later. Cypress retries assertions automatically.'],
      ['What is flaky?', 'A test that sometimes passes and sometimes fails without code changes.']].map(([q, a], i) =>
      <details key={i} data-testid="we-accordion"><summary>{q}</summary><p>{a}</p></details>)}
    <div className="we-tabs" role="tablist">{Object.keys(T).map(k => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} id={'tab-' + k}
      data-testid={'we-tab-' + k} onClick={() => setTab(k)}>{k}</button>)}</div>
    <div className="we-panel" role="tabpanel" data-testid="we-tabpanel">{T[tab]}</div></Card>;
}
function ModalCard() {
  const ref = useRef(null); const [ans, setAns] = useState(''); const [toast, setToast] = useState(false);
  const answer = a => { setAns(a); ref.current.close(); };
  return <Card id="modal" color="red" title="Modal Dialog & Toast">
    <button className="we-btn" id="open-modal" data-testid="we-open-modal" onClick={() => ref.current.showModal()}>Open modal</button>
    <button className="we-btn" id="show-toast" data-testid="we-show-toast" onClick={() => { setToast(true); setTimeout(() => setToast(false), 3000); }}>Show toast</button>
    <dialog ref={ref} className="we-dialog" id="confirm-dialog" data-testid="we-dialog"><h3>Delete this item?</h3><p>This action cannot be undone.</p>
      <button className="we-btn" id="modal-yes" data-testid="we-modal-yes" onClick={() => answer('Confirmed')}>Yes</button>
      <button className="we-btn" id="modal-no" data-testid="we-modal-no" onClick={() => answer('Cancelled')}>No</button></dialog>
    {ans && <div className="we-result" data-testid="we-modal-result">{ans}</div>}
    {toast && <div className="we-toast" role="status" data-testid="we-toast">Saved successfully</div>}</Card>;
}
function InteractiveCard() {
  const [stars, setStars] = useState(0); const [tags, setTags] = useState(['react', 'cypress']); const [tag, setTag] = useState(''); const [otp, setOtp] = useState(Array(6).fill(''));
  const refs = useRef([]);
  const otpChange = (i, v) => { if (!/^\d?$/.test(v)) return; const o = [...otp]; o[i] = v; setOtp(o); if (v && i < 5) refs.current[i + 1].focus(); };
  const addTag = e => { if (e.key === 'Enter' && tag.trim()) { setTags([...tags, tag.trim()]); setTag(''); } };
  return <Card id="interactive" color="amber" title="Star Rating, Tags & OTP">
    <div className="we-stars" role="radiogroup" aria-label="Rating" data-testid="we-stars">{[1, 2, 3, 4, 5].map(n =>
      <button key={n} type="button" className={'we-star' + (n <= stars ? ' on' : '')} aria-label={n + ' star'} data-testid={'we-star-' + n} onClick={() => setStars(n)}>★</button>)}</div>
    <p className="we-out" data-testid="we-stars-out">Rating: {stars} / 5</p>
    <Field label="Tags (press Enter to add)"><input type="text" id="tag-input" data-testid="we-tag-input" value={tag} onChange={e => setTag(e.target.value)} onKeyDown={addTag} /></Field>
    <div className="we-chips" data-testid="we-chips">{tags.map((t, i) => <span key={i} className="we-chip" data-testid="we-chip">{t}
      <button type="button" aria-label={'remove ' + t} data-testid="we-chip-x" onClick={() => setTags(tags.filter((_, j) => j !== i))}>×</button></span>)}</div>
    <Field label="One-time password"><span className="we-otp" data-testid="we-otp">{otp.map((d, i) => <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
      data-testid={'we-otp-' + i} value={d} onChange={e => otpChange(i, e.target.value)} />)}</span></Field>
    <p className="we-out" data-testid="we-otp-out">OTP: {otp.join('') || '------'}</p></Card>;
}
function DragCard() {
  const [items, setItems] = useState(['Plan tests', 'Write scripts', 'Run pipeline', 'Analyse results', 'Report bugs']); const [from, setFrom] = useState(null);
  const drop = to => { if (from === null || from === to) return; const a = [...items]; const [m] = a.splice(from, 1); a.splice(to, 0, m); setItems(a); setFrom(null); };
  return <Card id="drag" color="cyan" title="Drag & Drop Sortable List">
    <ol className="we-sort" data-testid="we-sort">{items.map((t, i) => <li key={t} draggable="true" data-testid="we-sort-item" onDragStart={() => setFrom(i)} onDragOver={e => e.preventDefault()} onDrop={() => drop(i)}>{t}</li>)}</ol>
    <p className="we-out" data-testid="we-sort-out">{items.join(' > ')}</p></Card>;
}
function GridCard() {
  const [q, setQ] = useState(''); const [sort, setSort] = useState({ k: 0, dir: 1 }); const [page, setPage] = useState(1); const [sel, setSel] = useState([]);
  const rows = useMemo(() => STAFF.filter(r => r.join(' ').toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : a[sort.k] < b[sort.k] ? -1 : 0) * sort.dir), [q, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / 4)); const cur = Math.min(page, pages); const view = rows.slice((cur - 1) * 4, cur * 4);
  const names = view.map(r => r[0]); const all = names.length > 0 && names.every(n => sel.includes(n));
  const toggleAll = on => setSel(on ? [...new Set([...sel, ...names])] : sel.filter(n => !names.includes(n)));
  return <Card id="grid" color="slate" title="Data Grid: Search, Sort, Select & Paginate" wide>
    <Field label="Filter rows"><input type="text" id="grid-filter" data-testid="we-grid-filter" placeholder="Type a name, role or city" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /></Field>
    <table className="we-table" id="data-grid" data-testid="we-grid"><thead><tr>
      <th><input type="checkbox" id="grid-select-all" data-testid="we-grid-all" checked={all} onChange={e => toggleAll(e.target.checked)} /></th>
      {['Name', 'Position', 'City', 'Amount'].map((h, i) => <th key={h} className="sortable" data-testid={'we-grid-h-' + i} onClick={() => setSort({ k: i, dir: sort.k === i ? -sort.dir : 1 })}>
        {h}{sort.k === i ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</th>)}</tr></thead>
      <tbody>{view.map(r => <tr key={r[0]} data-testid="we-grid-row"><td><input type="checkbox" data-testid="we-grid-check" checked={sel.includes(r[0])}
        onChange={e => setSel(e.target.checked ? [...sel, r[0]] : sel.filter(n => n !== r[0]))} /></td>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
    {rows.length === 0 && <p data-testid="we-grid-empty">No rows match.</p>}
    <div className="we-pager" data-testid="we-pager"><button disabled={cur <= 1} data-testid="we-grid-prev" onClick={() => setPage(cur - 1)}>Prev</button>
      {[...Array(pages)].map((_, i) => <button key={i} className={cur === i + 1 ? 'on' : ''} data-testid={'we-page-' + (i + 1)} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
      <button disabled={cur >= pages} data-testid="we-grid-next" onClick={() => setPage(cur + 1)}>Next</button>
      <span data-testid="we-grid-selected" style={{ marginLeft: 12 }}>Selected: {sel.length}</span></div></Card>;
}
function ScrollCard() {
  const [n, setN] = useState(8);
  const onScroll = e => { const t = e.target; if (t.scrollTop + t.clientHeight >= t.scrollHeight - 5 && n < 30) setN(n + 6); };
  return <Card id="scroll" color="lime" title="Infinite Scroll List">
    <div className="we-scrollbox" id="infinite-list" data-testid="we-infinite" onScroll={onScroll}>{Array.from({ length: n }, (_, i) => <div key={i} className="we-item" data-testid="we-infinite-item">Item {i + 1}</div>)}</div>
    <p className="we-out" data-testid="we-infinite-count">Loaded {n} of 30 items</p></Card>;
}
function ShadowCard() {
  const host = useRef(null);
  useEffect(() => {
    const el = host.current; if (!el || el.shadowRoot) return;
    const s = el.attachShadow({ mode: 'open' });
    s.innerHTML = `<style>button{background:#c026d3;color:#fff;border:0;padding:8px 14px;border-radius:6px;cursor:pointer}p{margin:8px 0 0;color:#86198f}input{padding:8px;border:1px solid #e879f9;border-radius:6px;display:block;margin-bottom:8px;width:90%}</style>
<input id="shadow-input" placeholder="Inside shadow DOM"/><button id="shadow-btn">Click inside shadow</button><p id="shadow-out">Not clicked yet</p>`;
    s.getElementById('shadow-btn').addEventListener('click', () => { s.getElementById('shadow-out').textContent = 'Shadow button clicked: ' + s.getElementById('shadow-input').value; });
  }, []);
  return <Card id="shadow" color="fuchsia" title="Shadow DOM Component"><div id="shadow-host" data-testid="we-shadow-host" ref={host} />
    <p className="we-out">Use .shadow() in Cypress, or set includeShadowDom: true.</p></Card>;
}
function TextCard() {
  const [t, setT] = useState(''); const [typed, setTyped] = useState('Edit this text...');
  return <Card id="text" color="teal" title="Rich Text & Character Counter">
    <div className="we-editable" id="editable" data-testid="we-editable" contentEditable="true" suppressContentEditableWarning onInput={e => setTyped(e.currentTarget.innerText)}>Edit this text...</div>
    <p className="we-out" data-testid="we-editable-out">Typed: {typed}</p>
    <Field label="Bio (max 50 characters)"><textarea id="bio" data-testid="we-bio" rows={3} maxLength={50} value={t} onChange={e => setT(e.target.value)} /></Field>
    <p className="we-out" data-testid="we-bio-count">{t.length} / 50</p></Card>;
}
function ActionsCard() {
  const [o, setO] = useState({ dbl: '', ctx: '' }); const [key, setKey] = useState(''); const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText('npm run cy:open'); } catch (e) { /* clipboard may be blocked */ } setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <Card id="actions" color="blue" title="Mouse, Keyboard, Tooltip & Clipboard">
    <button className="we-btn" id="dblclick-btn" data-testid="we-dblclick" onDoubleClick={() => setO({ ...o, dbl: 'Double clicked' })}>Double-click me</button>
    <div className="we-area" id="rightclick-area" data-testid="we-rightclick" onContextMenu={e => { e.preventDefault(); setO({ ...o, ctx: 'Right clicked' }); }}>Right-click here</div>
    <Field label="Press any key in this box"><input type="text" id="key-input" data-testid="we-key" onKeyDown={e => setKey(e.key)} /></Field>
    <p className="we-out" data-testid="we-actions-out">{[o.dbl, o.ctx, key && 'Key: ' + key].filter(Boolean).join(' | ') || 'No action yet'}</p>
    <span className="we-tip" data-tip="I am a tooltip" id="tooltip-target" data-testid="we-tooltip">Hover for tooltip</span>
    <button className="we-btn" id="copy-btn" data-testid="we-copy" onClick={copy}>{copied ? 'Copied!' : 'Copy command'}</button></Card>;
}

export default function WebElements() {
  useTitle('WebElements Practice Lab');
  const [radio, setRadio] = useState('');
  const [query, setQuery] = useState(''); const [picked, setPicked] = useState('');
  const [dd, setDd] = useState(''); const [multi, setMulti] = useState([]); const [list, setList] = useState('');
  const [checks, setChecks] = useState({ option1: false, option2: false, option3: false });
  const [name, setName] = useState(''); const [result, setResult] = useState('');
  const [shown, setShown] = useState(true); const [hover, setHover] = useState(false);
  const matches = useMemo(() => { const s = query.trim().toLowerCase(); return s && query !== picked ? COUNTRIES.filter(c => c.toLowerCase().includes(s)).slice(0, 8) : []; }, [query, picked]);
  const total = STAFF.reduce((s, r) => s + r[3], 0);
  const doAlert = () => { window.alert(`Hello ${name}, share this practice page and share your knowledge`); setResult('Alert accepted'); };
  const doConfirm = () => { const ok = window.confirm(`Hello ${name}, Are you sure you want to confirm?`); setResult(ok ? 'You clicked OK' : 'You clicked Cancel'); };

  return <div className="we-page" data-testid="we-page" id="top">
    <header className="we-hero"><h1 data-testid="we-heading">WebElements Practice Lab</h1>
      <p>A colourful playground of classic and modern web elements for UI automation practice. Every element has an id and a data-testid.</p>
      <nav className="we-jump" data-testid="we-jump">{SECTIONS.map(([id, l]) => <a key={id} href={'#sec-' + id}>{l}</a>)}</nav></header>

    <h2 className="we-group">Classic elements</h2>
    <div className="we-grid">
      <Card id="radio" color="blue" title="Radio Buttons">
        {['radio1', 'radio2', 'radio3'].map((v, i) => <label key={v}><input type="radio" name="radioButton" id={v} value={v} data-testid={'we-' + v} checked={radio === v} onChange={() => setRadio(v)} /> Radio{i + 1}</label>)}</Card>
      <Card id="suggest" color="teal" title="Auto-suggest Country Search">
        <div className="we-box"><input type="text" id="autocomplete" data-testid="we-autocomplete" placeholder="Type to Select Countries" autoComplete="off" value={query} onChange={e => { setQuery(e.target.value); setPicked(''); }} />
          {matches.length > 0 && <ul className="we-suggest" data-testid="we-suggestions">{matches.map(c => <li key={c} className="ui-menu-item" data-testid="we-suggestion" onClick={() => { setQuery(c); setPicked(c); }}>{c}</li>)}</ul>}</div></Card>
      <Card id="dropdown" color="purple" title="Dropdowns, Datalist & Multi-select">
        <Field label="Single select"><select id="dropdown-class-example" data-testid="we-dropdown" value={dd} onChange={e => setDd(e.target.value)}>
          <option value="">Select</option><option value="option1">Option1</option><option value="option2">Option2</option><option value="option3">Option3</option></select></Field>
        <Field label="Datalist (type or pick a browser)"><input type="text" id="datalist-input" data-testid="we-datalist" list="we-browsers" value={list} onChange={e => setList(e.target.value)} />
          <datalist id="we-browsers"><option value="Chrome" /><option value="Firefox" /><option value="Safari" /><option value="Edge" /></datalist></Field>
        <Field label="Multi-select (hold Ctrl)"><select multiple id="multi-select" data-testid="we-multi" value={multi} onChange={e => setMulti(Array.from(e.target.selectedOptions, o => o.value))}>
          <option value="java">Java</option><option value="js">JavaScript</option><option value="py">Python</option><option value="sql">SQL</option></select></Field>
        <p className="we-out" data-testid="we-multi-out">Selected: {multi.join(', ') || 'none'}</p></Card>
      <Card id="checkbox" color="orange" title="Checkboxes">
        {['option1', 'option2', 'option3'].map((k, i) => <label key={k}><input type="checkbox" id={'checkBoxOption' + (i + 1)} name={'checkBoxOption' + (i + 1)} value={k} data-testid={'we-check' + (i + 1)}
          checked={checks[k]} onChange={e => setChecks({ ...checks, [k]: e.target.checked })} /> Option{i + 1}</label>)}</Card>
      <Card id="window" color="pink" title="Switch Window & Tab">
        <button className="we-btn" id="openwindow" data-testid="we-open-window" onClick={() => window.open('/webelements/child', 'weChild', 'width=700,height=450')}>Open Window</button>
        <a className="we-btn" id="opentab" data-testid="we-open-tab" href="/webelements/child" target="_blank" rel="noreferrer">Open Tab</a></Card>
      <Card id="alerts" color="red" title="Alert & Confirm Popups">
        <input type="text" id="name" data-testid="we-name" placeholder="Enter Your Name" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ marginTop: 12 }}><button className="we-btn" id="alertbtn" data-testid="we-alert" onClick={doAlert}>Alert</button>
          <button className="we-btn" id="confirmbtn" data-testid="we-confirm" onClick={doConfirm}>Confirm</button></div>
        {result && <div className="we-result" data-testid="we-alert-result">{result}</div>}</Card>
      <Card id="product" color="indigo" title="Web Table: Courses" wide>
        <table className="we-table" id="product" data-testid="we-product-table"><thead><tr><th>Instructor</th><th>Course</th><th>Price</th></tr></thead>
          <tbody>{COURSES.map(([a, b, c], i) => <tr key={i}><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody></table></Card>
      <Card id="hideshow" color="cyan" title="Element Displayed: Hide / Show">
        <button className="we-btn" id="hide-textbox" data-testid="we-hide" onClick={() => setShown(false)}>Hide</button>
        <button className="we-btn" id="show-textbox" data-testid="we-show" onClick={() => setShown(true)}>Show</button>
        <input type="text" id="displayed-text" data-testid="we-displayed" placeholder="Hide/Show Example" style={{ display: shown ? 'block' : 'none', marginTop: 10 }} /></Card>
      <Card id="fixed" color="green" title="Web Table: Fixed Header">
        <div className="we-scroll" data-testid="we-fixed-scroll"><table className="we-table" id="fixed-header-table" data-testid="we-fixed-table"><thead><tr><th>Name</th><th>Position</th><th>City</th><th>Amount</th></tr></thead>
          <tbody>{STAFF.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
        <p>Total Amount Collected: <b data-testid="we-total">{total}</b></p></Card>
      <Card id="hover" color="amber" title="Mouse Hover Menu">
        <div className="we-hover" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <button className="we-btn" id="mousehover" data-testid="we-hover-btn">Mouse Hover</button>
          <div className="we-menu" data-testid="we-hover-menu" style={{ display: hover ? 'block' : 'none' }}><a href="#top" data-testid="we-hover-top">Top</a><a href="/webelements" data-testid="we-hover-reload">Reload</a></div></div></Card>
      <Card id="frame" color="slate" title="iFrame" wide><iframe id="courses-iframe" data-testid="we-iframe" title="Courses" width="100%" height="170" srcDoc={FRAME} /></Card>
    </div>

    <h2 className="we-group">Modern HTML5 and UI components</h2>
    <div className="we-grid">
      <DateTimeCard /><SlidersCard /><FormCard /><FileCard /><SwitchCard /><DynamicCard /><TabsCard /><ModalCard /><InteractiveCard /><DragCard />
      <GridCard /><ScrollCard /><ShadowCard /><TextCard /><ActionsCard />
    </div>
  </div>;
}

export function WebElementsChild() {
  useTitle('WebElements Practice Lab - child');
  return <div className="we-page"><h1 data-testid="we-child-title">Child window / tab</h1>
    <p id="child-text">This page opened from the WebElements Practice Lab.</p><a className="we-btn c-blue" href="/webelements" id="child-back">Back to the lab</a></div>;
}
