#!/bin/bash

# MASTER SCRIPT: Create All Working Priority Issues (1-5)
# Complete project roadmap for client demo preparation

echo "🚀 Creating Complete GitHub Issue Roadmap (WORKING VERSION)..."
echo "=============================================================="

# Priority 1: UI Consistency & Core Fixes (Most Critical)
echo "📋 Phase 1: UI Consistency & Core Fixes"
./demos/create-priority1-working.sh
echo ""

# Priority 2: Dual Monitor / Large Screen Optimization
echo "🖥️ Phase 2: Dual Monitor & Large Screen Optimization"
./demos/create-priority2-working.sh
echo ""

echo "🎯 PHASES 1-2 COMPLETE!"
echo "=============================================================="
echo "📊 Key Issues Created:"
echo "   Priority 1: ~24 issues (Core Demo Requirements) ✅"
echo "   Priority 2: ~10 issues (Dual Monitor Optimization) ✅"
echo ""
echo "🔗 View your issues at: https://github.com/bryanlcamp/Beacon/issues"
echo "🚀 Ready to start Priority 1 work for maximum demo impact!"
