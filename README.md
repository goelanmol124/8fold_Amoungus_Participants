# Among Us AI Agent Hackathon — Participant Guide

Welcome to the EightFold AmongUs hackathon. You will build an AI agent that plays Among Us in a high-fidelity, turn-based simulation engine. Your agent will compete against other teams' agents in a live tournament.

---

## Tournament Schedule

| Time | Duration | What Happens |
|------|----------|--------------|
| 10:00 - 10:30 | 30 min | **Kickoff** — rules walkthrough, engine demo, repo setup |
| 10:30 - 12:45 | 2h 15m | **Dev Sprint 1** — build your agent |
| 12:45 - 1:15 | 30 min | **Checkpoint 1 Submission** — submit your agent, tournament runs, lunch begins |
| 1:15 - 1:45 | 30 min | **Checkpoint 1 Showcase** — watch highlighted matches on screen |
| 1:45 - 3:30 | 1h 45m | **Dev Sprint 2** — iterate based on what you learned |
| 3:30 - 3:45 | 15 min | **Checkpoint 2 Submission** — submit updated agent |
| 3:45 - 4:15 | 30 min | **Checkpoint 2 Showcase** — watch matches, interim leaderboard |
| 4:15 - 5:15 | 1h | **Final Sprint** — last improvements |
| **5:15** | — | **Code Freeze** — hard deadline, no exceptions |
| 5:15 - 5:45 | 30 min | **Final Tournament** — full evaluation runs |
| 5:45 - 6:00 | 15 min | **Results and Awards** — leaderboard reveal |

### Submission Rules

- At each checkpoint, submit your agent file to the shared submission folder.
- Name your file: `teamname_checkpoint_N.py` (e.g., `alpha_checkpoint_1.py`).
- If you miss a checkpoint deadline, your previous submission (or the default `RuleBasedBot`) will be used.
- **Code Freeze at 5:15 PM is final.** Late submissions will use their Checkpoint 2 version.

---

## Getting Started

### 1. Installation

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and sync the environment
git clone <repo-url>
cd 8fold_Amoungus
uv sync
```

### 2. Configure Your LLM (Optional)

If you want to use an LLM-powered agent, set up an API key:

```bash
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

You do NOT need an LLM. Rule-based agents with good strategy can win.

### 3. Run a Local Game

```bash
python main.py play --agents path/to/your_agent.py rulebased rulebased rulebased --verbose
```

### 4. Visualize a Match

After running a game, a `game_log.json` is created. Open `visualiser/index.html` in any browser, click **Load Game Log**, and select your file.

**Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `<` / `>` | Previous / Next round |
| `+` / `-` | Speed up / Slow down |
| `M` | Toggle meeting overlay |

---

## What You Submit

You submit **a single Python file** containing your agent class. Nothing else.

Your file must:
1. Contain exactly one class that inherits from `BaseAgent`
2. Be fully self-contained (all your logic in one file, imports at the top)
3. Not modify, monkey-patch, or subvert any framework files

Use `template_agent.py` as your starting point.

### What You CAN Do

- Import and use anything from the `engine` package (read-only):
  - `from engine.engine import BaseAgent, Role`
  - `from engine.agents import parse_llm_json, format_observation_as_text, bfs_shortest_path`
  - `from engine.config import MAP_ADJACENCY, ALL_ROOMS, TASK_POOL`
- Use LLM APIs (OpenRouter, OpenAI, Anthropic, etc.)
- Use these standard/common libraries:
  - **Standard library**: `random`, `collections`, `math`, `re`, `json`, `os`, `logging`, `functools`, `itertools`, `heapq`, `copy`, `typing`, `dataclasses`, `enum`, `abc`, `time`, `statistics`
  - **ML/Data**: `numpy`, `scikit-learn`
  - **LLM frameworks**: `langchain`, `llama-index`, `openai`, `anthropic`, `requests`
  - **Utilities**: `pydantic`
- Maintain internal state, memory, and strategy across rounds
- Use pathfinding, probabilistic reasoning, game theory — any algorithmic approach
- Call external LLM APIs (at your own cost and latency risk — the engine has a 30-second timeout per agent call)

### What You CANNOT Do

