# Beacon AI Bootstrap - Context & Working Style

## Document Purpose

**This document exists to get AI sessions up to productive speed immediately.** Instead of spending 30+ minutes explaining domain context, technical architecture, and working preferences every time a session crashes or restarts, this doc allows us to jump straight into deep technical discussions and productive work.

**Context recovery in under 2 minutes** - Read this doc → understand the Beacon platform components → start building/debugging/optimizing without basic questions.

The goal: eliminate context setup time so we can focus on the complex, valuable work that requires both human insight and AI assistance.

## Reading Order

For comprehensive understanding, read component docs in this order (follows data flow):

1. **beacon-ai-bootstrap.md** (this file) - Working style, overview, ground rules
2. **Author Deep Dive** - Data generation foundation (all other components depend on this)
3. **Pulse Deep Dive** - Network simulation and data broadcasting
4. **Core Deep Dive** - Strategy execution engine
5. **Match Deep Dive** - Matching engine and risk management

**Quick context recovery:** Read just this bootstrap + the component you're working on.

## Technical Context

Beacon is a complete HFT simulation platform achieving **3.1μs P99 latency** on laptops. Four main components:

- **Author**: Parametric market data generator (replaces tick data, solves overfitting)
- **Pulse**: Network simulation & data broadcasting (UDP multicast, latency spikes, chaos engineering)
- **Core**: Strategy execution engine (C++20, lock-free, template metaprogramming)
- **Match**: Matching engine & risk management (multi-participant TCP, position limits)

### Author Deep Dive

**Purpose**: Replaces expensive tick data while solving the overfitting problem. Instead of training on the same March 15th sequence, generate hundreds of unique "March 15th-like" scenarios.

**Why Author beats tick data**: Generates unlimited realistic scenarios faster than historical data processing, integrates seamlessly with any exchange protocol, and costs a fraction of expensive tick data subscriptions while eliminating overfitting entirely.

**Dataset Generation**:
- Multi-product datasets with independent per-product configuration
- Price configuration: Base + percentage OR explicit high/low ranges
- Same pattern for: Bid Price, Ask Price, Bid Qty, Ask Qty
- Bullish/bearish trend parameters per product
- Bid/ask spread controls and weighting schemes (e.g., 40% bids toward lower end)
- Smart constraint system prevents crossed markets even when ranges overlap

**Dataset Composition**:
- Measured in message count, not volume
- Each product assigned % of total messages (must sum to 100%)
- UI validation with red adorners prevents invalid configurations
- Example: 1000 messages → MSFT 25%, AAPL 35%, AMZN 40%

**Output & Integration**:
- Generates data in native exchange protocols (CME iLink, NYSE Pillar, NASDAQ ITCH)
- Raw binary format for realistic simulation
- Author is the SOLE data source for entire Beacon ecosystem
- Workflow: Select exchange → configure products → create dataset

**Anti-Overfitting Features**:
- Datasets are immutable (cannot be modified)
- Same parameters generate different datasets each run
- Create hundreds of variations for robust strategy training
- Model any market conditions: quiet periods to extreme volatility

**Configuration Management**:
- Save/load configuration files for complex setups
- Unlimited dataset storage and replay capabilities
- Global controls for bulk adjustments (current: simple penny movements)
- Reproducible testing: replay exact same dataset repeatedly

### Pulse Deep Dive

**Purpose**: Controllable price exchange simulation with realistic network latency modeling. Full visibility into normally black-box exchange behavior.

**Why Pulse beats real exchanges**: Test realistic latency disadvantages (you vs. Citadel/Jump) locally via UDP loopback - no network team, no special infrastructure, run from laptop.

**Real-time Bridge**:
- Input: Author datasets (already in exchange protocol format)
- Output: UDP Multicast Loopback (never leaves machine)
- Initiates real-time simulation after offline dataset creation
- Startup script coordinates all components and UDP/TCP connections

