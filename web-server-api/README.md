# Beacon Flask API 

File-based communication bridge between web frontend and C++ processing with **real-time progress tracking**.

## Structure

```
/api/
├── outbound/          # JSON configs for C++ executable
├── inbound/           # Status updates, results from C++
├── flask-app/         # Flask server
│   ├── app.py
│   └── requirements.txt
└── progress-demo.html # Progress visualization demo
```

## API Flow

1. **Start Simulation**: `POST /api/simulation`
   - Web sends config → Generate JSON in `/outbound/`
   - Invoke C++ with JSON path
   - Return job ID

2. **Check Status**: `GET /api/simulation/{job_id}/status` 
   - Read status from `/inbound/status_{job_id}.json`
   - C++ updates this file during processing

3. **Get Progress**: `GET /api/simulation/{job_id}/progress`
   - Read progress data from `/inbound/progress_{job_id}.json`
   - Real-time bucket-based progress with performance metrics

4. **Download Results**: `GET /api/simulation/{job_id}/results`
   - Return PDF from `/inbound/results_{job_id}.pdf`

## Progress Visualization

The progress tracking supports:
- **Message buckets** (e.g., 1k message chunks)
- **Real-time latency charts**
- **Throughput monitoring** 
- **Performance statistics**
- **Time estimation**

Demo: Open `/api/progress-demo.html` to see progress visualization

## C++ Integration

Your C++ executable should:

1. **Read config** from `/api/outbound/config_{job_id}.json`:
   ```json
   {
     "job_id": "abc123",
     "messages": 1000000,
     "progress_tracking": {
       "bucket_size": 1000,
       "update_frequency": "per_bucket"
     }
   }
   ```

2. **Write progress** to `/api/inbound/progress_{job_id}.json` every bucket:
   ```cpp
   // Every 1k messages processed
   if (messages_processed % bucket_size == 0) {
       update_progress_file(job_id, bucket_number, avg_latency, throughput);
   }
   ```

3. **Write final status** to `/api/inbound/status_{job_id}.json`
4. **Write results** to `/api/inbound/results_{job_id}.pdf`

## Setup

```bash
cd api/flask-app
pip install -r requirements.txt
python app.py
```