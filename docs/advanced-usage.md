# ⚡ Advanced Usage

Power user features and advanced configurations for Beacon Trading System.

## 🎯 Overview

While `beacon-simple.py` provides the perfect getting-started experience, power users need advanced features like:

- **Multiple algorithm execution**
- **Custom protocol implementations** 
- **Performance optimization**
- **Integration with external systems**
- **Advanced risk management**
- **Real-time monitoring and control**

This guide covers these advanced scenarios using the full `beacon-unified.py` interface.

## 🚀 Advanced Interface

### **beacon-unified.py**

The advanced interface provides **modular configuration** and **fine-grained control**:

```bash
# Advanced interface with modular configs
python3 beacon-unified.py

# Custom config locations
python3 beacon-unified.py --config configs/startBeaconNYSE.json

# Debug mode with verbose output
python3 beacon-unified.py --debug --verbose
```

**Key Differences from Simple Interface**:
- **Modular Configs**: Separate JSON files per component
- **Advanced Features**: Custom protocols, multiple algorithms, performance tuning
- **External Integration**: API endpoints, database connections, message queues
- **Production Features**: Monitoring, alerting, automated recovery

## 📁 Advanced Configuration Structure

### **Master Configuration (startBeacon.json)**
```json
{
    "market_data_generator": {
        "config_file": "config/generator/real_market.json",
        "enabled": true
    },
    "matching_engine": {
        "config_file": "config/matching_engine/production.json", 
        "enabled": true
    },
    "algorithms": [
        {
            "name": "twap_aapl",
            "config_file": "config/algorithm/twap_aggressive.json",
            "enabled": true
        },
        {
            "name": "vwap_tsla", 
            "config_file": "config/algorithm/vwap_passive.json",
            "enabled": true
        }
    ],
    "monitoring": {
        "enabled": true,
        "dashboard_port": 8080,
        "metrics_endpoint": "/metrics"
    }
}
```

### **Advanced Algorithm Configuration**
```json
{
    "algorithm": {
        "type": "TWAP_PLUS",
        "symbol": "AAPL",
        "side": "B",
        "total_quantity": 50000,
        "time_window_seconds": 1800,
        "slice_count": 30,
        
        "advanced_settings": {
            "adaptive_sizing": true,
            "market_impact_model": "ALMGREN_CHRISS",
            "participation_rate_limit": 0.15,
            "price_improvement_threshold": 0.01,
            
            "risk_controls": {
                "max_slice_size": 2000,
                "price_collar_percent": 2.0,
                "position_limit": 100000,
                "daily_loss_limit": 50000.0
            },
            
            "execution_tactics": {
                "aggressive_on_momentum": true,
                "passive_near_close": true,
                "iceberg_threshold": 5000,
                "smart_order_routing": ["NYSE", "NASDAQ", "BATS"]
            }
        }
    },
    
    "protocol": {
        "primary": "pillar",
        "backup": "ouch", 
        "custom_fields": {
            "account": "PROD_TRADER_001",
            "clearing_firm": "EXAMPLE_CLEARING",
            "trader_id": "JD_001"
        }
    },
    
    "performance": {
        "cpu_affinity": [2, 3],
        "memory_pool_mb": 512,
        "numa_node": 0,
        "priority": "HIGH"
    }
}
```

### **Production Matching Engine Configuration**
```json
{
    "matching_engine": {
        "order_book": {
            "price_levels": 1000,
            "memory_pool_orders": 100000,
            "tick_size": 0.01,
            "lot_size": 100
        },
        
        "network": {
            "order_entry_port": 9002,
            "market_data_port": 8002,
            "drop_copy_port": 9003,
            "admin_port": 9001,
            "interface": "lo0",
            "tcp_nodelay": true,
            "socket_buffer_size": 65536
        },
        
        "latency": {
            "matching_delay_microseconds": 50,
            "ack_delay_microseconds": 10,
            "market_data_delay_microseconds": 5
        },
        
        "protocols": {
            "ouch": {
                "version": "5.0",
                "heartbeat_interval": 30,
                "sequence_reset_on_logon": true
            },
            "pillar": {
                "version": "3.2", 
                "max_message_size": 1024,
                "compression": false
            },
            "cme": {
                "version": "iLink3",
                "session_id": "BEACON001",
                "firm_id": "EXAMPLE"
            }
        }
    }
}
```

## 🔀 Multi-Algorithm Execution

### **Parallel Algorithm Orchestration**

**Use Case**: Execute TWAP on AAPL while running VWAP on TSLA simultaneously