**Network Architecture & Latency Simulation**:
- **Match advantage**: UDP direct → immediate liquidity (minimal hops)
- **Strategy disadvantage**: UDP receive → algo processing → TCP send → Match (multiple hops)
- **Real-world parallel**: Simulates being outgunned by nanosecond HFT infrastructure
- **Local execution**: Entire realistic simulation via OS network stack on single machine

**Broadcasting & Scaling**:
- Broadcasts Author datasets for dual purpose:
  1. **Match component**: Uses data for liquidity generation
  2. **Strategy scaling**: Run unlimited Strategy instances horizontally
- **Execution feedback loop**: Match → execution reports → Pulse (private multicast)
- **Complete market view**: Pulse inserts executions (LAST messages) into broadcast stream
- **MPID tracking**: All participants see full picture, prevents double-counting

**Performance Infrastructure**:
- **Lock-free SPSC queues**: Dataset messages → tryAdd queue → dedicated spinning thread
- **UDP broadcast control**: Full throttle to slow, with chaos engineering options
- **Chaos testing**: Packet drops, out-of-order packets, malformed packets, sustained bursts
- **Real-time threading**: Hot path threads with memory-mapped pause (mmpause)

### Core Deep Dive

**Purpose**: Zero-overhead strategy execution framework with 3.1μs P99 latency. Hardware-optimized abstractions that look like simple OOP.

**Strategy API Architecture**:
- **User interface**: Familiar inheritance patterns (inherit from AlgorithmBase, override OnMarketData, etc.)
- **Under the hood**: C++20 concepts + template polymorphism - zero runtime cost
- **Compile-time registration**: REGISTER_STRATEGY macro for static discovery
- **No runtime overhead**: Direct function calls, no vtable dispatch, no allocation

**Hardware-Level Optimization**:
- **Cache-line alignment**: `alignas(64)` prevents false sharing
- **CPU prefetch**: `__builtin_prefetch` preloads data into cache
- **L1 cache constraints**: Static asserts ensure algorithms fit in 32KB L1 cache
- **Lock-free atomics**: Relaxed memory ordering for maximum speed
- **SPSC ringbuffers**: Zero-contention queues with exact type specialization

**Configuration Performance**:
- **ConfigCache**: Exactly 2 cache lines (128 bytes) for predictable access
- **Hot/cold separation**: Frequent params in first cache line, others in second
- **Pre-parsed startup**: JSON→array conversion once, then O(1) access during trading
- **Standardized indices**: Consistent parameter naming (PRICE_THRESHOLD, VOLUME_THRESHOLD, etc.)
- **No JSON parsing**: During hot path, config access is single L1 cache read

**Zero-Cost Abstraraction Guarantees**:
- **Compile-time validation**: Must be trivially destructible, nothrow move constructible
- **Template specialization**: All queue types templated for exact type matching
- **Always inline**: Critical path functions forced inline with compiler attributes
- **Memory layout**: Strategic padding and alignment for optimal CPU cache utilization

### Match Deep Dive

**Purpose**: Matching engine with multi-layered competition simulation and comprehensive analytics. Tests strategy performance against realistic market participants and infrastructure advantages.

**Network Advantage Simulation**:
- **No network stack**: Match has zero latency accessing Pulse data (simulates exchange-internal advantages)
- **Strategic disadvantage**: Your strategy faces TCP round-trips while Match gets instant liquidity access
- **Real-world parallel**: Simulates co-located participants and exchange-internal advantages

**EXPEDITER - Algorithmic Competition**:
- **Layered competition**: Network disadvantage + sophisticated algorithmic participants
- **Configurable participants**: Mix of "normal" speed and "insanely fast" algorithms
- **Liquidity competition**: Multiple participants competing for same opportunities
- **Flexible deployment**: Use standalone or alongside real competing strategies
- **Strategic testing**: Forces strategy to learn competitive behavior, not vacuum trading

