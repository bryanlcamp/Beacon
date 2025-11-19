import subprocess
import time
import os
from pathlib import Path

def run_process(cmd, cwd=None):
    print(f"[RUN] {' '.join(cmd)}")
    return subprocess.Popen(cmd, cwd=cwd)

def wait_for_handshake(process_name, timeout=10):
    print(f"[WAIT] Waiting for handshake from {process_name}...")
    
    # Implement actual handshake detection based on process type
    if "matching engine" in process_name:
        # Check for matching engine port binding (typically 8080 for orders)
        return wait_for_port_binding(8080, timeout)
    elif "algo" in process_name:
        # Check for algorithm client connection readiness (typically connects to 8080)
        return wait_for_tcp_connection("127.0.0.1", 8080, timeout)
    elif "market data" in process_name:
        # Check for UDP multicast binding (typically 12345 for market data)
        return wait_for_udp_binding(12345, timeout)
    else:
        # Fallback to time-based wait for unknown processes
        time.sleep(2)
        return True

def wait_for_port_binding(port, timeout=10):
    """Wait for a process to bind to a specific port"""
    import socket
    
    for attempt in range(timeout * 2):  # Check every 0.5 seconds
        try:
            # Try to connect to the port to see if it's bound
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            
            if result == 0:
                print(f"[HANDSHAKE] Port {port} is bound and accepting connections")
                return True
        except:
            pass
        
        time.sleep(0.5)
    
    print(f"[WARNING] Port {port} binding timeout after {timeout}s")
    return False

def wait_for_tcp_connection(host, port, timeout=10):
    """Wait for ability to establish TCP connection"""
    import socket
    
    for attempt in range(timeout * 2):  # Check every 0.5 seconds
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.0)
            result = sock.connect_ex((host, port))
            sock.close()
            
            if result == 0:
                print(f"[HANDSHAKE] TCP connection to {host}:{port} successful")
                return True
        except:
            pass
        
        time.sleep(0.5)
    
    print(f"[WARNING] TCP connection to {host}:{port} timeout after {timeout}s")
    return False

def wait_for_udp_binding(port, timeout=10):
    """Wait for UDP port to become available (indicating process started)"""
    import socket
    
    for attempt in range(timeout * 2):  # Check every 0.5 seconds
        try:
            # Try to bind to the port - if it fails, something else is using it
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(0.5)
            
            # Try to bind - if this fails, port is likely in use (which is what we want)
            try:
                sock.bind(('127.0.0.1', port))
                sock.close()
                # Port is free, process hasn't bound yet
            except socket.error:
                # Port is in use - this is what we want for UDP multicast
                sock.close()
                print(f"[HANDSHAKE] UDP port {port} is in use (process likely started)")
                return True
        except:
            pass
        
        time.sleep(0.5)
    
    print(f"[WARNING] UDP port {port} binding detection timeout after {timeout}s")
    return False

def main():
    repo_root = Path(__file__).resolve().parents[3]
    engine_bin = repo_root / "src/apps/exchange_matching_engine/bin/debug/exchange_matching_engine"
    algo_bin = repo_root / "src/apps/client_algorithm/bin/debug/client_algorithm"
    md_playback_bin = repo_root / "src/apps/exchange_market_data_playback/bin/debug/exchange_market_data_playback"

    # 1. Start matching engine
    engine_proc = run_process([str(engine_bin), "--demo"])
    wait_for_handshake("matching engine")

    # 2. Start algo
    algo_proc = run_process([str(algo_bin), "--demo"])
    wait_for_handshake("algo")

    # 3. Start market data playback
    md_proc = run_process([str(md_playback_bin), "--demo"])
    wait_for_handshake("market data playback")

    print("[INFO] All components started. Demo running.")
    try:
        # Wait for user to terminate or for any process to exit
        engine_proc.wait()
        algo_proc.wait()
        md_proc.wait()
    except KeyboardInterrupt:
        print("[INFO] Terminating demo processes...")
        engine_proc.terminate()
        algo_proc.terminate()
        md_proc.terminate()

if __name__ == "__main__":
    main()