**Configuration**:
```json
{
    "algorithms": [
        {
            "name": "aapl_twap",
            "symbol": "AAPL", 
            "algorithm": "TWAP",
            "shares": 10000,
            "time_window_minutes": 30,
            "priority": "HIGH"
        },
        {
            "name": "tsla_vwap", 
            "symbol": "TSLA",
            "algorithm": "VWAP", 
            "shares": 5000,
            "time_window_minutes": 45,
            "priority": "MEDIUM"  
        }
    ]
}
```

**Execution**:
```bash
python3 beacon-unified.py --parallel --max-algorithms 5
```

**Output**:
```
[SUCCESS] [SYSTEM   ] 🎉 Multi-algorithm execution ready
[SUCCESS] [AAPL-TWAP] Started: 10,000 shares over 30 minutes
[SUCCESS] [TSLA-VWAP] Started: 5,000 shares over 45 minutes
[SUCCESS] [AAPL-TWAP] Slice 1/20: 500 shares @ $150.25 → FILLED
[SUCCESS] [TSLA-VWAP] Slice 1/15: 333 shares @ $250.30 → FILLED
[SUCCESS] [AAPL-TWAP] Slice 2/20: 500 shares @ $150.28 → FILLED
```

### **Algorithm Performance Comparison**

**Execution Quality Dashboard**:
```
┌─ Algorithm Performance ────────────────────────────────────┐
│ AAPL TWAP │ Progress: ██████░░░░ 60% │ Slippage: -$0.15  │
│ TSLA VWAP │ Progress: ████░░░░░░ 40% │ Slippage: +$0.23  │  
│ MSFT IMPL │ Progress: ██████████ 100% │ Slippage: -$0.05 │
└────────────────────────────────────────────────────────────┘

┌─ Real-time Metrics ────────────────────────────────────────┐
│ Total Orders: 1,247 │ Fills: 1,241 │ Rejects: 6         │
│ Avg Latency: 127μs  │ 99th: 245μs   │ Max: 450μs         │
│ P&L Today: +$2,341  │ Unrealized: +$156 │ Risk: 23%      │
└────────────────────────────────────────────────────────────┘
```

## 🔌 Custom Protocol Implementation

### **Adding a New Exchange Protocol**

**Example**: Implementing Coinbase Pro (FIX 4.4) for crypto trading

**1. Protocol Handler Interface**:
```cpp
// include/protocols/coinbase_pro.h
class CoinbaseProHandler : public ProtocolHandler {
private:
    std::string api_key_;
    std::string secret_key_;
    std::string passphrase_;
    
public:
    std::vector<uint8_t> encode_order(const Order& order) override;
    Order decode_execution_report(const std::vector<uint8_t>& data) override;
    bool authenticate_session() override;
};
```

**2. FIX Message Implementation**:
```cpp
// src/protocols/coinbase_pro.cpp
std::vector<uint8_t> CoinbaseProHandler::encode_order(const Order& order) {
    FIXMessage msg;
    msg.set_field(FIX::MsgType, FIX::MsgType_NewOrderSingle);
    msg.set_field(FIX::ClOrdID, order.client_order_id);
    msg.set_field(FIX::Symbol, order.symbol);
    msg.set_field(FIX::Side, order.side == Side::BUY ? '1' : '2');
    msg.set_field(FIX::OrderQty, order.quantity);
    msg.set_field(FIX::OrdType, order.type == OrderType::MARKET ? '1' : '2');
    
    if (order.type == OrderType::LIMIT) {
        msg.set_field(FIX::Price, order.price);
    }
    
    // Coinbase-specific fields
    msg.set_field(FIX::TimeInForce, '1'); // GTC
    msg.set_field(544, order.cash_order_qty); // CashOrderQty for market orders
    
    return msg.serialize();
}
```

**3. Configuration Integration**:
```json
{
    "protocol": {
        "type": "coinbase_pro",
        "endpoint": "wss://ws-feed-public.pro.coinbase.com",
        "credentials": {
            "api_key": "${COINBASE_API_KEY}",
            "secret": "${COINBASE_SECRET}", 
            "passphrase": "${COINBASE_PASSPHRASE}"
        },
        "settings": {
            "heartbeat_interval": 30,
            "reconnect_delay": 5,
            "max_message_size": 4096
        }
    }
}
```

**4. Registration**:
```cpp
// Register new protocol in main()
ProtocolRegistry::instance().register_protocol(
    "coinbase_pro", 
    std::make_unique<CoinbaseProHandler>()
);
```

## ⚡ Performance Optimization

### **CPU Affinity and NUMA Optimization**

