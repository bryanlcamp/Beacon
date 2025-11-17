Below is a snippet from a sample Market Data Generation file. Some of the parameter meanings are intuitive. Regardless, let's break them down:

```json:{
  "num_messages": 10000,    # Number of messages to generate
  "online_mode": true       # Specify whether to use the internet
  "exchange": "nsdq",       # Exchange (Protocol: Totalview)
  "symbols": [              # Products and their settings
    {
      "symbol": "MSFT",         # MSFT Configuration Parameters
      "percent": 300,           # Percent of messages that are MSFT
      "spread_percentage": 0.8, # Bid-Ask spread
      "prev_day": {             # Previous trading day's OHLCV
        "open_price": 508.29,   # Open price
        "high_price": 514.83,   # Highest traded price
        "low_price": 506.57,    # Lowest traded price
        "close_price": 510.53,  # Close Price
        "volume:" 917475        # Volume traded
      },
      "price_range": {          # Prices must be within this band
        "high_price": 506.57,   # Highest generated price
        "low_price": 514.83,    # Lowest generated price
        "low_weight": 1.0       # Probability generated price is low
      },
      "quantity_range": {       # Qtys must be within this band
        "min_quantity": 10,     # Minimum generated quantity
        "max_quantity": 100,    # Maximum generated quantity
        "low_weight": 1.0       # Probability generated qty is low 
      },
    },                          # Add more symbols here
  ]
  ```
First, note that the file begins with a there is a ***global section***, which applies to ***all*** products.  
- `num_messages`: Percent of messages to generate.  
- `use_online_mode`: Specifies whether to download ***any*** information from the internet. This includes the previous day's trading day's high/low/close prices, 
- `exchange`: The exchange on which these products are listed. ***NOTE:*** this is only used to determine what exchange messaging protocol to use. For example, if you were to specify "cme", Beacon knows to generate message using the ***ITCH*** protocol when generating messages. Internally, Beacon has an ***Exchange protocol versioning system***. Details re: how to configure and use that substack are ***defined here.*** ***IMPORTANT:*** Beacon generates messages based on the exchange specified at the global level. You ***may not*** use a different exchange at the produce level. E.g., if you specify "cme", all messages will be generated in CME (ITCH) format.
