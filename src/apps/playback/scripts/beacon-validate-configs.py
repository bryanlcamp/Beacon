#!/usr/bin/env python3
"""
Beacon Playback Config Validator Script
Validates all playback configuration files for syntax and compatibility.
"""

import json
import subprocess
import sys
from pathlib import Path

def main():
    # Get project root (4 levels up from this script: scripts -> playback -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    config_dir = project_root / "config" / "playback"
    
    if not config_dir.exists():
        print("❌ Playback config directory not found!")
        print(f"   Expected: {config_dir}")
        return 1
    
    print("🔍 Validating Beacon playback configuration files...")
    print(f"📁 Config directory: {config_dir}")
    print()
    
    # Find all JSON files
    config_files = list(config_dir.rglob("*.json"))
    
    if not config_files:
        print("⚠️  No configuration files found")
        return 0
    
    print(f"Found {len(config_files)} configuration file(s)")
    
    valid_files = 0
    invalid_files = 0
    warnings = 0
    
    for config_file in sorted(config_files):
        relative_path = config_file.relative_to(config_dir)
        print(f"\n📄 Validating: {relative_path}")
        
        try:
            # Parse JSON
            with open(config_file, 'r') as f:
                data = json.load(f)
            
            # Basic validation based on file type
            file_warnings = []
            
            if config_file.name == "default.json":
                # Main config validation
                required_fields = ["senderConfig"]
                for field in required_fields:
                    if field not in data:
                        print(f"   ❌ Missing required field: '{field}'")
                        invalid_files += 1
                        continue
                
                # Check referenced files exist
                if "senderConfig" in data:
                    sender_path = config_dir / data["senderConfig"]
                    if not sender_path.exists():
                        file_warnings.append(f"Referenced sender config not found: {data['senderConfig']}")
                
                if "authorities" in data:
                    for auth in data["authorities"]:
                        auth_path = config_dir / auth
                        if not auth_path.exists():
                            file_warnings.append(f"Referenced authority config not found: {auth}")
                
                if "advisors" in data:
                    for advisor in data["advisors"]:
                        advisor_path = config_dir / advisor
                        if not advisor_path.exists():
                            file_warnings.append(f"Referenced advisor config not found: {advisor}")
            
            elif config_file.parent.name == "senders":
                # Sender config validation
                if "type" in data:
                    sender_type = data["type"]
                    if sender_type == "udp":
                        required_udp = ["address", "port"]
                        for field in required_udp:
                            if field not in data:
                                file_warnings.append(f"UDP sender missing field: '{field}'")
                    elif sender_type == "tcp":
                        required_tcp = ["address", "port"]
                        for field in required_tcp:
                            if field not in data:
                                file_warnings.append(f"TCP sender missing field: '{field}'")
            
            elif config_file.parent.name == "authorities":
                # Authority config validation
                if "mode" in data:
                    mode = data["mode"]
                    if mode == "burst":
                        recommended_burst = ["burstSize", "burstIntervalMs"]
                        for field in recommended_burst:
                            if field not in data:
                                file_warnings.append(f"Burst mode missing recommended field: '{field}'")
                    elif mode == "wave":
                        recommended_wave = ["periodMs", "minRate", "maxRate"]
                        for field in recommended_wave:
                            if field not in data:
                                file_warnings.append(f"Wave mode missing recommended field: '{field}'")
            
            # Show results for this file
            if file_warnings:
                for warning in file_warnings:
                    print(f"   ⚠️  {warning}")
                warnings += len(file_warnings)
            
            print(f"   ✅ JSON syntax valid")
            valid_files += 1
            
        except json.JSONDecodeError as e:
            print(f"   ❌ JSON syntax error: {e}")
            invalid_files += 1
        except Exception as e:
            print(f"   ❌ Error reading file: {e}")
            invalid_files += 1
    
    # Summary
    print(f"\n{'═' * 60}")
    print("📊 VALIDATION SUMMARY")
    print(f"{'═' * 60}")
    print(f"Valid files:    {valid_files}")
    print(f"Invalid files:  {invalid_files}")
    print(f"Warnings:       {warnings}")
    
    if invalid_files == 0:
        if warnings == 0:
            print("\n🎉 All configuration files are valid!")
            return 0
        else:
            print(f"\n⚠️  Configuration files are valid but have {warnings} warning(s)")
            return 0
    else:
        print(f"\n❌ {invalid_files} configuration file(s) have errors!")
        return 1

if __name__ == "__main__":
    exit(main())