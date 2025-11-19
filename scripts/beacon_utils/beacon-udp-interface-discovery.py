#!/usr/bin/env python3
"""
Enhanced UDP diagnostics with macOS-specific multicast interface detection
"""

import socket
import struct
import sys
import subprocess

def get_network_interfaces():
    """Get available network interfaces on macOS"""
    try:
        result = subprocess.run(['ifconfig'], capture_output=True, text=True)
        interfaces = []
        
        for line in result.stdout.split('\n'):
            if line and not line.startswith('\t') and ':' in line:
                current_interface = line.split(':')[0]
                interfaces.append(current_interface)
        
        return interfaces
    except Exception as e:
        print(f"Could not get interfaces: {e}")
        return []

def test_multicast_with_interface(interface_name):
    """Test multicast loopback with specific interface"""
    print(f"\n[TEST] Testing multicast with interface {interface_name}")
    
    try:
        # Get interface IP
        result = subprocess.run(['ifconfig', interface_name], capture_output=True, text=True)
        ip_line = [line for line in result.stdout.split('\n') if 'inet ' in line and '127.0.0.1' not in line]
        
        if not ip_line:
            print(f"  ⚠ No IP address found for {interface_name}")
            return False
        
        interface_ip = ip_line[0].split()[1]
        print(f"  → Interface IP: {interface_ip}")
        
        # Create sender with specific interface
        sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sender.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_LOOP, 1)
        sender.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(interface_ip))
        
        # Create receiver
        receiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        receiver.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        receiver.bind(('', 12346))
        
        mreq = struct.pack(\"4sl\", socket.inet_aton('239.255.0.1'), socket.INADDR_ANY)
        receiver.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
        receiver.settimeout(2.0)
        
        # Send test message
        test_message = f\"TEST_FROM_{interface_name}\".encode()
        sender.sendto(test_message, ('239.255.0.1', 12346))
        print(f\"  → Test message sent via {interface_name}\")
        
        # Try to receive
        try:
            data, addr = receiver.recvfrom(1024)
            if data == test_message:
                print(f\"  ✓ Loopback successful via {interface_name}!\")
                success = True
            else:
                print(f\"  ✗ Wrong data received\")
                success = False
        except socket.timeout:
            print(f\"  ✗ No loopback via {interface_name}\")
            success = False
        
        sender.close()
        receiver.close()
        return success
        
    except Exception as e:
        print(f\"  ✗ Error testing {interface_name}: {e}\")
        return False

def find_working_multicast_interface():
    \"\"\"Find which interface works for multicast loopback\"\"\"
    print(\"\\n[DISCOVERY] Finding working multicast interface\")
    print(\"-\" * 50)
    
    interfaces = get_network_interfaces()
    working_interfaces = []
    
    for interface in interfaces:
        if interface in ['lo0', 'en0', 'en1', 'wlan0', 'eth0']:  # Common interfaces
            if test_multicast_with_interface(interface):
                working_interfaces.append(interface)
    
    return working_interfaces

def generate_udp_fix_recommendations(working_interfaces):
    \"\"\"Generate specific recommendations based on working interfaces\"\"\"
    print(\"\\n\" + \"=\" * 70)
    print(\" UDP MULTICAST LOOPBACK - DETAILED ANALYSIS\")
    print(\"=\" * 70)
    
    if working_interfaces:
        print(f\" ✓ Working interfaces found: {', '.join(working_interfaces)}\")
        print(\"\\n SOLUTION 1: Use working interface in C++ code\")
        print(\" \" + \"-\" * 45)
        
        for interface in working_interfaces:
            try:
                result = subprocess.run(['ifconfig', interface], capture_output=True, text=True)
                ip_line = [line for line in result.stdout.split('\\n') if 'inet ' in line and '127.0.0.1' not in line]
                if ip_line:
                    interface_ip = ip_line[0].split()[1]
                    print(f\" Interface {interface}: {interface_ip}\")
                    print(f\" C++ Code: localInterface.s_addr = inet_addr(\\\"{interface_ip}\\\");\")\n            except:\n                pass\n    else:\n        print(\" ✗ No working multicast interfaces found\")\n        print(\"\\n SOLUTION 1: Use TCP mode instead\")\n        print(\" \" + \"-\" * 35)        \n        print(\" TCP is more reliable on localhost and doesn't depend on\")\n        print(\" multicast routing. Modify playback config to use TCP.\")\n    \n    print(\"\\n SOLUTION 2: Alternative loopback approaches\")\n    print(\" \" + \"-\" * 45)\n    print(\" 1. Use 127.0.0.1 unicast instead of multicast\")\n    print(\" 2. Use named pipes or shared memory for IPC\")\n    print(\" 3. Use TCP with multiple client connections\")\n    \n    print(\"\\n SOLUTION 3: Docker/container approach\")\n    print(\" \" + \"-\" * 40)\n    print(\" Run components in containers with proper network setup\")\n    print(\" Docker handles multicast routing automatically\")\n\ndef main():\n    working_interfaces = find_working_multicast_interface()\n    generate_udp_fix_recommendations(working_interfaces)\n    \n    # Also show current multicast routes\n    print(\"\\n CURRENT MULTICAST ROUTES:\")\n    print(\" \" + \"-\" * 30)\n    try:\n        result = subprocess.run(['netstat', '-rn'], capture_output=True, text=True)\n        for line in result.stdout.split('\\n'):\n            if '224' in line:\n                print(f\" {line}\")\n    except:\n        print(\" Could not retrieve routes\")\n\nif __name__ == \"__main__\":\n    main()