# Trade Game

A multiplayer world-trade and nation-management game. Every player leads a random country in a shared world of 60 nations on a real world map. Players trade on a live market, make deals with the computer and with each other, run their country's budget, laws and research, and can go to war.

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm start
```

Open http://localhost:3000. To play with someone on the same Wi-Fi, they can open `http://<your-computer's-IP>:3000`.

## Put it online with Render

1. Create a new repository on GitHub and upload everything in this folder (not `node_modules`).
2. On [render.com](https://render.com), click **New → Blueprint**, pick the repository, and click **Apply**. Render reads `render.yaml` and sets everything up.
   - Alternatively: **New → Web Service**, pick the repository, then set the **Build Command** to `npm install` and the **Start Command** to `npm start`.
3. When the deploy finishes, open your `https://….onrender.com` address and send the link to your friends.

### Keeping games when the server restarts

On Render's free plan the server goes to sleep after about 15 minutes with no visitors, and **games in progress are lost** when it does. The first visit after that also takes up to a minute while it wakes up.

To keep games, use a paid instance and add a **persistent disk** (for example mounted at `/var/data`). Then add the environment variable `DATA_DIR=/var/data`. The server saves every game there and restores it after restarts and deploys.

Other optional environment variables:

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `3000` | Port to listen on (Render sets this automatically) |
| `DATA_DIR` | not set | Folder for saved games; games are kept in memory only without it |
| `ROOM_IDLE_HOURS` | `72` | Delete games nobody has opened for this many hours |

### Scaling

One server instance easily handles many rooms: each room runs in its own isolated copy of the game, and a month takes only milliseconds to simulate. Keep it at **one instance**. Rooms live inside that server, so several instances behind a load balancer would split players of the same game between machines. If you ever need more, upgrade the instance size instead.

## How to play

- **Create a game** to get a 4-letter code, or **join** with a friend's code. Up to 8 players per game; you can also play alone.
- In the lobby everyone sees their random country and can **reroll** it. The host picks a turn timer and presses **Start**.
- A month passes when every online player presses **Ready**, or when the turn timer runs out.
- Deals and peace offers to other players need their approval (they appear in the **Trade** tab).
- The **Global** tab covers globalization:
  - **Tariffs and the WTO:** import tariffs earn money and please local business, but other countries hit back at your exports. WTO members get lower fees and friendlier partners but can't go above 10%.
  - **Trade blocs:** six blocs exist at the start (EU, North American Trade Pact, ASEAN, Mercosur, GCC, African Free Trade Area). Apply to one, invite countries, or found your own. Members trade more easily and defend each other.
  - **Foreign investment:** build plants in other countries and earn half their profits every month. Foreign companies also offer to build in yours, and you can nationalize them (investors won't like it).
  - **Culture and ideas:** soft power brings tourists and friendlier relations. Cultural exchanges share research, and technologies spread: anything your trade partners, bloc members or investment partners already know is cheaper for you to research.
- If your government falls (bankruptcy, revolution, losing an election or a coup), the computer takes over your country and you can keep watching.
- Close the tab any time: your browser remembers your seat, and reopening the site puts you back in.

## Project layout

```
server.js          Express + WebSocket server: rooms, lobby, turns, saving
public/game.js     All game rules (shared by the server and the browser)
public/client.js   The interface
public/index.html  Page layout and styles
public/world.json  Country borders (Natural Earth 1:110m via world-atlas)
render.yaml        Render blueprint
```

The server is the source of truth: browsers only send actions ("buy 10 oil", "declare war"), and the server applies them with the same rules in `game.js` and sends the updated world back to everyone.

Map data: [Natural Earth](https://www.naturalearthdata.com/) (public domain), via the [world-atlas](https://github.com/topojson/world-atlas) package.
