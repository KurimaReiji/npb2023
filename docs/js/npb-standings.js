import { createElement, games_at_home, games_behind, games_on_road, get_records, teams_by_wpct } from "./npb2023-utils.js";
import { NpbTeams as Teams } from "./npb2023-teams.js";

const items = ["Team", "W", "L", "T", "PCT", "GB", "blank", "L10", "STRK", "blank", "RS", "RA", "Diff", "RS/G", "RA/G", "blank", "X-W/L", "Luck", "blank", "1 RUN", "SHO", "10+R"];

function getRecords(data) {
  const sorted = Teams.all()
    .map((team) => {
      const myGames = data.filter((o) => o.isGameOf(team));
      const records = get_records(team)(myGames);
      const home = Object.assign(get_records(team)(myGames.filter(games_at_home(team))), { team, group: "home" });
      const road = Object.assign(get_records(team)(myGames.filter(games_on_road(team))), { team, group: "road" });
      return Object.assign({ team }, records, { home, road });
    })
    .sort(teams_by_wpct)
    ;
  // add games behind
  ["Central", "Pacific"].forEach(league => {
    const members = sorted.filter(obj => Teams.league(obj.team) === league);
    const leader = members[0];
    members.forEach((obj) => {
      obj.gb = games_behind(obj.win, obj.loss, leader.win, leader.loss);
    });
  });
  return sorted;
}

function to_tdmap(o) {
  const tds = new Map();
  tds.set("Team", createElement("td")({
    text: "group" in o ? o.group : o.team,
    dataset: { item: "Team" }
  }));
  [
    ["W", o.win], ["L", o.loss], ["T", o.tied],
    ["RS", o.rs], ["RA", o.ra], ["Diff", o.rdiff],
    ["Luck", Math.round(Number(o.xwl.luck))],
    ["STRK", o.strk],
  ].forEach(([key, text]) => {
    const td = createElement("td")({
      text,
      dataset: { item: key }
    });
    tds.set(key, td);
  });
  tds.set("PCT", createElement("td")({
    text: Number(o.winpct).toFixed(3).replace(/^0/, ""),
    dataset: { item: "PCT" }
  }));
  const gb = createElement("td")({
    text: (("group" in o) && true) ? "" : o.gb.padStart(4, "X").replace("XXXX", ""),
    dataset: { item: "GB" }
  });
  gb.innerHTML = gb.textContent.replace(/X+/, "&ensp;");
  tds.set("GB", gb);
  [
    ["RS/G", o.rs / o.g],
    ["RA/G", o.ra / o.g],
  ].forEach(([key, val]) => {
    const td = createElement("td")({
      text: val.toFixed(2),
      dataset: { item: key }
    });
    tds.set(key, align_to_char(td));
  });
  [
    ["L10", [o.last10.win, o.last10.loss], "-"],
    ["X-W/L", [o.xwl.win, o.xwl.loss], "-"],
    ["1 RUN", [o.oneRun.win, o.oneRun.loss], "-"],
    ["SHO", [o.shutOut.pitching, o.shutOut.batting], ","],
    ["10+R", [o.tenPlusRun.scored, o.tenPlusRun.allowed], ","],
  ].forEach(([key, vals, char]) => {
    const td = createElement("td")({
      text: vals.join(char),
      dataset: { item: key, align: char }
    });
    tds.set(key, align_to_char(td));
  });

  tds.set("blank", createElement("td")({
    text: "",
    dataset: { item: "blank" }
  }));

  Teams.all().forEach((team) => {
    const key = `vs. ${Teams.initial(team)}`;
    const obj = o.headToHead.find(o => o.opponent === team) || { win: "0", loss: "0" };
    const td = createElement("td")({
      text: team === o.team ? "" : `${obj?.win}-${obj?.loss}`,
      dataset: { item: key, align: "-" }
    });
    tds.set(key, align_to_char(td));
  });

  return tds;
}
function create_tr(o, items) {
  const tr = createElement("tr")({ dataset: { team: o.team } });
  const tds = to_tdmap(o);
  tr.replaceChildren(...items.map(item => tds.get(item).cloneNode(true)));
  return tr;
}

function align_to_char(td) {
  if (!td.dataset.align | !td.textContent) return td;
  const [win, loss] = td.textContent.split(td.dataset.align);
  td.innerHTML = [win.padStart(2).slice(-2), loss.padEnd(2).slice(0, 2)].map((s) => s.replace(" ", "&ensp;")).join(td.dataset.align);
  return td;
};