**Complete Competition Ecosystem**:
1. **Network latency** (Pulse): Infrastructure speed disadvantage
2. **Algorithmic competition** (EXPEDITER): Smart participants competing for liquidity
3. **Optional real strategies**: Additional live competing algorithms
4. **Exchange advantages**: Match gets first access to liquidity data

**Comprehensive Analytics & Reporting**:
- **PnL analysis**: Complete profit and loss breakdown
- **Execution metrics**: Passive vs. active fills (market making vs. taking)
- **Performance data**: Fill analysis and execution quality
- **Latency measurements**: Strategy response time analysis
- **Risk analysis**: Drawdown calculations and peak-to-trough declines
- **Strategy insights**: Understanding HOW profits were achieved, not just IF they were achieved

**Current Web Interface**: Landing page with smart panel system. Sidebar icons trigger sliding detail panels with app-specific content. Recent work focused on hover behavior, proximity detection, and smooth animations.

## Working Style & Preferences

### Communication
- **Direct, no fluff**: User prefers straightforward responses without verbose explanations
- **Show don't tell**: Use tools to make changes rather than describing what you'll do
- **Minimal feature creep**: When user says "this is over the top" - they mean it, dial it back
- **Consistency is king**: Match existing patterns rather than inventing new ones

### Code Style
- **Clean, minimal**: Follow existing design patterns exactly
- **No over-engineering**: Simple solutions over complex ones
- **Performance aware**: 3.1μs latency is a core selling point
- **Consistent naming**: "Author.", "Pulse.", "Strategy.", "Match." - period included

### UI/UX Patterns Established
- **Smart panel system**: Sidebar icons trigger content panels with proximity detection
- **Orange for info**: Info panel uses orange accent color (rgba(255, 145, 77, 0.08))
- **Blue for apps**: App panels use blue accent color (rgba(107, 182, 255, 0.08))
- **Two-column layout**: Main content + dynamic sidebar with equal spacing
- **Hover tolerance**: Extended timeouts (600-800ms) for better UX
- **No dead spaces**: Icon bar should always show closest panel content

## Ground Rules

### Visual Standards
1. **Icons**: Only minimal SVG icons. No colorful or decorative graphics. Reference `/assets/images/icons/` for approved style.

### Development Standards
2. **Ask before making changes**: Always confirm before editing files. This rule applies throughout the session until explicitly told otherwise.
3. **Be honest about code quality**: Point out issues respectfully. User values learning over validation and doesn't want to ship bad code.
4. **Organize code logically**: Add new code near related modules/functions. Keep similar functionality grouped together.
5. **Question code organization**: Always ask if repeated code should be moved to common CSS, shared functions, or libraries.
6. **Follow language conventions**: Use industry-standard naming conventions and indentation for each language consistently.

### Build System
```bash
build.py              # Debug/release build
build.py -T           # Build + all unit tests
```

### File Structure Context
```
/var/www/html/
├── index.html         # Main landing page (current work)
├── apps/              # Individual app interfaces
├── assets/css/        # Design system
├── beacon-core/       # C++ core system
├── wiki/              # Documentation
└── .ai/               # This file - AI context
```

## Current Session Context
- Fixed main page smart panel system with proximity detection
- Implemented clean info panel with contact details
- Established hover behavior that keeps panels visible on icon bar
- User values minimal, professional aesthetic over feature-rich interfaces

## Key Lessons
1. When user says something is "over the top" - simplify immediately
2. Match existing visual patterns rather than creating new ones
3. Consistency across all components is more important than individual features
4. Performance (3.1μs latency) is a core differentiator - maintain that messaging
5. UI should feel professional and minimal, not flashy

## Red Flags
- Verbose explanations instead of direct action
- Over-engineered solutions to simple problems
- Breaking established visual/interaction patterns
- Feature creep beyond user requirements
- Losing sight of the core technical performance story

---
*This document should be referenced whenever context seems lost or working style changes abruptly.*
