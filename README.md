![Beacon Trading System](docs/assets/beacon-homepage.svg)

# Beacon Trading System
Beacon is a Comprehensive Live Trading Simulator. Allowing your trading strategy to run in a real trading environment. With all components provided. Simply plug in your algorithm, and you can start testing in minutes.

## What Makes This Different

### Creating Customized Datasets.
- You're in charge of tailoring your own datasets, on a granular level. Enter as many products as you want. Configure each product's ***bid-ask spread***, ***volume***, ***bid/ask prices*** with a weighting system, the percent of messaegs per product in the data set,
the ***product's trading*** frequency, and much, much more.
- You pick the exchange, and your dataset will be generated into ***native binary protocol***, per each exchange's specifications.
- Create as many datasets as you'd like, specify whatever parameters you'd like.

### Market Data Exchange
Beacon comes with a world-class component called "Market Data Playback". This acts as a true market data exchange. It broadcasts the dataset ***you created*** to your algorithm via UDP (loopback). Just as an exchange would. No market data **ever** leaves your trading machine. **No networking** is involved. But your algorithm receives all the benefits of interacting with a true exchange, sending your data in exchange-specific binary protocol.
- Play your data back in configurable burst and wave intervals.
- Play your data back at different speeds. Stress test your algorithm in real-time.
- Make the exchange "go dark", send you malformed, out of order, or missing packets, so you can prepare for disaster-recovery scenarios.

### Client Algorithm
**Real Exchange Protocols** - Native binary NASDAQ NYSE, and CME used throughout  
**World-Class Infrastructure** - Lock-free, cache-aware, zero-copying.
**Production Architecture** - Matching engine, order book simulation, multi-threaded market data processing  
**Institutional Features** - Risk limits, position tracking, real-time P&L, execution analytics

## Plug-In Algorithm Development

Build sophisticated trading strategies with the framework:

```cpp
class YourStrategy : public AlgorithmBase {
    void onMarketData(const MarketUpdate& update) override {
        // Your trading logic here
        //if (shouldTrade(update)) {
        //    sendOrder(OrderType::LIMIT, 100, update.bid + 0.01);
        //}
    }

    void onOrderAck(const MarketOrder& order) override {
    }

    void onOrderReject(const MarketReject& reject) override {
    }    

    void onOrderFill(const ExecutionReport& fill) override {
        //updatePosition(fill);
    }
};
```

**Included Strategies:**
- **TWAP** - A true Time-weighted average price execution.
- **POV**  - A minimal copy/paste example.

## Contact

**Bryan Camp**  
Email: [bryancamp@gmail.com]  
LinkedIn: [linkedin.com/in/bryanlcamp]  