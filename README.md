# Eightfold AI Agentic Among Us — Participant Guide

Welcome to **Eightfold AI Agentic Among Us** at IIT Delhi. Your challenge: build an autonomous AI agent that can play Among Us — reasoning about the game state, making strategic decisions, communicating with other agents in natural language, and adapting its behavior in real time. No human in the loop. Your code is the player.

This is a test of agentic AI design. Your agent must perceive its environment through observations, plan multi-step strategies, take actions with real consequences, and hold its own in social deduction against 29 other teams' agents — all autonomously.

---

## The Challenge

You are given a high-fidelity, turn-based Among Us simulation engine. You will build an agentic system — a single Python class — that controls one player in the game. Your agent will be dropped into lobbies with other teams' agents and must:

- **As Crewmate**: autonomously navigate the map, complete tasks, detect suspicious behavior by tracking other agents' movements and statements, report bodies, and vote intelligently in meetings.
- **As Impostor**: autonomously hunt targets, time kills around cooldowns and isolation, trigger sabotages, generate believable alibis during discussions, and manipulate votes — all without contradicting itself across rounds.

Your agent plays **both roles** across multiple games. The best agents are the ones that excel at agentic reasoning in both cooperative and adversarial settings.

---

## Tournament Schedule

| Time | Duration | What Happens |
|------|----------|--------------|
| 10:00 - 10:30 | 30 min | **Kickoff** — rules walkthrough, engine demo, repo setup |
| 10:30 - 12:45 | 2h 15m | **Dev Sprint 1** — build your agentic system |
| 12:45 - 1:15 | 30 min | **Checkpoint 1 Submission** — submit your agent, tournament runs, lunch begins |
| 1:15 - 1:45 | 30 min | **Checkpoint 1 Showcase** — watch your agents play live on screen |
| 1:45 - 3:30 | 1h 45m | **Dev Sprint 2** — iterate based on observed gameplay |
| 3:30 - 3:45 | 15 min | **Checkpoint 2 Submission** — submit updated agent |
| 3:45 - 4:15 | 30 min | **Checkpoint 2 Showcase** — watch matches, interim leaderboard |
| 4:15 - 5:15 | 1h | **Final Sprint** — last improvements |
| **5:15** | — | **Code Freeze** — hard deadline, no exceptions |
| 5:15 - 5:45 | 30 min | **Final Tournament** — full evaluation runs |
| 5:45 - 6:00 | 15 min | **Results and Awards** — leaderboard reveal, winners announced |

(The Timelines are tentative and for participants assistance, Organisers hold the right to modify timelines if required)
### Submission Rules

- At each checkpoint, submit your agent file to the shared submission folder.
- Name your file: `teamname_checkpoint_N.py` (e.g., `alpha_checkpoint_1.py`).
- If you miss a checkpoint deadline, your previous submission (or the default `RuleBasedBot`) will be used.
- **Code Freeze at 5:15 PM is final.** Late submissions will use their Checkpoint 2 version.

### What Happens at Checkpoints

At each checkpoint, we run a live tournament with all submitted agents. The matches are broadcast on screen so you can watch your agent in action — see how it navigates, how it handles discussions, where it makes mistakes. Use this to identify weaknesses in your agentic logic and iterate in the next sprint.

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

### 2. Configure Your LLM (Optional — Read This Carefully)

Each team is provided an **OpenRouter API key with $3 of credits**. This is your total budget for the entire hackathon — development, local testing, checkpoint tournaments, and the final tournament combined.

```bash
cp .env.example .env
# Edit .env and add the OPENROUTER_API_KEY provided to your team
```

**$3 goes fast.** A single game can have 50-90 rounds, and your agent is called every round plus during discussions and voting. That means one game alone can trigger 60-150+ LLM calls. If you point your agent at a large model during development, you can burn through your entire budget (for Development) before the first checkpoint.

**How to manage your credits:**

