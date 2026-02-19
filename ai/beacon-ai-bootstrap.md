# Beacon AI Bootstrap - Context & Working Style

## Technical Context

Beacon is a complete HFT simulation platform achieving **3.1μs P99 latency** on laptops. Four main components:

- **Author**: Market data generation (bid/ask streams, configurable volatility)
- **Pulse**: Network simulation & data broadcasting (UDP multicast, latency spikes, chaos engineering)
- **Core**: Strategy execution engine (C++20, lock-free, template metaprogramming)
- **Match**: Matching engine & risk management (multi-participant TCP, position limits)

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
