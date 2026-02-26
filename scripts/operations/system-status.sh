#!/bin/bash
# System Resource Monitor - Clean, formatted overview

echo "🖥️  Beacon Platform System Resources"
echo "=================================="
echo

# Memory Overview
echo "💾 MEMORY OVERVIEW"
echo "----------------"
memory_info=$(free -h)
total_mem=$(echo "$memory_info" | awk 'NR==2{print $2}')
used_mem=$(echo "$memory_info" | awk 'NR==2{print $3}')
free_mem=$(echo "$memory_info" | awk 'NR==2{print $4}')
available_mem=$(echo "$memory_info" | awk 'NR==2{print $7}')

echo "  Total:     $total_mem"
echo "  Used:      $used_mem"
echo "  Available: $available_mem"
echo "  Free:      $free_mem"
echo

# Disk Overview
echo "💽 DISK OVERVIEW"
echo "--------------"
disk_info=$(df -h /)
total_disk=$(echo "$disk_info" | awk 'NR==2{print $2}')
used_disk=$(echo "$disk_info" | awk 'NR==2{print $3}')
avail_disk=$(echo "$disk_info" | awk 'NR==2{print $4}')
use_percent=$(echo "$disk_info" | awk 'NR==2{print $5}')

echo "  Total:     $total_disk"
echo "  Used:      $used_disk ($use_percent)"
echo "  Available: $avail_disk"
echo

# CPU Overview
echo "⚡ CPU OVERVIEW"
echo "-------------"
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
load_avg=$(uptime | awk -F'load average:' '{print $2}')
echo "  CPU Usage: ${cpu_usage}%"
echo "  Load Avg: $load_avg"
echo

# Process Overview - Top Memory Users
echo "🔥 TOP MEMORY USERS"
echo "-----------------"
echo "  PID    %MEM  %CPU  RSS     COMMAND"
echo "  ----   ----  ----  -----   -------"
ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  %-6s %-5s %-5s %-7s %s\n", $2, $4, $3, $6, $11}'
echo

# Process Overview - Top CPU Users
echo "⚡ TOP CPU USERS"
echo "--------------"
echo "  PID    %CPU  %MEM  RSS     COMMAND"
echo "  ----   ----  ----  -----   -------"
ps aux --sort=-%cpu | head -6 | tail -5 | awk '{printf "  %-6s %-5s %-5s %-7s %s\n", $2, $3, $4, $6, $11}'
echo

# Beacon-specific processes if running
echo "🎯 BEACON PROCESSES"
echo "-----------------"
beacon_procs=$(ps aux | grep -E "(nginx|gunicorn|flask|beacon-core)" | grep -v grep)
if [ -n "$beacon_procs" ]; then
    echo "  PID    %CPU  %MEM  COMMAND"
    echo "  ----   ----  ----  -------"
    echo "$beacon_procs" | awk '{printf "  %-6s %-5s %-5s %s\n", $2, $3, $4, $11}'
else
    echo "  No beacon processes running"
fi
echo

# Network connections
echo "🌐 NETWORK STATUS"
echo "---------------"
connections=$(netstat -tuln 2>/dev/null | grep LISTEN | wc -l)
echo "  Listening ports: $connections"

# Check specific ports beacon uses
ports=("80" "443" "5000")
for port in "${ports[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        service=$(netstat -tulnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f2 | head -1)
        echo "  Port $port: ✅ $service"
    else
        echo "  Port $port: ❌ not listening"
    fi
done
echo

# System uptime
echo "⏱️  SYSTEM STATUS"
echo "---------------"
echo "  Uptime: $(uptime -p)"
echo "  Date:   $(date)"
