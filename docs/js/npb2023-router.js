const locationHandler = () => {
  const [_, site, app, ...opts] = location.pathname.split("/");
  let title;
  if (app === "standings" || app === "head-to-head") {
    const [league, ...rest] = opts;
    title = `${league} League Standings of NPB 2023 Season`;
    const standings = document.querySelector("npb-standings");
    standings.setAttribute("league", league);
    if (app === "head-to-head") {
      standings.setAttribute("page", "h2h");
    } else {
      standings.removeAttribute("page");
    }
  }
  document.querySelector("title").textContent = title;
}

const route = (e) => {
  e.preventDefault();
  if (e.target.href === window.location.href) return;
  window.history.pushState({}, null, e.target.href);
  locationHandler();
}

window.addEventListener("popstate", (_) => {
  locationHandler();
});

const css = `<style>
div {
  margin-block-end: .5em;
  font-family: 'Noto Sans', sans-serif;
  background: var(--npb-blue);
  box-shadow: rgb(0 0 0) 1px 0px 5px;
  overflow-x: auto;
}
ul {
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
li {
  white-space: nowrap;
}
div>ul {
  margin-block: 0;
  padding: 8px 0 8px .5em;
  width: 100%;
  color: white;
  height: 40px;
}
div>ul>li {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0.5em;
}
div>ul>li:nth-of-type(n+2) {
  border-left: 1px solid white;
}
li>ul {
  padding-inline-start: .5em;
}
[data-league="Pacific"] {
  --league-color: var(--pacific-league-blue);
}
[data-league="Central"] {
  --league-color: var(--central-league-green);
}
a {
  display: block;
  color: white;
  background: var(--league-color);
  text-decoration: none;
  padding: 0;
  width: 5em;
  text-align: center;
}
</style>`;

class NpbRouter extends HTMLElement {
  static get observedAttributes() {
    return ["league"];
  }

  constructor() {
    super();
  }

  render() {
    const html = `
<div>
<ul>
  <li>NPB2023</li>
  <li>Standings
    <ul>
      <li><a href="/npb2023/standings/Pacific" data-app="standngs" data-league="Pacific">Pacific</a></li>
      <li><a href="/npb2023/standings/Central" data-app="standngs" data-league="Central">Central</a></li>
    </ul>
  </li>
  <li>Head-to-head
    <ul>
      <li><a href="/npb2023/head-to-head/Pacific" data-app="head-to-head" data-league="Pacific">Pacific</a></li>
      <li><a href="/npb2023/head-to-head/Central" data-app="head-to-head" data-league="Central">Central</a></li>
    </ul>
  </li>
</ul>
</div>
    `;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;

    [...this.shadowRoot.querySelectorAll(`a[data-app]`)].forEach((a) => {
      a.addEventListener("click", route)
    });
  }
  connectedCallback() {
    this.render();
  }
}

customElements.define("npb-router", NpbRouter);
export { NpbRouter, route, locationHandler }
