import { daysFromOpeningDay, to_total, to_uniq, teams_by_wpct, createElement } from "./npb2023-utils.js";
import { NpbTeams as Teams } from "./npb2023-teams.js";
import { createSVG, createBackgroundRect, createTics, createAxis, createGroup, createTextbox, createPath, createCircle, createText, trunc, createScale } from "./svg-utils.js";

function create_chart(series, dates, league, options = {}) {
  const s = series.filter((o) => Teams.league(o.team) === league);
  console.log(s);
  const duration = dates.duration;
  const params = get_params(s, dates, duration, options.width, options.height);
  const svg = draw_chart(params);
  const div = createElement("div")({
    dataset: { league }
  });
  div.replaceChildren(svg);
  params.gSeries = div.querySelector(".series");
  draw_series(s, params, dates.duration);
  return div;
}

function get_params(series, dates, duration, width = 1152, height = 548) {
  const [xRange, yRange] = [
    [0, width],
    [0, height]
  ];
  const vw = trunc(width * 0.01);
  const year = dates.start.split("-")[0];
  const yMax = Math.max(...series.map((s) => s.above.max), 20);
  const yMin = Math.min(...series.map((s) => s.above.min), -20);
  const xShift = dates.duration - duration;

  const xAxis = [xShift, dates.duration + 0];
  const yAxis = [yMin - 2, yMax + 2].map((n) =>
    n % 5 == 0 ? n + Math.sign(n) : n
  );
  const xDomain = xAxis;
  const yDomain = [...yAxis].reverse();

  const padding = {
    top: trunc(Math.min(height * 0.08, 5 * vw)),
    right: trunc(width * 0.17),
    bottom: trunc(Math.min(height * 0.05, 4 * vw)),
    left: trunc(width * 0.04),
  };

  const xScale = createScale(xDomain, xRange, padding.left, padding.right);
  const yScale = createScale(yDomain, yRange, padding.top, padding.bottom);
  const dx = trunc(xScale(1) - xScale(0));
  const dy = trunc(yScale(0) - yScale(1));
  const u = Math.min(dx, dy);
  const scales = { xScale, yScale, dx, dy };

  const axis = {
    pathStyle: { "stroke-width": trunc(0.2 * vw) },
    lines: [
      [
        [xScale(xAxis[0]), yScale(0)],
        [xScale(xAxis[1]), yScale(0)],
      ],
      [
        [xScale(xShift), yScale(yAxis[0])],
        [xScale(xShift), yScale(yAxis[1])],
      ],
    ],
  };

  const xTics = "04,05,06,07,08,09,10"
    .split(",")
    .map((mm) => {
      return "01,15".split(",").map((dd) => `${year}-${mm}-${dd}`);
    })
    .flat()
    .concat([dates.end])
    .map((d) => {
      return {
        pos: daysFromOpeningDay(d, dates.start),
        text: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(`${d}T12:00`)),
      };
    })
    .filter((obj) => obj.pos <= xAxis[1] && obj.pos > xAxis[0])
    .filter((obj, i, ary) =>
      ary.length > 5 ? obj.text.endsWith("1") || i == ary.length - 1 : true
    )
    .filter(
      (obj, i, a) => i == a.length - 1 || obj.pos < a[a.length - 1].pos - 2
    );

  const yTics = [...new Array(30)]
    .map((n, i) => i * 5 - 60)
    .filter((n) => n < yAxis[1] && n > yAxis[0])
    .map((n) => {
      return { pos: n, text: n };
    });

  const tics = {
    xAxis: xAxis.map((v) => trunc(xScale(v))),
    yAxis: yAxis.map((v) => trunc(yScale(v))),
    xTics: xTics.map((o) => Object.assign(o, { pos: trunc(xScale(o.pos)) })),
    yTics: yTics.map((o) => Object.assign(o, { pos: trunc(yScale(o.pos)) })),
    xTicsPos: trunc(xScale(xShift) - width * 0.01),
    yTicsPos: trunc(yScale(yAxis[0]) + padding.bottom * 0.4),
    pathStyle: {
      "stroke-width": trunc(0.1 * vw),
    },
    labelStyle: {
      "font-size": Math.min(20, 1.5 * vw),
      "alignment-baseline": "middle",
    },
  };

  const league = Teams.league(series[0].team);
  const title = {
    text: `Games above .500, ${year} ${league} League`,
    attr: {
      x: width * 0.5,
      y: trunc(Math.min(height * 0.05, (padding.top + Math.min(28, 3 * vw)) * 0.45)),
      "font-size": Math.min(28, 3 * vw),
      "text-anchor": "middle",
      "alignment-baseline": "middle",
    },
    cls: ["title"],
  };

  const path = {
    fill: "none",
    "stroke-width": Math.min(dx, 0.6 * vw),
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  };
  const dot = {
    r: Math.min(u * 0.5, 0.6 * vw),
  };
  const label = {
    "font-size": 1.75 * vw,
    "alignment-baseline": "middle",
  };

  return {
    xRange, yRange, padding, xShift, scales, axis, tics, title, league, path, dot, label,
  }
}

