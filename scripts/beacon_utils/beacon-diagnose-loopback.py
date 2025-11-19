#!/usr/bin/env python3
"""
UDP/TCP Loopback Diagnostic Tool for Beacon Trading System

This tool helps diagnose UDP multicast and TCP connection issues in a complete 
loopback simulation where:
1. playback -> UDP multicast -> client_algorithm  
2. client_algorithm -> TCP -> matching_engine

All communication stays on localhost (127.0.0.1) for isolated testing.
"""

import socket
import struct
import sys
import time
import threading
import signal
from datetime import datetime

class UdpDiagnostics:
    def __init__(self, multicast_addr="239.255.0.1", port=12345):
        self.multicast_addr = multicast_addr
        self.port = port
        self.running = True
        self.message_count = 0
        self.total_bytes = 0
        signal.signal(signal.SIGINT, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        print("\n[INFO] Stopping UDP diagnostics...")
        self.running = False
    
    def test_multicast_socket_creation(self):
        """Test basic multicast socket creation and configuration"""
        print(f"[TEST] Creating UDP multicast socket for {self.multicast_addr}:{self.port}")
        
        try:
            # Create UDP socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
            print("  ✓ Socket created successfully")
            
            # Set socket options
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            print("  ✓ SO_REUSEADDR set")
            
            # Set receive buffer size
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 2 * 1024 * 1024)
            print("  ✓ Receive buffer size set to 2MB")
            
            # Bind to port
            sock.bind(('', self.port))
            print(f"  ✓ Bound to port {self.port}")
            
            # Join multicast group
            mreq = struct.pack("4sl", socket.inet_aton(self.multicast_addr), socket.INADDR_ANY)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
            print(f"  ✓ Joined multicast group {self.multicast_addr}")
            
            sock.close()
            return True
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return False
    
    def test_multicast_loopback(self):
        """Test multicast loopback on localhost"""
        print(f"[TEST] Testing multicast loopback capability")
        
        # Create sender
        sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        # Enable multicast loopback
        sender.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_LOOP, 1)
        print("  ✓ Multicast loopback enabled on sender")
        
        # Set multicast interface to loopback
        sender.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton('127.0.0.1'))
        print("  ✓ Multicast interface set to 127.0.0.1")
        
        # Create receiver
        receiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        receiver.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        receiver.bind(('', self.port + 100))  # Different port for test
        
        # Join multicast group
        mreq = struct.pack("4sl", socket.inet_aton(self.multicast_addr), socket.INADDR_ANY)
        receiver.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
        print(f"  ✓ Test receiver joined {self.multicast_addr}")
        
        # Set short timeout
        receiver.settimeout(2.0)
        
        # Send test message
        test_message = b"UDP_LOOPBACK_TEST_12345"
        sender.sendto(test_message, (self.multicast_addr, self.port + 100))
        print("  ✓ Test message sent")
        
        # Try to receive
        try:
            data, addr = receiver.recvfrom(1024)
            if data == test_message:
                print(f"  ✓ Loopback successful! Received from {addr}")
                success = True
            else:
                print(f"  ✗ Received different data: {data}")
                success = False
        except socket.timeout:
            print("  ✗ No loopback received (timeout)")
            success = False
        
        sender.close()
        receiver.close()
        return success
    
    def listen_for_playback(self, timeout=10):
        """Listen for messages from playback application"""
        print(f"[LISTEN] Waiting for playback messages on {self.multicast_addr}:{self.port}")
        print(f"         Timeout: {timeout} seconds")
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 2 * 1024 * 1024)
            
            sock.bind(('', self.port))
            
            mreq = struct.pack("4sl", socket.inet_aton(self.multicast_addr), socket.INADDR_ANY)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
            
            sock.settimeout(timeout)
            
            print("  ✓ Listening for messages...")
            start_time = time.time()
            
            while self.running and (time.time() - start_time) < timeout:
                try:
                    data, addr = sock.recvfrom(1024)
                    self.message_count += 1
                    self.total_bytes += len(data)
                    
                    if self.message_count == 1:
                        print(f"  ✓ First message received from {addr}")
                        print(f"    Size: {len(data)} bytes")
                        print(f"    First 16 bytes: {' '.join(f'{b:02x}' for b in data[:16])}")
                    
                    if self.message_count % 1000 == 0:
                        print(f"  → {self.message_count} messages ({self.total_bytes} bytes)")
                        
                except socket.timeout:
                    if self.message_count == 0:
                        print("  ✗ No messages received (timeout)")
                    break
            
            sock.close()
            
        except Exception as e:
            print(f"  ✗ Error listening: {e}")
            return False
        
        return self.message_count > 0

