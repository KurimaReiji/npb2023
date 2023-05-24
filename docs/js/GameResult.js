import { NpbTeams as Teams } from "./npb2023-teams.js";

class GameResult {
  constructor({ date, home, road, score, place, status }) {
    this.date = date;
    const scores = score.replace(/\s+/g, "").split("-").map((s) => Number(s));
    this.sign = Math.sign(scores[0] - scores[1]);
    this.home = {
      team: home,
      score: scores[0]
    };
    this.road = {
      team: road,
      score: scores[1]
    };
    this.place = place;
    this.status = status;
  }

  get winner() {
    return [this.road.team, "Tied", this.home.team][this.sign + 1];
  }

  get loser() {
    return [this.home.team, "Tied", this.road.team][this.sign + 1];
  }

  get isTied() {
    return this.sign === 0;
  }

  get isOneRunGame() {
    return Math.abs(this.home.score - this.road.score) === 1;
  }

  get isShutOutGame() {
    return this.home.score === 0 || this.road.score === 0;
  }

  get isTenPlusRunsGame() {
    return this.home.score > 9 || this.road.score > 9;
  }

  get isInterLeagueGame() {
    return Teams.league(this.home.team) !== Teams.league(this.road.team);
  }

  isGameOf(team) {
    return [this.home, this.road].some(o => o.team === team);
  }

  opponentOf(team) {
    return [this.home, this.road].find(o => o.team !== team).team;
  }

  runsScored(team) {
    return [this.home, this.road].find(o => o.team === team).score;
  }

  runsAllowed(team) {
    return [this.home, this.road].find(o => o.team !== team).score;
  }
}

const toGameResult = (obj) => (new GameResult(obj));

export { GameResult, toGameResult };

/* const padStartWithSpace = (i) => (n) => n.toString().padStart(i, " ");
const padEndWithSpace = (i) => (n) => n.toString().padEnd(i, " ");
const pad2 = padStartWithSpace(2);
const padEnd2 = padEndWithSpace(2);

const teams = ['オリックス・バファローズ', '福岡ソフトバンクホークス', '埼玉西武ライオンズ', '東北楽天ゴールデンイーグルス', '千葉ロッテマリーンズ', '北海道日本ハムファイターズ', '東京ヤクルトスワローズ', '横浜DeNAベイスターズ', '阪神タイガース', '読売ジャイアンツ', '広島東洋カープ', '中日ドラゴンズ'];
const team = teams[11];
console.log(team);
fetch("https://kurimareiji.github.io/npb2023-results/npb2023-results.json")
  .then(r => r.json())
  .then(inputs => {
    const games = inputs
      .map(obj => new GameResult(obj))
      .filter(g => g.isGameOf(team))
      //.filter(g => g.isOneRunGame)
      //.filter(g => g.isShutOutGame)
      //.filter(g => g.isTenPlusRunsGame)
      .map(g => {
        return `${pad2(g.runsScored(team))}-${padEnd2(g.runsAllowed(team))} ${g.opponentOf(team)}`;
      })
      ;
    console.log(games.join("\n"));
  })
 */