function get_dates(games) {
  const gamedays = games.map(g => g.date).reduce(to_uniq).sort();
  return {
    start: gamedays.at(0),
    end: gamedays.at(-1),
    duration: daysFromOpeningDay(gamedays.at(-1), gamedays.at(0)),
  };
}

function get_series(games, dates) {
  const alldays = [...new Array(dates.duration)].map((_, i) => i + 1);
  const series = Teams.all()
    .map((team) => {
      const myGames = games.filter((g) => g.isGameOf(team));
      const win = myGames.filter(g => g.winner === team).length;
      const loss = myGames.filter(g => g.loser === team).length;

      const log = alldays
        .map((i) => myGames.find((o) => daysFromOpeningDay(o.date, dates.start) === i))
        ;
      const wlt = log
        .map((g) => {
          if (g?.winner === team) return 1;
          if (g?.loser === team) return -1;
          return 0;
        });
      const values = log.map((g, i) => {
        return {
          x: i + 1,
          y: wlt.slice(0, i + 1).reduce(to_total),
          opp: g ? g.opponentOf(team) : "off"
        }
      });
      const above = {
        min: Math.min(...values.map((pt) => pt.y)),
        max: Math.max(...values.map((pt) => pt.y)),
        final: values.at(-1).y,
      };
      return {
        team, win, loss, values, above
      }
    })
    .sort(teams_by_wpct);
  return series;
}

function draw_series(series, params, n = 40) {
  const { xShift, gSeries } = params;
  const { xScale, yScale, dx } = params.scales;

  gSeries.replaceChildren();
  [...series].reverse().forEach((s) => {
    const team = s.team;
    const g = createGroup({
      attr: {
        id: team,
      },
      dataset: { team },
      cls: [team, "series"],
    });

    const path = createPath({
      attr: Object.assign({}, params.path, {
        d:
          `M ${xScale(0)} ${yScale(0)}` +
          s.values
            .map(
              (w, i) =>
                ` ${i < xShift ? "M" : "L"} ${xScale(w.x)} ${yScale(w.y)}`
            )
            .join(""),
      }),
    });
    g.append(path);

    s.values
      .map((w, i) => {
        if (i < xShift - 1) return false;
        const c = createCircle({
          attr: Object.assign({}, params.dot, {
            cx: xScale(w.x),
            cy: yScale(w.y),
          }),
          dataset: { x: w.x, y: w.y, team: w.opp },
          cls: ["dot"],
        });
        return c;
      })
      .filter((c) => c)
      .forEach((c) => g.append(c));

    const labelText = createText({
      text: `${team} (${s.win}-${s.loss})`,
      attr: Object.assign({}, params.label, {
        x: xScale(n) + params.padding.right * 0.1,
        y: yScale(s.above.final),
      }),
      dataset: { y: s.above.final, yy: yScale(s.above.final) },
      cls: ["label"],
    });
    g.append(labelText);
    gSeries.append(g);
  });

}

const draw_chart = (params) => {
  const { xRange, yRange, tics, axis, title } = params;

  const fragment = document.createDocumentFragment();

  const svg = createSVG(xRange, yRange);

  const bgRect = createBackgroundRect(svg);
  const gTics = createTics(tics);
  const gAxis = createAxis(axis);
  const gSeries = createGroup({ cls: ["series"] });
  const gTitle = createTextbox(title);

  fragment.append(bgRect, gTics, gAxis, gSeries, gTitle);
  svg.append(fragment);
  return svg;
};