- **Use economical models.** OpenRouter has many models with a economical cost per million tokens. 
  - Browse [openrouter.ai/models](https://openrouter.ai/models) and sort by price.
- **Build your agentic logic with rules first.** Get pathfinding, task completion, and basic strategy working without any LLM calls. Layer in LLM reasoning only for the decisions that actually benefit from it — social deduction, discussion, voting.
- **Not every decision needs an LLM.** "Move toward my next task" is a graph traversal problem, not a language problem. Reserve your credits for the moments that matter: generating discussion messages, parsing accusations, casting votes.
- **If you run out, you're not eliminated.** Your agent should have rule-based fallbacks. A hybrid agentic system (deterministic logic + LLM reasoning where it counts) is both cheaper and more robust than a pure LLM agent.

You might not need an LLM at all. A well-engineered rule-based agent with strong agentic logic can absolutely win. However, smartly use your resources to the best

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
2. Be fully self-contained (all your agentic logic in one file, imports at the top)
3. Not modify, monkey-patch, or subvert any framework files

Use `template_agent.py` as your starting point.

### What You CAN Do

- Import and use anything from the `engine` package (read-only):
  - `from engine.engine import BaseAgent, Role`
  - `from engine.agents import parse_llm_json, format_observation_as_text, bfs_shortest_path`
  - `from engine.config import MAP_ADJACENCY, ALL_ROOMS, TASK_POOL`
- Use LLM APIs via the provided OpenRouter key (or your own keys, let us know before tournament if you are using your keys)
- Use these standard/common libraries:
  - **Standard library**: `random`, `collections`, `math`, `re`, `json`, `os`, `logging`, `functools`, `itertools`, `heapq`, `copy`, `typing`, `dataclasses`, `enum`, `abc`, `time`, `statistics`
  - **ML/Data**: `numpy`, `scikit-learn`
  - **LLM/Agentic frameworks**: `langchain`, `llama-index`, `openai`, `anthropic`, `requests`
  - **Utilities**: `pydantic`
- Maintain internal state, memory, and strategy across rounds — build agents that learn and adapt within a game
- Use pathfinding, probabilistic reasoning, Bayesian inference, game theory — any algorithmic approach
- Design any agentic architecture: ReAct loops, chain-of-thought planning, memory-augmented reasoning, tool-use patterns — whatever makes your agent smarter

### What You CANNOT Do

- **Modify framework files**: Do not change anything in `engine/`, `main.py`, or `visualiser/`. Submissions that require framework changes will be disqualified.
- **Read or write files on disk** (no persisting state between games, no reading other agents' source files)
- **Access the network** for anything other than LLM API calls (no scraping, no inter-agent communication outside the game)
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

Your agent must implement these 5 methods — this is the agentic interface between your code and the simulation:

```python
from engine.engine import BaseAgent

class MyAgent(BaseAgent):
    def on_game_start(self, config: dict) -> None:
        """Called once at game start. Initialize your agent's memory, strategy, and internal state."""

    def on_task_phase(self, observation: dict) -> dict:
        """Called every round. Perceive the game state and return an autonomous action."""

    def on_discussion(self, observation: dict) -> str:
        """Called during meetings. Generate a natural language message to persuade other agents."""

    def on_vote(self, observation: dict) -> str:
        """Called at vote time. Reason about the discussion and return a player ID or 'skip'."""

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

- Your role is assigned randomly each game — your agent must handle **both** crewmate and impostor autonomously.
- As **crewmate**: prioritize task completion, report bodies, and track movement patterns to catch impostors in discussions.
- As **impostor**: kill when isolated with a target, use sabotages to create chaos, and generate consistent alibis during meetings — an agent that contradicts its own earlier statements will get caught.
- **Ghosts** (dead players) can still move and complete tasks. A good agent finishes its tasks even after death to help its team win.
- The `observation` dict is your agent's perception of the world — location, nearby players, task list, events, chat history, and available actions.
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

## Evaluation Criteria

Your agent is evaluated across multiple games in the tournament. The scoring combines:

### Primary: Elo Rating (Win/Loss)
- All teams start at **1200 Elo**
- Winning increases your Elo, losing decreases it
- Beating higher-rated teams gives more Elo than beating lower-rated ones
- Matchups are balanced — every team plays an equal number of games as impostor and crewmate

### What Makes a Winning Agent

| Criterion | What It Means |
|-----------|---------------|
| **Stability** | Does your agent crash, hang, or timeout? Agents that fail under pressure lose turns and lose games. Robustness is non-negotiable. |
| **Strategic Reasoning** | Can your agent plan multi-step actions — pathfinding to tasks, timing kills around cooldowns, choosing when to sabotage vs. when to lay low? |
| **Social Deduction** | Can your agent detect inconsistencies in other agents' statements? If someone claims "I was in MedBay" but your agent saw them in Electrical, can it call that out? |
| **Narrative Consistency** | As impostor, can your agent maintain a coherent alibi across multiple discussion rounds without contradicting itself? |
| **Adaptiveness** | Does your agent adjust its behavior based on game state — playing differently when 3 players remain vs. 7, or when a sabotage is active? |
| **Survival & Win Rate** | Ultimately, the leaderboard is determined by wins. Agents that survive longer, complete more tasks, and make better votes climb the rankings. |

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
No. A well-engineered rule-based agent with strong pathfinding, voting logic, and situational awareness can beat a poorly-prompted LLM agent. The best agentic systems often combine deterministic logic with selective LLM reasoning.

**Q: What happens if my agent crashes?**
The engine catches exceptions and treats them as a `wait` action. Your agent stays in the game but loses that turn. Consistent crashes will cost you games. Build for stability first, cleverness second.

**Q: Can I use multiple files?**
No. Submit a single `.py` file. All your logic must be in that one file. You can define helper classes and functions within it.

**Q: What if I need a library that's not on the allowed list?**
Ask an organizer. We'll approve it if it's reasonable and doesn't give an unfair advantage.

**Q: What if I run out of API credits?**
Design your agent to handle LLM failures gracefully. If an API call fails (no credits, timeout, error), your agent should fall back to rule-based logic instead of crashing. A hybrid agentic approach — deterministic logic for routine actions, LLM reasoning for social deduction — is both cheaper and more robust.

**Q: Can I use my own API key instead of the provided one?**
Yes. You can use any OpenRouter-compatible key or even a direct OpenAI/Anthropic key. The provided $3 key is a starting resource for your team — how you use it is up to you.

**Q: How are impostor/crewmate roles assigned in the tournament?**
Roles are balanced across the tournament. Every team plays an equal number of games as impostor and crewmate, so your Elo reflects agentic skill in both cooperative and adversarial settings.