class TcpDiagnostics:
    def __init__(self, host="127.0.0.1", port=54321):
        self.host = host
        self.port = port
    
    def test_tcp_connection(self):
        """Test TCP connection to matching engine"""
        print(f"[TEST] Testing TCP connection to {self.host}:{self.port}")
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5.0)
            
            result = sock.connect_ex((self.host, self.port))
            if result == 0:
                print("  ✓ TCP connection successful")
                
                # Test sending data
                test_msg = b"TCP_CONNECTION_TEST"
                sock.send(test_msg)
                print("  ✓ Test message sent")
                
                success = True
            else:
                print(f"  ✗ Connection failed (error {result})")
                success = False
            
            sock.close()
            return success
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return False
    
    def simulate_client_algorithm_connection(self):
        """Simulate client_algorithm connecting to matching_engine"""
        print(f"[SIMULATE] Client algorithm -> Matching engine TCP connection")
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            
            # Enable TCP_NODELAY for low latency (like in client_algorithm)
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            print("  ✓ TCP_NODELAY enabled")
            
            print(f"  → Connecting to {self.host}:{self.port}")
            sock.connect((self.host, self.port))
            print("  ✓ Connected to matching engine")
            
            # Send a simple OUCH-like message
            order_msg = b"O" + b"12345678" + b"B" + b"AAPL    " + (1000).to_bytes(4, 'little') + (50000).to_bytes(4, 'little')
            sock.send(order_msg)
            print(f"  ✓ Order message sent ({len(order_msg)} bytes)")
            
            # Try to receive response (with timeout)
            sock.settimeout(2.0)
            try:
                response = sock.recv(1024)
                print(f"  ✓ Response received ({len(response)} bytes)")
            except socket.timeout:
                print("  ⚠ No response from matching engine (timeout)")
            
            sock.close()
            return True
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return False

def check_system_configuration():
    """Check system-level network configuration"""
    print("[SYSTEM] Checking network configuration")
    
    import subprocess
    
    # Check multicast routes (macOS)
    try:
        result = subprocess.run(['netstat', '-rn'], capture_output=True, text=True)
        multicast_routes = [line for line in result.stdout.split('\n') if '224' in line]
        
        if multicast_routes:
            print("  ✓ Multicast routes found:")
            for route in multicast_routes[:3]:  # Show first 3
                print(f"    {route}")
        else:
            print("  ⚠ No multicast routes found")
            
    except Exception as e:
        print(f"  ⚠ Could not check routes: {e}")
    
    # Check if ports are in use
    print("\n[PORTS] Checking port availability")
    test_ports = [12345, 54321, 9000]
    
    for port in test_ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', port))
            if result == 0:
                print(f"  ⚠ Port {port} is in use (service running?)")
            else:
                print(f"  ✓ Port {port} is available")
            sock.close()
        except Exception:
            print(f"  ? Port {port} - unknown status")

def main():
    print("=" * 70)
    print(" BEACON TRADING SYSTEM - UDP/TCP LOOPBACK DIAGNOSTICS")
    print("=" * 70)
    print(f" Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(" Purpose: Diagnose UDP multicast and TCP connections for")
    print("          complete loopback simulation without external network")
    print("=" * 70)
    
    # Parse command line arguments
    udp_addr = sys.argv[1] if len(sys.argv) > 1 else "239.255.0.1"
    udp_port = int(sys.argv[2]) if len(sys.argv) > 2 else 12345
    tcp_port = int(sys.argv[3]) if len(sys.argv) > 3 else 54321
    
    print(f" UDP: {udp_addr}:{udp_port}")
    print(f" TCP: 127.0.0.1:{tcp_port}")
    print("=" * 70)
    
    # System configuration check
    check_system_configuration()
    print()
    
    # UDP diagnostics
    udp_diag = UdpDiagnostics(udp_addr, udp_port)
    
    print("1. UDP SOCKET CREATION TEST")
    print("-" * 30)
    socket_ok = udp_diag.test_multicast_socket_creation()
    print()
    
    print("2. UDP MULTICAST LOOPBACK TEST")  
    print("-" * 30)
    loopback_ok = udp_diag.test_multicast_loopback()
    print()
    
    # TCP diagnostics
    tcp_diag = TcpDiagnostics("127.0.0.1", tcp_port)
    
    print("3. TCP CONNECTION TEST")
    print("-" * 30)
    tcp_ok = tcp_diag.test_tcp_connection()
    print()
    
    # Summary and recommendations
    print("=" * 70)
    print(" DIAGNOSTIC SUMMARY")
    print("=" * 70)
    
    if socket_ok and loopback_ok:
        print(" ✓ UDP: Ready for playback -> client_algorithm communication")
    else:
        print(" ✗ UDP: Issues detected - see recommendations below")
    
    if tcp_ok:
        print(" ✓ TCP: Matching engine is running and accepting connections")
    else:
        print(" ✗ TCP: Matching engine not running or connection issues")
    
    print()
    print(" RECOMMENDATIONS:")
    print(" " + "-" * 50)
    
    if not socket_ok:
        print(" • UDP socket creation failed - check system permissions")
        print(" • Try running as administrator or check firewall settings")
    
    if not loopback_ok:
        print(" • UDP multicast loopback not working")
        print(" • On macOS, try using interface en0 instead of lo0")
        print(" • Check: netstat -rn | grep 224")
        print(" • Alternative: Use TCP mode instead of UDP for testing")
    
    if not tcp_ok:
        print(" • Matching engine is not running")
        print(" • Start matching engine: ./build/matching_engine 54321")
        print(" • Check if another process is using the port")
    
    print()
    print(" COMPLETE LOOPBACK SIMULATION SETUP:")
    print(" " + "-" * 40)
    print(" 1. Start matching engine:  ./build/matching_engine 54321")
    print(" 2. Start UDP listener:     python3 this_script.py listen")  
    print(" 3. Start playback:         ./build/playback --config config.json test.bin")
    print(" 4. Start client algorithm: ./build/client_algorithm 239.255.0.1 12345 127.0.0.1 54321")
    print()
    print("=" * 70)
    
    # Special listening mode
    if len(sys.argv) > 1 and sys.argv[1] == "listen":
        print("\n[LISTEN MODE] Waiting for playback messages...")
        udp_diag.listen_for_playback(timeout=60)
        print(f"\nReceived {udp_diag.message_count} messages ({udp_diag.total_bytes} bytes)")

if __name__ == "__main__":
    main()