function create_table(records, league, items, options = {}) {
  const data = records.filter((obj) => Teams.league(obj.team) === league);
  const h2h = records
    .sort((a, b) => {
      if (Teams.league(a.team) === Teams.league(b.team)) return 0;
      if (Teams.league(a.team) === league) return -1;
      if (Teams.league(b.team) === league) return 1;
      return 0;
    })
    .map(o => `vs. ${Teams.initial(o.team)}`);
  const itemsWh2h = items.concat(h2h);
  const table = createElement("table")(options);
  const thead = create_thead(itemsWh2h);
  const tbody = create_tbody(data, itemsWh2h);

  table.replaceChildren(thead, tbody);
  table.style.display = "none";
  return table;
}

function create_tbody(records, items) {
  const tbody = createElement("tbody")({});
  const trs = records.map((o) => {
    return [create_tr(o, items), create_tr(o.home, items), create_tr(o.road, items)];
  }).flat();
  tbody.replaceChildren(...trs);
  return tbody;
}

function create_thead(items) {
  const thead = createElement("thead")({});
  const ths = items
    .map((text) => {
      return createElement("th")({ text: text === "blank" ? "" : text, dataset: { item: text } })
    });
  const theadTr = createElement("tr")({});
  theadTr.replaceChildren(...ths);
  thead.replaceChildren(theadTr);
  return thead;
}

function set_league_header(thead) {
  const leagueHeader = thead.querySelector(`[data-item="Team"]`);
  leagueHeader.textContent = league;
  leagueHeader.dataset.league = league;
}

const css = `<style>
:host {
  --gap: 8px;
  --note-height: .85em;
  --blankcolumn-width: 2.2%;
  --bg-white: white;
  --self-bg-color: var(--bg-color, cornsilk);
  display: block;
}
div {
  overflow: auto;
  padding-block-end: var(--note-height);
}
table {
  position: relative;
  border-collapse: collapse;
  font-family: 'Noto Sans', sans-serif;
  width: 100%;
}
th {
  font-weight: normal;
  text-align: right;
  padding-block: 0 var(--gap);
}
th,
td{
  white-space: nowrap;
  box-sizing: border-box;
}
tbody>tr:nth-of-type(3n+1) {
  border-top: 6px solid var(--team-color);
  line-height: 1.8;
}
tbody>tr:nth-of-type(3n+1)>td:nth-of-type(1){
  text-align: left;
}
tbody tr:nth-of-type(3n+3) td {
  padding-block: 0 var(--gap);
}

[data-item="Team"] {
  width: 6em;
  text-align: left;
  padding-inline: .5em .25em;
}
tbody>tr:nth-of-type(3n+2) [data-item="Team"],
tbody>tr:nth-of-type(3n+3) [data-item="Team"] {
  text-align: right;
}
[data-item="T"],
[data-item="L"],
[data-item="W"] {
  min-width: 2em;
  text-align: right;
  padding-inline: 0 .25em;
}
[data-item="PCT"] {
  min-width: 2.25em;
  text-align: right;
  padding-inline: 0 .25em;
}
[data-item="GB"],
[data-item="Diff"],
[data-item="RA/G"],
[data-item="RS/G"],
[data-item="RA"],
[data-item="RS"] {
  text-align: right;
  padding-inline: 0 .25em;
}
[data-item="STRK"],
[data-item="Luck"] {
  text-align: right;
  padding-inline: 0 .5em;
}
[data-item="X-W/L"] {
  text-align: center;
  padding-inline: .175em;
}
[data-item="L10"],
[data-item="10+R"],
[data-item="SHO"],
[data-item="1 RUN"] {
  text-align: center;
}
[data-item="blank"] {
  width: var(--blankcolumn-width);
}
.h2h [data-item="blank"] {
  width: calc(.25 * var(--blankcolumn-width));
}
[data-item^="vs. "] {
  text-align: center;
  display: none;
}
.h2h [data-item^="vs. "] {
  display: table-cell;
}
.h2h [data-item="Diff"],
.h2h [data-item="RA"],
.h2h [data-item="RS"],
.h2h [data-item="RA/G"],
.h2h [data-item="RS/G"],
.h2h [data-item="Luck"],
.h2h [data-item="X-W/L"],
.h2h [data-item="10+R"],
.h2h [data-item="SHO"],
.h2h [data-item="1 RUN"],
.h2h [data-item="STRK"],
.h2h [data-item="L10"] {
  display: none;
}
tbody>tr:nth-of-type(3n+1) td {
  font-weight: 600;
}

/* table backgrounds */
table {
  background: var(--bg-white);
}
th {
  --border: calc(100% - var(--gap,0));
  background-image: linear-gradient(
    180deg,
    var(--league-color) 0%,
    var(--league-color) var(--border),
    var(--self-bg-color) var(--border),
    var(--self-bg-color) 100%
  );
  color: white;
}
tbody tr:nth-of-type(3n+1) {
  background: #ececec;
}
tbody tr:nth-of-type(3n+1) td {
  background: var(--team-bgcolor);
}
tbody tr:nth-of-type(3n+2) td {
  background: var(--team-bgcolor);
}
tbody tr:nth-of-type(3n+3) td {
  --border: calc(100% - var(--gap,0));
  --border-line: calc(var(--border) + 1px);
  --border-color: lightgray;
  background: linear-gradient(180deg, 
    var(--team-bgcolor) 0%,
    var(--team-bgcolor) var(--border),
    var(--border-color) var(--border),
    var(--border-color) var(--border-line),
    var(--bg-color) var(--border-line),
    var(--bg-color) 100%);
}
th[data-item^="vs. "] {
  background: linear-gradient(
    180deg,
    var(--team-color) 0%,
    var(--team-color) var(--border),
    var(--self-bg-color) var(--border),
    var(--self-bg-color) 100%
  );
}
th[data-item="vs. B"] {
  --team-color: var(--buffaloes-gold);
}
th[data-item="vs. H"] {
  --team-color: var(--hawks-gold);
}
th[data-item="vs. M"] {
  --team-color: var(--marines-silver);
}
th[data-item="vs. L"] {
  --team-color: var(--lions-navy);
}
th[data-item="vs. E"] {
  --team-color: var(--eagles-winered);
}
th[data-item="vs. F"] {
  --team-color: var(--fighters-blue);
}
th[data-item="vs. S"] {
  --team-color: var(--swallows-green);
}
th[data-item="vs. T"] {
  --team-color: var(--tigers-yellow);
}
th[data-item="vs. G"] {
  --team-color: var(--giants-orange);
}
th[data-item="vs. DB"] {
  --team-color: var(--baystars-darkblue);
}
th[data-item="vs. C"] {
  --team-color: var(--carp-red);
}
th[data-item="vs. D"] {
  --team-color: var(--dragons-lightblue);
}

table:after {
  content: attr(data-updated);
  font-size: var(--note-height);
  line-height: 1;
  color: var(--text-color, #333);
  position: absolute;
  bottom: calc(-0.8 * var(--note-height));
  right: var(--gap);
}
.notes {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  font-size: .85em;
  padding-inline: 0;
  margin-block: 1rem 0;
}
.h2h ~ .notes {
  display: none;
}
li {
  margin-inline-end: 1.2em;
}
</style>`;

