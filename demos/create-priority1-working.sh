#!/bin/bash

# Priority 1: UI Consistency & Core Fixes (SIMPLIFIED - WORKING VERSION)
# Focus: Critical issues for client demo readiness

echo "Creating Priority 1 issues for UI Consistency & Core Fixes..."

# Button & Control Issues
gh issue create --title "Standardize button styling across all components" --body "Ensure all buttons (Add Symbol, Remove, Clear Dataset) have consistent styling, sizing, padding, and hover states." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix button sizing inconsistencies" --body "Make all action buttons the same height and padding. Currently different buttons have varying sizes which looks unprofessional." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize hover effects for interactive elements" --body "Implement consistent hover states for all buttons, dropdowns, and clickable elements throughout the interface." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix button text alignment and spacing" --body "Center all button text properly and ensure consistent internal padding for professional appearance." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize disabled button states" --body "Create consistent styling for disabled buttons across all components with proper opacity and cursor states." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Implement consistent button grouping and spacing" --body "Fix spacing between button groups and ensure consistent margins throughout the interface." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

# Input Field Issues
gh issue create --title "Standardize input field styling and dimensions" --body "Make all input fields (text, number, dropdown) consistent in height, padding, border, and focus states." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix input validation visual feedback" --body "Add consistent error states, success states, and validation messaging for all form inputs." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize placeholder text styling" --body "Ensure all placeholder text has consistent color, opacity, and font styling across all inputs." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix focus states for all input elements" --body "Implement consistent focus rings and highlight states for accessibility and professional appearance." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize dropdown styling and behavior" --body "Make all dropdown menus consistent in styling, animation, and interaction patterns." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

# Color & Visual Consistency
gh issue create --title "Audit and standardize color palette usage" --body "Review all colors used in the interface and ensure consistency with the established design system." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix background color inconsistencies" --body "Ensure all panels, cards, and backgrounds use the correct colors from the design system." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize border styles and colors" --body "Make all borders consistent in width, color, and radius throughout the interface." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix shadow and elevation inconsistencies" --body "Standardize box shadows and elevation levels for cards, modals, and interactive elements." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

# Typography Issues
gh issue create --title "Standardize font weights across all text elements" --body "Ensure consistent font weights for headings, body text, labels, and UI text throughout the application." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix text size inconsistencies" --body "Standardize font sizes for similar text elements and establish clear hierarchy throughout the interface." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize text color hierarchy" --body "Implement consistent text colors for primary, secondary, and tertiary text elements." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix line height and text spacing" --body "Ensure consistent line heights and letter spacing for optimal readability and professional appearance." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize heading styles and hierarchy" --body "Create consistent heading styles (H1-H6) with proper sizing, spacing, and visual hierarchy." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

# Layout & Spacing Issues
gh issue create --title "Fix inconsistent padding and margins" --body "Standardize spacing throughout the interface using a consistent spacing scale (8px grid or similar)." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Align all elements to consistent grid system" --body "Ensure all interface elements align to a consistent grid for professional, organized appearance." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix datacard alignment and spacing issues" --body "Ensure all datacards have consistent spacing, alignment, and positioning relative to each other." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Standardize container and wrapper spacing" --body "Create consistent spacing for all containers, panels, and content wrappers throughout the interface." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

gh issue create --title "Fix responsive layout consistency" --body "Ensure the interface maintains consistent spacing and alignment across different screen sizes and zoom levels." --label "priority-1" --milestone "client-demo" --repo "bryanlcamp/Beacon"

echo "Priority 1 issues created successfully!"
