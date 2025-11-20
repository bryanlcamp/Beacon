#!/bin/bash

#
# Quick UDP/TCP Loopback Test for Beacon Trading System
#
# This script tests both UDP multicast and TCP loopback capabilities
# and provides recommendations for complete isolated simulation.
#

echo "=================================================================="
echo " BEACON LOOPBACK CONNECTIVITY TEST"
echo "=================================================================="

# Test UDP multicast loopback
echo "1. Testing UDP multicast loopback..."
echo "----------------------------------"

# Start a simple UDP listener in background
python3 -c "
import socket
import struct
import time

try:
    # Create receiver
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('', 12347))
    
    # Join multicast group  
    mreq = struct.pack('4sl', socket.inet_aton('239.255.0.1'), socket.INADDR_ANY)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
    sock.settimeout(3.0)
    
    print('UDP receiver ready...')
    
    # Create sender
    sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) 
    sender.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_LOOP, 1)
    
    # Send test message
    sender.sendto(b'UDP_TEST_12345', ('239.255.0.1', 12347))
    print('UDP test message sent')
    
    # Try to receive
    try:
        data, addr = sock.recvfrom(1024)
        if data == b'UDP_TEST_12345':
            print('✓ UDP multicast loopback WORKS!')
            udp_works = True
        else:
            print('✗ UDP received wrong data')
            udp_works = False
    except socket.timeout:
        print('✗ UDP multicast loopback FAILED (timeout)')
        udp_works = False
        
    sock.close()
    sender.close()
    
except Exception as e:
    print(f'✗ UDP test error: {e}')
    udp_works = False
" && UDP_RESULT="WORKS" || UDP_RESULT="FAILED"

echo ""
echo "2. Testing TCP loopback..."
echo "-------------------------"

# Test TCP loopback
python3 -c "
import socket
import threading
import time

def tcp_server():
    try:
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('127.0.0.1', 12348))
        server.listen(1)
        server.settimeout(5.0)
        
        print('TCP server listening on 127.0.0.1:12348')
        
        conn, addr = server.accept()
        data = conn.recv(1024)
        
        if data == b'TCP_TEST_12345':
            print('✓ TCP server received correct data')
            conn.send(b'TCP_ACK')
        else:
            print('✗ TCP server received wrong data')
            
        conn.close()
        server.close()
        
    except Exception as e:
        print(f'TCP server error: {e}')

def tcp_client():
    try:
        time.sleep(0.5)  # Let server start
        
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.connect(('127.0.0.1', 12348))
        
        client.send(b'TCP_TEST_12345')
        response = client.recv(1024)
        
        if response == b'TCP_ACK':
            print('✓ TCP loopback communication WORKS!')
        else:
            print('✗ TCP received wrong response')
            
        client.close()
        
    except Exception as e:
        print(f'TCP client error: {e}')

# Run server and client
server_thread = threading.Thread(target=tcp_server)
client_thread = threading.Thread(target=tcp_client)

server_thread.start()
client_thread.start()

server_thread.join()
client_thread.join()
" && TCP_RESULT="WORKS" || TCP_RESULT="FAILED"

echo ""
echo "=================================================================="
echo " LOOPBACK TEST RESULTS"
echo "=================================================================="
echo " UDP Multicast: $UDP_RESULT"
echo " TCP Loopback:  $TCP_RESULT"
echo ""

if [[ "$UDP_RESULT" == "WORKS" ]]; then
    echo "✓ RECOMMENDATION: Use UDP multicast configuration"
    echo "  - playback -> UDP 239.255.0.1:12345 -> client_algorithm"
    echo "  - client_algorithm -> TCP 127.0.0.1:54321 -> matching_engine"
    echo ""
    echo "  Configuration: config/playback/loopback_simulation.json"
else
    echo "⚠ RECOMMENDATION: Use TCP mode instead of UDP multicast"
    echo "  - playback -> TCP 127.0.0.1:12345 -> client_algorithm"
    echo "  - client_algorithm -> TCP 127.0.0.1:54321 -> matching_engine"
    echo ""
    echo "  Configuration: Use sender_tcp_loopback.json instead"
fi

echo ""
echo " COMPLETE SIMULATION SETUP:"
echo " -------------------------"
echo " 1. Build all components: cmake --build build"
echo " 2. Generate test data:   ./build/bin/generator config/generator/sample_config.json test.bin"
echo " 3. Start matching engine: ./build/src/apps/matching_engine/matching_engine 54321"
echo " 4. Start playback:       ./build/src/apps/playback/playback --config config.json test.bin" 
echo " 5. Start client:         ./build/src/apps/client_algorithm/client_algorithm ..."
echo ""
echo " OR use automated script: ./scripts/beacon_run/beacon-run-loopback-simulation.sh"
echo "=================================================================="