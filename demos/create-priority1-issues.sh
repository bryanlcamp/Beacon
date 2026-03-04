#!/bin/bash

# Create all Priority 1 issues for client demo prep
# Run from beacon-web-ui directory

echo "🎯 Creating all Priority 1 UI Consistency issues..."

# Buttons (issues 1-5)
./demos/create-issue.sh web-ui buttons medium "Standardize Add Symbol button styling with other primary buttons"
./demos/create-issue.sh web-ui buttons medium "Ensure all remove symbol (×) buttons have consistent size and hover states"
./demos/create-issue.sh web-ui buttons medium "Standardize collapse button (▼) arrow size and rotation animation"
./demos/create-issue.sh web-ui buttons medium "Make Portfolio toggle button consistent with main button theme"
./demos/create-issue.sh web-ui buttons medium "Align Pricing mode toggle buttons with overall button styling"

# Input Fields (issues 6-10)
./demos/create-issue.sh web-ui inputs medium "Standardize symbol input box border radius and focus states"
./demos/create-issue.sh web-ui inputs medium "Ensure percentage input styling consistent across all datacards"
./demos/create-issue.sh web-ui inputs medium "Make global control number inputs match range slider styling"
./demos/create-issue.sh web-ui inputs medium "Standardize all range slider track colors and thumb sizes"
./demos/create-issue.sh web-ui inputs medium "Align duration picker input styling with other time controls"

# Colors & States (issues 11-15)
./demos/create-issue.sh web-ui colors medium "Audit all primary blue elements for consistent #6bb6ff hex value"
./demos/create-issue.sh web-ui colors medium "Standardize hover state brightness changes across all buttons"
./demos/create-issue.sh web-ui colors medium "Ensure all interactive elements have consistent focus outlines"
./demos/create-issue.sh web-ui colors medium "Standardize error state red color across validation messages"
./demos/create-issue.sh web-ui colors medium "Make success/allocation status green consistent"

# Typography & Spacing (issues 16-20)
./demos/create-issue.sh web-ui typography medium "Standardize all input label font sizes (audit 0.75em vs 0.85em)"
./demos/create-issue.sh web-ui typography medium "Ensure all buttons use consistent font-weight"
./demos/create-issue.sh web-ui typography medium "Standardize datacard header text sizing (symbol names, exchange prefix)"
./demos/create-issue.sh web-ui layout medium "Audit button padding for consistency"
./demos/create-issue.sh web-ui layout medium "Enforce 8px/16px/24px spacing grid throughout interface"

# Layout Elements (issues 21-24)
./demos/create-issue.sh web-ui layout medium "Standardize border radius values across cards, buttons, inputs"
./demos/create-issue.sh web-ui layout medium "Ensure consistent box shadow depth on all elevated elements"
./demos/create-issue.sh web-ui layout medium "Standardize glass morphism background opacity and blur values"
./demos/create-issue.sh web-ui layout medium "Make all icons (×, ▼, etc.) consistent relative size"

echo "✅ Created 24 Priority 1 issues with 'client-demo' milestone!"
echo "📋 View them at: https://github.com/bryanlcamp/beacon-web-ui/issues?q=is%3Aissue+is%3Aopen+milestone%3Aclient-demo"