**Configuration for High-Frequency Trading**:
```json
{
    "performance": {
        "cpu_affinity": {
            "matching_engine": [0, 1],    // Dedicated cores
            "algorithm_1": [2],           // Isolated core
            "algorithm_2": [3],           // Isolated core  
            "market_data": [4, 5],        // Data processing
            "network_io": [6, 7]          // Network interrupts
        },
        
        "numa_topology": {
            "matching_engine": 0,         // NUMA node 0
            "algorithms": 0,              // Same node as engine
            "market_data": 1              // Separate node for data
        },
        
        "memory_optimization": {
            "huge_pages": true,           // 2MB pages
            "memory_lock": true,          // Prevent swapping
            "pre_allocate_mb": 1024       // Pre-fault memory
        },
        
        "scheduler": {
            "policy": "SCHED_FIFO",       // Real-time scheduling
            "priority": 99,               // Highest priority
            "isolcpus": [0, 1, 2, 3]     // Isolate from kernel
        }
    }
}
```

**System Setup Script**:
```bash
#!/bin/bash
# setup_hft_system.sh

# Enable huge pages
echo 512 > /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages

# Isolate CPUs from kernel scheduling
echo "isolcpus=0,1,2,3 nohz_full=0,1,2,3 rcu_nocbs=0,1,2,3" >> /etc/default/grub
update-grub

# Set CPU governor to performance
for cpu in {0..3}; do
    echo performance > /sys/devices/system/cpu/cpu${cpu}/cpufreq/scaling_governor
done

# Disable CPU frequency scaling
echo 1 > /sys/devices/system/cpu/intel_pstate/no_turbo

# Network interrupt affinity 
echo 6 > /proc/irq/24/smp_affinity  # Ethernet interrupt to CPU 6
```

### **Lock-Free Data Structures**

**High-Performance Order Queue**:
```cpp
// include/utils/spsc_queue.h
template<typename T, size_t Size>
class SPSCQueue {
private:
    alignas(64) std::atomic<size_t> head_{0};  // Producer cache line
    alignas(64) std::atomic<size_t> tail_{0};  // Consumer cache line
    alignas(64) std::array<T, Size> buffer_;   // Data cache lines
    
public:
    bool enqueue(const T& item) noexcept {
        const size_t current_head = head_.load(std::memory_order_relaxed);
        const size_t next_head = (current_head + 1) % Size;
        
        if (next_head == tail_.load(std::memory_order_acquire)) {
            return false;  // Queue full
        }
        
        buffer_[current_head] = item;
        head_.store(next_head, std::memory_order_release);
        return true;
    }
    
    bool dequeue(T& item) noexcept {
        const size_t current_tail = tail_.load(std::memory_order_relaxed);
        
        if (current_tail == head_.load(std::memory_order_acquire)) {
            return false;  // Queue empty
        }
        
        item = buffer_[current_tail];
        tail_.store((current_tail + 1) % Size, std::memory_order_release);
        return true;
    }
};
```

**Zero-Copy Market Data Processing**:
```cpp
// Memory-mapped market data file
class MemoryMappedMarketData {
private:
    void* mapped_memory_;
    size_t file_size_;
    size_t current_offset_;
    
public:
    const MarketTick* get_next_tick() noexcept {
        if (current_offset_ + sizeof(MarketTick) > file_size_) {
            return nullptr;
        }
        
        const MarketTick* tick = reinterpret_cast<const MarketTick*>(
            static_cast<char*>(mapped_memory_) + current_offset_
        );
        current_offset_ += sizeof(MarketTick);
        return tick;
    }
};
```

## 📊 Advanced Risk Management

### **Real-Time Risk Monitoring**

**Multi-Dimensional Risk Controls**:
```json
{
    "risk_management": {
        "position_limits": {
            "max_gross_exposure": 10000000,    // $10M gross
            "max_net_exposure": 5000000,       // $5M net  
            "max_single_position": 1000000,    // $1M per symbol
            "sector_limits": {
                "TECH": 3000000,               // $3M in tech
                "FINANCE": 2000000,            // $2M in finance
                "HEALTHCARE": 1500000          // $1.5M in healthcare
            }
        },
        
        "pnl_limits": {
            "daily_loss_limit": 100000,        // $100K daily loss
            "weekly_loss_limit": 300000,       // $300K weekly loss
            "drawdown_limit": 0.15,            // 15% max drawdown
            "var_limit": 250000                // $250K Value at Risk
        },
        
        "order_controls": {
            "max_order_size": 50000,           // Max single order
            "max_order_rate": 100,             // Orders per second
            "price_collar_percent": 5.0,       // Price deviation limit
            "market_order_limit": 10000        // Max market order size
        }
    }
}
```

