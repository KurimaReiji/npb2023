const locationHandler = () => {
  const [_, app, ...opts] = location.pathname.split("/");
  let title;
  if (app === "standings") {
    const [league, ...rest] = opts;
    title = `${league} League Standings of NPB 2023 Season`;
    document.querySelector("npb-standings").setAttribute("league", league);
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
  padding-block-end: .5em;
  font-family: 'Noto Sans', sans-serif;
}
ul {
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
div>ul {
  margin-block: 0;
  padding: 8px 0 8px .5em;
  width: 100%;
  background: var(--npb-blue);
  color: white;
  box-shadow: rgb(0 0 0) 1px 0px 5px;
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
      <li><a href="/standings/Pacific" data-app="standngs" data-league="Pacific">Pacific</a></li>
      <li><a href="/standings/Central" data-app="standngs" data-league="Central">Central</a></li>
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