- **Modify framework files**: Do not change anything in `engine/`, `main.py`, or `visualiser/`. Submissions that require framework changes will be disqualified.
- **Read or write files on disk** (no saving state between games, no reading other agents' files)
- **Access the network** for anything other than LLM API calls (no scraping, no communicating with teammates' agents)
- **Use subprocess, exec, eval**, or any code execution/injection
- **Install arbitrary packages**: If you need a library not listed above, ask an organizer. We will approve reasonable requests.
- **Exceed resource limits**: Your agent must respond within 30 seconds per call. Agents that consistently timeout will forfeit their turns.
- **Interfere with other agents**: No crashing the game, no memory manipulation, no exploiting the Python runtime

### Do NOT Modify These Files

| File/Directory | Why |
|----------------|-----|
| `engine/engine.py` | Core game simulation — shared by all teams |
| `engine/config.py` | Game configuration and map — must be identical for fair play |
| `engine/agents.py` | Built-in agent implementations and utilities |
| `engine/tournament.py` | Tournament runner — used for official evaluation |
| `engine/visualizer.py` | Visualization tools |
| `engine/replay_theater.py` | Replay system |
| `main.py` | CLI entry point |
| `visualiser/` | Web replay theater |

---

## Building Your Agent

### Core Methods

Your agent must implement these 5 methods:

```python
from engine.engine import BaseAgent

class MyAgent(BaseAgent):
    def on_game_start(self, config: dict) -> None:
        """Called once at game start. Store your ID, role, map, and tasks."""

    def on_task_phase(self, observation: dict) -> dict:
        """Called every round. Return an action like {"action": "move", "target": "Admin"}."""

    def on_discussion(self, observation: dict) -> str:
        """Called during meetings. Return a chat message (max 500 chars)."""

    def on_vote(self, observation: dict) -> str:
        """Called at vote time. Return a player ID or "skip"."""

    def on_game_end(self, result: dict) -> None:
        """Called when the game ends."""
```

### Available Actions (Task Phase)

| Action | Target | Who Can Use | Description |
|--------|--------|-------------|-------------|
| `move` | Room name | Everyone | Move to an adjacent room |
| `do_task` | Task ID | Crewmates / Ghosts | Work on a task at your location |
| `kill` | Player ID | Impostors | Kill a player in your room |
| `report` | — | Everyone (alive) | Report a body in your room |
| `call_emergency` | — | Everyone (alive) | Call meeting (must be in Cafeteria) |
| `sabotage` | `reactor` / `o2` / `lights` / `comms` | Impostors | Trigger a sabotage |
| `fix_sabotage` | — | Everyone | Fix active sabotage at fix location |
| `fake_task` | — | Impostors | Pretend to do a task |
| `wait` | — | Everyone | Do nothing |

### Resolution Order

Each round resolves in this order:
1. Cooldowns tick down
2. Movement resolves
3. Kills resolve (after movement — you must be in the same room)
4. Tasks resolve
5. Reports / Emergency meetings resolve

### Key Tips

- Your role is assigned randomly each game — your agent must handle **both** crewmate and impostor.
- As **crewmate**: prioritize completing tasks and reporting bodies.
- As **impostor**: kill when alone with a target, sabotage strategically, and deceive in meetings.
- **Ghosts** (dead players) can still move and complete tasks. Finish your tasks to help your team.
- The `observation` dict contains everything you need — your location, nearby players, task list, events, and available actions.
- Use `format_observation_as_text(obs)` to convert observations into readable text for LLM prompts.
- Use `bfs_shortest_path(start, end, MAP_ADJACENCY)` for pathfinding.

---

## Game Mechanics

- **Map**: 14 rooms (The Skeld layout) with fixed adjacency.
- **Crewmates** win by completing all tasks or ejecting all impostors.
- **Impostors** win by reaching majority (kills) or critical sabotage timeout (reactor/O2).
- **Kill cooldown**: 6 rounds after each kill.
- **Sabotages**: Reactor and O2 are critical (countdown to impostor win). Lights and Comms are disruptive (blind crewmates / disable task info).
- **Meetings**: 3 discussion rounds, then vote. Majority vote ejects a player.
- **Max rounds**: 90 (timeout results in a draw — neither side wins).

---

## Tournament Scoring

Games are scored using an **Elo rating system**:
- All teams start at 1200 Elo
- Winning increases your Elo, losing decreases it
- Beating higher-rated teams gives more Elo than beating lower-rated ones
- Matchups are balanced — every team plays an equal number of games as impostor and crewmate

---

## Local Testing

```bash
# Quick test against built-in bots
python main.py play --agents your_agent.py rulebased rulebased rulebased --verbose

# Test with more players
python main.py play --agents your_agent.py your_agent.py rulebased rulebased rulebased rulebased rulebased --verbose

# Run a local mini-tournament (put agent files in a folder)
python main.py tournament --agents-dir ./my_agents --games 10
```

---

## Repository Structure

```
8fold_Amoungus/
├── main.py                  # CLI entry point (DO NOT MODIFY)
├── template_agent.py        # Your starting point
├── engine/                  # Game engine (DO NOT MODIFY)
│   ├── engine.py            # Core simulation
│   ├── config.py            # Game config, map, tasks
│   ├── agents.py            # Built-in agents + utilities
│   ├── tournament.py        # Tournament runner
│   ├── visualizer.py        # Tkinter visualizer
│   └── replay_theater.py    # Pygame replay
├── visualiser/              # Web replay theater (DO NOT MODIFY)
├── examples/                # Reference agent implementations
│   ├── simple_rule_based_agent.py
│   └── open_router_personality_agent.py
└── .env.example             # API key template
```

---

## FAQ

**Q: Do I need to use an LLM?**
No. A well-designed rule-based agent with good pathfinding, voting logic, and situational awareness can beat a poorly-prompted LLM agent. Use whatever approach you think will win.

**Q: What happens if my agent crashes?**
The engine catches exceptions and treats them as a `wait` action. Your agent stays in the game but loses that turn. Consistent crashes will cost you games.

**Q: Can I use multiple files?**
No. Submit a single `.py` file. All your logic must be in that one file. You can define helper classes and functions within it.

**Q: What if I need a library that's not on the allowed list?**
Ask an organizer. We'll approve it if it's reasonable and doesn't give an unfair advantage (e.g., no game-hacking tools, no direct process manipulation libraries).

**Q: How are impostor/crewmate roles assigned in the tournament?**
Roles are balanced across the tournament. Every team plays an equal number of games as impostor and crewmate, so your overall Elo reflects skill in both roles.