**Risk Engine Implementation**:
```cpp
class RiskEngine {
private:
    PositionTracker positions_;
    PnLCalculator pnl_;
    RiskLimits limits_;
    
public:
    RiskDecision check_order(const Order& order) {
        // Position limit check
        if (!check_position_limits(order)) {
            return RiskDecision::REJECT("Position limit exceeded");
        }
        
        // P&L limit check  
        double projected_pnl = calculate_projected_pnl(order);
        if (pnl_.daily_pnl() + projected_pnl < -limits_.daily_loss_limit) {
            return RiskDecision::REJECT("Daily loss limit would be exceeded");
        }
        
        // Price collar check
        if (!check_price_collar(order)) {
            return RiskDecision::REJECT("Price outside collar");
        }
        
        // Order size check
        if (order.quantity > limits_.max_order_size) {
            return RiskDecision::REJECT("Order size too large");
        }
        
        return RiskDecision::APPROVE();
    }
};
```

### **Circuit Breakers and Emergency Stops**

**Automated Risk Response**:
```cpp
class CircuitBreaker {
private:
    std::atomic<bool> trading_enabled_{true};
    std::atomic<double> loss_threshold_{100000.0};
    
public:
    void check_conditions() {
        double current_pnl = pnl_tracker_.get_daily_pnl();
        
        if (current_pnl < -loss_threshold_.load()) {
            emergency_stop("Daily loss limit reached");
        }
        
        double portfolio_var = risk_calculator_.calculate_var();
        if (portfolio_var > var_limit_) {
            emergency_stop("VaR limit exceeded");
        }
    }
    
    void emergency_stop(const std::string& reason) {
        trading_enabled_.store(false);
        cancel_all_orders();
        flatten_all_positions();
        notify_risk_managers(reason);
        log_emergency_stop(reason);
    }
};
```

## 🔄 External System Integration

### **Database Integration**

**Trade Reporting to PostgreSQL**:
```cpp
class DatabaseReporter {
private:
    pqxx::connection conn_;
    
public:
    void report_execution(const Execution& exec) {
        pqxx::work txn(conn_);
        
        txn.exec_params(
            "INSERT INTO executions "
            "(timestamp, symbol, side, quantity, price, algorithm) "
            "VALUES ($1, $2, $3, $4, $5, $6)",
            exec.timestamp,
            exec.symbol, 
            exec.side,
            exec.quantity,
            exec.price,
            exec.algorithm_name
        );
        
        txn.commit();
    }
};
```

**Configuration**:
```json
{
    "database": {
        "type": "postgresql",
        "connection_string": "postgresql://trader:password@localhost:5432/beacon_trading",
        "connection_pool_size": 10,
        "reporting": {
            "executions": true,
            "market_data": false,
            "risk_events": true,
            "performance_metrics": true
        }
    }
}
```

### **Message Queue Integration**

**Real-Time Event Streaming**:
```cpp
#include <kafka/kafka.h>

class EventStreamer {
private:
    kafka::producer producer_;
    
public:
    void stream_execution(const Execution& exec) {
        nlohmann::json event = {
            {"type", "execution"},
            {"timestamp", exec.timestamp},
            {"symbol", exec.symbol},
            {"quantity", exec.quantity}, 
            {"price", exec.price},
            {"algorithm", exec.algorithm_name}
        };
        
        producer_.send(kafka::record("trading_events", event.dump()));
    }
};
```

### **REST API Integration**

**Real-Time Control Interface**:
```cpp
#include <crow.h>

class TradingAPI {
private:
    crow::SimpleApp app_;
    
public:
    void setup_routes() {
        // Get current positions
        CROW_ROUTE(app_, "/positions")
        ([this]() {
            return position_tracker_.to_json();
        });
        
        // Emergency stop all algorithms
        CROW_ROUTE(app_, "/emergency_stop").methods("POST"_method)
        ([this](const crow::request& req) {
            emergency_stop_all();
            return crow::response(200, "Emergency stop activated");
        });
        
        // Start new algorithm
        CROW_ROUTE(app_, "/algorithms").methods("POST"_method)
        ([this](const crow::request& req) {
            auto config = nlohmann::json::parse(req.body);
            auto algo_id = start_algorithm(config);
            return crow::response(201, algo_id);
        });
    }
};
```

## 📈 Advanced Analytics

### **Real-Time Performance Attribution**