class NpbStandings extends HTMLElement {
  static get observedAttributes() {
    return ["league", "page"];
  }

  constructor() {
    super();
    this.render();
  }

  show(league) {
    if (!this.shadowRoot) return;
    if (!league) return;
    [...this.shadowRoot?.querySelectorAll(`table[data-league]`)].forEach((tbl) => {
      tbl.style.display = "none";
      if (tbl.dataset.league === league) tbl.style.display = "table";
    });
  }

  render() {
    const html = `
<div></div>
<ul class="notes">
  <li>L10:&nbsp;Record in the Last 10 Games</li>
  <li>STRK:&nbsp;Current&nbsp;Streak</li>
  <li>X-W/L:&nbsp;Expected Win-loss Record Based on Runs Scored and Runs Allowed</li>
  <li>Luck:&nbsp;The difference between the actual W-L and Pythagorean W-L</li>
  <li>1&nbsp;Run:&nbsp;Record in 1-run games</li>
  <li>SHO:&nbsp;Shutout Games (Pitching, Batting)</li>
  <li>10+R:&nbsp;10 Runs and more (Scored, Allowed)</li>
</ul>
    `;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css} <link rel="stylesheet" href="/npb2023/css/npb2023-colors-applied.css">${html}`;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "league") {
      if (["Pacific", "Central"].indexOf(newValue) < 0) return;
      this.show(newValue);
    } else if (name === "page") {
      const div = this.shadowRoot.querySelector("div");
      if (newValue === "h2h") {
        div.classList.add("h2h");
      } else
        div.classList.remove("h2h");
    }
  }

  connectedCallback() {
    document.addEventListener("ResultsLoaded", (e) => {
      const games = e.detail;
      const updated = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${games.at(-1).date}T12:00`));

      const records = getRecords(games);
      this.tables = ["Pacific", "Central"].map((league) => {
        return create_table(records, league, items, {
          dataset: { league, updated: `After games of ${updated}` }
        });
      });
      this.shadowRoot.querySelector("div").replaceChildren(...this.tables);
      this.show(this.getAttribute("league"));
    });
  }
};

customElements.define("npb-standings", NpbStandings);
export { NpbStandings };

