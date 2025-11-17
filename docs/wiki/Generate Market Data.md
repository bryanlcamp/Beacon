## Generating Market Data Configuration
Below is a snippet from a Market Data Generator configuration file. Some of the parameters, and their meanings are intuitive. Some are more complex. Regardless, let's break them all down, very explicitly.

### Sample Config  File
```json:{
  "num_messages": 10000, # Number of messages to generate
  "use_prev_day": true   # Init config with yesterday's settings?
  "exchange": "nsdq"     # Exchange (Protocol: Totalview)
  "symbols": [                     # Products and their settings
    {
      "symbol": "MSFT",            # MSFT Configuration Parameters
      "percent": 30,               # Percent of messages that are MSFT
      "trade_qty_percentage": 75,  # The total number of MSFT shares
      "spread_percentage": 0.8,    # Bid-Ask spread
      "prev_day": {                # Previous trading day's OHLCV
        "open_price": 508.29,      # Open price
        "high_price": 514.83,      # Highest traded price
        "low_price": 506.57,       # Lowest traded price
        "close_price": 510.53,     # Close Price
        "volume:" 917475           # Volume traded
      },
      "price_range": {             # Prices must be within this band
        "high_price": 506.57,      # Highest generated price
        "low_price": 514.83,       # Lowest generated price
        "low_weight": 1.0          # Probability generated price is low
      },
      "quantity_range": {          # Qtys must be within this band
        "min_quantity": 10,        # Minimum generated quantity
        "max_quantity": 100,       # Maximum generated quantity
        "low_weight": 1.0          # Probability generated qty is low 
      },
    },                             # Add more symbols here
  ]
  ```
### Global Configuration
First, note that each Market Data Generator configuration file begins with a ***global section***. Specifically, this section of the configuration file applies to ***all*** products. Let's break down what each field means:
- `num_messages`: The ***total*** number of messages that will be generated. Specifically, the ***binary*** file you just created will contain this number of messages (formatted using the  ***appropriate exhcange protocol***).
- `use_prev_day`: End-of-day values from the previous day are freely available, for both personal and commercial use. Indicates whether Beacon should download the previous day's OHLCV (***O***pen price, ***H***ighest traded price, ***L***owest traded price, ***C***losing price, ***V***olume traded). If this value is true, then: (1) the product's price band will be updated to use the previous day.
- `exchange`: The exchange on which these products are listed. ***NOTE:*** this is only used to determine what exchange messaging protocol to use. For example, if you were to specify "cme", Beacon knows to generate message using the ***ITCH*** protocol when generating messages. Internally, Beacon has an ***Exchange protocol versioning system***. Details re: how to configure and use that substack are ***defined here.*** ***IMPORTANT:*** Beacon generates messages based on the exchange specified at the global level. You ***may not*** use a different exchange at the produce level. E.g., if you specify "cme", all messages will be generated in CME (ITCH) format.

### Product Configuration ###
Next, each product is defined in the `symbols` array. Each product has its own configuration section. Let's break down what each field means:
- `symbol`: The product's ticker symbol.
- `percent`: The percentage of ***total messages*** (as defined in the global section) that should be ***allocated to this product.*** For example, if you specify 30, then 30% of the total messages will be for this product.
- `trade_qty_percent`: The percentage of ***this product's messages*** that should be trades. For example, if `percent` above is 30, and you specify a value of 50, then 50% of the 30% of total messages allocated to this symbol will be trades. Clearly, this number can contradict the min/max trade qty size below. Should this happen, then an ***exception is thrown*** at startup alerting you to these conflicting values. All of the flexibility can lead to configuration complexity! A web interface is in the works to simplify this process :)
- `spread_percentage`: The bid-ask spread for this product, expressed as a percentage. For example, if the last traded price is $100 and you specify 0.5, then the bid-ask spread will be $0.50.
- `prev_day`: The previous trading day's [OHLCV](https://en.wikipedia.org/wiki/Open-high-low-close_chart) data for this product. This section is 
only required if `use_prev_day` is true in the global section. Each field is defined as follows:
  - `open_price`: The previous day's opening price.
  - `high_price`: The previous day's highest traded price.
  - `low_price`: The previous day's lowest traded price.
  - `close_price`: The previous day's closing price.
  - `volume`: The total volume traded on the previous day.
- `price_range`: The price range within which generated prices must fall.
  - `high_price`: The highest price that can be generated.
  - `low_price`: The lowest price that can be generated.
  - `low_weight`: A weight factor that influences the probability of the price being closer to the low price in the price band.
  
















 