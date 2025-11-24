# 🔧 Beacon Configuration Reference

Complete reference for all Beacon configuration options.

## 📋 Quick Reference

| Setting | Description | Default | Values |
|---------|-------------|---------|--------|
| `symbol` | Stock symbol to trade | `"AAPL"` | Any valid symbol |
| `side` | Buy or Sell | `"B"` | `"B"` (Buy), `"S"` (Sell) |
| `shares` | Total shares to execute | `1000` | Positive integer |
| `price` | Limit price per share | `150.0` | Positive number |
| `time_window_minutes` | TWAP execution window | `2` | 1-60 minutes |
| `slice_count` | Number of child orders | `6` | 1-100 slices |
| `protocol` | Exchange protocol | `"cme"` | `"nasdaq"`, `"cme"`, `"nyse"` |
| `duration_seconds` | Session runtime | `30` | 10-3600 seconds |

## 📖 Detailed Settings

### Trading Parameters

#### `symbol` - Stock Symbol
```json
"symbol": "AAPL"
```
- **Description**: Stock symbol to trade
- **Examples**: `"AAPL"`, `"MSFT"`, `"GOOGL"`, `"TSLA"`
- **Note**: Must be a valid symbol in your market data

#### `side` - Order Side  
```json
"side": "B"
```
- **Description**: Whether to buy or sell
- **Values**: 
  - `"B"` - Buy orders
  - `"S"` - Sell orders

#### `shares` - Total Quantity
```json
"shares": 1000
```
- **Description**: Total shares to execute via TWAP
- **Range**: 1 to 1,000,000
- **Note**: Will be split across `slice_count` orders

#### `price` - Limit Price
```json
"price": 150.0
```
- **Description**: Limit price per share in dollars
- **Range**: 0.01 to 10,000.00
- **Note**: Used for all child orders

### TWAP Algorithm

#### `time_window_minutes` - Execution Window
```json
"time_window_minutes": 2
```
- **Description**: How long to spread the order over
- **Range**: 1 to 60 minutes
- **Calculation**: Slice interval = `time_window_minutes * 60 / slice_count`

#### `slice_count` - Order Slices
```json
"slice_count": 6
```
- **Description**: Number of child orders to create
- **Range**: 1 to 100
- **Example**: 1000 shares ÷ 6 slices = ~167 shares per order

### System Settings

#### `protocol` - Exchange Protocol
```json
"protocol": "cme"
```
- **Description**: Which exchange protocol to use
- **Values**:
  - `"nasdaq"` - NASDAQ OUCH v5.0
  - `"cme"` - CME iLink 3  
  - `"nyse"` - NYSE Pillar v3.2

#### `duration_seconds` - Session Duration
```json
"duration_seconds": 30
```
- **Description**: Total session runtime (monitoring period)
- **Range**: 10 to 3600 seconds
- **Note**: Should be longer than `time_window_minutes * 60`

### Network Settings

#### `market_data_port` - UDP Port
```json
"market_data_port": 8002
```
- **Description**: Port for market data UDP stream
- **Default**: 8002
- **Note**: Usually don't need to change

#### `order_entry_port` - TCP Port  
```json
"order_entry_port": 9002
```
- **Description**: Port for order entry TCP connection
- **Default**: 9002
- **Note**: Usually don't need to change

### Market Data Generation

#### `symbols_list` - Data Symbols
```json
"symbols_list": ["AAPL", "MSFT", "GOOGL"]
```
- **Description**: Symbols for market data generation
- **Note**: Your trading `symbol` should be included

#### `message_count` - Data Volume
```json
"message_count": 5000
```
- **Description**: Number of market data messages to generate
- **Range**: 1000 to 100,000

## 📄 Complete Example

```json
{
  "_comment": "🚀 BEACON TRADING SYSTEM - USER CONFIG 🚀",
  "_description": "Edit the values marked #change_me",
  
  "_trading_comment": "📈 TRADING SETTINGS #change_me",
  "symbol": "AAPL",
  "side": "B", 
  "shares": 1000,
  "price": 150.0,
  "time_window_minutes": 2,
  "slice_count": 6,
  
  "_data_comment": "📊 MARKET DATA SETTINGS #change_me", 
  "data_source": "generator",
  "symbols_list": ["AAPL", "MSFT", "GOOGL"],
  "message_count": 5000,
  "data_file": "market_data.bin",
  
  "_system_comment": "⚙️ SYSTEM SETTINGS",
  "protocol": "cme",
  "duration_seconds": 30,
  "market_data_port": 8002,
  "order_entry_port": 9002,
  
  "_matching_comment": "🎯 MATCHING ENGINE",
  "match_type": "fifo",
  "fill_probability": 1.0,
  "partial_fills": true,
  
  "_advanced_comment": "🔧 ADVANCED SETTINGS",
  "enable_generator": true,
  "enable_playbook": false,
  "enable_matching_engine": true,
  "enable_algorithm": true,
  "startup_delay_seconds": 2
}
```

## 🧮 Calculations

### TWAP Timing
- **Slice Interval**: `time_window_minutes * 60 / slice_count` seconds
- **Shares per Slice**: `shares / slice_count` (rounded)

### Example: 1000 AAPL over 2 minutes with 6 slices
- Slice Interval: `2 * 60 / 6 = 20 seconds` 
- Shares per Slice: `1000 / 6 = 167 shares` (rounded)
- Schedule: 167 shares every 20 seconds for 2 minutes

## 🔗 Related Documentation

- **[Getting Started](getting-started.md)** - Step-by-step tutorial
- **[Advanced Usage](advanced-usage.md)** - beacon-unified.py configuration  
- **[TWAP Algorithm](twap-algorithm.md)** - Algorithm details
- **[Troubleshooting](troubleshooting.md)** - Common configuration issues

---

**[← Back to Documentation Hub](index.md)**