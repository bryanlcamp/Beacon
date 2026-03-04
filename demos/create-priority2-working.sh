#!/bin/bash

# Priority 2: Dual Monitor / Large Screen Optimization (SIMPLIFIED - WORKING VERSION)
# Focus: Enhanced layouts for professional trading environments

echo "Creating Priority 2 issues for Dual Monitor / Large Screen Optimization..."

# Dual Monitor Layout Issues
gh issue create --title "Implement dual-monitor mode toggle" --body "Add toggle for dual-monitor layouts with datacard distribution across screens. Essential for professional trading setups where multiple monitors are standard." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Add ultra-wide screen layout optimization" --body "Optimize layout for ultra-wide monitors (3440x1440, 5120x1440) with proper datacard spacing and control panel positioning." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Create draggable datacard positioning system" --body "Allow users to drag and position datacards for custom layouts across multiple monitors. Save positions to localStorage." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Implement monitor-aware datacard grouping" --body "Smart grouping system that distributes datacards optimally across available screen real estate." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

# Advanced Display Features
gh issue create --title "Add fullscreen datacard mode" --body "Implement fullscreen mode for individual datacards with F11 or double-click activation. Critical for focus trading scenarios." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Create datacard zoom levels (75%, 100%, 125%, 150%)" --body "Add zoom controls for datacards to accommodate different screen sizes and user preferences. Include keyboard shortcuts." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Implement picture-in-picture datacard mode" --body "Allow datacards to be popped out as floating windows for multi-monitor workflows." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

# Performance for Large Displays
gh issue create --title "Optimize rendering for 4K+ displays" --body "Ensure smooth performance and proper scaling on high-DPI displays (4K, 5K, 8K). Test and optimize CSS transforms and animations." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Add adaptive refresh rate for large layouts" --body "Implement smart refresh rates based on number of visible datacards and screen resolution to maintain 60fps." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

# Professional Monitor Features
gh issue create --title "Add monitor configuration presets" --body "Create presets for common trading monitor setups: Single 4K, Dual 1440p, Triple 1080p, Ultra-wide + Portrait." --label "priority-2" --milestone "client-demo" --repo "bryanlcamp/Beacon"

echo "Priority 2 issues created successfully!"
