# npb2023

Some data on 2023 season of Nippon Professional Baseball

- Standings [Central League](https://kurimareiji.github.io/npb2023/standings/Central) / [Pacific League](https://kurimareiji.github.io/npb2023/standings/Pacific)
- Head-to-head [Central League](https://kurimareiji.github.io/npb2023/head-to-head/Central) / [Pacific League](https://kurimareiji.github.io/npb2023/head-to-head/Pacific)
- above .500 [Central League](https://kurimareiji.github.io/npb2023/above500/Central) / [Pacific League](https://kurimareiji.github.io/npb2023/above500/Pacific)

![above .500 / Pacific League](/docs/PLabove500.png)
![above .500 / Central League](/docs/CLabove500.png)

## Stadiums 公式戦開催球場のまとめ (JSON)

- [npb2023-stadiums.json](https://kurimareiji.github.io/npb2023/npb2023-stadiums.json)

- [公式戦開催全球場 | 球場情報 | NPB.jp 日本野球機構](https://npb.jp/stadium/)

から、直近開催時の球場表記、正式球場名、所在地に加え、地図から緯度経度を抽出して、
公式戦日程表の球場名の日本語、英語を集めて、
それっぽい英語表記を加えた。

## Schedules 試合日程・結果 (JSON)

- [npb2023-schedules.json](https://kurimareiji.github.io/npb2023/npb2023-schedules.json)

- [試合日程・結果 | NPB.jp 日本野球機構](https://npb.jp/games/2023/schedule_04_detail.html)

の3月から10月までのデータをJSONにまとめたもの。
中止31試合、ノーゲーム2試合を含む。
オールスターやポストシーズンの試合は含まない。

## Linescores (JSON)

- [npb2023-linescores.json](https://kurimareiji.github.io/npb2023/npb2023-linescores.json)

レギュラーシーズン858試合のラインスコアまとめ。「雨天のためコールドゲーム」が3試合。
