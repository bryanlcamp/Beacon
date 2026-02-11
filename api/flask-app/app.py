#!/usr/bin/env python3
"""
Beacon Flask API - Bridge between web frontend and C++ processing
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import subprocess
import time
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Paths
OUTBOUND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'outbound')
INBOUND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'inbound')


@app.route('/api/simulation', methods=['POST'])
def start_simulation():
    """
    Start a new simulation run
    Web frontend sends config → Generate JSON → Invoke C++ → Return job ID
    """
    try:
        config = request.get_json()
        job_id = str(uuid.uuid4())[:8]
        
        # Create config file for C++ executable
        config_data = {
            "job_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "messages": config.get('messages', 1000),
            "dataset": config.get('dataset', 'cme'),
            "strategy": config.get('strategy', 'example'),
            "output_path": os.path.join(INBOUND_DIR, f"results_{job_id}.pdf")
        }
        
        config_file = os.path.join(OUTBOUND_DIR, f"config_{job_id}.json")
        with open(config_file, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        # TODO: Invoke C++ executable (stubbed for now)
        # subprocess.Popen(['/path/to/beacon-sim', config_file])
        
        # Create mock status file
        status_file = os.path.join(INBOUND_DIR, f"status_{job_id}.json")
        with open(status_file, 'w') as f:
            json.dump({
                "job_id": job_id,
                "status": "running",
                "started": datetime.now().isoformat()
            }, f, indent=2)
        
        return jsonify({
            "success": True,
            "job_id": job_id,
            "status": "started",
            "config_file": config_file
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/simulation/<job_id>/status', methods=['GET'])
def get_simulation_status(job_id):
    """
    Check status of a running simulation
    Reads from inbound folder for status updates from C++
    """
    try:
        status_file = os.path.join(INBOUND_DIR, f"status_{job_id}.json")
        
        if not os.path.exists(status_file):
            return jsonify({"success": False, "error": "Job not found"}), 404
        
        with open(status_file, 'r') as f:
            status = json.load(f)
        
        # Check for results file
        results_file = os.path.join(INBOUND_DIR, f"results_{job_id}.pdf")
        if os.path.exists(results_file):
            status["results_ready"] = True
            status["download_url"] = f"/api/simulation/{job_id}/results"
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/simulation/<job_id>/progress', methods=['GET'])
def get_simulation_progress(job_id):
    """
    Get detailed progress data for visualization
    Returns message processing progress in buckets for charting
    """
    try:
        progress_file = os.path.join(INBOUND_DIR, f"progress_{job_id}.json")
        
        if not os.path.exists(progress_file):
            return jsonify({"success": False, "error": "Progress data not found"}), 404
            
        with open(progress_file, 'r') as f:
            progress_data = json.load(f)
        
        return jsonify(progress_data)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/simulation/<job_id>/results', methods=['GET'])
def download_results(job_id):
    """
    Download PDF results for completed simulation
    """
    try:
        results_file = f"results_{job_id}.pdf"
        return send_from_directory(INBOUND_DIR, results_file, as_attachment=True)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "outbound_dir": os.path.exists(OUTBOUND_DIR),
        "inbound_dir": os.path.exists(INBOUND_DIR)
    })


if __name__ == '__main__':
    # Ensure directories exist
    os.makedirs(OUTBOUND_DIR, exist_ok=True)
    os.makedirs(INBOUND_DIR, exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5000)