function fix_overlapping(targets) {
  if (targets.length === 0) return;
  const isOverlapped = (y, i, ary) => {
    if (!ary[i + 1]) return false;
    return y + h > ary[i + 1];
  };
  const h = Number(targets[0].getAttribute("font-size"));
  const step = h * 0.125;
  let bboxes = targets.map((el) => el.getBBox().y);

  while (bboxes.some(isOverlapped)) {
    const idx0 = bboxes.findIndex(isOverlapped);
    const label0 = targets[idx0];
    const y0 = Number(label0.getAttribute("y"));
    label0.setAttribute("y", trunc(y0 - step));

    const label1 = targets[idx0 + 1];
    const y1 = Number(label1.getAttribute("y"));
    label1.setAttribute("y", trunc(y1 + step));
    bboxes = targets.map((el) => el.getBBox().y);
  }
};

const css = `<link rel="stylesheet" href="/npb2023/css/npb2023-colors-applied.css"><style>
:host {
  display: block;
  --bg-color: var(--bg-color, crimson);
  --chart-width: calc(100vw - 20px);
  --chart-height: calc(100vh - 50px);
  --w: var(--chart-width);
  font-family: 'Noto Sans', sans-serif;
}
.bgRect {
  stroke: none;
  fill: var(--bg-color, cornsilk);
}

.tics,
.axis {
  stroke: var(--text-color, midnightblue);
  fill: none;
}
.tics path {
  stroke-opacity: 0.5;
}

.tics text {
  stroke: none;
  fill: var(--text-color, midnightblue);
}

.ytics {
  text-anchor: end;
}

.xtics {
  text-anchor: middle;
}
.series path {
  stroke: var(--team-color);
  stroke-opacity: 0.7;
  filter: drop-shadow(0px 1px 0px rgba(0, 0, 0, 0.9));
}
.series circle {
  fill: var(--team-color);
  fill-opacity: 0.7;
  filter: drop-shadow(0px 1px 0px rgba(0, 0, 0, 0.9));
}
[data-team="off"]{
  display: none;
}
.series text {
  fill: var(--team-color);
  font-weight: bold;
  //filter: drop-shadow(0px 1px 0px rgba(0, 0, 0, 0.9));
}

.textbox rect {
  fill: var(--bg-color);
}
</style>`;

class NpbAbove500 extends HTMLElement {
  static get observedAttributes() {
    return ["league"];
  }

  constructor() {
    super();
    this.render();
  }

  render() {

    const html = `
<div></div>
    `;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "league") {
      if (["Pacific", "Central"].indexOf(newValue) < 0) return;
      this.show(newValue);
    }
  }

  show(league) {
    if (!this.shadowRoot || !league) return;
    [...this.shadowRoot?.querySelectorAll(`div[data-league]`)].forEach((div) => {
      div.style.display = "none";
      if (div.dataset.league === league) div.style.display = "block";
      const targetLabels = [...div.querySelectorAll(`[data-league="${league}"] .label`)]
        .sort((a, b) => {
          const [aa, bb] = [a, b].map(el => Number(el.getAttribute("y")));
          if (aa > bb) return 1;
          if (aa, bb) return -1;
          return 0;
        });
      fix_overlapping(targetLabels);
    });
  }

  connectedCallback() {
    const container = document.querySelector(".container");
    const [width, height] = ["width", "height"].map((prop) => {
      const value = getComputedStyle(container)[prop];
      return Number(value.replace("px", ""));
    });
    document.addEventListener("ResultsLoaded", (e) => {
      const games = e.detail;
      const updated = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${games.at(-1).date}T12:00`));

      const dates = get_dates(games);
      const series = get_series(games, dates);
      this.charts = ["Pacific", "Central"].map((league) => {
        return create_chart(series, dates, league, {
          width, height,
          dataset: { league, updated: `After games of ${updated}` }
        });
      });
      this.shadowRoot.querySelector("div").replaceChildren(...this.charts);
      this.show(this.getAttribute("league"));
    });
  }
}

customElements.define("npb-above500", NpbAbove500);
export { NpbAbove500 };