**Execution Quality Metrics**:
```cpp
class ExecutionAnalyzer {
public:
    struct ExecutionMetrics {
        double implementation_shortfall;
        double market_impact; 
        double timing_risk;
        double opportunity_cost;
        double total_cost;
    };
    
    ExecutionMetrics analyze_twap_execution(
        const std::vector<Execution>& executions,
        const MarketData& benchmark_data
    ) {
        ExecutionMetrics metrics;
        
        // Implementation Shortfall = (Execution Price - Decision Price) * Quantity
        double decision_price = benchmark_data.arrival_price;
        double total_cost = 0.0;
        double total_quantity = 0.0;
        
        for (const auto& exec : executions) {
            double slice_cost = (exec.price - decision_price) * exec.quantity;
            total_cost += slice_cost;
            total_quantity += exec.quantity;
        }
        
        metrics.implementation_shortfall = total_cost / total_quantity;
        
        // Market Impact = Execution Price - Mid Price at execution time
        metrics.market_impact = calculate_market_impact(executions, benchmark_data);
        
        // Timing Risk = Mid Price Movement during execution
        metrics.timing_risk = calculate_timing_risk(executions, benchmark_data);
        
        return metrics;
    }
};
```

### **Machine Learning Integration**

**Predictive Market Impact Model**:
```python
# ml/market_impact_model.py
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

class MarketImpactPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        
    def train(self, historical_executions):
        """Train on historical execution data"""
        features = self.extract_features(historical_executions)
        targets = self.extract_market_impact(historical_executions)
        
        self.model.fit(features, targets)
        joblib.dump(self.model, 'models/market_impact_model.pkl')
        
    def predict_impact(self, order_size, symbol, time_of_day, volatility):
        """Predict market impact for a given order"""
        features = np.array([[order_size, symbol, time_of_day, volatility]])
        predicted_impact = self.model.predict(features)[0]
        return predicted_impact
        
    def optimize_slice_sizes(self, total_quantity, time_horizon, symbol):
        """Optimize TWAP slice sizes to minimize expected impact"""
        # Use predicted impact to optimize execution schedule
        pass
```

**C++ Integration**:
```cpp
class MLMarketImpactModel {
private:
    Python python_model_;
    
public:
    double predict_impact(const Order& order, const MarketContext& context) {
        // Call Python model from C++
        py::object result = python_model_.attr("predict_impact")(
            order.quantity,
            order.symbol,
            context.time_of_day,
            context.volatility
        );
        return result.cast<double>();
    }
};
```

## 🔧 Production Deployment

### **Containerized Deployment**

**Dockerfile**:
```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    python3 \
    python3-pip \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY . /app/beacon
WORKDIR /app/beacon

# Build system
RUN cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
RUN cmake --build build --parallel

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Create non-root user
RUN useradd -m -s /bin/bash trader
USER trader

# Run beacon
CMD ["python3", "beacon-unified.py"]
```

**Docker Compose for Multi-Service Setup**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  beacon-trading:
    build: .
    container_name: beacon-trading
    volumes:
      - ./configs:/app/beacon/configs
      - ./logs:/app/beacon/logs
    environment:
      - TRADING_ENV=production
      - LOG_LEVEL=INFO
    networks:
      - trading-network
    
  beacon-risk:
    build: .
    container_name: beacon-risk
    command: ["python3", "risk_server.py"]
    networks:
      - trading-network
      
  redis:
    image: redis:alpine
    container_name: beacon-redis
    networks:
      - trading-network
      
  postgres:
    image: postgres:14
    container_name: beacon-db
    environment:
      - POSTGRES_DB=beacon_trading
      - POSTGRES_USER=trader
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - trading-network

networks:
  trading-network:
    driver: bridge

volumes:
  postgres_data:
```

### **Kubernetes Deployment**

**Production Kubernetes Manifests**:
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: beacon-trading
spec:
  replicas: 3
  selector:
    matchLabels:
      app: beacon-trading
  template:
    metadata:
      labels:
        app: beacon-trading
    spec:
      containers:
      - name: beacon
        image: beacon-trading:latest
        resources:
          requests:
            cpu: 2000m
            memory: 4Gi
          limits:
            cpu: 4000m
            memory: 8Gi
        env:
        - name: TRADING_ENV
          value: "production"
        volumeMounts:
        - name: config-volume
          mountPath: /app/beacon/configs
        - name: logs-volume
          mountPath: /app/beacon/logs
      volumes:
      - name: config-volume
        configMap:
          name: beacon-config
      - name: logs-volume
        persistentVolumeClaim:
          claimName: beacon-logs-pvc
```

---

## 🔗 Related Documentation

- **[Getting Started](getting-started.md)** - Simple interface tutorial
- **[Configuration Reference](configuration.md)** - All settings explained
- **[Architecture Guide](architecture.md)** - System design details  
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

---

**[← Back to Documentation Hub](index.md)**